import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import api from "../api/client.js";

export default function CheckoutPayment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const plan = searchParams.get("plan");
  const interval = searchParams.get("interval") || "monthly";

  const [billingInfo, setBillingInfo] = useState(null);
  const [activeTab, setActiveTab] = useState("card"); // card, paypal, gpay, applepay
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiry: "",
    cvv: "",
  });
  const [cardBrand, setCardBrand] = useState("unknown");
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0); // 0, 1, 2, 3
  const [error, setError] = useState("");

  useEffect(() => {
    if (!plan) return navigate("/pricing");

    // Load billing info from sessionStorage
    const stored = sessionStorage.getItem("meetnova_billing_info");
    if (stored) {
      setBillingInfo(JSON.parse(stored));
    } else {
      navigate(`/checkout/billing?plan=${plan}&interval=${interval}`);
    }
  }, [plan, interval, navigate]);

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

  const handlePay = async (e) => {
    e.preventDefault();
    if (processing) return;

    if (activeTab === "card") {
      if (formData.cardNumber.replace(/\s/g, "").length < 16) return setError("Please enter a valid 16-digit card number");
      if (formData.expiry.length < 5) return setError("Please enter a valid expiry date (MM/YY)");
      if (formData.cvv.length < 3) return setError("Please enter a valid 3-digit CVV");
    }

    setError("");
    setProcessing(true);
    setProcessingStep(1);

    // Simulate Step 1 (Verification) -> Step 2 (Gateway connection) -> Step 3 (Completion)
    setTimeout(() => {
      setProcessingStep(2);
      setTimeout(() => {
        setProcessingStep(3);
        setTimeout(async () => {
          try {
            const { data } = await api.post("/payments/create-checkout-session", {
              plan,
              interval,
            });

            if (data.provider === "payhere" && data.checkoutUrl && data.fields) {
              const form = document.createElement("form");
              form.method = "POST";
              form.action = data.checkoutUrl;
              form.style.display = "none";

              Object.entries(data.fields).forEach(([key, value]) => {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = key;
                input.value = value;
                form.appendChild(input);
              });

              document.body.appendChild(form);
              form.submit();
              return;
            }

            if (data.url) {
              window.location.href = data.url;
              return;
            }

            throw new Error("Payment gateway did not return a redirect URL.");
          } catch (err) {
            setError(err.response?.data?.message || "Checkout failed. Please try again.");
            setProcessing(false);
          }
        }, 1500);
      }, 1500);
    }, 1500);
  };

  if (!billingInfo) return null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xl p-6 sm:p-10 relative">
        
        {/* Fullscreen processing screen Overlay */}
        {processing && (
          <div className="absolute inset-0 bg-slate-100/90 z-50 flex flex-col items-center justify-center p-8 text-center transition-all duration-300">
            <div className="bg-white border border-slate-200 p-8 sm:p-12 rounded-3xl shadow-2xl max-w-md w-full">
              <ArrowPathIcon className="h-16 w-16 text-accent animate-spin mx-auto mb-6" />
              <h3 className="text-2xl font-bold mb-8 text-slate-900">Processing Your Payment</h3>
              
              <div className="space-y-5 text-left">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  {processingStep >= 2 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
                  )}
                  <span className={`text-sm ${processingStep >= 2 ? "text-slate-400 line-through" : "text-slate-800 font-medium"}`}>
                    Verifying billing details...
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  {processingStep >= 3 ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500 flex-shrink-0" />
                  ) : processingStep === 2 ? (
                    <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${processingStep >= 3 ? "text-slate-400 line-through" : processingStep === 2 ? "text-slate-850 font-medium" : "text-slate-400"}`}>
                    Contacting secure payment gateway...
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-3">
                  {processingStep === 3 ? (
                    <div className="h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 flex-shrink-0" />
                  )}
                  <span className={`text-sm ${processingStep === 3 ? "text-slate-800 font-medium animate-pulse" : "text-slate-400"}`}>
                    Processing charge & activating subscription...
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => navigate(`/checkout/billing?plan=${plan}&interval=${interval}`)}
          className="flex items-center text-sm text-slate-500 hover:text-slate-800 transition mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> Back
        </button>

        <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-2 font-display">Secure Checkout</h2>
        <p className="text-slate-500 mb-8">Select your preferred payment method and authorize your transaction.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Payment Method Selector Tab (Left column) */}
          <div className="md:col-span-4 space-y-2">
            {[
              { id: "card", label: "Credit/Debit Card", icon: CreditCardIcon },
              { id: "paypal", label: "PayPal", isText: "PayPal" },
              { id: "gpay", label: "Google Pay", isText: "Google Pay" },
              { id: "applepay", label: "Apple Pay", isText: "Apple Pay" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  setError("");
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-sm font-semibold transition cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-blue-50 border-accent text-accent"
                    : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500"
                }`}
              >
                <span>{tab.label}</span>
                {tab.icon ? (
                  <tab.icon className="h-5 w-5 text-slate-400" />
                ) : (
                  <span className="text-[10px] uppercase font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">Mock</span>
                )}
              </button>
            ))}
          </div>

          {/* Form details (Right column) */}
          <div className="md:col-span-8">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6">
              <div className="flex justify-between items-baseline mb-4">
                <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Charge</span>
                <span className="text-2xl font-bold text-slate-900">LKR {billingInfo.total.toFixed(2)}</span>
              </div>
              <div className="text-xs text-slate-500 leading-normal flex items-start gap-2">
                <SparklesIcon className="h-4 w-4 text-accent flex-shrink-0" />
                <span>Billed to: <strong className="text-slate-800">{billingInfo.name}</strong> ({billingInfo.email}) in {billingInfo.country}</span>
              </div>
            </div>

            <form onSubmit={handlePay} className="space-y-6">
              {activeTab === "card" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                      Card Number
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        name="cardNumber"
                        required
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-white border border-slate-300 rounded-xl pl-4 pr-12 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono tracking-wider"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {cardBrand === "visa" && <span className="text-blue-500 font-black text-xs">VISA</span>}
                        {cardBrand === "mastercard" && <span className="text-orange-500 font-black text-xs">MC</span>}
                        {cardBrand === "amex" && <span className="text-green-500 font-black text-xs">AMEX</span>}
                        {cardBrand === "unknown" && <CreditCardIcon className="h-5 w-5 text-slate-400" />}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        name="expiry"
                        required
                        value={formData.expiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                        CVV
                      </label>
                      <input
                        type="password"
                        name="cvv"
                        required
                        value={formData.cvv}
                        onChange={handleInputChange}
                        placeholder="•••"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "paypal" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <div className="text-2xl font-black italic text-blue-500">PayPal</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Clicking the payment button below will redirect you to authorize a mock PayPal authentication flow in this sandbox.
                  </p>
                </div>
              )}

              {activeTab === "gpay" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <div className="text-xl font-bold text-slate-700">Google Pay</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Simulate checking out with Google Wallet. Quick authorization will happen securely on submission.
                  </p>
                </div>
              )}

              {activeTab === "applepay" && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <div className="text-xl font-bold text-slate-700"> Apple Pay</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Simulate checking out with Apple Pay. Touch ID or Face ID mockup validation will trigger.
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-accent hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center transition shadow-lg shadow-blue-500/10 cursor-pointer"
              >
                Pay Now
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 mt-8 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheckIcon className="h-5 w-5 text-green-500" />
            <span>Guaranteed Safe Payment Processor.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
