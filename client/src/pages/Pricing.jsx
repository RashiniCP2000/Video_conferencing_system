import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckIcon } from "@heroicons/react/20/solid";
import api from "../api/client.js";

const tiers = [
  {
    name: "Basic",
    id: "tier-basic",
    href: "#",
    priceMonthly: "$9.99",
    description: "Perfect for individuals and small teams.",
    features: [
      "Unlimited 1-on-1 meetings",
      "Up to 50 participants per meeting",
      "Group chat & screen sharing",
      "HD video and audio",
      "Basic support",
    ],
    featured: false,
    buttonText: "Get started",
  },
  {
    name: "Student",
    id: "tier-student",
    href: "/verify/student",
    priceMonthly: "$4.99",
    description: "Specially priced for students at verified institutions.",
    features: [
      "All Basic features",
      "Up to 100 participants",
      "Cloud recording (5GB)",
      "Student community access",
      "Priority support",
    ],
    featured: true,
    buttonText: "Verify & Subscribe",
  },
  {
    name: "Corporate",
    id: "tier-corporate",
    href: "/verify/corporate",
    priceMonthly: "Custom",
    description: "Enterprise-grade features for your company.",
    features: [
      "All Basic features",
      "Unlimited participants",
      "Admin dashboard & usage stats",
      "SSO integration",
      "Dedicated account manager",
      "Custom branding",
    ],
    featured: false,
    buttonText: "Contact Sales",
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Pricing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (plan) => {
    if (plan === "corporate") {
      navigate("/verify/corporate");
      return;
    }
    if (plan === "student") {
      navigate("/verify/student");
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/payments/create-checkout-session", { plan });
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-accent">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose the right plan for your needs
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-400">
          From solo projects to global enterprises, we have a plan that fits. 
          Verified students and corporate teams get exclusive benefits.
        </p>
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.featured
                  ? "bg-surface-elevated ring-2 ring-accent"
                  : "bg-surface-elevated/50 ring-1 ring-surface-border",
                "rounded-3xl p-8 xl:p-10"
              )}
            >
              <h3
                id={tier.id}
                className={classNames(
                  tier.featured ? "text-accent" : "text-white",
                  "text-lg font-semibold leading-8"
                )}
              >
                {tier.name}
              </h3>
              <p className="mt-4 text-sm leading-6 text-slate-400">{tier.description}</p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-white">{tier.priceMonthly}</span>
                {tier.priceMonthly !== "Custom" && (
                  <span className="text-sm font-semibold leading-6 text-slate-400">/month</span>
                )}
              </p>
              <button
                onClick={() => handleSubscribe(tier.name.toLowerCase())}
                disabled={loading}
                className={classNames(
                  tier.featured
                    ? "bg-accent text-white shadow-sm hover:bg-blue-600"
                    : "bg-white/10 text-white hover:bg-white/20",
                  "mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-50"
                )}
              >
                {loading ? "Processing..." : tier.buttonText}
              </button>
              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-300 xl:mt-10">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon className="h-6 w-5 flex-none text-accent" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
