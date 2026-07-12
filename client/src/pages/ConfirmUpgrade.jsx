import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ArrowLeftIcon, CheckIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const PLAN_DETAILS = {
  student: {
    name: "Student Plan",
    priceOneTime: 1500,
    description: "One-time payment with student verification.",
    features: [
      "Meeting recording",
      "20GB cloud storage",
      "Download and delete recordings",
      "Google Calendar integration",
    ],
  },
  corporate: {
    name: "Corporate Plan",
    priceMonthly: 2000,
    priceYearly: 20000,
    description: "Business subscription with monthly/yearly billing.",
    features: [
      "Unlimited meetings",
      "Recording enabled",
      "Full admin controls",
      "Premium features unlocked",
      "Recording retention: 3 months",
    ],
  },
};

export default function ConfirmUpgrade() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval") || "monthly";

  useEffect(() => {
    if (!plan || !PLAN_DETAILS[plan]) {
      navigate("/pricing");
    }
  }, [plan, navigate]);

  if (!plan || !PLAN_DETAILS[plan]) return null;

  const details = PLAN_DETAILS[plan];
  const isStudent = plan === "student";
  const originalPrice = isStudent
    ? details.priceOneTime
    : interval === "yearly"
      ? details.priceYearly
      : details.priceMonthly;
  const cycleLabel = isStudent ? "One-time Payment" : interval === "yearly" ? "Yearly Billing" : "Monthly Billing";
  const perMonthLabel = isStudent ? "" : interval === "yearly" ? `/month (billed annually)` : "/month";
  const monthlyPriceStr = isStudent
    ? details.priceOneTime.toFixed(2)
    : interval === "yearly"
      ? (details.priceYearly / 12).toFixed(2)
      : details.priceMonthly.toFixed(2);

  const handleConfirm = () => {
    navigate(`/checkout/billing?plan=${plan}&interval=${interval}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-2xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-8 sm:p-10">
        
        {/* Back navigation */}
        <button
          onClick={() => navigate("/pricing")}
          className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Change Plan
        </button>

        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Confirm Your Upgrade</h2>
        <p className="text-slate-500 mb-8">Review the summary of your selected plan before completing checkout.</p>

        {/* Current Plan vs New Plan Comparison */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5">
            <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">Your Current License</div>
            <div className="text-lg font-bold text-slate-700 capitalize">{user?.plan || "Free"}</div>
            <div className="text-xs text-slate-400 mt-1">Status: Active</div>
          </div>
          <div className="bg-blue-50/50 border-2 border-accent rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-accent text-white text-[9px] font-bold px-2 py-0.5 rounded-bl-lg uppercase">Selected</div>
            <div className="text-xs text-accent font-semibold uppercase tracking-wider mb-1">Upgraded License</div>
            <div className="text-lg font-bold text-slate-900 capitalize">{details.name}</div>
            <div className="text-xs text-green-600 mt-1">{cycleLabel}</div>
          </div>
        </div>

        {/* Features Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8">
          <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Included Features</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
            {details.features.map((feature, i) => (
              <li key={i} className="flex items-center text-sm text-slate-600">
                <CheckIcon className="h-5 w-5 text-accent mr-2.5 flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Financial Charge Summary */}
        <div className="border-t border-slate-100 pt-6 mb-8">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-slate-500 text-sm">Selected Plan Rate</span>
            <span className="text-xl font-bold text-slate-800">LKR {monthlyPriceStr}{perMonthLabel}</span>
          </div>
          <div className="flex justify-between items-baseline border-t border-slate-100 pt-4 mt-4">
            <span className="text-slate-600 font-semibold">Total to Charge Today</span>
            <span className="text-3xl font-extrabold text-slate-900">LKR {originalPrice.toFixed(2)}</span>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleConfirm}
            className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition shadow-lg shadow-blue-500/10 cursor-pointer"
          >
            Confirm & Proceed to Billing
          </button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
            <span>Secure 256-bit SSL encrypted checkout connection.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
