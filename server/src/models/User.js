import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    plan: {
      type: String,
      enum: ["free", "basic", "student", "corporate"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["inactive", "active", "past_due", "canceled"],
      default: "inactive",
    },
    verificationStatus: {
      type: String,
      enum: ["none", "pending", "verified", "rejected"],
      default: "none",
    },
    verificationType: {
      type: String,
      enum: ["student", "corporate"],
    },
    stripeCustomerId: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
