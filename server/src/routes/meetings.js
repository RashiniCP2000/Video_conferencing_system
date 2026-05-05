import { Router } from "express";
import { randomBytes } from "crypto";
import { Meeting } from "../models/Meeting.js";
import { User } from "../models/User.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";

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
      createdAt: meeting.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not load meeting" });
  }
});

export default router;
