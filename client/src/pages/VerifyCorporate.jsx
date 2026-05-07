import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

export default function VerifyCorporate() {
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!companyName || !workEmail) {
      setError("Please provide both company name and work email.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      await api.post("/verify/corporate", { companyName, workEmail });
      setMessage("Verification request submitted! We'll review your company details shortly.");
      setTimeout(() => navigate("/"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Corporate Verification</h2>
        <p className="mt-2 text-sm text-slate-600">
          Scale your team with the Corporate plan.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface-elevated py-8 px-4 shadow-sm sm:rounded-lg sm:px-10 border border-surface-border">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-slate-700">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  id="company"
                  name="company"
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="Acme Corp"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Work Email Address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  className="block w-full appearance-none rounded-md border border-surface-border bg-surface px-3 py-2 text-white placeholder-slate-500 focus:border-accent focus:outline-none focus:ring-accent sm:text-sm"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <p className="text-xs text-slate-500">
              Note: We will verify your company status using the domain of your work email.
            </p>

            {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
            {message && <div className="text-green-400 text-sm mt-2">{message}</div>}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-accent py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Submit for Verification"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
