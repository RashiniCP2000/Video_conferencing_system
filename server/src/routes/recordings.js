import { Router } from "express";
import multer from "multer";
import { Recording } from "../models/Recording.js";
import { authRequired } from "../middleware/auth.js";
import { uploadFile, deleteFile } from "../config/s3.js";
import { sendMail } from "../config/mailer.js";
import { recordingReadyEmail } from "../config/emailTemplates.js";
import { User } from "../models/User.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";

const router = Router();
const RECORDING_ENABLED_PLANS = new Set(["student", "corporate"]);
const STUDENT_STORAGE_LIMIT_BYTES = 20 * 1024 * 1024 * 1024;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB limit for dev testing
  },
});

// POST /api/recordings - Upload a new recording file
router.post("/", authRequired, upload.single("video"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No video file uploaded." });
    }

    const user = await User.findById(req.userId).select("name email plan");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!RECORDING_ENABLED_PLANS.has(user.plan)) {
      return res.status(403).json({
        message: "Recording is available only on Student and Corporate plans.",
      });
    }
    if (user.plan === "student") {
      const usage = await Recording.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, total: { $sum: "$fileSize" } } },
      ]);
      const currentUsage = usage[0]?.total || 0;
      if (currentUsage + req.file.size > STUDENT_STORAGE_LIMIT_BYTES) {
        return res.status(400).json({
          message: "Student storage limit reached (20GB). Delete old recordings to upload new ones.",
        });
      }
    }

    const { meetingCode, title, duration } = req.body;
    if (!meetingCode) {
      return res.status(400).json({ message: "Meeting code is required." });
    }

    // Upload using s3.js helper
    const uploadResult = await uploadFile(
      req.file.buffer,
      req.file.originalname || `meeting-${meetingCode}.webm`,
      req.file.mimetype || "video/webm"
    );

    // Save to Database
    const recording = await Recording.create({
      meetingCode: meetingCode.toUpperCase(),
      title: title || "Instant Meeting Recording",
      userId: req.userId,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      duration: duration ? Number(duration) : 0,
      fileSize: req.file.size,
      storageType: uploadResult.storageType,
    });

    // Notify the host via email
    let host = user;
    try {
      if (host && host.email) {
        const recordingLink = recording.fileUrl;
        const emailHtml = recordingReadyEmail(recording.title, recordingLink);
        await sendMail({
          to: host.email,
          subject: `Your meeting recording is ready: ${recording.title}`,
          html: emailHtml,
        });
      }
    } catch (mailError) {
      console.error("[Recordings Route] Failed to send recording ready email:", mailError);
    }

    logActivity({
      userId: req.userId,
      userEmail: host?.email,
      userName: host?.name,
      category: "meeting",
      action: "recording_start",
      details: { meetingCode: meetingCode.toUpperCase(), title: recording.title, fileName: recording.fileName },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      message: "Recording uploaded and saved successfully.",
      recording,
    });
  } catch (error) {
    console.error("[Recordings Route] Upload failed:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
});

// GET /api/recordings - List user's recordings with search and date filters
router.get("/", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("plan");
    if (user?.plan === "corporate") {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const expired = await Recording.find({ userId: req.userId, createdAt: { $lt: cutoff } });
      for (const rec of expired) {
        await deleteFile(rec.fileName, rec.storageType);
      }
      if (expired.length) {
        await Recording.deleteMany({ _id: { $in: expired.map((r) => r._id) } });
      }
    }

    const { search, startDate, endDate } = req.query;

    const query = { userId: req.userId };

    // Search query: filters by title or meeting code
    if (search) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { title: searchRegex },
        { meetingCode: searchRegex },
      ];
    }

    // Date range query
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Extend to end of the day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const recordings = await Recording.find(query)
      .sort({ createdAt: -1 })
      .lean();

    res.json({ recordings });
  } catch (error) {
    console.error("[Recordings Route] Listing failed:", error);
    res.status(500).json({ message: "Failed to fetch recordings", error: error.message });
  }
});

// DELETE /api/recordings/:id - Delete a specific recording
router.delete("/:id", authRequired, async (req, res) => {
  try {
    const recording = await Recording.findOne({ _id: req.params.id, userId: req.userId });

    if (!recording) {
      return res.status(404).json({ message: "Recording not found or unauthorized." });
    }

    // Delete the file using the configuration helper
    await deleteFile(recording.fileName, recording.storageType);

    // Delete from Database
    await Recording.deleteOne({ _id: recording._id });

    const host = await User.findById(req.userId);

    logActivity({
      userId: req.userId,
      userEmail: host?.email,
      userName: host?.name,
      category: "meeting",
      action: "recording_stop",
      details: { meetingCode: recording.meetingCode, title: recording.title, fileName: recording.fileName },
      ipAddress: getClientIp(req),
    });

    res.json({ message: "Recording successfully deleted." });
  } catch (error) {
    console.error("[Recordings Route] Deletion failed:", error);
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
});

// GET /api/recordings/storage-stats - Get storage usage and limits
router.get("/storage-stats", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("plan");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const usage = await Recording.aggregate([
      { $match: { userId: user._id } },
      { $group: { _id: null, total: { $sum: "$fileSize" } } },
    ]);
    const usedBytes = usage[0]?.total || 0;

    let totalBytesLimit = 0;
    let unlimited = false;

    if (user.plan === "student") {
      totalBytesLimit = STUDENT_STORAGE_LIMIT_BYTES;
    } else if (user.plan === "corporate") {
      totalBytesLimit = 100 * 1024 * 1024 * 1024; // 100 GB visual baseline
      unlimited = true;
    }

    res.json({
      usedBytes,
      totalBytesLimit,
      remainingBytes: Math.max(0, totalBytesLimit - usedBytes),
      unlimited,
      plan: user.plan,
    });
  } catch (err) {
    console.error("[Recordings Route] Failed to fetch storage stats:", err);
    res.status(500).json({ message: "Failed to fetch storage stats", error: err.message });
  }
});

// PATCH /api/recordings/:id/rename - Rename a specific recording
router.patch("/:id/rename", authRequired, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ message: "Title is required." });
    }

    const recording = await Recording.findOne({ _id: req.params.id, userId: req.userId });
    if (!recording) {
      return res.status(404).json({ message: "Recording not found or unauthorized." });
    }

    recording.title = title.trim();
    await recording.save();

    res.json({
      message: "Recording renamed successfully.",
      recording,
    });
  } catch (err) {
    console.error("[Recordings Route] Rename failed:", err);
    res.status(500).json({ message: "Rename failed", error: err.message });
  }
});

export default router;
