import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { sendMail } from "../config/mailer.js";
import { passwordResetEmail } from "../config/emailTemplates.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";

const router = Router();

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
    
    // Assign admin role if there are no existing admins in the system
    const adminExists = await User.findOne({ role: "admin" });
    const role = adminExists ? "user" : "admin";

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
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
      details: { role },
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    if (user.status === "suspended") {
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

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscriptionStatus: user.subscriptionStatus },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      // Return 200 even if user not found to prevent email enumeration
      return res.status(200).json({ message: "If that email is registered, we sent a reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const resetUrl = `${process.env.CLIENT_ORIGIN || "http://localhost:5173"}/reset-password/${resetToken}`;
    console.log(`\n--- PASSWORD RESET LINK ---\nFor user: ${user.email}\nLink: ${resetUrl}\n---------------------------\n`);

    // Send the email
    const emailHtml = passwordResetEmail(resetUrl, user.name);
    const mailResult = await sendMail({
      to: user.email,
      subject: "Reset your VideoConf Password",
      html: emailHtml,
    });

    let extraInfo = "";
    if (mailResult.success && mailResult.previewUrl) {
      extraInfo = ` (Preview: ${mailResult.previewUrl})`;
    }

    res.status(200).json({ 
      message: `If that email is registered, we sent a reset link.${extraInfo}` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to process request" });
  }
});

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

router.get("/me", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("name email role plan subscriptionStatus status");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (user.status === "suspended") {
      return res.status(403).json({ message: "Your account has been suspended by an administrator." });
    }

    res.json({
      user: { id: user._id, name: user.name, email: user.email, role: user.role, plan: user.plan, subscriptionStatus: user.subscriptionStatus, status: user.status },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

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
