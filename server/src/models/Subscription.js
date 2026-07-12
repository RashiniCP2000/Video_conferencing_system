import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    plan: { type: String, enum: ["basic", "student", "corporate"], required: true },
    stripeSubscriptionId: { type: String, required: true },
    status: { type: String, required: true },
    currentPeriodEnd: { type: Date, required: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "LKR" },
    paymentProvider: { type: String, enum: ["stripe", "payhere", "mock"], default: "mock" },
    invoiceNumber: { type: String },
    invoicePath: { type: String },
    billingInterval: { type: String, enum: ["one_time", "monthly", "yearly"], default: "monthly" },
  },
  { timestamps: true }
);

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
