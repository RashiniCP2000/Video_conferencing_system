import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ArrowLeftIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const PLAN_PRICES = {
  student: {
    name: "Student Plan",
    oneTimePrice: 1500,
  },
  corporate: {
    name: "Corporate Plan",
    monthlyPrice: 2000,
    yearlyPrice: 20000,
  },
};

export default function CheckoutBilling() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval") || "monthly";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    country: "United States",
    company: "",
    taxId: "",
  });

  useEffect(() => {
    if (!plan || !PLAN_PRICES[plan]) {
      navigate("/pricing");
    }
  }, [plan, navigate]);

  // Sync user details to form if available
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        country: user.country || "United States",
        company: user.company || "",
      }));
    }
  }, [user]);

  if (!plan || !PLAN_PRICES[plan]) return null;

  const planDetails = PLAN_PRICES[plan];
  const subtotal = plan === "student"
    ? planDetails.oneTimePrice
    : interval === "yearly"
      ? planDetails.yearlyPrice
      : planDetails.monthlyPrice;
  const taxRate = 0.0;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.country.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    // Persist billing info in sessionStorage for the next screen
    sessionStorage.setItem(
      "meetnova_billing_info",
      JSON.stringify({
        ...formData,
        subtotal,
        tax,
        total,
      })
    );

    navigate(`/checkout/payment?plan=${plan}&interval=${interval}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-6 sm:p-10">
        
        {/* Left Side: Form */}
        <div className="lg:col-span-7">
          <button
            onClick={() => navigate(`/confirm-upgrade?plan=${plan}&interval=${interval}`)}
            className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition mb-6"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
          </button>

          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2">Billing Information</h2>
          <p className="text-slate-500 mb-8">Provide your billing address and organizational details.</p>

          <form onSubmit={handleNext} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Billing Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder="First and last name"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Billing Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="billing@company.com"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g. United States"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                  Company Name <span className="text-slate-400">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="e.g. Acme Corporation"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Tax ID / VAT Registration Number <span className="text-slate-400">(Optional)</span>
              </label>
              <input
                type="text"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                placeholder="e.g. US-1234567-B"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-4 bg-accent hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition shadow-lg shadow-blue-500/10 cursor-pointer"
            >
              Proceed to Payment
            </button>
          </form>
        </div>

        {/* Right Side: Order Summary Panel */}
        <div className="lg:col-span-5 bg-slate-50 p-6 sm:p-8 rounded-2xl border border-slate-200 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Order Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start text-sm">
                <div>
                  <div className="font-semibold text-slate-800">{planDetails.name}</div>
                  <div className="text-xs text-slate-500 capitalize mt-0.5">
                    {plan === "student" ? "one-time payment" : `${interval} billing`}
                  </div>
                </div>
                <span className="font-bold text-slate-800">LKR {subtotal.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 my-4"></div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span className="text-slate-800">LKR {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm text-slate-500">
                <span>Taxes & Fees</span>
                <span className="text-slate-800">LKR {tax.toFixed(2)}</span>
              </div>

              <div className="border-t border-slate-200 my-4"></div>

              <div className="flex justify-between items-baseline">
                <span className="text-slate-700 font-bold text-base">Total Payable</span>
                <span className="text-3xl font-extrabold text-slate-900">LKR {total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 flex items-start gap-3 mt-8">
            <ShieldCheckIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Guaranteed Secure Checkout</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Your data is stored transiently to calculate taxes and customize your billing transaction.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
