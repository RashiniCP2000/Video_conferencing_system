import { Router } from "express";
import multer from "multer";
import { Recording } from "../models/Recording.js";
import { authRequired } from "../middleware/auth.js";
import { uploadFile, deleteFile } from "../config/s3.js";

const router = Router();
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

    res.json({ message: "Recording successfully deleted." });
  } catch (error) {
    console.error("[Recordings Route] Deletion failed:", error);
    res.status(500).json({ message: "Deletion failed", error: error.message });
  }
});

export default router;
