import mongoose from "mongoose";

const universitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    normalizedName: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    country: { type: String, default: "Sri Lanka" },
    emailDomain: { type: String, default: "" },
  },
  { timestamps: true }
);

export const University = mongoose.model("University", universitySchema);
