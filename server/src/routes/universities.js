import express from "express";
import { authRequired } from "../middleware/auth.js";
import { adminRequired } from "../middleware/auth.js";
import { University } from "../models/University.js";

const router = express.Router();

const normalize = (value) => value.trim().toLowerCase();

router.get("/", authRequired, adminRequired, async (_req, res) => {
  try {
    const universities = await University.find().sort({ name: 1 });
    res.json({ universities });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch universities", error: error.message });
  }
});

router.post("/", authRequired, adminRequired, async (req, res) => {
  try {
    const { name, country = "Sri Lanka", emailDomain = "" } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: "University name is required." });

    const normalizedName = normalize(name);
    const university = await University.findOneAndUpdate(
      { normalizedName },
      { name: name.trim(), normalizedName, country: country.trim(), emailDomain: emailDomain.trim(), status: "active" },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ university });
  } catch (error) {
    res.status(500).json({ message: "Failed to save university", error: error.message });
  }
});

router.delete("/:id", authRequired, adminRequired, async (req, res) => {
  try {
    const university = await University.findByIdAndDelete(req.params.id);
    if (!university) return res.status(404).json({ message: "University not found" });
    res.json({ message: "University removed", university });
  } catch (error) {
    res.status(500).json({ message: "Failed to remove university", error: error.message });
  }
});

export default router;
