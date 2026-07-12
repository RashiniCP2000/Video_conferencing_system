import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";

const FAQ_ITEMS = [
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time. Your premium benefits will remain active until the end of your current billing period.",
  },
  {
    question: "How does the Student verification work?",
    answer: "When you select the Student plan, you will be redirected to our educational verification page where you submit your institutional details. Once verified, the discounted student price is immediately applied.",
  },
  {
    question: "What payment methods are supported?",
    answer: "We support card payments and online banking through the configured Sri Lankan payment flow.",
  },
  {
    question: "Is there a discount for annual billing?",
    answer: "Corporate users can choose LKR 2,000 monthly or LKR 20,000 yearly billing.",
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isAnnual, setIsAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const highlight = params.get("highlight") || location.hash?.replace("#", "");
    if (highlight) {
      const element = document.getElementById(`tier-${highlight.toLowerCase()}`);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          const card = element.closest(".rounded-3xl");
          if (card) {
            card.classList.add("ring-4", "ring-indigo-500", "scale-105");
            setTimeout(() => {
              card.classList.remove("ring-4", "ring-indigo-500", "scale-105");
            }, 3000);
          }
        }, 150);
      }
    }
  }, [location]);

  const tiers = [
    {
      name: "Basic",
      id: "tier-basic",
      priceMonthly: "FREE",
      priceBilled: "LKR 0",
      description: "Standard free plan for everyday meetings.",
      features: [
        "Unlimited meetings",
        "Limited duration (free-tier style)",
        "No recording",
        "No cloud storage",
        "Google Calendar integration",
        "Standard features only",
      ],
      featured: false,
      buttonText: "Use Basic",
    },
    {
      name: "Student",
      id: "tier-student",
      priceMonthly: "LKR 1,500",
      priceBilled: "One-time payment",
      description: "Verified student plan with recording and managed storage.",
      features: [
        "Meeting recording enabled",
        "20GB cloud storage cap",
        "Download recordings",
        "Delete recordings",
        "Google Calendar integration",
        "Permanent storage within 20GB limit",
      ],
      featured: true,
      buttonText: "Verify & Subscribe",
    },
    {
      name: "Corporate",
      id: "tier-corporate",
      priceMonthly: isAnnual ? "LKR 20,000" : "LKR 2,000",
      priceBilled: isAnnual ? "Yearly billing" : "Monthly billing",
      description: "Business plan with admin controls and premium capabilities.",
      features: [
        "Unlimited meetings",
        "Recording enabled",
        "High / unlimited storage",
        "Full admin control",
        "Google Calendar integration",
        "All premium features unlocked",
        "Recording auto-delete after 3 months",
      ],
      featured: false,
      buttonText: "Verify & Subscribe",
    },
  ];

  const handleSubscribe = (planName) => {
    const plan = planName.toLowerCase();
    
    // If the user already has this plan, do nothing
    if (user?.plan === plan) return;

    if (plan === "basic") {
      navigate("/");
      return;
    }
    if (plan === "corporate") {
      navigate("/verify/corporate");
      return;
    }
    if (plan === "student") {
      // Check if verified already
      if (user?.verificationStatus !== "verified") {
        navigate("/verify/student");
        return;
      }
    }

    if (plan === "student") {
      navigate("/confirm-upgrade?plan=student&interval=one_time");
      return;
    }
    navigate(`/confirm-upgrade?plan=corporate&interval=${isAnnual ? "yearly" : "monthly"}`);
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="bg-slate-50 text-slate-800 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-accent uppercase tracking-wider">Pricing</h2>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Choose the right plan for your needs
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-slate-500">
            From solo projects to global enterprises, we have a plan that fits. 
            Verified students and corporate teams get exclusive benefits.
          </p>
        </div>

        {/* Corporate Billing Toggle */}
        <div className="mt-12 flex justify-center items-center gap-x-4">
          <span className={`text-sm ${!isAnnual ? "text-slate-800 font-semibold" : "text-slate-400"}`}>Corporate Monthly</span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none bg-accent"
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                isAnnual ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
          <span className={`text-sm flex items-center gap-1.5 ${isAnnual ? "text-slate-800 font-semibold" : "text-slate-400"}`}>
            Corporate Yearly
          </span>
        </div>

        {/* Cards Grid */}
        <div className="isolate mx-auto mt-16 grid max-w-md grid-cols-1 gap-y-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8">
          {tiers.map((tier) => {
            const planKey = tier.name.toLowerCase();
            const isCurrentPlan = user && user.plan === planKey;

            return (
              <div
                key={tier.id}
                className={`relative flex flex-col justify-between rounded-3xl p-8 xl:p-10 transition-all duration-300 hover:translate-y-[-4px] ${
                  tier.featured
                    ? "bg-white ring-2 ring-accent shadow-xl scale-105 z-10"
                    : "bg-white ring-1 ring-slate-200 shadow-sm"
                }`}
              >
                {tier.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-accent px-4 py-1 text-xs font-semibold uppercase tracking-wider text-white shadow-md">
                    Most Popular
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start">
                    <h3
                      id={tier.id}
                      className={`text-lg font-bold leading-8 ${
                        tier.featured ? "text-accent" : "text-slate-900"
                      }`}
                    >
                      {tier.name}
                    </h3>
                    {isCurrentPlan && (
                      <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent ring-1 ring-inset ring-accent/20">
                        Current Plan
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-500">{tier.description}</p>
                  
                  <div className="mt-6">
                    <p className="flex items-baseline gap-x-1">
                      <span className="text-4xl font-extrabold tracking-tight text-slate-900">{tier.priceMonthly}</span>
                      {tier.name === "Corporate" && !isAnnual && (
                        <span className="text-sm font-semibold leading-6 text-slate-400">/month</span>
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">{tier.priceBilled}</p>
                  </div>

                  <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-slate-600 xl:mt-10">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex gap-x-3 items-center">
                        <CheckIcon className="h-5 w-5 flex-none text-accent" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handleSubscribe(tier.name)}
                  disabled={isCurrentPlan}
                  className={`mt-8 block w-full rounded-xl py-3 px-3 text-center text-sm font-bold leading-6 transition-all duration-200 cursor-pointer ${
                    isCurrentPlan
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : tier.featured
                      ? "bg-accent hover:bg-blue-600 text-white shadow-lg shadow-blue-500/10"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  {isCurrentPlan ? "Current Plan" : tier.buttonText}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ Accordion Section */}
        <div className="mx-auto max-w-4xl mt-32">
          <h3 className="text-2xl font-bold tracking-tight text-center text-slate-900 mb-12">Frequently Asked Questions</h3>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 shadow-sm">
                  <button
                    onClick={() => toggleFaq(index)}
                    className="w-full flex justify-between items-center px-6 py-4 text-left font-semibold text-slate-800 hover:text-slate-900 transition focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <ChevronDownIcon
                      className={`h-5 w-5 text-slate-450 transition-transform duration-200 ${
                        isOpen ? "transform rotate-180" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-sm leading-relaxed text-slate-500 border-t border-slate-100 pt-3">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
