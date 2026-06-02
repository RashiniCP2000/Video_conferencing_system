import mongoose from "mongoose";

const planSchema = new mongoose.Schema(
  {
    planId: { type: String, required: true, unique: true, index: true }, // e.g. "basic", "student", "corporate"
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    interval: { type: String, enum: ["month", "year"], default: "month" },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true },
    description: { type: String },
  },
  { timestamps: true }
);

export const Plan = mongoose.model("Plan", planSchema);
