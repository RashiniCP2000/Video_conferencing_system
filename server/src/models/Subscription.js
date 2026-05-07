import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["basic", "student", "corporate"], required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodEnd: { type: Date, required: true },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
