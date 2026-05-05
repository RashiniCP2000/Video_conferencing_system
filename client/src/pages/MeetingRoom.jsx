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
  const [copied, setCopied] = useState(false);

  const [remoteStreams, setRemoteStreams] = useState({});
  const [localStream, setLocalStream] = useState(null);

  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const peerCtorRef = useRef(null);
  const selfSocketIdRef = useRef(null);

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
    setScreenSharing(false);
    setInCall(false);
    setParticipants([]);
    setChatMessages([]);
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

    socket.emit(
      "join-meeting",
      { meetingCode: codeUpper, displayName: name },
      (response) => {
        if (!response?.ok) {
          setJoinError(response?.error || "Could not join meeting");
          teardownCall();
          return;
        }

        selfSocketIdRef.current = response.socketId;
        const selfId = response.socketId;
        const existing = response.existingUsers || [];

        setParticipants([
          { socketId: selfId, displayName: name },
          ...existing.map((u) => ({ socketId: u.socketId, displayName: u.displayName })),
        ]);

        existing.forEach(({ socketId: sid }) => {
          createPeerConnection(sid, true, localStreamRef.current, socket);
        });

        setInCall(true);
      }
    );
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
    socketRef.current.emit("chat-message", { text });
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

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <header className="shrink-0 border-b border-surface-border bg-surface-elevated px-4 py-3 flex flex-wrap items-center gap-3 justify-between">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wide">Meeting code</p>
          <p className="font-mono text-lg text-white">{codeUpper}</p>
          {meetingMeta.title && (
            <p className="text-sm text-slate-400">{meetingMeta.title}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
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

      {!inCall ? (
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
            <button
              type="button"
              onClick={handleJoinCall}
              className="w-full rounded-xl bg-accent hover:bg-blue-600 text-white font-medium py-3 text-sm"
            >
              Join with microphone & camera
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex-1 p-4 overflow-auto">
              <div
                className="grid gap-3 h-full"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                }}
              >
                {tiles.map(({ id, stream, label }) => (
                  <div
                    key={id}
                    className="relative aspect-video rounded-xl overflow-hidden bg-black border border-surface-border"
                  >
                    <video
                      autoPlay
                      playsInline
                      muted={id === "local"}
                      ref={(el) => {
                        if (el && stream) el.srcObject = stream;
                      }}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-0.5 text-xs text-white">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
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
            <ul className="max-h-28 overflow-y-auto px-3 py-2 text-sm text-slate-300 border-b border-surface-border space-y-1">
              {participants.map((p) => (
                <li key={p.socketId}>
                  {p.displayName}
                  {p.socketId === selfSocketIdRef.current ? " · you" : ""}
                  {meetingMeta.isHost && p.socketId === selfSocketIdRef.current ? " · host" : ""}
                </li>
              ))}
            </ul>
            <div className="px-3 py-2 text-xs font-medium text-slate-400 uppercase tracking-wide">
              Group chat
            </div>
            <div className="flex-1 overflow-y-auto px-3 space-y-2 pb-2">
              {chatMessages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="text-accent font-medium">{m.senderName}: </span>
                  <span className="text-slate-200">{m.text}</span>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="p-3 border-t border-surface-border flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Message everyone…"
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
