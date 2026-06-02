import { Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { Meeting } from "../models/Meeting.js";
import { Recording } from "../models/Recording.js";
import { Subscription } from "../models/Subscription.js";
import { Plan } from "../models/Plan.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authRequired, adminRequired } from "../middleware/auth.js";
import { logActivity, getClientIp } from "../utils/activityLogger.js";

const router = Router();

// Self-executing seed function to populate default plans
async function seedDefaultPlans() {
  try {
    const count = await Plan.countDocuments();
    if (count === 0) {
      console.log("[Seeding] Populating default subscription plans...");
      await Plan.insertMany([
        {
          planId: "free",
          name: "Free Tier",
          price: 0,
          interval: "month",
          features: ["Standard 40-minute limit", "Up to 10 participants", "Screen sharing"],
          isActive: true,
          description: "Basic features for simple call hosting."
        },
        {
          planId: "basic",
          name: "Basic Plan",
          price: 9.99,
          interval: "month",
          features: ["Unlimited call duration", "Up to 50 participants", "Cloud call recording (Local/S3)"],
          isActive: true,
          description: "Ideal plan for small teams and developers."
        },
        {
          planId: "student",
          name: "Student Tier",
          price: 4.99,
          interval: "month",
          features: ["Unlimited call duration", "Up to 100 participants", "Cloud recording", "Google Calendar connected"],
          isActive: true,
          description: "Affordable plan with full features for verified students."
        },
        {
          planId: "corporate",
          name: "Corporate Enterprise",
          price: 19.99,
          interval: "month",
          features: ["Unlimited call duration", "Up to 250 participants", "Cloud recording", "Priority support & high storage limits"],
          isActive: true,
          description: "Robust security and features for businesses."
        }
      ]);
      console.log("[Seeding] Populated 4 default plans successfully!");
    }
  } catch (error) {
    console.error("Error seeding default plans:", error);
  }
}
seedDefaultPlans();

// Apply authRequired and adminRequired to all admin routes
router.use(authRequired);
router.use(adminRequired);

/**
 * GET /api/admin/stats
 * Aggregates counts and analytics dataset for the overview screen.
 */
router.get("/stats", async (req, res) => {
  try {
    // 1. Cards overview counters
    const totalUsers = await User.countDocuments();
    
    // Active users: users logged in/updated in the last 7 days
    const activeUsersThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ updatedAt: { $gte: activeUsersThreshold } });
    
    const premiumSubscribers = await User.countDocuments({
      plan: { $ne: "free" },
      subscriptionStatus: "active",
    });
    
    const totalMeetings = await Meeting.countDocuments();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const meetingsHeldToday = await Meeting.countDocuments({ createdAt: { $gte: todayStart } });
    
    const totalRecordings = await Recording.countDocuments();
    
    const storageAggregate = await Recording.aggregate([
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
    ]);
    const storageUsage = storageAggregate[0]?.totalSize || 0;

    // 2. Charts Data
    // Daily registration trends & meeting activity for the last 7 days
    const registrationTrends = [];
    const meetingActivity = [];
    
    for (let i = 6; i >= 0; i--) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - i);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      
      const dayUsers = await User.countDocuments({ createdAt: { $gte: start, $lt: end } });
      const dayMeetings = await Meeting.countDocuments({ createdAt: { $gte: start, $lt: end } });
      
      const dateString = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      registrationTrends.push({ label: dateString, value: dayUsers });
      meetingActivity.push({ label: dateString, value: dayMeetings });
    }

    // Subscription revenue statistics (Revenue approximation based on plan subscription numbers)
    const plans = ["free", "basic", "student", "corporate"];
    const subscriptionStats = {};
    for (const plan of plans) {
      subscriptionStats[plan] = await User.countDocuments({ plan });
    }

    // Storage usage statistics: local vs s3 size aggregation
    const localStorageAggregate = await Recording.aggregate([
      { $match: { storageType: "local" } },
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
    ]);
    const s3StorageAggregate = await Recording.aggregate([
      { $match: { storageType: "s3" } },
      { $group: { _id: null, totalSize: { $sum: "$fileSize" } } },
    ]);
    
    const storageStats = {
      local: localStorageAggregate[0]?.totalSize || 0,
      s3: s3StorageAggregate[0]?.totalSize || 0,
    };

    res.json({
      cards: {
        totalUsers,
        activeUsers,
        premiumSubscribers,
        totalMeetings,
        meetingsHeldToday,
        totalRecordings,
        storageUsage,
      },
      charts: {
        registrationTrends,
        meetingActivity,
        subscriptionStats,
        storageStats,
      },
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    res.status(500).json({ message: "Failed to load admin overview statistics" });
  }
});

/**
 * GET /api/admin/recent-activities
 * Fetches recent database changes in last few days (users, meetings, subs, recordings)
 */
router.get("/recent-activities", async (req, res) => {
  try {
    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("name email plan createdAt");

    const recentMeetings = await Meeting.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("host", "name email")
      .lean();

    const recentRecordings = await Recording.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean();

    const recentSubscriptions = await Subscription.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .lean();

    res.json({
      recentRegistrations,
      recentMeetings: recentMeetings.map((m) => ({
        id: m._id,
        meetingCode: m.meetingCode,
        title: m.title,
        hostName: m.host?.name || "Deleted User",
        hostEmail: m.host?.email || "N/A",
        createdAt: m.createdAt,
        endedAt: m.endedAt,
      })),
      recentRecordings: recentRecordings.map((r) => ({
        id: r._id,
        title: r.title,
        meetingCode: r.meetingCode,
        userName: r.userId?.name || "Deleted User",
        fileSize: r.fileSize,
        duration: r.duration,
        createdAt: r.createdAt,
      })),
      recentSubscriptions: recentSubscriptions.map((s) => ({
        id: s._id,
        userName: s.userId?.name || "Deleted User",
        userEmail: s.userId?.email || "N/A",
        plan: s.plan,
        status: s.status,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching recent activities:", error);
    res.status(500).json({ message: "Failed to load recent activities" });
  }
});

/**
 * GET /api/admin/users
 * Fetches a list of all users. Optional query parameter search.
 */
router.get("/users", async (req, res) => {
  try {
    const search = req.query.search || "";
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .select("name email role plan subscriptionStatus verificationStatus verificationType verificationData status createdAt");

    res.json({ users });
  } catch (error) {
    console.error("Error fetching users list:", error);
    res.status(500).json({ message: "Failed to load user directory" });
  }
});

/**
 * POST /api/admin/users
 * Creates a new user with 'admin' role directly.
 */
router.post("/users", async (req, res) => {
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
    const newAdmin = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: "admin",
    });

    res.status(201).json({
      message: "Admin created successfully",
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        role: newAdmin.role,
      },
    });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Failed to create new admin user" });
  }
});

/**
 * PATCH /api/admin/users/:id
 * Updates specific credentials, roles, plans, or verification status.
 */
router.patch("/users/:id", async (req, res) => {
  try {
    const { name, email, role, plan, subscriptionStatus, verificationStatus } = req.body;
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase().trim();
    if (role) updateData.role = role;
    if (plan) updateData.plan = plan;
    if (subscriptionStatus) updateData.subscriptionStatus = subscriptionStatus;
    if (verificationStatus) updateData.verificationStatus = verificationStatus;

    // Prevent demoting the last admin user
    if (role === "user") {
      const userToDemote = await User.findById(req.params.id);
      if (userToDemote && userToDemote.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot demote the only remaining administrator." });
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select("name email role plan subscriptionStatus verificationStatus verificationType status createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    logActivity({
      userId: req.params.id,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      category: "user",
      action: "profile_update",
      details: { updatedFields: Object.keys(updateData), updatedBy: req.userId },
      ipAddress: getClientIp(req),
    });

    res.json({ message: "User updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating user details:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Deletes user profile
 */
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.userId) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const userToDel = await User.findById(req.params.id);
    if (!userToDel) return res.status(404).json({ message: "User not found" });

    if (userToDel.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Cannot delete the only remaining administrator." });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    logActivity({
      userId: req.params.id,
      userEmail: userToDel.email,
      userName: userToDel.name,
      category: "user",
      action: "profile_update",
      details: { deleted: true, deletedBy: req.userId },
      ipAddress: getClientIp(req),
    });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user profile" });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Suspends or activates user accounts
 */
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (status !== "active" && status !== "suspended") {
      return res.status(400).json({ message: "Status must be active or suspended" });
    }
    if (req.params.id === req.userId && status === "suspended") {
      return res.status(400).json({ message: "You cannot suspend your own account." });
    }

    if (status === "suspended") {
      const userToSuspend = await User.findById(req.params.id);
      if (userToSuspend && userToSuspend.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Cannot suspend the only remaining administrator." });
        }
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true }
    ).select("name email role plan subscriptionStatus verificationStatus status createdAt");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    logActivity({
      userId: req.params.id,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      category: "user",
      action: "profile_update",
      details: { status, updatedBy: req.userId },
      ipAddress: getClientIp(req),
    });

    res.json({ message: `User status changed to ${status} successfully`, user: updatedUser });
  } catch (error) {
    console.error("Error changing user status:", error);
    res.status(500).json({ message: "Failed to update account status" });
  }
});

/**
 * POST /api/admin/users/:id/reset-password
 * Overwrites password of a user account
 */
router.post("/users/:id/reset-password", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const updatedUser = await User.findByIdAndUpdate(req.params.id, { $set: { passwordHash } });
    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    logActivity({
      userId: req.params.id,
      userEmail: updatedUser.email,
      userName: updatedUser.name,
      category: "user",
      action: "password_change",
      details: { method: "admin_reset", resetBy: req.userId },
      ipAddress: getClientIp(req),
    });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting user password:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
});

/**
 * GET /api/admin/users/:id/subscription
 * Fetches user subscription details and payments history
 */
router.get("/users/:id/subscription", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("plan subscriptionStatus createdAt");
    if (!user) return res.status(404).json({ message: "User not found" });

    const history = await Subscription.find({ userId: req.params.id }).sort({ createdAt: -1 });

    let startDate = user.createdAt;
    let expiryDate = null;
    
    if (history.length > 0) {
      startDate = history[history.length - 1].createdAt;
      expiryDate = history[0].currentPeriodEnd;
    }

    res.json({
      plan: user.plan,
      status: user.subscriptionStatus,
      startDate,
      expiryDate,
      history: history.map((h) => ({
        id: h._id,
        plan: h.plan,
        status: h.status,
        date: h.createdAt,
        expires: h.currentPeriodEnd,
        stripeId: h.stripeSubscriptionId,
      })),
    });
  } catch (error) {
    console.error("Error loading user subscription details:", error);
    res.status(500).json({ message: "Failed to load user subscription details" });
  }
});

/**
 * POST /api/admin/verifications/:id/approve or reject
 * Approves or rejects corporate or student verification requests, updating plans instantly.
 */
router.post("/verifications/:id/:action", async (req, res) => {
  try {
    const { action } = req.params;
    if (action !== "approve" && action !== "reject") {
      return res.status(400).json({ message: "Action must be approve or reject" });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: "Verification target user not found" });
    }

    const verificationStatus = action === "approve" ? "verified" : "rejected";
    const updateFields = { verificationStatus };

    if (action === "approve") {
      updateFields.plan = targetUser.verificationType === "student" ? "student" : "corporate";
      updateFields.subscriptionStatus = "active";
    } else {
      updateFields.plan = "free";
      updateFields.subscriptionStatus = "inactive";
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true }
    ).select("name email role plan subscriptionStatus verificationStatus verificationType verificationData status createdAt");

    res.json({
      message: `Verification ${action === "approve" ? "approved" : "rejected"} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error reviewing verification request:", error);
    res.status(500).json({ message: "Failed to complete verification review" });
  }
});

/**
 * GET /api/admin/plans
 * Lists all subscription plans
 */
router.get("/plans", async (req, res) => {
  try {
    const plans = await Plan.find().sort({ createdAt: 1 });
    res.json({ plans });
  } catch (error) {
    console.error("Error fetching plans list:", error);
    res.status(500).json({ message: "Failed to load pricing plans" });
  }
});

/**
 * POST /api/admin/plans
 * Creates a brand new subscription plan
 */
router.post("/plans", async (req, res) => {
  try {
    const { planId, name, price, interval, features, isActive, description } = req.body;
    if (!planId || !name || price === undefined) {
      return res.status(400).json({ message: "planId, name, and price are required." });
    }
    const existing = await Plan.findOne({ planId: planId.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Plan ID already exists." });
    }
    const newPlan = await Plan.create({
      planId: planId.toLowerCase().trim(),
      name,
      price,
      interval: interval || "month",
      features: features || [],
      isActive: isActive !== false,
      description,
    });
    res.status(201).json({ message: "Plan created successfully", plan: newPlan });
  } catch (error) {
    console.error("Error creating plan:", error);
    res.status(500).json({ message: "Failed to create pricing plan" });
  }
});

/**
 * PATCH /api/admin/plans/:id
 * Updates details of an existing subscription plan
 */
router.patch("/plans/:id", async (req, res) => {
  try {
    const { name, price, interval, features, isActive, description } = req.body;
    const updateData = {};
    if (name) updateData.name = name;
    if (price !== undefined) updateData.price = price;
    if (interval) updateData.interval = interval;
    if (features) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (description !== undefined) updateData.description = description;

    const updatedPlan = await Plan.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    if (!updatedPlan) {
      return res.status(404).json({ message: "Plan not found" });
    }
    res.json({ message: "Plan updated successfully", plan: updatedPlan });
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ message: "Failed to update pricing plan" });
  }
});

/**
 * DELETE /api/admin/plans/:id
 * Deletes a pricing plan
 */
router.delete("/plans/:id", async (req, res) => {
  try {
    const plan = await Plan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ message: "Failed to delete pricing plan" });
  }
});

/**
 * GET /api/admin/reports
 * Aggregates a comprehensive JSON summary manifest of the system.
 */
router.get("/reports", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const adminCount = await User.countDocuments({ role: "admin" });
    const standardUsers = await User.countDocuments({ role: "user" });

    const basicPlans = await User.countDocuments({ plan: "basic" });
    const studentPlans = await User.countDocuments({ plan: "student" });
    const corporatePlans = await User.countDocuments({ plan: "corporate" });
    const freePlans = await User.countDocuments({ plan: "free" });

    const activeSubs = await User.countDocuments({ subscriptionStatus: "active" });
    const canceledSubs = await User.countDocuments({ subscriptionStatus: "canceled" });

    const totalMeetings = await Meeting.countDocuments();
    const totalRecordings = await Recording.countDocuments();
    
    const sizeAggregate = await Recording.aggregate([{ $group: { _id: null, sum: { $sum: "$fileSize" } } }]);
    const totalStorageBytes = sizeAggregate[0]?.sum || 0;

    res.json({
      generatedAt: new Date(),
      userDemographics: {
        totalUsers,
        admins: adminCount,
        standardUsers,
        freePlan: freePlans,
        basicPlan: basicPlans,
        studentPlan: studentPlans,
        corporatePlan: corporatePlans,
      },
      subscriptionOverview: {
        active: activeSubs,
        canceled: canceledSubs,
      },
      conferencingMetrics: {
        totalMeetings,
        totalRecordings,
        totalStorageBytes,
      },
    });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ message: "Failed to generate system report" });
  }
});

/**
 * GET /api/admin/activity-logs
 * Fetches activity logs with filtering, search, date range, and pagination.
 */
router.get("/activity-logs", async (req, res) => {
  try {
    const {
      category,
      action,
      search,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const filter = {};

    if (category && category !== "all") {
      filter.category = category;
    }
    if (action && action !== "all") {
      filter.action = action;
    }
    if (search) {
      filter.$or = [
        { userName: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    res.status(500).json({ message: "Failed to load activity logs" });
  }
});

export default router;
