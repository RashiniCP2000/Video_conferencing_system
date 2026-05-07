import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api/client.js";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      return setError("Passwords do not match");
    }
    if (password.length < 6) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/reset-password", { token, newPassword: password });
      setMessage(data.message);
      // Automatically redirect to login after 3 seconds
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link might be expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-surface-elevated border border-surface-border p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900 mb-1">Set New Password</h1>
        <p className="text-slate-600 text-sm mb-6">Create a new password for your account.</p>

        {message ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3">
              {message}
            </div>
            <p className="text-center text-slate-500 text-sm">Redirecting to sign in...</p>
            <Link 
              to="/login" 
              className="block w-full text-center rounded-lg bg-surface border border-surface-border hover:bg-slate-50 text-slate-900 font-medium py-2.5 text-sm transition-colors"
            >
              Sign in now
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-600 text-sm px-3 py-2 border border-red-100">{error}</div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent text-slate-900"
                placeholder="Minimum 6 characters"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirm Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent text-slate-900"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent hover:bg-blue-600 text-white font-medium py-2.5 text-sm disabled:opacity-50 transition-colors mt-2"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
