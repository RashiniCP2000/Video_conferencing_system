import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    meetingCode: { type: String, required: true, unique: true, index: true },
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "Meeting" },
    source: { type: String, enum: ["instant", "scheduled"], default: "instant", index: true },
    scheduledFor: { type: Date, default: null, index: true },
    durationMinutes: { type: Number, default: 60 },
    timezone: { type: String, default: "UTC" },
    description: { type: String, default: "" },
    invitees: { type: [String], default: [] },
    calendarEventId: { type: String, default: null },
    calendarEventLink: { type: String, default: null },
    /** When true (default), guests wait until the meeting host admits them. */
    waitingRoomEnabled: { type: Boolean, default: true },
    endedAt: { type: Date, default: null },
    
    // Meeting Passwords & real-time Locks
    password: { type: String, default: null },
    isLocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Meeting = mongoose.model("Meeting", meetingSchema);
