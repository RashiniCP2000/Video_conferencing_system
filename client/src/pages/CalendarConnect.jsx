import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../api/client.js";

export default function CalendarConnect() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    // Check url search params for status updates
    const success = searchParams.get("success");
    const error = searchParams.get("error");
    if (success === "true") {
      setMessage({ type: "success", text: "Google Calendar connected successfully!" });
    } else if (error) {
      setMessage({
        type: "error",
        text: error === "auth_failed" 
          ? "Failed to authenticate with Google. Please try again." 
          : "An error occurred during authentication."
      });
    }

    fetchStatus();
  }, [searchParams]);

  async function fetchStatus() {
    try {
      const { data } = await api.get("/calendar/status");
      setConnected(data.connected);
    } catch (err) {
      console.error("Failed to fetch calendar connection status:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    setActionLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const { data } = await api.get("/calendar/auth-url");
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No OAuth URL returned");
      }
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to initiate Google connection."
      });
      setActionLoading(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Are you sure you want to disconnect Google Calendar?")) {
      return;
    }
    setActionLoading(true);
    setMessage({ type: "", text: "" });
    try {
      await api.post("/calendar/disconnect");
      setConnected(false);
      setMessage({ type: "success", text: "Disconnected Google Calendar successfully." });
    } catch (err) {
      console.error(err);
      setMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to disconnect Google Calendar."
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span 
            className="font-bold text-slate-800 text-lg cursor-pointer hover:text-indigo-600 transition-colors"
            onClick={() => navigate("/")}
          >
            VideoConf
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600 font-medium text-sm">Settings</span>
        </div>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
        >
          Back to Dashboard
        </button>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-md">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Google Calendar Integration</h1>
              <p className="text-slate-500 text-sm">
                Automatically add schedules and get reminders directly in Google Calendar.
              </p>
            </div>
          </div>

          {message.text && (
            <div 
              className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3 border ${
                message.type === "success" 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {message.type === "success" ? (
                <svg className="w-5 h-5 flex-shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 flex-shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
              <span>{message.text}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center items-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-col">
                  <span className="text-slate-800 font-semibold">Connection Status</span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    {connected ? "Your Google Account is securely connected." : "Your Google Account is not connected."}
                  </span>
                </div>
                {connected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700">
                    Not Connected
                  </span>
                )}
              </div>

              <div className="border-t border-slate-100 pt-6">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">How it works:</h3>
                <ul className="text-slate-600 text-xs space-y-2 list-disc pl-5">
                  <li>You connect your Google Account securely using OAuth 2.0. We only request permission to manage calendar events.</li>
                  <li>After creating a meeting, click the calendar button to configure meeting time.</li>
                  <li>We'll inject the title, join link, and automatically set popup and email reminders.</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-6">
                {connected ? (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-rose-600 font-semibold text-sm transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Disconnecting..." : "Disconnect Calendar"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleConnect}
                    disabled={actionLoading}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
                  >
                    {actionLoading ? "Connecting..." : "Connect Google Calendar"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
