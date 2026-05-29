import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    meetingCode: { type: String, required: true, index: true },
    title: { type: String, default: "Call Recording" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    duration: { type: Number, required: true }, // in seconds
    fileSize: { type: Number, required: true }, // in bytes
    storageType: { type: String, enum: ["s3", "local"], default: "local" },
  },
  { timestamps: true }
);

export const Recording = mongoose.model("Recording", recordingSchema);
