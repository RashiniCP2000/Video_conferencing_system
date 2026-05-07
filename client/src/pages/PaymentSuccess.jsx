import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      navigate("/");
    }, 5000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-surface-elevated border border-surface-border p-12 rounded-3xl shadow-xl max-w-md w-full">
        <CheckCircleIcon className="h-20 w-20 text-green-400 mx-auto mb-6" />
        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        <p className="text-slate-400 mb-8">
          Thank you for upgrading. Your subscription is now active and your premium features are unlocked.
        </p>
        <div className="text-sm text-slate-500">
          Redirecting you to the dashboard in <span className="text-accent font-bold">{countdown}</span> seconds...
        </div>
        <button
          onClick={() => navigate("/")}
          className="mt-8 w-full bg-accent hover:bg-blue-600 text-white font-medium py-3 rounded-xl transition-colors"
        >
          Go to Dashboard Now
        </button>
      </div>
    </div>
  );
}
