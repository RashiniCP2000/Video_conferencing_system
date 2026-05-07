import express from "express";
import multer from "multer";
import { User } from "../models/User.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// Student Verification
router.post("/student", authRequired, upload.single("idCard"), async (req, res) => {
  try {
    const { universityEmail } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.verificationStatus = "pending";
    user.verificationType = "student";
    user.verificationData = {
      universityEmail,
      idCardPath: req.file ? req.file.path : null,
    };

    await user.save();
    res.json({ message: "Student verification submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Corporate Verification
router.post("/corporate", authRequired, async (req, res) => {
  try {
    const { companyName, workEmail } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.verificationStatus = "pending";
    user.verificationType = "corporate";
    user.verificationData = {
      companyName,
      workEmail,
    };

    await user.save();
    res.json({ message: "Corporate verification submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
