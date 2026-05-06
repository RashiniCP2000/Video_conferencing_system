import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated border border-surface-border p-8 shadow-xl">
        <h1 className="text-2xl font-semibold text-white mb-1">Reset Password</h1>
        <p className="text-slate-400 text-sm mb-6">Enter your email to receive a reset link.</p>
        
        {message ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 text-sm px-4 py-3">
              {message}
            </div>
            <Link 
              to="/login" 
              className="block w-full text-center rounded-lg bg-surface border border-surface-border hover:bg-surface-elevated text-white font-medium py-2.5 text-sm transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-500/15 text-red-300 text-sm px-3 py-2">{error}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Email address</label>
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent hover:bg-blue-600 text-white font-medium py-2.5 text-sm disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-center text-sm mt-4">
              <Link to="/login" className="text-accent hover:underline">
                Back to Sign in
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
