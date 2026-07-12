import jwt from "jsonwebtoken";
import { Meeting } from "../models/Meeting.js";
import { User } from "../models/User.js";
import { logActivity } from "../utils/activityLogger.js";

/** Main room: meetingCode (uppercase) -> Map(socketId -> displayName) */
const meetingSockets = new Map();
/** Waiting: meetingCode -> Map(socketId -> displayName) */
const waitingQueues = new Map();
/** Current host socket id per meeting (runtime; supports transfer). */
const hostSocketByRoom = new Map();
/** Host-enforced mute state per room: meetingCode -> Map(socketId -> boolean). */
const mutedStateByRoom = new Map();
/** Active whiteboard state per meeting room key (runtime: lines, notes, images) */
const meetingWhiteboards = new Map();

function roomKey(meetingCode) {
  return meetingCode.toUpperCase();
}

function isRuntimeHost(socket, rKey) {
  return hostSocketByRoom.get(rKey) === socket.id;
}

function addToMainRoom(socket, meetingCodeUpper, displayName, io) {
  const rKey = roomKey(meetingCodeUpper);
  socket.join(rKey);
  socket.meetingCode = meetingCodeUpper;
  socket.displayName = displayName;
  socket.waitingForKey = null;

  if (!meetingSockets.has(rKey)) meetingSockets.set(rKey, new Map());
  meetingSockets.get(rKey).set(socket.id, displayName);
  if (!mutedStateByRoom.has(rKey)) mutedStateByRoom.set(rKey, new Map());
  mutedStateByRoom.get(rKey).set(socket.id, false);

  logActivity({
    userId: socket.userId || null,
    userEmail: socket.userEmail || "N/A",
    userName: socket.userName || displayName || "Guest",
    category: "meeting",
    action: "meeting_join",
    details: { meetingCode: meetingCodeUpper },
    ipAddress: socket.handshake.address || "Unknown",
  });

  const existing = [];
  meetingSockets.get(rKey).forEach((name, id) => {
    if (id !== socket.id) existing.push({ socketId: id, displayName: name });
  });

  socket.to(rKey).emit("user-joined", {
    socketId: socket.id,
    displayName,
  });

  return {
    existingUsers: existing,
    hostSocketId: hostSocketByRoom.get(rKey) ?? null,
    mutedByHost: Object.fromEntries(mutedStateByRoom.get(rKey)?.entries() || []),
  };
}

function maybeAssignDbHost(socket, meeting, rKey) {
  const isDbHost =
    Boolean(socket.userId && meeting.host && meeting.host.toString() === socket.userId);
  if (!isDbHost) return;

  const map = meetingSockets.get(rKey);
  const hadNoHost = !hostSocketByRoom.has(rKey);
  const roomWasEmpty = !map || map.size === 0;

  if (hadNoHost || roomWasEmpty) {
    hostSocketByRoom.set(rKey, socket.id);
  }
}

function emitWaitingSyncToHost(io, socket, rKey) {
  const wq = waitingQueues.get(rKey);
  if (!wq?.size) return;
  socket.emit("waiting-sync", {
    users: [...wq.entries()].map(([id, name]) => ({ socketId: id, displayName: name })),
  });
}

function admitWaitingUser(io, meetingCodeUpper, targetId) {
  const rKey = roomKey(meetingCodeUpper);
  const wq = waitingQueues.get(rKey);
  const target = io.sockets.sockets.get(targetId);
  if (!wq?.has(targetId) || !target) return false;

  const dn = wq.get(targetId);
  wq.delete(targetId);
  if (wq.size === 0) waitingQueues.delete(rKey);

  target.leave(`wait:${rKey}`);
  target.waitingForKey = null;

  const { existingUsers, hostSocketId } = addToMainRoom(target, rKey, dn, io);

  target.emit("admitted-to-meeting", {
    existingUsers,
    hostSocketId,
    mutedByHost: Object.fromEntries(mutedStateByRoom.get(rKey)?.entries() || []),
    whiteboard: meetingWhiteboards.get(rKey) || { lines: [], notes: [], images: [] }
  });
  return true;
}

/** Admit everyone in the waiting queue (e.g. when the waiting room is turned off). */
export function flushWaitingQueue(io, meetingCodeUpper) {
  const rKey = roomKey(meetingCodeUpper);
  const wq = waitingQueues.get(rKey);
  if (!wq?.size) return;
  const ids = [...wq.keys()];
  for (const id of ids) {
    admitWaitingUser(io, rKey, id);
  }
}

export function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.sub;
      } catch {
        socket.userId = null;
      }
    }
    next();
  });

  io.on("connection", (socket) => {
    socket.on("join-meeting", async (payload, ack) => {
      try {
        const meetingCodeRaw = payload?.meetingCode?.toUpperCase()?.trim();
        const displayName = (
          payload?.displayName?.trim() ||
          socket.handshake.auth?.displayName?.trim() ||
          "Guest"
        ).slice(0, 80);

        if (!meetingCodeRaw) {
          ack?.({ ok: false, error: "Missing meeting code" });
          return;
        }

        const meeting = await Meeting.findOne({ meetingCode: meetingCodeRaw, endedAt: null }).lean();
        if (!meeting) {
          ack?.({ ok: false, error: "Meeting not found" });
          return;
        }

        if (socket.userId) {
          const loggedInUser = await User.findById(socket.userId).select("name email").lean();
          if (loggedInUser) {
            socket.userEmail = loggedInUser.email;
            socket.userName = loggedInUser.name;
          }
        }
        if (!socket.userName) {
          socket.userName = displayName || "Guest";
        }
        if (!socket.userEmail) {
          socket.userEmail = "N/A";
        }

        const rKey = roomKey(meeting.meetingCode);
        const isDbHost =
          Boolean(socket.userId && meeting.host && meeting.host.toString() === socket.userId);
        const waitingEnabled = meeting.waitingRoomEnabled !== false;

        socket.displayName = displayName;

        if (waitingEnabled && !isDbHost) {
          if (!waitingQueues.has(rKey)) waitingQueues.set(rKey, new Map());
          waitingQueues.get(rKey).set(socket.id, displayName);
          socket.join(`wait:${rKey}`);
          socket.waitingForKey = rKey;

          const hostSock = hostSocketByRoom.get(rKey);
          if (hostSock) {
            io.to(hostSock).emit("waiting-participant", {
              socketId: socket.id,
              displayName,
            });
          }

          ack?.({
            ok: true,
            waiting: true,
            socketId: socket.id,
            hostSocketId: hostSocketByRoom.get(rKey) ?? null,
          });
          return;
        }

        maybeAssignDbHost(socket, meeting, rKey);

        const { existingUsers, hostSocketId } = addToMainRoom(
          socket,
          meeting.meetingCode,
          displayName,
          io
        );

        if (isRuntimeHost(socket, rKey)) {
          emitWaitingSyncToHost(io, socket, rKey);
        }

        ack?.({
          ok: true,
          waiting: false,
          socketId: socket.id,
          existingUsers,
          hostSocketId,
          isHost: isRuntimeHost(socket, rKey),
          whiteboard: meetingWhiteboards.get(rKey) || { lines: [], notes: [], images: [] }
        });
      } catch (err) {
        console.error(err);
        ack?.({ ok: false, error: "Join failed" });
      }
    });

    socket.on("admit-waiting", ({ targetId }, ack) => {
      try {
        if (!socket.meetingCode) {
          ack?.({ ok: false, error: "Not in meeting" });
          return;
        }
        const rKey = roomKey(socket.meetingCode);
        if (!isRuntimeHost(socket, rKey)) {
          ack?.({ ok: false, error: "Not host" });
          return;
        }
        const wq = waitingQueues.get(rKey);
        const target = io.sockets.sockets.get(targetId);
        if (!target || !wq?.has(targetId)) {
          ack?.({ ok: false, error: "Participant not waiting" });
          return;
        }

        admitWaitingUser(io, rKey, targetId);
        ack?.({ ok: true, socketId: targetId });
      } catch (err) {
        console.error(err);
        ack?.({ ok: false, error: "Admit failed" });
      }
    });

    socket.on("deny-waiting", ({ targetId }, ack) => {
      if (!socket.meetingCode) {
        ack?.({ ok: false, error: "Not in meeting" });
        return;
      }
      const rKey = roomKey(socket.meetingCode);
      if (!isRuntimeHost(socket, rKey)) {
        ack?.({ ok: false, error: "Not host" });
        return;
      }
      const wq = waitingQueues.get(rKey);
      const target = io.sockets.sockets.get(targetId);
      if (!target || !wq?.has(targetId)) {
        ack?.({ ok: false, error: "Not in waiting" });
        return;
      }
      wq.delete(targetId);
      if (wq.size === 0) waitingQueues.delete(rKey);
      target.leave(`wait:${rKey}`);
      target.waitingForKey = null;
      target.emit("waiting-denied", { reason: "The host did not admit you to this meeting." });
      ack?.({ ok: true, socketId: targetId });
    });

    socket.on("transfer-host", ({ newHostSocketId }, ack) => {
      if (!socket.meetingCode || !newHostSocketId) {
        ack?.({ ok: false, error: "Invalid" });
        return;
      }
      const rKey = roomKey(socket.meetingCode);
      if (!isRuntimeHost(socket, rKey)) {
        ack?.({ ok: false, error: "Not host" });
        return;
      }
      const map = meetingSockets.get(rKey);
      if (!map?.has(newHostSocketId)) {
        ack?.({ ok: false, error: "Participant not in call" });
        return;
      }
      hostSocketByRoom.set(rKey, newHostSocketId);
      io.to(rKey).emit("host-changed", { hostSocketId: newHostSocketId });
      ack?.({ ok: true });
    });

    socket.on("host-mute-participant", ({ targetId }, ack) => {
      if (!socket.meetingCode || !targetId) {
        ack?.({ ok: false, error: "Invalid" });
        return;
      }
      const rKey = roomKey(socket.meetingCode);
      if (!isRuntimeHost(socket, rKey)) {
        ack?.({ ok: false, error: "Not host" });
        return;
      }
      const map = meetingSockets.get(rKey);
      if (!map?.has(targetId)) {
        ack?.({ ok: false, error: "Not in call" });
        return;
      }
      if (!mutedStateByRoom.has(rKey)) mutedStateByRoom.set(rKey, new Map());
      mutedStateByRoom.get(rKey).set(targetId, true);
      io.to(targetId).emit("host-force-mute");
      io.to(rKey).emit("participant-muted-state", { socketId: targetId, muted: true });
      ack?.({ ok: true });
    });

    socket.on("host-set-participant-mute", ({ targetId, muted }, ack) => {
      if (!socket.meetingCode || !targetId || typeof muted !== "boolean") {
        ack?.({ ok: false, error: "Invalid" });
        return;
      }
      const rKey = roomKey(socket.meetingCode);
      if (!isRuntimeHost(socket, rKey)) {
        ack?.({ ok: false, error: "Not host" });
        return;
      }
      const map = meetingSockets.get(rKey);
      if (!map?.has(targetId)) {
        ack?.({ ok: false, error: "Not in call" });
        return;
      }

      if (!mutedStateByRoom.has(rKey)) mutedStateByRoom.set(rKey, new Map());
      mutedStateByRoom.get(rKey).set(targetId, muted);
      io.to(targetId).emit("host-force-mute", { muted });
      io.to(rKey).emit("participant-muted-state", { socketId: targetId, muted });
      ack?.({ ok: true, targetId, muted });
    });

    socket.on("host-remove-participant", ({ targetId }, ack) => {
      if (!socket.meetingCode || !targetId) {
        ack?.({ ok: false, error: "Invalid" });
        return;
      }
      const rKey = roomKey(socket.meetingCode);
      if (!isRuntimeHost(socket, rKey)) {
        ack?.({ ok: false, error: "Not host" });
        return;
      }
      if (targetId === socket.id) {
        ack?.({ ok: false, error: "Cannot remove yourself" });
        return;
      }
      const map = meetingSockets.get(rKey);
      if (!map?.has(targetId)) {
        ack?.({ ok: false, error: "Not in call" });
        return;
      }
      const target = io.sockets.sockets.get(targetId);
      target?.emit("removed-from-meeting", { reason: "You were removed by the host." });
      target?.disconnect(true);
      ack?.({ ok: true });
    });

    socket.on("webrtc-signal", ({ to, signal }) => {
      if (!to || !signal || !socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (!map?.has(socket.id) || !map?.has(to)) return;
      io.to(to).emit("webrtc-signal", { from: socket.id, signal });
    });

    socket.on("chat-message", ({ text }) => {
      if (!socket.meetingCode || !text?.trim()) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (!map?.has(socket.id)) return;
      io.to(rKey).emit("chat-message", {
        id: `${socket.id}-${Date.now()}`,
        senderId: socket.id,
        senderName: socket.displayName || "Guest",
        text: text.trim().slice(0, 2000),
        ts: Date.now(),
        scope: "room",
      });
    });

    socket.on("private-message", ({ to, text }) => {
      if (!socket.meetingCode || !to || !text?.trim()) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (!map?.has(socket.id) || !map?.has(to)) return;

      const recipientName = map.get(to) || "Participant";
      const payload = {
        id: `${socket.id}-dm-${Date.now()}`,
        senderId: socket.id,
        senderName: socket.displayName || "Guest",
        recipientId: to,
        recipientName,
        text: text.trim().slice(0, 2000),
        ts: Date.now(),
        scope: "private",
      };
      io.to(to).emit("private-message", payload);
      socket.emit("private-message", payload);
    });

    socket.on("whiteboard-draw", (data) => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      if (!meetingWhiteboards.has(rKey)) {
        meetingWhiteboards.set(rKey, { lines: [], notes: [], images: [] });
      }
      meetingWhiteboards.get(rKey).lines.push(data);
      socket.to(rKey).emit("whiteboard-draw", data);
    });

    socket.on("whiteboard-notes", (notes) => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      if (!meetingWhiteboards.has(rKey)) {
        meetingWhiteboards.set(rKey, { lines: [], notes: [], images: [] });
      }
      meetingWhiteboards.get(rKey).notes = notes;
      socket.to(rKey).emit("whiteboard-notes", notes);
    });

    socket.on("whiteboard-images", (images) => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      if (!meetingWhiteboards.has(rKey)) {
        meetingWhiteboards.set(rKey, { lines: [], notes: [], images: [] });
      }
      meetingWhiteboards.get(rKey).images = images;
      socket.to(rKey).emit("whiteboard-images", images);
    });

    socket.on("whiteboard-clear", () => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      meetingWhiteboards.set(rKey, { lines: [], notes: [], images: [] });
      socket.to(rKey).emit("whiteboard-clear");
    });

    socket.on("raise-hand", ({ raised }) => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (!map?.has(socket.id)) return;
      socket.to(rKey).emit("user-hand-state-changed", { socketId: socket.id, raised });
    });

    socket.on("caption-broadcast", ({ text, isFinal }) => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (!map?.has(socket.id)) return;
      socket.to(rKey).emit("caption-broadcast", {
        socketId: socket.id,
        displayName: socket.displayName || "Guest",
        text,
        isFinal,
      });
    });


    socket.on("disconnect", () => {
      const waitKey = socket.waitingForKey;
      if (waitKey) {
        const wq = waitingQueues.get(waitKey);
        if (wq) {
          wq.delete(socket.id);
          if (wq.size === 0) waitingQueues.delete(waitKey);
        }
        const hostSock = hostSocketByRoom.get(waitKey);
        if (hostSock) {
          io.to(hostSock).emit("waiting-left", { socketId: socket.id });
        }
        return;
      }

      if (!socket.meetingCode) return;

      logActivity({
        userId: socket.userId || null,
        userEmail: socket.userEmail || "N/A",
        userName: socket.userName || socket.displayName || "Guest",
        category: "meeting",
        action: "meeting_leave",
        details: { meetingCode: socket.meetingCode, socketId: socket.id },
        ipAddress: socket.handshake.address || "Unknown",
      });

      const rKey = roomKey(socket.meetingCode);
      const wasHost = hostSocketByRoom.get(rKey) === socket.id;

      const map = meetingSockets.get(rKey);
      if (map) {
        map.delete(socket.id);
        mutedStateByRoom.get(rKey)?.delete(socket.id);
        io.to(rKey).emit("participant-muted-state", { socketId: socket.id, muted: false });
        socket.to(rKey).emit("user-left", { socketId: socket.id });
        if (map.size === 0) {
          meetingSockets.delete(rKey);
          hostSocketByRoom.delete(rKey);
          waitingQueues.delete(rKey);
          mutedStateByRoom.delete(rKey);
          meetingWhiteboards.delete(rKey);

          logActivity({
            userId: socket.userId || null,
            userEmail: socket.userEmail || "N/A",
            userName: socket.userName || socket.displayName || "Guest",
            category: "meeting",
            action: "meeting_delete",
            details: { meetingCode: socket.meetingCode, reason: "all_participants_left" },
            ipAddress: socket.handshake.address || "Unknown",
          });
        }
      }

      if (wasHost) {
        hostSocketByRoom.delete(rKey);
        const m = meetingSockets.get(rKey);
        if (m && m.size > 0) {
          const nextHost = [...m.keys()][0];
          hostSocketByRoom.set(rKey, nextHost);
          io.to(rKey).emit("host-changed", { hostSocketId: nextHost });
        }
      }
    });
  });
}
