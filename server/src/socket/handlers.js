import jwt from "jsonwebtoken";
import { Meeting } from "../models/Meeting.js";

const meetingSockets = new Map();

function roomKey(meetingCode) {
  return meetingCode.toUpperCase();
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
        const meetingCode = payload?.meetingCode?.toUpperCase()?.trim();
        const displayName =
          (payload?.displayName?.trim() ||
            socket.handshake.auth?.displayName?.trim() ||
            "Guest") + "";

        if (!meetingCode) {
          ack?.({ ok: false, error: "Missing meeting code" });
          return;
        }

        const meeting = await Meeting.findOne({ meetingCode, endedAt: null }).lean();
        if (!meeting) {
          ack?.({ ok: false, error: "Meeting not found" });
          return;
        }

        socket.meetingCode = meetingCode;
        socket.displayName = displayName.slice(0, 80);

        const rKey = roomKey(meetingCode);
        socket.join(rKey);

        if (!meetingSockets.has(rKey)) meetingSockets.set(rKey, new Map());
        const socketsInMeeting = meetingSockets.get(rKey);

        const existing = [];
        socketsInMeeting.forEach((name, id) => {
          if (id !== socket.id) existing.push({ socketId: id, displayName: name });
        });

        socketsInMeeting.set(socket.id, socket.displayName);

        socket.to(rKey).emit("user-joined", {
          socketId: socket.id,
          displayName: socket.displayName,
        });

        ack?.({
          ok: true,
          socketId: socket.id,
          existingUsers: existing,
        });
      } catch (err) {
        console.error(err);
        ack?.({ ok: false, error: "Join failed" });
      }
    });

    socket.on("webrtc-signal", ({ to, signal }) => {
      if (!to || !signal || !socket.meetingCode) return;
      io.to(to).emit("webrtc-signal", { from: socket.id, signal });
    });

    socket.on("chat-message", ({ text }) => {
      if (!socket.meetingCode || !text?.trim()) return;
      const rKey = roomKey(socket.meetingCode);
      io.to(rKey).emit("chat-message", {
        id: `${socket.id}-${Date.now()}`,
        senderId: socket.id,
        senderName: socket.displayName || "Guest",
        text: text.trim().slice(0, 2000),
        ts: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      if (!socket.meetingCode) return;
      const rKey = roomKey(socket.meetingCode);
      const map = meetingSockets.get(rKey);
      if (map) {
        map.delete(socket.id);
        if (map.size === 0) meetingSockets.delete(rKey);
      }
      socket.to(rKey).emit("user-left", { socketId: socket.id });
    });
  });
}
