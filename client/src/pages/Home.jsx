import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function Home() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateMeeting() {
    setError("");
    setCreating(true);
    try {
      const { data } = await api.post("/meetings", {});
      navigate(`/meet/${data.meetingId}?name=${encodeURIComponent(user?.name || "Host")}`);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Could not create meeting. Is the API running on port 5000?";
      setError(msg);
    } finally {
      setCreating(false);
    }
  }

  function handleJoinMeeting(e) {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase().replace(/[^A-F0-9]/g, "");
    if (code.length !== 8) {
      setError("Meeting code must be 8 characters (hex)");
      return;
    }
    const name = (guestName.trim() || user?.name || "Guest").slice(0, 80);
    navigate(`/meet/${code}?name=${encodeURIComponent(name)}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-surface-border bg-surface-elevated/80 backdrop-blur px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-slate-900">Video Conference</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline">{user?.email}</span>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="text-sm font-medium text-accent hover:text-blue-700"
          >
            Upgrade Plan
          </button>
          <button
            type="button"
            onClick={logout}
            className="text-sm text-slate-500 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
        <h1 className="text-3xl font-semibold text-slate-900 mb-2">Dashboard</h1>
        <div className="flex items-center gap-3 mb-10">
          <p className="text-slate-600">
            Create an instant meeting or join with a code.
          </p>
          <span className="px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-bold uppercase tracking-wider">
            {user?.plan || "Free"} Plan
          </span>
          {user?.subscriptionStatus === "active" && (
            <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider">
              Active
            </span>
          )}
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/15 text-red-300 text-sm px-4 py-3">{error}</div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-surface-border bg-surface-elevated p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900 mb-2">New meeting</h2>
            <p className="text-sm text-slate-600 mb-4">
              Generate a meeting ID and share the link with participants.
            </p>
            <button
              type="button"
              onClick={handleCreateMeeting}
              disabled={creating}
              className="rounded-xl bg-accent hover:bg-blue-600 text-white font-medium px-5 py-3 text-sm disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create instant meeting"}
            </button>
          </section>

          <section className="rounded-2xl border border-surface-border bg-surface-elevated p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900 mb-2">Join meeting</h2>
            <form onSubmit={handleJoinMeeting} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Meeting code
                </label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="e.g. A1B2C3D4"
                  className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-accent text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Display name (optional if logged in)
                </label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder={user?.name || "Your name"}
                  className="w-full rounded-lg bg-surface border border-surface-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent text-slate-900"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl border border-surface-border hover:bg-slate-50 text-slate-900 font-medium py-3 text-sm transition-colors"
              >
                Join
              </button>
            </form>
          </section>
        </div>

        <p className="mt-10 text-xs text-slate-400">
          Tip: Share{" "}
          <code className="text-slate-600">
            {typeof window !== "undefined" ? window.location.origin : ""}/meet/YOURCODE
          </code>{" "}
          so others can join without signing in.
        </p>
      </main>
    </div>
  );
}
