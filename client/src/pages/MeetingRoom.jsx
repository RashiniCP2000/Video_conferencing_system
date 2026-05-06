import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { io } from "socket.io-client";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

const ICE_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

function destroyPeer(peer) {
  try {
    peer.destroy();
  } catch {
    /* ignore */
  }
}

function buildCompositeRecordingStream(videoElements, mediaStreams) {
  const w = 1280;
  const h = 720;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  let raf = 0;

  function drawFrame() {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    const els = videoElements.filter((v) => v && v.readyState >= 2);
    const n = els.length;
    if (n === 1) {
      const v = els[0];
      const vw = v.videoWidth;
      const vh = v.videoHeight;
      if (vw && vh) {
        const scale = Math.min(w / vw, h / vh);
        const tw = vw * scale;
        const th = vh * scale;
        ctx.drawImage(v, (w - tw) / 2, (h - th) / 2, tw, th);
      }
    } else if (n > 1) {
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);
      const cw = w / cols;
      const ch = h / rows;
      els.forEach((v, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const vw = v.videoWidth;
        const vh = v.videoHeight;
        if (!vw || !vh) return;
        const scale = Math.min(cw / vw, ch / vh);
        const tw = vw * scale;
        const th = vh * scale;
        ctx.drawImage(v, col * cw + (cw - tw) / 2, row * ch + (ch - th) / 2, tw, th);
      });
    }
    raf = requestAnimationFrame(drawFrame);
  }

  raf = requestAnimationFrame(drawFrame);
  const canvasStream = canvas.captureStream(15);
  const vTrack = canvasStream.getVideoTracks()[0];

  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  mediaStreams.forEach((stream) => {
    const tracks = stream.getAudioTracks().filter((t) => t.readyState === "live");
    if (!tracks.length) return;
    try {
      const src = audioCtx.createMediaStreamSource(new MediaStream(tracks));
      src.connect(dest);
    } catch {
      /* ignore */
    }
  });

  const out = new MediaStream();
  if (vTrack) out.addTrack(vTrack);
  dest.stream.getAudioTracks().forEach((t) => out.addTrack(t));

  return {
    stream: out,
    stop: () => {
      cancelAnimationFrame(raf);
      vTrack?.stop();
      audioCtx.close();
    },
  };
}

export default function MeetingRoom() {
  const { meetingCode } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuth();

  const [metaLoading, setMetaLoading] = useState(true);
  const [metaError, setMetaError] = useState("");
  const [meetingMeta, setMeetingMeta] = useState(null);

  const [displayName, setDisplayName] = useState(() => searchParams.get("name")?.slice(0, 80) || "");
  const [inCall, setInCall] = useState(false);
  const [joinError, setJoinError] = useState("");

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);

  const [participants, setParticipants] = useState([]);
  const [chatOpen, setChatOpen] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatRecipient, setChatRecipient] = useState("everyone");
  const [copied, setCopied] = useState(false);

  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);

  const [layoutMode, setLayoutMode] = useState("grid");
  const [spotlightId, setSpotlightId] = useState(null);

  const [waitingForAdmission, setWaitingForAdmission] = useState(false);
  const [waitingPeers, setWaitingPeers] = useState([]);
  const [liveHostSocketId, setLiveHostSocketId] = useState(null);
  const [mySocketId, setMySocketId] = useState(null);

  const [recording, setRecording] = useState(false);
  const [waitingRoomSaving, setWaitingRoomSaving] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordChunksRef = useRef([]);
  const compositeStopRef = useRef(null);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const peerCtorRef = useRef(null);
  const selfSocketIdRef = useRef(null);
  const videoElsRef = useRef({});

  const codeUpper = meetingCode?.toUpperCase() || "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setMetaLoading(true);
      setMetaError("");
      try {
        const { data } = await api.get(`/meetings/${codeUpper}`);
        if (!cancelled) setMeetingMeta(data);
      } catch (err) {
        if (!cancelled) setMetaError(err.response?.data?.message || "Meeting not found");
      } finally {
        if (!cancelled) setMetaLoading(false);
      }
    }
    if (codeUpper) load();
    return () => {
      cancelled = true;
    };
  }, [codeUpper]);

  useEffect(() => {
    if (!displayName.trim() && user?.name) setDisplayName(user.name);
  }, [user?.name, displayName]);

  const teardownCall = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    mediaRecorderRef.current = null;
    recordChunksRef.current = [];
    compositeStopRef.current?.();
    compositeStopRef.current = null;
    setRecording(false);

    peersRef.current.forEach((p) => destroyPeer(p));
    peersRef.current.clear();
    setRemoteStreams({});

    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    cameraStreamRef.current = null;
    selfSocketIdRef.current = null;
    setMySocketId(null);
    setScreenSharing(false);
    setInCall(false);
    setWaitingForAdmission(false);
    setWaitingPeers([]);
    setLiveHostSocketId(null);
    setParticipants([]);
    setChatMessages([]);
    videoElsRef.current = {};
  }, []);

  useEffect(() => () => teardownCall(), [teardownCall]);

  const replaceVideoForPeers = useCallback((videoTrack) => {
    peersRef.current.forEach((peer) => {
      const pc = peer._pc;
      if (!pc) return;
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender && videoTrack) sender.replaceTrack(videoTrack);
    });
  }, []);

  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    const cam = cameraStreamRef.current;
    const camVideo = cam?.getVideoTracks()[0];
    if (camVideo) replaceVideoForPeers(camVideo);
    setScreenSharing(false);
  }, [replaceVideoForPeers]);

  const startScreenShare = useCallback(async () => {
    try {
      const screen = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });
      screenStreamRef.current = screen;
      const screenVideo = screen.getVideoTracks()[0];
      screenVideo.onended = () => stopScreenShare();
      replaceVideoForPeers(screenVideo);
      setScreenSharing(true);
    } catch {
      /* user cancelled */
    }
  }, [replaceVideoForPeers, stopScreenShare]);

  const removePeer = useCallback((remoteId) => {
    const peer = peersRef.current.get(remoteId);
    if (peer) {
      destroyPeer(peer);
      peersRef.current.delete(remoteId);
    }
    setRemoteStreams((prev) => {
      const next = { ...prev };
      delete next[remoteId];
      return next;
    });
  }, []);

  const createPeerConnection = useCallback(
    (remoteSocketId, initiator, stream, socket) => {
      const Peer = peerCtorRef.current;
      if (!Peer || peersRef.current.has(remoteSocketId)) return;

      const peer = new Peer({
        initiator,
        trickle: true,
        stream,
        config: { iceServers: ICE_SERVERS },
      });

      peer.on("signal", (signal) => {
        socket.emit("webrtc-signal", { to: remoteSocketId, signal });
      });

      peer.on("stream", (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [remoteSocketId]: remoteStream }));
      });

      peer.on("close", () => removePeer(remoteSocketId));
      peer.on("error", () => removePeer(remoteSocketId));

      peersRef.current.set(remoteSocketId, peer);
    },
    [removePeer]
  );

  const enterCallPeers = useCallback(
    (socket, joinName, existingUsers) => {
      const selfId = selfSocketIdRef.current;
      if (!selfId || !localStreamRef.current) return;

      setParticipants([
        { socketId: selfId, displayName: joinName },
        ...existingUsers.map((u) => ({ socketId: u.socketId, displayName: u.displayName })),
      ]);

      existingUsers.forEach(({ socketId: sid }) => {
        createPeerConnection(sid, true, localStreamRef.current, socket);
      });

      setInCall(true);
    },
    [createPeerConnection]
  );

  const attachMeetingSocket = useCallback(
    (socket, joinName) => {
      socket.on("connect_error", () => {
        setJoinError("Could not connect to meeting server. Check VITE_API_URL and that the server is running.");
        teardownCall();
      });

      socket.on("webrtc-signal", ({ from, signal }) => {
        const peer = peersRef.current.get(from);
        if (peer) peer.signal(signal);
      });

      socket.on("user-joined", ({ socketId, displayName: dn }) => {
        if (!localStreamRef.current || socketId === selfSocketIdRef.current) return;
        createPeerConnection(socketId, false, localStreamRef.current, socket);
        setParticipants((prev) => {
          if (prev.some((p) => p.socketId === socketId)) return prev;
          return [...prev, { socketId, displayName: dn }];
        });
      });

      socket.on("user-left", ({ socketId }) => {
        removePeer(socketId);
        setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on("chat-message", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on("private-message", (msg) => {
        setChatMessages((prev) => [...prev, msg]);
      });

      socket.on("admitted-to-meeting", ({ existingUsers, hostSocketId }) => {
        setWaitingForAdmission(false);
        if (hostSocketId != null) setLiveHostSocketId(hostSocketId);
        enterCallPeers(socket, joinName, existingUsers || []);
      });

      socket.on("waiting-denied", ({ reason }) => {
        setJoinError(reason || "The host did not admit you.");
        teardownCall();
      });

      socket.on("host-changed", ({ hostSocketId }) => {
        if (hostSocketId != null) setLiveHostSocketId(hostSocketId);
      });

      socket.on("host-force-mute", () => {
        setMicOn(false);
      });

      socket.on("removed-from-meeting", ({ reason }) => {
        window.alert(reason || "You were removed from the meeting.");
        teardownCall();
        if (isAuthenticated) navigate("/");
        else navigate("/login");
      });

      socket.on("waiting-sync", ({ users }) => {
        setWaitingPeers(users || []);
      });

      socket.on("waiting-participant", ({ socketId, displayName: dn }) => {
        setWaitingPeers((prev) => {
          if (prev.some((p) => p.socketId === socketId)) return prev;
          return [...prev, { socketId, displayName: dn }];
        });
      });

      socket.on("waiting-left", ({ socketId }) => {
        setWaitingPeers((prev) => prev.filter((p) => p.socketId !== socketId));
      });

      socket.on("waiting-room-updated", ({ waitingRoomEnabled: w }) => {
        setMeetingMeta((prev) => (prev ? { ...prev, waitingRoomEnabled: w } : prev));
        if (!w) setWaitingPeers([]);
      });
    },
    [createPeerConnection, enterCallPeers, isAuthenticated, navigate, removePeer, teardownCall]
  );

  const handleJoinCall = async () => {
    const name = displayName.trim() || user?.name || "Guest";
    if (!name) {
      setJoinError("Enter a display name");
      return;
    }
    setJoinError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      cameraStreamRef.current = stream;
      setLocalStream(stream);
    } catch {
      setJoinError("Camera/microphone permission is required to join.");
      return;
    }

    try {
      const mod = await import("simple-peer/simplepeer.min.js");
      peerCtorRef.current = mod.default;
      if (typeof peerCtorRef.current !== "function") {
        const fb = await import("simple-peer");
        peerCtorRef.current = fb.default;
      }
    } catch (err) {
      console.error(err);
      setJoinError("Could not load WebRTC. Refresh the page or try another browser.");
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
      cameraStreamRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ["websocket"],
      auth: { token: token || undefined },
    });
    socketRef.current = socket;

    attachMeetingSocket(socket, name);

    socket.emit("join-meeting", { meetingCode: codeUpper, displayName: name }, (response) => {
      if (!response?.ok) {
        setJoinError(response?.error || "Could not join meeting");
        teardownCall();
        return;
      }

      selfSocketIdRef.current = response.socketId;
      setMySocketId(response.socketId);
      if (response.hostSocketId != null) setLiveHostSocketId(response.hostSocketId);

      if (response.waiting) {
        setWaitingForAdmission(true);
        return;
      }

      const existing = response.existingUsers || [];
      enterCallPeers(socket, name, existing);
    });
  };

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = micOn;
    });
  }, [micOn]);

  useEffect(() => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = camOn;
    });
  }, [camOn]);

  const leaveMeeting = () => {
    teardownCall();
    if (isAuthenticated) navigate("/");
    else navigate("/login");
  };

  const sendChat = (e) => {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text || !socketRef.current) return;
    if (chatRecipient === "everyone") {
      socketRef.current.emit("chat-message", { text });
    } else {
      socketRef.current.emit("private-message", { to: chatRecipient, text });
    }
    setChatInput("");
  };

  const copyLink = async () => {
    const url = `${window.location.origin}/meet/${codeUpper}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const updateWaitingRoomSetting = async (enabled) => {
    if (!meetingMeta?.isHost) return;
    setWaitingRoomSaving(true);
    try {
      const { data } = await api.patch(`/meetings/${codeUpper}/waiting-room`, {
        waitingRoomEnabled: enabled,
      });
      setMeetingMeta((prev) =>
        prev ? { ...prev, waitingRoomEnabled: data.waitingRoomEnabled } : prev
      );
    } catch (err) {
      window.alert(err.response?.data?.message || "Could not update waiting room");
    } finally {
      setWaitingRoomSaving(false);
    }
  };

  const admitWaiting = (targetId) => {
    socketRef.current?.emit("admit-waiting", { targetId }, (res) => {
      if (res?.ok && res.socketId) {
        setWaitingPeers((prev) => prev.filter((p) => p.socketId !== res.socketId));
      }
    });
  };

  const denyWaiting = (targetId) => {
    socketRef.current?.emit("deny-waiting", { targetId }, (res) => {
      if (res?.ok && res.socketId) {
        setWaitingPeers((prev) => prev.filter((p) => p.socketId !== res.socketId));
      }
    });
  };

  const transferHost = (newHostSocketId) => {
    socketRef.current?.emit("transfer-host", { newHostSocketId }, () => {});
  };

  const hostMute = (targetId) => {
    socketRef.current?.emit("host-mute-participant", { targetId: targetId }, () => {});
  };

  const hostRemove = (targetId) => {
    if (!window.confirm("Remove this participant from the meeting?")) return;
    socketRef.current?.emit("host-remove-participant", { targetId: targetId }, () => {});
  };

  const collectVideoElsInTileOrder = useCallback((tilesList) => {
    return tilesList.map((t) => videoElsRef.current[t.id]).filter(Boolean);
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  useEffect(() => {
    const live = Boolean(
      mySocketId && liveHostSocketId && mySocketId === liveHostSocketId
    );
    if (recording && !live) {
      stopRecording();
    }
  }, [recording, mySocketId, liveHostSocketId, stopRecording]);

  const startRecording = useCallback(() => {
    if (!mySocketId || !liveHostSocketId || mySocketId !== liveHostSocketId) return;
    const tilesList = [
      ...(localStream
        ? [
            {
              id: "local",
              stream: localStream,
              label: `${displayName.trim() || "You"} (you)`,
            },
          ]
        : []),
      ...Object.entries(remoteStreams).map(([id, stream]) => {
        const p = participants.find((x) => x.socketId === id);
        return { id, stream, label: p?.displayName || "Participant" };
      }),
    ];
    const videoEls = collectVideoElsInTileOrder(tilesList);
    const mediaStreams = tilesList.map((t) => t.stream).filter(Boolean);
    if (!videoEls.length || !mediaStreams.length) return;

    const { stream, stop } = buildCompositeRecordingStream(videoEls, mediaStreams);
    compositeStopRef.current = stop;

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
      ? "video/webm;codecs=vp9,opus"
      : MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

    recordChunksRef.current = [];
    let recorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType });
    } catch {
      recorder = new MediaRecorder(stream);
    }

    recorder.ondataavailable = (ev) => {
      if (ev.data.size) recordChunksRef.current.push(ev.data);
    };
    recorder.onstop = () => {
      compositeStopRef.current?.();
      compositeStopRef.current = null;
      const blob = new Blob(recordChunksRef.current, { type: recorder.mimeType || "video/webm" });
      recordChunksRef.current = [];
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `meeting-${codeUpper}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setRecording(false);
      mediaRecorderRef.current = null;
    };

    mediaRecorderRef.current = recorder;
    recorder.start(250);
    setRecording(true);
  }, [
    codeUpper,
    collectVideoElsInTileOrder,
    displayName,
    liveHostSocketId,
    localStream,
    mySocketId,
    participants,
    remoteStreams,
  ]);

  const setVideoRef = useCallback((tileId, el) => {
    if (el) videoElsRef.current[tileId] = el;
    else delete videoElsRef.current[tileId];
  }, []);

  if (metaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading meeting…
      </div>
    );
  }

  if (metaError || !meetingMeta) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-red-300">{metaError || "Meeting unavailable"}</p>
        <Link to="/" className="text-accent hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const tiles = [
    ...(localStream
      ? [
          {
            id: "local",
            stream: localStream,
            label: `${displayName.trim() || "You"} (you)`,
          },
        ]
      : []),
    ...Object.entries(remoteStreams).map(([id, stream]) => {
      const p = participants.find((x) => x.socketId === id);
      return { id, stream, label: p?.displayName || "Participant" };
    }),
  ];

  const isLiveHost = Boolean(mySocketId && liveHostSocketId && mySocketId === liveHostSocketId);

  const mainTileId =
    spotlightId ||
    (tiles.find((t) => t.id !== "local")?.id ?? tiles[0]?.id ?? null);
  const mainTile = mainTileId ? tiles.find((t) => t.id === mainTileId) : null;
  const stripTiles = layoutMode === "speaker" && mainTile ? tiles.filter((t) => t.id !== mainTile.id) : [];

  const renderTile = (tile, { compact } = {}) => (
    <div
      key={`${tile.id}-${tile.stream?.id ?? "stream"}`}
      className={`relative rounded-xl overflow-hidden bg-black border border-surface-border ${
        compact ? "aspect-video w-40 shrink-0" : "aspect-video"
      }`}
    >
      <video
        autoPlay
        playsInline
        muted={tile.id === "local"}
        ref={(el) => {
          setVideoRef(tile.id, el);
          if (el && tile.stream) el.srcObject = tile.stream;
        }}
        className="w-full h-full object-cover"
      />
      <button
        type="button"
        onClick={() => setSpotlightId(tile.id)}
        className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white text-left hover:bg-black/80 max-w-[90%]"
        title="Spotlight in speaker view"
      >
        {tile.label}
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="shrink-0 border-b border-surface-border bg-surface-elevated px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Meeting code</p>
          <p className="font-mono text-lg text-white">{codeUpper}</p>
          {meetingMeta.title && <p className="text-sm text-slate-400">{meetingMeta.title}</p>}
          <p className="text-xs text-slate-500 mt-1">
            {meetingMeta.waitingRoomEnabled
              ? "Waiting room is on for guests."
              : "Waiting room is off — guests join the call directly."}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copyLink}
            className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-slate-200 hover:bg-surface"
          >
            {copied ? "Copied!" : "Copy invite link"}
          </button>
          {!isAuthenticated && (
            <Link
              to="/login"
              className="rounded-lg border border-surface-border px-3 py-1.5 text-sm text-accent hover:bg-surface"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {!inCall && !waitingForAdmission ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-elevated p-8">
            <h2 className="text-xl font-semibold text-white mb-1">Ready to join?</h2>
            <p className="text-sm text-slate-400 mb-6">
              Host: {meetingMeta.host?.name || "Unknown"}
            </p>
            <label className="block text-xs font-medium text-slate-400 mb-1">Display name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {joinError && (
              <div className="mb-4 rounded-lg bg-red-500/15 text-red-300 text-sm px-3 py-2">
                {joinError}
              </div>
            )}
            {meetingMeta.isHost && (
              <div className="mb-4 rounded-lg border border-surface-border bg-surface px-3 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-300">Waiting room (meeting setting)</p>
                  <p className="text-xs text-slate-500">Only you can change this while signed in as host</p>
                </div>
                <button
                  type="button"
                  disabled={waitingRoomSaving}
                  onClick={() => updateWaitingRoomSetting(!meetingMeta.waitingRoomEnabled)}
                  className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                    meetingMeta.waitingRoomEnabled
                      ? "bg-amber-600/35 text-amber-100 border border-amber-500/40"
                      : "bg-surface-elevated text-slate-300 border border-surface-border"
                  }`}
                >
                  {waitingRoomSaving ? "…" : meetingMeta.waitingRoomEnabled ? "On" : "Off"}
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={handleJoinCall}
              className="w-full rounded-xl bg-accent hover:bg-blue-600 text-white font-medium py-3 text-sm"
            >
              Join with microphone & camera
            </button>
          </div>
        </div>
      ) : waitingForAdmission ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
          <div className="rounded-2xl border border-surface-border bg-surface-elevated px-8 py-10 max-w-md text-center">
            <h2 className="text-lg font-semibold text-white mb-2">Waiting for the host</h2>
            <p className="text-sm text-slate-400">
              You’ll join the call when the host admits you from the waiting room.
            </p>
          </div>
          {localStream && (
            <div className="w-full max-w-sm rounded-xl overflow-hidden border border-surface-border aspect-video bg-black">
              <video
                autoPlay
                playsInline
                muted
                ref={(el) => {
                  if (el) el.srcObject = localStream;
                }}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <button
            type="button"
            onClick={leaveMeeting}
            className="rounded-full px-5 py-2 text-sm border border-surface-border text-slate-200 hover:bg-surface"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="shrink-0 px-4 py-2 border-b border-surface-border flex flex-wrap items-center gap-2 bg-surface-elevated/50">
              <span className="text-xs text-slate-500 mr-2">Layout</span>
              <button
                type="button"
                onClick={() => setLayoutMode("grid")}
                className={`rounded-lg px-3 py-1 text-xs ${
                  layoutMode === "grid"
                    ? "bg-accent text-white"
                    : "border border-surface-border text-slate-300"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setLayoutMode("speaker")}
                className={`rounded-lg px-3 py-1 text-xs ${
                  layoutMode === "speaker"
                    ? "bg-accent text-white"
                    : "border border-surface-border text-slate-300"
                }`}
              >
                Speaker
              </button>
              {(meetingMeta.isHost || isLiveHost) && (
                <span className="w-px h-4 bg-surface-border mx-1 hidden sm:block" />
              )}
              {meetingMeta.isHost && (
                <>
                  <span className="text-xs text-slate-500">Lobby</span>
                  <button
                    type="button"
                    disabled={waitingRoomSaving}
                    onClick={() => updateWaitingRoomSetting(!meetingMeta.waitingRoomEnabled)}
                    className={`rounded-lg px-3 py-1 text-xs font-medium disabled:opacity-50 ${
                      meetingMeta.waitingRoomEnabled
                        ? "bg-amber-600/35 text-amber-100 border border-amber-500/40"
                        : "border border-surface-border text-slate-300"
                    }`}
                  >
                    {waitingRoomSaving ? "…" : meetingMeta.waitingRoomEnabled ? "On" : "Off"}
                  </button>
                </>
              )}
              {isLiveHost && (
                <>
                  <span className="w-px h-4 bg-surface-border mx-1 hidden sm:block" />
                  <button
                    type="button"
                    onClick={recording ? stopRecording : startRecording}
                    className={`rounded-lg px-3 py-1 text-xs border ${
                      recording
                        ? "bg-red-600 border-red-500 text-white"
                        : "border-surface-border text-slate-300"
                    }`}
                  >
                    {recording ? "Stop recording" : "Record"}
                  </button>
                  {recording && (
                    <span className="text-xs text-red-400 flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      Rec
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex-1 p-4 overflow-auto min-h-0">
              {layoutMode === "grid" ? (
                <div
                  className="grid gap-3 h-full"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  }}
                >
                  {tiles.map((tile) => renderTile(tile))}
                </div>
              ) : (
                <div className="flex flex-col gap-3 h-full min-h-[360px]">
                  {mainTile && (
                    <div className="flex-1 min-h-[200px]">{renderTile(mainTile)}</div>
                  )}
                  {stripTiles.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 shrink-0">
                      {stripTiles.map((tile) => renderTile(tile, { compact: true }))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <footer className="shrink-0 border-t border-surface-border bg-surface-elevated px-4 py-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setMicOn((m) => !m)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  micOn ? "bg-surface border border-surface-border" : "bg-red-600 text-white"
                }`}
              >
                {micOn ? "Mute" : "Unmute"}
              </button>
              <button
                type="button"
                onClick={() => setCamOn((c) => !c)}
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  camOn ? "bg-surface border border-surface-border" : "bg-red-600 text-white"
                }`}
              >
                {camOn ? "Camera off" : "Camera on"}
              </button>
              <button
                type="button"
                onClick={screenSharing ? stopScreenShare : startScreenShare}
                className={`rounded-full px-4 py-2 text-sm font-medium border border-surface-border ${
                  screenSharing ? "bg-emerald-700 text-white" : "bg-surface"
                }`}
              >
                {screenSharing ? "Stop sharing" : "Share screen"}
              </button>
              <button
                type="button"
                onClick={() => setChatOpen((o) => !o)}
                className="rounded-full px-4 py-2 text-sm font-medium bg-surface border border-surface-border lg:hidden"
              >
                Chat
              </button>
              <button
                type="button"
                onClick={leaveMeeting}
                className="rounded-full px-5 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white"
              >
                Leave
              </button>
            </footer>
          </div>

          <aside
            className={`${
              chatOpen ? "flex" : "hidden"
            } lg:flex w-full lg:w-80 border-l border-surface-border bg-surface-elevated flex-col max-h-[50vh] lg:max-h-none`}
          >
            <div className="p-3 border-b border-surface-border flex items-center justify-between">
              <span className="text-sm font-medium text-white">Participants ({participants.length})</span>
              <button type="button" className="lg:hidden text-slate-400 text-sm" onClick={() => setChatOpen(false)}>
                Close
              </button>
            </div>

            {isLiveHost && waitingPeers.length > 0 && (
              <div className="px-3 py-2 border-b border-surface-border bg-amber-500/10">
                <p className="text-xs font-medium text-amber-200 mb-2">Waiting room</p>
                <ul className="space-y-2">
                  {waitingPeers.map((w) => (
                    <li
                      key={w.socketId}
                      className="flex items-center justify-between gap-2 text-xs text-slate-200"
                    >
                      <span className="truncate">{w.displayName}</span>
                      <span className="flex gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => admitWaiting(w.socketId)}
                          className="rounded bg-emerald-600 px-2 py-0.5 text-white"
                        >
                          Admit
                        </button>
                        <button
                          type="button"
                          onClick={() => denyWaiting(w.socketId)}
                          className="rounded bg-slate-700 px-2 py-0.5"
                        >
                          Deny
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <ul className="max-h-36 overflow-y-auto px-3 py-2 text-sm text-slate-300 border-b border-surface-border space-y-2">
              {participants.map((p) => (
                <li key={p.socketId} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span>
                      {p.displayName}
                      {p.socketId === mySocketId ? " · you" : ""}
                      {p.socketId === liveHostSocketId ? " · host" : ""}
                    </span>
                    {isLiveHost && p.socketId !== mySocketId && (
                      <span className="flex flex-wrap gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => transferHost(p.socketId)}
                          className="text-[10px] uppercase tracking-wide text-accent hover:underline"
                        >
                          Make host
                        </button>
                        <button
                          type="button"
                          onClick={() => hostMute(p.socketId)}
                          className="text-[10px] uppercase tracking-wide text-slate-400 hover:underline"
                        >
                          Mute
                        </button>
                        <button
                          type="button"
                          onClick={() => hostRemove(p.socketId)}
                          className="text-[10px] uppercase tracking-wide text-red-400 hover:underline"
                        >
                          Remove
                        </button>
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide flex flex-col gap-1">
              <span>Chat</span>
              <select
                value={chatRecipient}
                onChange={(e) => setChatRecipient(e.target.value)}
                className="w-full rounded-lg bg-surface border border-surface-border px-2 py-1.5 text-xs text-slate-200 normal-case"
              >
                <option value="everyone">Everyone</option>
                {participants
                  .filter((p) => p.socketId !== mySocketId)
                  .map((p) => (
                    <option key={p.socketId} value={p.socketId}>
                      Private → {p.displayName}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-2">
              {chatMessages.map((m) => (
                <div key={m.id} className="text-sm">
                  {m.scope === "private" ? (
                    <span className="text-slate-500 text-xs block mb-0.5">
                      Private{m.recipientId === mySocketId ? " (to you)" : ""}
                    </span>
                  ) : null}
                  <span className="text-accent font-medium">{m.senderName}: </span>
                  <span className="text-slate-200">{m.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-surface-border flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={chatRecipient === "everyone" ? "Message everyone…" : "Private message…"}
                className="flex-1 rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent hover:bg-blue-600 px-3 py-2 text-sm font-medium text-white"
              >
                Send
              </button>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}
