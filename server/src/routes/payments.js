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
    const { plan } = req.body;
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // Check verification if student plan
    if (plan === "student" && user.verificationStatus !== "verified") {
      return res.status(403).json({ message: "Student verification required for this plan." });
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
      },
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ message: "Stripe session creation failed", error: error.message });
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

export default router;
