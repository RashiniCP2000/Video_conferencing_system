import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import MeetNovaLogo from "../components/MeetNovaLogo.jsx";
import heroImage from "../assets/login-1.jpg";

const benefits = [
  "Secure encrypted audio and video",
  "Easy scheduling and calendar sync",
  "Fast screen sharing and chat",
];

function getDashboardPath(user) {
  const isSystemAdmin = user?.role === "admin" && user?.email?.toLowerCase().endsWith("@admin.com");
  return isSystemAdmin ? "/admin" : "/dashboard";
}

export default function Login() {
  const navigate = useNavigate();
  const { loginWithToken, isAuthenticated, user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(getDashboardPath(user), { replace: true });
    }
  }, [isAuthenticated, navigate, user]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const loggedInUser = await loginWithToken(data.token);
      navigate(getDashboardPath(loggedInUser), { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] py-6 px-3">
      <div className="mx-auto w-full max-w-5xl">
        <header className="mb-5 flex flex-col gap-2 border-b border-slate-200 pb-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <MeetNovaLogo size="lg" variant="light" linkTo="/" />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span>New to MeetNova?</span>
            <Link to="/register" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign Up
            </Link>
            <span className="text-slate-400">•</span>
            <a href="#" className="font-medium text-slate-600 hover:text-blue-600">
              Support
            </a>
            <span className="text-slate-400">•</span>
            <button className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600">
              English
              <span className="text-xs">▾</span>
            </button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.95fr]">
          <section className="relative overflow-hidden rounded-[1.75rem] bg-[#f3f7fc] p-5 shadow-lg shadow-slate-200/30">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-5 shadow-xl">
              <div className="flex items-center justify-center">
                <img src={heroImage} alt="Hero illustration" className="h-[240px] w-full max-w-[340px] object-cover" />
              </div>
            </div>

            <div className="mt-5 rounded-[1.75rem] bg-white p-4 shadow-xl shadow-slate-200/30 max-w-2xl mx-auto">
              <h2 className="text-base font-semibold text-slate-900">Create your free Basic account</h2>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-emerald-500 text-sm text-white">✓</span>
                  <p className="text-sm text-slate-700">Get up to 40 minutes and 100 participants per meeting</p>
                </div>
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-emerald-500 text-sm text-white">✓</span>
                  <p className="text-sm text-slate-700">Share AI Docs</p>
                </div>
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-emerald-500 text-sm text-white">✓</span>
                  <p className="text-sm text-slate-700">Get 3 editable whiteboards</p>
                </div>
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-emerald-500 text-sm text-white">✓</span>
                  <p className="text-sm text-slate-700">Unlimited instant messaging</p>
                </div>
                <div className="flex items-center gap-3 rounded-[1.75rem] border border-slate-200 bg-slate-50/80 px-3 py-2.5">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-2xl bg-emerald-500 text-sm text-white">✓</span>
                  <p className="text-sm text-slate-700">Create up to 5 two-minute video messages</p>
                </div>
              </div>
            </div>
          </section>

<section className="rounded-[1.5rem] bg-white p-5 shadow-xl shadow-slate-200/30">
              <div className="mb-5 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-3 block text-sm font-medium text-slate-600">Email address</label>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <label className="block text-sm font-medium text-slate-600">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-[1.5rem] bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? "Continue…" : "Continue"}
              </button>

              <p className="text-sm leading-6 text-slate-500">
                By proceeding, I agree to MeetNova&apos;s <span className="text-blue-600">Privacy Statement</span> and <span className="text-blue-600">Terms of Service</span>.
              </p>
            </form>

            <div className="my-5 flex items-center gap-2.5 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>Or sign up with</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="flex justify-center">
              <button type="button" className="rounded-[1.5rem] border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
                Google
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
