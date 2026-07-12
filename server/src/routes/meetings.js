import { Router } from "express";
import { randomBytes } from "crypto";
import { Meeting } from "../models/Meeting.js";
import { User } from "../models/User.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { flushWaitingQueue } from "../socket/handlers.js";
import { sendMail } from "../config/mailer.js";
import { meetingInviteEmail } from "../config/emailTemplates.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";
import {
  createGoogleCalendarEvent,
  createGoogleCalendarEventPayload,
  deleteGoogleCalendarEvent,
  updateGoogleCalendarEvent,
} from "../utils/googleCalendar.js";

const router = Router();

function generateMeetingCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

async function createUniqueMeetingCode() {
  let code = generateMeetingCode();
  for (let i = 0; i < 5; i++) {
    const clash = await Meeting.findOne({ meetingCode: code }).lean();
    if (!clash) return code;
    code = generateMeetingCode();
  }
  return code;
}

function normalizeInvitees(invitees) {
  if (!invitees) return [];
  if (Array.isArray(invitees)) {
    return invitees
      .map((v) => String(v || "").trim().toLowerCase())
      .filter(Boolean);
  }
  if (typeof invitees === "string") {
    return invitees
      .split(",")
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function mapMeetingForClient(meeting) {
  return {
    meetingCode: meeting.meetingCode,
    title: meeting.title,
    source: meeting.source || "instant",
    scheduledFor: meeting.scheduledFor || null,
    durationMinutes: meeting.durationMinutes || 60,
    timezone: meeting.timezone || "UTC",
    description: meeting.description || "",
    invitees: meeting.invitees || [],
    calendarEventId: meeting.calendarEventId || null,
    calendarEventLink: meeting.calendarEventLink || null,
    waitingRoomEnabled: meeting.waitingRoomEnabled !== false,
    hasPasscode: Boolean(meeting.password),
    createdAt: meeting.createdAt,
    updatedAt: meeting.updatedAt,
    meetingLink: `/meet/${meeting.meetingCode}`,
  };
}

router.post("/", authRequired, async (req, res) => {
  try {
    const code = await createUniqueMeetingCode();
    const meeting = await Meeting.create({
      meetingCode: code,
      host: req.userId,
      title: req.body.title?.trim() || "Instant meeting",
      source: "instant",
    });
    const host = await User.findById(req.userId).select("name email googleCalendarConnected googleAccessToken googleRefreshToken");

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

router.post("/scheduled", authRequired, async (req, res) => {
  try {
    const {
      title,
      date,
      time,
      timezone,
      durationMinutes,
      description,
      invitees,
      waitingRoomEnabled,
      passcode,
      syncGoogleCalendar,
    } = req.body ?? {};

    const meetingTitle = String(title || "").trim();
    if (!meetingTitle) {
      return res.status(400).json({ message: "Meeting title is required" });
    }
    if (!date || !time) {
      return res.status(400).json({ message: "Date and time are required" });
    }

    const scheduledFor = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledFor.getTime())) {
      return res.status(400).json({ message: "Invalid date/time" });
    }

    const code = await createUniqueMeetingCode();
    const meeting = await Meeting.create({
      meetingCode: code,
      host: req.userId,
      title: meetingTitle,
      source: "scheduled",
      scheduledFor,
      durationMinutes: Number(durationMinutes) > 0 ? Number(durationMinutes) : 60,
      timezone: String(timezone || "UTC"),
      description: String(description || "").trim(),
      invitees: normalizeInvitees(invitees),
      waitingRoomEnabled: waitingRoomEnabled !== false,
      password: passcode ? String(passcode).trim() : null,
    });

    const host = await User.findById(req.userId).select("name email googleCalendarConnected googleAccessToken googleRefreshToken");
    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const meetingLink = `${origin}/meet/${meeting.meetingCode}`;
    const inviteResults = [];
    const shouldSyncCalendar = Boolean(syncGoogleCalendar) && host?.googleCalendarConnected;

    if (shouldSyncCalendar) {
      const durationMins = Number(meeting.durationMinutes || 60);
      const endTime = new Date(scheduledFor.getTime() + durationMins * 60 * 1000);
      const eventResponse = await createGoogleCalendarEvent(
        host,
        createGoogleCalendarEventPayload({
          title: meeting.title,
          description: meeting.description,
          startTime: scheduledFor.toISOString(),
          endTime: endTime.toISOString(),
          meetingLink,
          invitees: meeting.invitees,
        })
      );
      meeting.calendarEventId = eventResponse.data.id;
      meeting.calendarEventLink = eventResponse.data.htmlLink || null;
      await meeting.save();
    }

    for (const email of meeting.invitees) {
      const html = meetingInviteEmail(meeting.title, meetingLink, host?.name || "A user", scheduledFor);
      const mailResult = await sendMail({
        to: email,
        subject: `Invitation to join meeting: ${meeting.title}`,
        html,
      });
      inviteResults.push({ email, success: mailResult.success, previewUrl: mailResult.previewUrl });
    }

    logActivity({
      userId: req.userId,
      userEmail: host?.email,
      userName: host?.name,
      category: "meeting",
      action: "meeting_schedule",
      details: { meetingCode: meeting.meetingCode, title: meeting.title, scheduledFor },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      meeting: mapMeetingForClient(meeting),
      calendarSynced: shouldSyncCalendar,
      inviteResults,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not schedule meeting" });
  }
});

router.get("/scheduled", authRequired, async (req, res) => {
  try {
    const meetings = await Meeting.find({ host: req.userId, source: "scheduled", endedAt: null })
      .sort({ scheduledFor: 1, createdAt: -1 })
      .lean();
    res.json({ meetings: meetings.map(mapMeetingForClient) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load scheduled meetings" });
  }
});

router.put("/scheduled/:meetingCode", authRequired, async (req, res) => {
  try {
    const code = req.params.meetingCode.toUpperCase();
    const meeting = await Meeting.findOne({ meetingCode: code, source: "scheduled", endedAt: null });
    if (!meeting) {
      return res.status(404).json({ message: "Scheduled meeting not found" });
    }
    if (meeting.host.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the meeting host can edit this meeting" });
    }

    const {
      title,
      date,
      time,
      timezone,
      durationMinutes,
      description,
      invitees,
      waitingRoomEnabled,
      passcode,
      syncGoogleCalendar,
    } = req.body ?? {};

    if (title !== undefined) meeting.title = String(title || "").trim() || meeting.title;
    if (date && time) {
      const scheduledFor = new Date(`${date}T${time}`);
      if (Number.isNaN(scheduledFor.getTime())) {
        return res.status(400).json({ message: "Invalid date/time" });
      }
      meeting.scheduledFor = scheduledFor;
    }
    if (timezone !== undefined) meeting.timezone = String(timezone || "UTC");
    if (durationMinutes !== undefined) {
      const nextDuration = Number(durationMinutes);
      if (Number.isFinite(nextDuration) && nextDuration > 0) {
        meeting.durationMinutes = nextDuration;
      }
    }
    if (description !== undefined) meeting.description = String(description || "").trim();
    if (invitees !== undefined) meeting.invitees = normalizeInvitees(invitees);
    if (typeof waitingRoomEnabled === "boolean") meeting.waitingRoomEnabled = waitingRoomEnabled;
    if (passcode !== undefined) {
      const nextPasscode = String(passcode || "").trim();
      meeting.password = nextPasscode || null;
    }

    const host = await User.findById(req.userId).select("name email googleCalendarConnected googleAccessToken googleRefreshToken");
    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    const meetingLink = `${origin}/meet/${meeting.meetingCode}`;
    const shouldSyncCalendar = Boolean(syncGoogleCalendar) && host?.googleCalendarConnected;
    if (shouldSyncCalendar) {
      const eventPayload = createGoogleCalendarEventPayload({
        title: meeting.title,
        description: meeting.description,
        startTime: meeting.scheduledFor ? meeting.scheduledFor.toISOString() : new Date().toISOString(),
        endTime: meeting.scheduledFor
          ? new Date(meeting.scheduledFor.getTime() + meeting.durationMinutes * 60 * 1000).toISOString()
          : new Date(Date.now() + meeting.durationMinutes * 60 * 1000).toISOString(),
        meetingLink,
        invitees: meeting.invitees,
      });

      if (meeting.calendarEventId) {
        const eventResponse = await updateGoogleCalendarEvent(host, meeting.calendarEventId, eventPayload);
        meeting.calendarEventLink = eventResponse.data.htmlLink || meeting.calendarEventLink;
      } else {
        const eventResponse = await createGoogleCalendarEvent(host, eventPayload);
        meeting.calendarEventId = eventResponse.data.id;
        meeting.calendarEventLink = eventResponse.data.htmlLink || null;
      }
    }

    await meeting.save();
    res.json({ meeting: mapMeetingForClient(meeting) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not update scheduled meeting" });
  }
});

router.delete("/scheduled/:meetingCode", authRequired, async (req, res) => {
  try {
    const code = req.params.meetingCode.toUpperCase();
    const meeting = await Meeting.findOne({ meetingCode: code, source: "scheduled", endedAt: null });
    if (!meeting) {
      return res.status(404).json({ message: "Scheduled meeting not found" });
    }
    if (meeting.host.toString() !== req.userId) {
      return res.status(403).json({ message: "Only the meeting host can delete this meeting" });
    }

    if (meeting.calendarEventId) {
      const host = await User.findById(req.userId).select("googleCalendarConnected googleAccessToken googleRefreshToken");
      if (host?.googleCalendarConnected) {
        await deleteGoogleCalendarEvent(host, meeting.calendarEventId);
      }
    }

    meeting.endedAt = new Date();
    await meeting.save();
    res.json({ message: "Meeting deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not delete scheduled meeting" });
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
