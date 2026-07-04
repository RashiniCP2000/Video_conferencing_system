import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { sendMail } from "../config/mailer.js";
import { passwordResetEmail, otpEmail } from "../config/emailTemplates.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";

const router = Router();

/* ── POST /auth/register ──────────────────────────────────────────── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return res.status(400).json({
        message: "Name, email, and password (min 6 characters) are required",
      });
    }
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: "Email already registered" });
    }
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "user",
    });
    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      category: "user",
      action: "register",
      details: { role: user.role },
      ipAddress: getClientIp(req),
    });

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscriptionStatus: user.subscriptionStatus },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

/* ── POST /auth/login ─────────────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth/Login] Login attempt for email: ${email}`);
    if (!email?.trim() || !password) {
      console.log(`[Auth/Login] Failed: missing email or password`);
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      console.log(`[Auth/Login] Failed: user not found in database for email: ${email}`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.passwordHash);
    console.log(`[Auth/Login] Password comparison result: ${isPasswordMatch}`);
    if (!isPasswordMatch) {
      console.log(`[Auth/Login] Failed: password mismatch`);
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status === "suspended") {
      console.log(`[Auth/Login] Failed: user account status is suspended`);
      return res.status(403).json({ message: "Your account has been suspended by an administrator." });
    }

    const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      category: "user",
      action: "login",
      ipAddress: getClientIp(req),
    });

    console.log(`[Auth/Login] Success: token generated for user ID: ${user._id}`);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscriptionStatus: user.subscriptionStatus },
    });
  } catch (err) {
    console.error("[Auth/Login] Exception occurred:", err);
    res.status(500).json({ message: "Login failed" });
  }
});

/* ── POST /auth/forgot-password ───────────────────────────────────── */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ message: "If that email is registered, we sent a reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${resetToken}`;
    console.log(`\n--- PASSWORD RESET LINK ---\nFor user: ${user.email}\nLink: ${resetUrl}\n---------------------------\n`);

    const emailHtml = passwordResetEmail(resetUrl, user.name);
    const mailResult = await sendMail({
      to: user.email,
      subject: "Reset your MeetNova Password",
      html: emailHtml,
    });

    let extraInfo = "";
    if (mailResult.success && mailResult.previewUrl) {
      extraInfo = ` (Preview: ${mailResult.previewUrl})`;
    }

    res.status(200).json({
      message: `If that email is registered, we sent a reset link.${extraInfo}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

/* ── POST /auth/send-otp ──────────────────────────────────────────── */
router.post("/send-otp", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email?.trim()) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(200).json({ message: "If that email is registered, we sent a code." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordOtp = crypto.createHash("sha256").update(otp).digest("hex");
    user.passwordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    console.log(`\n--- OTP RESET CODE ---\nFor user: ${user.email}\nOTP: ${otp}\n----------------------\n`);

    const emailHtml = otpEmail(otp, user.name);
    const mailResult = await sendMail({
      to: user.email,
      subject: "Your MeetNova Password Reset Code",
      html: emailHtml,
    });

    const isPlaceholder =
      !process.env.SMTP_USER ||
      process.env.SMTP_USER === "your-gmail@gmail.com" ||
      !mailResult ||
      !mailResult.success ||
      mailResult.messageId === "fallback-id-console";

    const responseData = { message: "Verification code sent to your email." };
    if (isPlaceholder || process.env.NODE_ENV !== "production") {
      responseData.debugOtp = otp;
    }

    res.status(200).json(responseData);
  } catch (err) {
    console.error("[Auth/SendOTP] Error:", err);
    res.status(500).json({ message: "Failed to send verification code" });
  }
});

/* ── POST /auth/verify-otp ────────────────────────────────────────── */
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email?.trim() || !otp?.trim()) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const hashedOtp = crypto.createHash("sha256").update(otp.trim()).digest("hex");
    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordOtp: hashedOtp,
      passwordOtpExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    user.passwordOtp = undefined;
    user.passwordOtpExpires = undefined;
    await user.save();

    res.status(200).json({ resetToken });
  } catch (err) {
    console.error("[Auth/VerifyOTP] Error:", err);
    res.status(500).json({ message: "Failed to verify code" });
  }
});

/* ── POST /auth/reset-password ────────────────────────────────────── */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Valid token and new password (min 6 chars) required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Token is invalid or has expired" });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      category: "user",
      action: "password_change",
      details: { method: "self_reset" },
      ipAddress: getClientIp(req),
    });

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

/* ── POST /auth/education-data ────────────────────────────────────── */
router.post("/education-data", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.verificationData = req.body;
    user.plan = "student";
    user.verificationStatus = "verified";
    await user.save();

    res.json({ message: "Education data saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save education data" });
  }
});

/* ── GET /auth/me ─────────────────────────────────────────────────── */
router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email role plan subscriptionStatus status firstName lastName phone jobTitle company country hostKey");
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended by an administrator." });
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        status: user.status,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        phone: user.phone || "",
        jobTitle: user.jobTitle || "",
        company: user.company || "",
        country: user.country || "",
        hostKey: user.hostKey || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

/* ── PUT /auth/profile ────────────────────────────────────────────── */
router.put("/profile", authRequired, async (req, res) => {
  try {
    const { firstName, lastName, email, phone, jobTitle, company, country, hostKey } = req.body;
    if (!email?.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (email.toLowerCase().trim() !== user.email) {
      const existing = await User.findOne({ email: email.toLowerCase().trim() });
      if (existing) {
        return res.status(409).json({ message: "Email is already in use" });
      }
    }

    user.firstName = (firstName || "").trim();
    user.lastName  = (lastName  || "").trim();
    user.name      = `${user.firstName} ${user.lastName}`.trim() || user.name || "User";
    user.email     = email.toLowerCase().trim();
    user.phone     = (phone     || "").trim();
    user.jobTitle  = (jobTitle  || "").trim();
    user.company   = (company   || "").trim();
    user.country   = (country   || "").trim();
    if (hostKey !== undefined) {
      user.hostKey = (hostKey || "").trim();
    }
    await user.save();

    logActivity({
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
      category: "user",
      action: "profile_update",
      ipAddress: getClientIp(req),
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        firstName: user.firstName || "",
        lastName:  user.lastName  || "",
        phone:     user.phone     || "",
        jobTitle:  user.jobTitle  || "",
        company:   user.company   || "",
        country:   user.country   || "",
        hostKey:   user.hostKey   || "",
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

/* ── POST /auth/logout ────────────────────────────────────────────── */
router.post("/logout", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email");
    if (user) {
      logActivity({
        userId: req.userId,
        userEmail: user.email,
        userName: user.name,
        category: "user",
        action: "logout",
        ipAddress: getClientIp(req),
      });
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to log logout activity" });
  }
});

export default router;
