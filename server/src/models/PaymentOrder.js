import mongoose from "mongoose";

const paymentOrderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    provider: { type: String, enum: ["stripe", "payhere", "mock"], required: true },
    plan: { type: String, enum: ["student", "corporate"], required: true },
    interval: { type: String, enum: ["one_time", "monthly", "yearly"], required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "LKR" },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
    gatewaySessionId: { type: String },
    gatewayPaymentId: { type: String },
    invoiceNumber: { type: String },
    invoicePath: { type: String },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: "Subscription" },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const PaymentOrder = mongoose.model("PaymentOrder", paymentOrderSchema);
