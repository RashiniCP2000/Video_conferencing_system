import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    userEmail: { type: String, default: "N/A" },
    userName: { type: String, default: "Unknown" },
    category: {
      type: String,
      enum: ["user", "meeting"],
      required: true,
      index: true,
    },
    action: {
      type: String,
      enum: [
        "login",
        "logout",
        "register",
        "profile_update",
        "password_change",
        "meeting_create",
        "meeting_delete",
        "meeting_join",
        "meeting_leave",
        "recording_start",
        "recording_stop",
      ],
      required: true,
      index: true,
    },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    ipAddress: { type: String, default: "Unknown" },
  },
  { timestamps: true }
);

// Compound index for efficient querying on the logs page
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
