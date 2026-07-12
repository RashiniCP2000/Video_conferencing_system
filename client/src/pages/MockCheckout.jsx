import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CreditCardIcon, ShieldCheckIcon, ArrowLeftIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import api from "../api/client.js";

const PLAN_INFO = {
  student: {
    name: "Student Plan",
    monthlyPrice: 1500,
    yearlyPrice: 1500,
  },
  corporate: {
    name: "Corporate Plan",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
  },
};

export default function MockCheckout() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const sessionId = searchParams.get("session_id");
  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval") || "monthly";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [cardBrand, setCardBrand] = useState("unknown");

  useEffect(() => {
    if (!sessionId || !plan || !PLAN_INFO[plan]) {
      setError("Invalid or expired checkout session.");
    }
  }, [sessionId, plan]);

  // Card brand detection helper
  const detectCardBrand = (number) => {
    const cleanNumber = number.replace(/\D/g, "");
    if (cleanNumber.startsWith("4")) return "visa";
    if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
    if (/^3[47]/.test(cleanNumber)) return "amex";
    return "unknown";
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      const clean = value.replace(/\D/g, "").substring(0, 16);
      const matches = clean.match(/\d{4,16}/g);
      const match = (matches && matches[0]) || "";
      const parts = [];

      for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
      }

      formattedValue = parts.length > 0 ? parts.join(" ") : clean;
      setCardBrand(detectCardBrand(clean));
    } else if (name === "expiry") {
      const clean = value.replace(/\D/g, "").substring(0, 4);
      if (clean.length >= 2) {
        formattedValue = `${clean.substring(0, 2)}/${clean.substring(2, 4)}`;
      } else {
        formattedValue = clean;
      }
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "").substring(0, 3);
    }

    setFormData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.cardName.trim()) return setError("Please enter cardholder name");
    if (formData.cardNumber.replace(/\s/g, "").length < 16) return setError("Please enter a valid 16-digit card number");
    if (formData.expiry.length < 5) return setError("Please enter a valid expiry date (MM/YY)");
    if (formData.cvv.length < 3) return setError("Please enter a valid 3-digit CVV");

    setError("");
    setLoading(true);

    try {
      await api.post("/payments/mock-complete-session", {
        sessionId,
        plan,
        interval,
      });

      // Redirect user to payment success page
      navigate(`/payment-success?session_id=${sessionId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Payment process failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (error && !sessionId) {
    return (
      <div className="min-h-screen bg-[#0f1419] flex items-center justify-center p-6 text-center text-white">
        <div className="bg-[#151c24] border border-slate-800 p-8 rounded-3xl max-w-md w-full">
          <p className="text-red-400 font-semibold mb-6">{error}</p>
          <button
            onClick={() => navigate("/pricing")}
            className="bg-accent text-white py-2 px-6 rounded-xl hover:bg-blue-600 transition"
          >
            Back to Pricing
          </button>
        </div>
      </div>
    );
  }

  const selectedPlan = PLAN_INFO[plan] || { name: "Premium Plan", monthlyPrice: 0, yearlyPrice: 0 };
  const price = interval === "yearly" ? selectedPlan.yearlyPrice : selectedPlan.monthlyPrice;
  const billingPeriod = plan === "student" ? " (one-time)" : interval === "yearly" ? "/year" : "/month";

  return (
    <div className="min-h-screen bg-[#0f1419] text-white py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 bg-[#151c24] border border-slate-800/80 rounded-3xl overflow-hidden shadow-2xl">
        
        {/* Left Side: Summary */}
        <div className="md:col-span-5 bg-gradient-to-br from-slate-900 to-[#121820] p-8 border-b md:border-b-0 md:border-r border-slate-800/60 flex flex-col justify-between">
          <div>
            <button
              onClick={() => navigate("/pricing")}
              className="flex items-center text-sm text-slate-400 hover:text-white transition mb-8"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
            </button>
            
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">Checkout Summary</div>
            <h2 className="text-3xl font-extrabold tracking-tight mb-6">{selectedPlan.name}</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Subscription Tier</span>
                <span className="font-semibold">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Billing Interval</span>
                <span className="font-semibold capitalize">{interval}</span>
              </div>
              <div className="border-t border-slate-800 my-4"></div>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-400 text-sm">Total Due</span>
                <span className="text-3xl font-bold">
                  LKR {price}
                  <span className="text-xs text-slate-400 font-normal">{billingPeriod}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-[#1b242f] rounded-2xl p-4 border border-slate-800 flex items-start gap-3">
            <ShieldCheckIcon className="h-6 w-6 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-white">Secure Sandbox Payment</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                This is a secure simulation interface. You can input any fake test card credentials to successfully proceed.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Payment Form */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          <h3 className="text-xl font-bold mb-6 flex items-center">
            <CreditCardIcon className="h-6 w-6 mr-2 text-accent" /> Card Details
          </h3>

          {error && (
            <div className="bg-red-950/40 border border-red-800 text-red-300 rounded-xl p-3 text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="cardName" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                Cardholder Name
              </label>
              <input
                type="text"
                id="cardName"
                name="cardName"
                required
                value={formData.cardName}
                onChange={handleInputChange}
                className="w-full bg-[#0d1217] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="cardNumber" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide flex justify-between">
                <span>Card Number</span>
                <span className="capitalize text-slate-500 font-medium">{cardBrand !== "unknown" ? cardBrand : ""}</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="cardNumber"
                  name="cardNumber"
                  required
                  value={formData.cardNumber}
                  onChange={handleInputChange}
                  className="w-full bg-[#0d1217] border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono tracking-wider"
                  placeholder="4000 1234 5678 9010"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  {cardBrand === "visa" && <span className="text-blue-400 font-black text-xs tracking-tight">VISA</span>}
                  {cardBrand === "mastercard" && <span className="text-orange-400 font-black text-xs tracking-tight">MC</span>}
                  {cardBrand === "amex" && <span className="text-green-400 font-black text-xs tracking-tight">AMEX</span>}
                  {cardBrand === "unknown" && <CreditCardIcon className="h-5 w-5 text-slate-600" />}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="expiry" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  Expiry Date
                </label>
                <input
                  type="text"
                  id="expiry"
                  name="expiry"
                  required
                  value={formData.expiry}
                  onChange={handleInputChange}
                  className="w-full bg-[#0d1217] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono"
                  placeholder="MM/YY"
                />
              </div>

              <div>
                <label htmlFor="cvv" className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wide">
                  CVV
                </label>
                <input
                  type="password"
                  id="cvv"
                  name="cvv"
                  required
                  value={formData.cvv}
                  onChange={handleInputChange}
                  className="w-full bg-[#0d1217] border border-slate-800 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono"
                  placeholder="•••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-accent hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center transition shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              {loading ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" /> Processing Payment...
                </>
              ) : (
                `Pay LKR ${price} & Upgrade`
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
