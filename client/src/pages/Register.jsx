import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import heroImage from "../assets/register 3.webp";

export default function Register() {
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isEducator, setIsEducator] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const name = `${firstName.trim()} ${lastName.trim()}`.trim();
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      const registeredUser = await loginWithToken(data.token);
      navigate(registeredUser?.role === "admin" ? "/admin" : "/education-data", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] px-4 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6 flex items-center justify-between text-sm text-slate-600">
          <Link to="/" className="text-2xl font-bold text-blue-700 hover:opacity-90 transition-opacity">MeetNova</Link>
          <div className="flex flex-wrap items-center gap-4">
            <span>Already have an account?</span>
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
            <span className="text-slate-300">|</span>
            <a href="#" className="font-medium text-slate-600 hover:text-blue-600">
              Support
            </a>
            <button className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-blue-600">
              English
              <span className="text-xs">▾</span>
            </button>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-[2rem] bg-white shadow-xl shadow-slate-200/30">
            <div className="h-[420px] max-h-[520px] overflow-hidden">
              <img src={heroImage} alt="Registration illustration" className="h-full w-full object-cover" />
            </div>
          </div>

          <section className="rounded-[2rem] bg-white p-8 shadow-xl shadow-slate-200/40">
            <div className="max-w-xl">
              <h1 className="text-4xl font-semibold text-slate-900">Create your account</h1>
              <p className="mt-3 text-sm text-slate-500">Enter your full name and password.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-3xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">First name</span>
                  <input
                    type="text"
                    autoComplete="given-name"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Last name</span>
                  <input
                    type="text"
                    autoComplete="family-name"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Email address</span>
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isEducator}
                  onChange={(e) => setIsEducator(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="leading-6">
                  <strong>For Educators:</strong> Check here if you are signing up on behalf of a school or other organization that provides educational services to children under the age of 18.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                {loading ? "Continuing…" : "Continue"}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
