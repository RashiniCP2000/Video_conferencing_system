import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin", "host", "participant"], default: "host" },
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
    googleAccessToken: String,
    googleRefreshToken: String,
    googleCalendarConnected: { type: Boolean, default: false },
    verificationData: { type: mongoose.Schema.Types.Mixed, default: {} },
    status: { type: String, enum: ["active", "suspended"], default: "active" },
    
    // Account Lockout on failed logins
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },

    // Email Verification Status
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
