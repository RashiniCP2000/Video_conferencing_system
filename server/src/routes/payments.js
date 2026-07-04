import express from "express";
import Stripe from "stripe";
import { User } from "../models/User.js";
import { Subscription } from "../models/Subscription.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";
const stripe = new Stripe(stripeKey);

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[Stripe] Warning: STRIPE_SECRET_KEY is missing. Payments will not work.");
}

const PRICE_IDS = {
  basic: "price_basic_id", // Placeholder
  student: "price_student_id", // Placeholder
};

router.post("/create-checkout-session", authRequired, async (req, res) => {
  try {
    const { plan, interval = "monthly" } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check verification if student plan
    if (plan === "student" && user.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Student verification required for this plan." });
    }

    // Fallback to Mock Payment Gateway if Stripe key is placeholder or missing
    if (stripeKey === "sk_test_placeholder" || !process.env.STRIPE_SECRET_KEY) {
      const mockSessionId = "mock_" + Math.random().toString(36).substring(2, 11);
      const redirectUrl = `/checkout/mock?session_id=${mockSessionId}&plan=${plan}&interval=${interval}`;
      return res.json({ id: mockSessionId, url: redirectUrl });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: user.email,
      line_items: [
        {
          price: PRICE_IDS[plan],
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/pricing`,
      metadata: {
        userId: user._id.toString(),
        plan: plan,
        interval: interval,
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Stripe session creation failed", error: error.message });
  }
});

router.post("/mock-complete-session", authRequired, async (req, res) => {
  try {
    const { sessionId, plan, interval = "monthly" } = req.body;
    if (!sessionId || !plan) {
      return res.status(400).json({ message: "Missing sessionId or plan" });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.plan = plan;
    user.subscriptionStatus = "active";
    user.stripeCustomerId = "mock_customer_" + user._id;
    await user.save();

    const durationDays = interval === "yearly" ? 365 : 30;
    await Subscription.create({
      userId: user._id,
      plan: plan,
      stripeSubscriptionId: "mock_sub_" + Math.random().toString(36).substring(2, 11),
      status: "active",
      currentPeriodEnd: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Mock payment completion failed", error: error.message });
  }
});

// Webhook to handle successful payments
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata.userId;
    const plan = session.metadata.plan;

    const user = await User.findById(userId);
    if (user) {
      user.plan = plan;
      user.subscriptionStatus = "active";
      user.stripeCustomerId = session.customer;
      await user.save();

      await Subscription.create({
        userId,
        plan,
        stripeSubscriptionId: session.subscription,
        status: "active",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Approx 30 days
      });
    }
  }

  res.json({ received: true });
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
