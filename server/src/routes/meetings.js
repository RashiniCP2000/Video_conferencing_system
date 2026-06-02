import { Router } from "express";
import { randomBytes } from "crypto";
import { Meeting } from "../models/Meeting.js";
import { User } from "../models/User.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { flushWaitingQueue } from "../socket/handlers.js";
import { sendMail } from "../config/mailer.js";
import { meetingInviteEmail } from "../config/emailTemplates.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";

const router = Router();

function generateMeetingCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

router.post("/", authRequired, async (req, res) => {
  try {
    let code = generateMeetingCode();
    for (let i = 0; i < 5; i++) {
      const clash = await Meeting.findOne({ meetingCode: code });
      if (!clash) break;
      code = generateMeetingCode();
    }
    const meeting = await Meeting.create({
      meetingCode: code,
      host: req.userId,
      title: req.body.title?.trim() || "Instant meeting",
    });
    const host = await User.findById(req.userId).select("name email");

    logActivity({
      userId: req.userId,
      userEmail: host?.email,
      userName: host?.name,
      category: "meeting",
      action: "meeting_create",
      details: { meetingCode: meeting.meetingCode, title: meeting.title },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      meetingId: meeting.meetingCode,
      meetingLink: `/meet/${meeting.meetingCode}`,
      title: meeting.title,
      host: host ? { name: host.name, email: host.email } : null,
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not create meeting" });
  }
});

router.patch("/:meetingCode/waiting-room", authRequired, async (req, res) => {
  try {
    const code = req.params.meetingCode.toUpperCase();
    const { waitingRoomEnabled } = req.body ?? {};
    if (typeof waitingRoomEnabled !== "boolean") {
      return res.status(400).json({ message: "Body must include waitingRoomEnabled: boolean" });
    }

    const meeting = await Meeting.findOne({ meetingCode: code, endedAt: null });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found or has ended" });
    }
    if (meeting.host.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the meeting host can change the waiting room" });
    }

    meeting.waitingRoomEnabled = waitingRoomEnabled;
    await meeting.save();

    const io = req.app.get("io");
    if (io) {
      io.to(code).emit("waiting-room-updated", { waitingRoomEnabled });
      if (!waitingRoomEnabled) {
        flushWaitingQueue(io, code);
      }
    }

    res.json({
      meetingCode: meeting.meetingCode,
      waitingRoomEnabled: meeting.waitingRoomEnabled,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update waiting room" });
  }
});

router.get("/:meetingCode", optionalAuth, async (req, res) => {
  try {
    const meeting = await Meeting.findOne({
      meetingCode: req.params.meetingCode.toUpperCase(),
      endedAt: null,
    })
      .populate("host", "name email")
      .lean();

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found or has ended" });
    }

    const userId = req.user?._id?.toString();
    const hostId = meeting.host?._id?.toString();
    const isHost = Boolean(userId && hostId && userId === hostId);

    res.json({
      meetingCode: meeting.meetingCode,
      title: meeting.title,
      host: meeting.host ? { name: meeting.host.name, email: meeting.host.email } : null,
      isHost,
      waitingRoomEnabled: meeting.waitingRoomEnabled !== false,
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load meeting" });
  }
});

router.post("/:meetingCode/invite", authRequired, async (req, res) => {
  try {
    const code = req.params.meetingCode.toUpperCase();
    const { emails } = req.body;
    if (!Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({ message: "emails array is required" });
    }

    const meeting = await Meeting.findOne({ meetingCode: code, endedAt: null });
    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found or has ended" });
    }

    const host = await User.findById(req.userId);
    const hostName = host ? host.name : "A user";

    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const meetingLink = `${origin}/meet/${code}`;

    const results = [];
    for (const email of emails) {
      const emailHtml = meetingInviteEmail(meeting.title, meetingLink, hostName);
      const mailResult = await sendMail({
        to: email.trim(),
        subject: `Invitation to join meeting: ${meeting.title}`,
        html: emailHtml,
      });
      results.push({ email, success: mailResult.success, previewUrl: mailResult.previewUrl });
    }

    res.json({ message: "Invitations sent successfully", results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not send invitations" });
  }
});

export default router;
