import express from "express";
import Stripe from "stripe";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";
import { PaymentOrder } from "../models/PaymentOrder.js";
import { authRequired } from "../middleware/auth.js";
import {
  buildOrderId,
  buildPayHereCheckout,
  getPlanCharge,
  normalizePlanInterval,
  verifyPayHereSignature,
  writeInvoicePdf,
} from "../utils/billing.js";

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeKey);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
const API_BASE_URL = process.env.API_BASE_URL || process.env.SERVER_URL || "http://localhost:5000";
const PAYHERE_MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "";
const PAYHERE_MERCHANT_SECRET = process.env.PAYHERE_MERCHANT_SECRET || "";
const hasPayHere = Boolean(PAYHERE_MERCHANT_ID && PAYHERE_MERCHANT_SECRET);
const hasStripe = Boolean(process.env.STRIPE_SECRET_KEY && stripeKey !== "sk_test_placeholder");

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] Warning: STRIPE_SECRET_KEY is missing. Payments will not work.");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const invoiceDir = path.resolve(__dirname, "../../uploads/invoices");

function buildPeriodEnd(plan, interval) {
  if (plan === "student") {
    return new Date(Date.now() + 365 * 50 * 24 * 60 * 60 * 1000);
  }
  return new Date(Date.now() + (interval === "yearly" ? 365 : 30) * 24 * 60 * 60 * 1000);
}

async function finalizeOrder(order, { provider, transactionId, gatewaySessionId, gatewayPaymentId }) {
  const latestOrder = await PaymentOrder.findOne({ orderId: order.orderId });
  if (!latestOrder) {
    throw new Error("Payment order not found");
  }

  if (latestOrder.status === "paid" && latestOrder.subscriptionId && latestOrder.invoicePath) {
    return latestOrder;
  }

  const user = await User.findById(latestOrder.userId);
  if (!user) {
    throw new Error("User not found");
  }

  user.plan = latestOrder.plan;
  user.subscriptionStatus = "active";
  if (provider === "stripe" && transactionId) {
    user.stripeCustomerId = gatewaySessionId || transactionId;
  }
  await user.save();

  const invoiceNumber = latestOrder.invoiceNumber || buildOrderId("INV");
  const invoicePath = path.join(invoiceDir, `${invoiceNumber}.pdf`);
  const currentPeriodEnd = buildPeriodEnd(latestOrder.plan, latestOrder.interval);

  const subscription = await Subscription.create({
    userId: user._id,
    plan: latestOrder.plan,
    stripeSubscriptionId: `${provider}_${latestOrder.orderId}`,
    status: "active",
    currentPeriodEnd,
    amount: latestOrder.amount,
    currency: latestOrder.currency,
    paymentProvider: provider,
    invoiceNumber,
    invoicePath,
    billingInterval: latestOrder.interval,
  });

  await writeInvoicePdf({
    filePath: invoicePath,
    invoice: {
      invoiceNumber,
      orderId: latestOrder.orderId,
      transactionId: transactionId || gatewayPaymentId || gatewaySessionId || latestOrder.orderId,
      createdAt: latestOrder.createdAt,
      customerName: user.name,
      customerEmail: user.email,
      plan: latestOrder.plan,
      interval: latestOrder.interval,
      amount: latestOrder.amount,
      currency: latestOrder.currency,
      description:
        latestOrder.plan === "student"
          ? "Student one-time subscription"
          : `Corporate subscription (${latestOrder.interval})`,
      status: "paid",
      periodEnd: currentPeriodEnd,
    },
  });

  latestOrder.status = "paid";
  latestOrder.gatewaySessionId = gatewaySessionId || latestOrder.gatewaySessionId;
  latestOrder.gatewayPaymentId = gatewayPaymentId || transactionId || latestOrder.gatewayPaymentId;
  latestOrder.invoiceNumber = invoiceNumber;
  latestOrder.invoicePath = invoicePath;
  latestOrder.subscriptionId = subscription._id;
  await latestOrder.save();

  return latestOrder;
}

router.post("/create-checkout-session", authRequired, async (req, res) => {
  try {
    const { plan, interval = "monthly" } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });
    if (plan !== "student" && plan !== "corporate") {
      return res.status(400).json({ message: "Only student and corporate plans are billable." });
    }

    if (plan === "student" && (user.verificationStatus !== "verified" || user.verificationType !== "student")) {
      return res.status(403).json({ message: "Student verification required for this plan." });
    }
    if (plan === "corporate" && (user.verificationStatus !== "verified" || user.verificationType !== "corporate")) {
      return res.status(403).json({ message: "Corporate verification required for this plan." });
    }

    const billing = getPlanCharge(plan, interval);
    const normalizedInterval = normalizePlanInterval(plan, interval);
    const provider = hasPayHere ? "payhere" : hasStripe ? "stripe" : "mock";
    const orderId = buildOrderId(provider === "payhere" ? "PH" : provider === "stripe" ? "ST" : "MK");

    await PaymentOrder.create({
      userId: user._id,
      orderId,
      provider,
      plan,
      interval: normalizedInterval,
      amount: billing.amount,
      currency: billing.currency,
      status: "pending",
      metadata: {
        userEmail: user.email,
      },
    });

    if (provider === "stripe") {
      const stripeLineItem = plan === "corporate"
        ? {
            price_data: {
              currency: "lkr",
              product_data: {
                name: `Corporate Plan (${normalizedInterval})`,
              },
              recurring: {
                interval: normalizedInterval === "yearly" ? "year" : "month",
              },
              unit_amount: Math.round(billing.amount * 100),
            },
            quantity: 1,
          }
        : {
            price_data: {
              currency: "lkr",
              product_data: {
                name: "Student Plan",
              },
              unit_amount: Math.round(billing.amount * 100),
            },
            quantity: 1,
          };

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        customer_email: user.email,
        line_items: [stripeLineItem],
        mode: plan === "corporate" ? "subscription" : "payment",
        success_url: `${CLIENT_URL}/payment-success?order_id=${orderId}&provider=stripe`,
        cancel_url: `${CLIENT_URL}/pricing`,
        metadata: {
          userId: user._id.toString(),
          plan,
          interval: normalizedInterval,
          orderId,
        },
      });

      await PaymentOrder.updateOne({ orderId }, { gatewaySessionId: session.id });
      return res.json({ provider, orderId, url: session.url });
    }

    if (provider === "payhere") {
      const checkout = buildPayHereCheckout({
        merchantId: PAYHERE_MERCHANT_ID,
        merchantSecret: PAYHERE_MERCHANT_SECRET,
        orderId,
        amount: billing.amount,
        currency: billing.currency,
        returnUrl: `${CLIENT_URL}/payment-success?order_id=${orderId}&provider=payhere`,
        cancelUrl: `${CLIENT_URL}/pricing`,
        notifyUrl: `${API_BASE_URL}/api/payments/payhere/notify`,
        customer: {
          name: user.name,
          firstName: user.firstName || user.name.split(" ")[0] || user.name,
          lastName: user.lastName || user.name.split(" ").slice(1).join(" "),
          email: user.email,
          phone: user.phone || "",
          address: user.company || "",
          city: user.country || "",
          country: user.country || "Sri Lanka",
        },
        items: plan === "student" ? "MeetNova Student Plan" : `MeetNova Corporate Plan (${normalizedInterval})`,
        plan,
        interval: normalizedInterval,
      });

      await PaymentOrder.updateOne(
        { orderId },
        { metadata: { checkoutUrl: checkout.checkoutUrl, fields: checkout.fields } }
      );

      return res.json({
        provider,
        orderId,
        checkoutUrl: checkout.checkoutUrl,
        fields: checkout.fields,
      });
    }

    return res.json({
      provider: "mock",
      orderId,
      url: `/checkout/mock?session_id=${orderId}&plan=${plan}&interval=${normalizedInterval}`,
    });
  } catch (error) {
    res.status(500).json({ message: "Payment session creation failed", error: error.message });
  }
});

router.post("/mock-complete-session", authRequired, async (req, res) => {
  try {
    const { sessionId, plan, interval = "monthly" } = req.body;
    if (!sessionId || !plan) {
      return res.status(400).json({ message: "Missing sessionId or plan" });
    }

    const normalizedInterval = normalizePlanInterval(plan, interval);
    let order = await PaymentOrder.findOne({ orderId: sessionId });
    if (!order) {
      const billing = getPlanCharge(plan, normalizedInterval);
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ message: "User not found" });
      order = await PaymentOrder.create({
        userId: user._id,
        orderId: sessionId,
        provider: "mock",
        plan,
        interval: normalizedInterval,
        amount: billing.amount,
        currency: billing.currency,
        status: "pending",
      });
    }

    await finalizeOrder(order, {
      provider: "mock",
      transactionId: `mock_txn_${sessionId}`,
      gatewaySessionId: sessionId,
      gatewayPaymentId: `mock_txn_${sessionId}`,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Mock payment completion failed", error: error.message });
  }
});

router.post("/payhere/notify", express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const {
      order_id: orderId,
      payment_id: paymentId,
      payhere_amount: amount,
      payhere_currency: currency,
      status_code: statusCode,
      md5sig: signature,
    } = req.body;

    if (!orderId) {
      return res.status(400).send("Missing order_id");
    }

    if (statusCode !== "2") {
      await PaymentOrder.updateOne({ orderId }, { status: "failed" });
      return res.status(200).send("ignored");
    }

    if (PAYHERE_MERCHANT_SECRET) {
      const valid = verifyPayHereSignature({
        merchantId: PAYHERE_MERCHANT_ID,
        orderId,
        amount,
        currency,
        statusCode,
        signature,
        merchantSecret: PAYHERE_MERCHANT_SECRET,
      });
      if (!valid) {
        return res.status(400).send("Invalid signature");
      }
    }

    const order = await PaymentOrder.findOne({ orderId });
    if (!order) {
      return res.status(404).send("Order not found");
    }

    await finalizeOrder(order, {
      provider: "payhere",
      transactionId: paymentId || orderId,
      gatewayPaymentId: paymentId || orderId,
    });

    res.status(200).send("OK");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get("/orders/:orderId", authRequired, async (req, res) => {
  try {
    const order = await PaymentOrder.findOne({
      orderId: req.params.orderId,
      userId: req.userId,
    }).populate("subscriptionId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ order });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch order", error: error.message });
  }
});

router.get("/invoices/:subscriptionId/download", authRequired, async (req, res) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.subscriptionId,
      userId: req.userId,
    });

    if (!subscription || !subscription.invoicePath) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    if (!fs.existsSync(subscription.invoicePath)) {
      return res.status(404).json({ message: "Invoice file missing" });
    }

    return res.download(subscription.invoicePath, path.basename(subscription.invoicePath));
  } catch (error) {
    res.status(500).json({ message: "Failed to download invoice", error: error.message });
  }
});

router.get("/billing-history", authRequired, async (req, res) => {
  try {
    const history = await Subscription.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch billing history", error: error.message });
  }
});

router.post("/cancel-subscription", authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = "free";
    user.subscriptionStatus = "inactive";
    await user.save();

    await Subscription.updateMany(
      { userId: req.userId, status: "active" },
      { status: "canceled" }
    );

    res.json({ success: true, plan: "free", subscriptionStatus: "inactive" });
  } catch (error) {
    res.status(500).json({ message: "Failed to cancel subscription", error: error.message });
  }
});

export default router;
