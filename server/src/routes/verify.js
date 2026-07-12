import express from "express";
import multer from "multer";
import { User } from "../models/User.js";
import { University } from "../models/University.js";
import { authRequired } from "../middleware/auth.js";
import { sendMail } from "../config/mailer.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function getRegisteredUniversities() {
  return (process.env.REGISTERED_UNIVERSITIES || "")
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

async function isUniversityRegistered(universityName) {
  const normalizedName = universityName.trim().toLowerCase();
  const university = await University.findOne({
    normalizedName,
    status: "active",
  });
  if (university) return true;

  const registeredUniversities = getRegisteredUniversities();
  if (registeredUniversities.length > 0) {
    return registeredUniversities.includes(normalizedName);
  }

  return false;
}

// Student Verification
router.post("/student", authRequired, upload.single("idCard"), async (req, res) => {
  try {
    const { universityEmail, universityName } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!req.file) return res.status(400).json({ message: "University ID card upload is required." });
    if (!universityEmail?.trim()) return res.status(400).json({ message: "University email is required." });
    if (!universityName?.trim()) return res.status(400).json({ message: "University name is required." });

    if (!(await isUniversityRegistered(universityName))) {
      return res.status(400).json({
        message:
          "University is not registered in the University Management System. Please contact support.",
      });
    }

    user.verificationStatus = "pending";
    user.verificationType = "student";
    user.verificationData = {
      universityEmail: universityEmail.trim(),
      universityName: universityName.trim(),
      idCardPath: req.file ? req.file.path : null,
    };

    await user.save();
    const adminEmail = process.env.ADMIN_VERIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `Student verification submitted - ${user.name}`,
        html: `<p>A student verification request was submitted.</p>
               <p><strong>User:</strong> ${user.name} (${user.email})</p>
               <p><strong>University:</strong> ${universityName}</p>
               <p><strong>University Email:</strong> ${universityEmail}</p>
               <p><strong>ID Path:</strong> ${req.file.path}</p>`,
      });
    }
    res.json({ message: "Student verification submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Corporate Verification
router.post("/corporate", authRequired, upload.single("businessCertificate"), async (req, res) => {
  try {
    const {
      companyName,
      pvRegistrationNumber,
      businessAddress,
      contactPerson,
      officialEmail,
      phoneNumber,
    } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!companyName?.trim()) return res.status(400).json({ message: "Company name is required." });
    if (!pvRegistrationNumber?.trim()) return res.status(400).json({ message: "PV registration number is required." });
    if (!businessAddress?.trim()) return res.status(400).json({ message: "Business address is required." });
    if (!contactPerson?.trim()) return res.status(400).json({ message: "Contact person is required." });
    if (!officialEmail?.trim()) return res.status(400).json({ message: "Official email is required." });
    if (!phoneNumber?.trim()) return res.status(400).json({ message: "Phone number is required." });
    if (!req.file) return res.status(400).json({ message: "Business registration certificate upload is required." });

    user.verificationStatus = "pending";
    user.verificationType = "corporate";
    user.verificationData = {
      companyName: companyName.trim(),
      pvRegistrationNumber: pvRegistrationNumber.trim(),
      businessAddress: businessAddress.trim(),
      contactPerson: contactPerson.trim(),
      officialEmail: officialEmail.trim(),
      phoneNumber: phoneNumber.trim(),
      businessCertificatePath: req.file.path,
    };

    await user.save();
    const adminEmail = process.env.ADMIN_VERIFICATION_EMAIL || process.env.SMTP_USER;
    if (adminEmail) {
      await sendMail({
        to: adminEmail,
        subject: `Corporate verification submitted - ${companyName}`,
        html: `<p>A corporate verification request was submitted.</p>
               <p><strong>User:</strong> ${user.name} (${user.email})</p>
               <p><strong>Company:</strong> ${companyName}</p>
               <p><strong>PV Registration:</strong> ${pvRegistrationNumber}</p>
               <p><strong>Official Email:</strong> ${officialEmail}</p>
               <p><strong>Certificate:</strong> ${req.file.path}</p>`,
      });
    }
    res.json({ message: "Corporate verification submitted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
