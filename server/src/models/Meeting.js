import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    meetingCode: { type: String, required: true, unique: true, index: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Meeting" },
    endedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
