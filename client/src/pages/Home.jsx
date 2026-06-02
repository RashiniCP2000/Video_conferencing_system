import { useState, useEffect } from "react";
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

  const [createdMeeting, setCreatedMeeting] = useState(null);
  const [inviteEmails, setInviteEmails] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteStatus, setInviteStatus] = useState(null);
  
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [meetingStartTime, setMeetingStartTime] = useState("");
  const [addingToCalendar, setAddingToCalendar] = useState(false);
  const [calendarStatus, setCalendarStatus] = useState(null);

  const getDefaultStartTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 10);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    if (user) {
      api.get("/calendar/status")
        .then(({ data }) => setCalendarConnected(data.connected))
        .catch(err => console.error("Error fetching calendar status", err));
    }
  }, [user]);

  async function handleCreateMeeting() {
    setError("");
    setCreating(true);
    setCreatedMeeting(null);
    setInviteEmails("");
    setInviteStatus(null);
    setCalendarStatus(null);
    setMeetingStartTime(getDefaultStartTime());
    try {
      const { data } = await api.post("/meetings", {
        title: `${user?.name || "Instant"}'s Meeting`
      });
      setCreatedMeeting({
        meetingId: data.meetingId,
        meetingLink: `${window.location.origin}${data.meetingLink}`,
        title: data.title,
      });
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

  async function handleSendInvites() {
    if (!inviteEmails.trim()) return;
    setInviting(true);
    setInviteStatus(null);
    const emails = inviteEmails.split(",").map(e => e.trim()).filter(Boolean);
    try {
      await api.post(`/meetings/${createdMeeting.meetingId}/invite`, { emails });
      setInviteStatus({ type: "success", text: "Invitations sent successfully!" });
      setInviteEmails("");
    } catch (err) {
      setInviteStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to send invitations."
      });
    } finally {
      setInviting(false);
    }
  }

  async function handleAddToCalendar() {
    if (!meetingStartTime) {
      setCalendarStatus({ type: "error", text: "Please select a start date and time." });
      return;
    }
    setAddingToCalendar(true);
    setCalendarStatus(null);
    try {
      const start = new Date(meetingStartTime);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      
      const { data } = await api.post("/calendar/add-event", {
        title: createdMeeting.title,
        description: `Meeting Code: ${createdMeeting.meetingId}`,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        meetingLink: createdMeeting.meetingLink,
      });
      
      setCalendarStatus({
        type: "success",
        text: "Event created successfully! ",
        link: data.htmlLink
      });
    } catch (err) {
      setCalendarStatus({
        type: "error",
        text: err.response?.data?.message || "Failed to add event to Google Calendar."
      });
    } finally {
      setAddingToCalendar(false);
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
            onClick={() => navigate("/recordings")}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Recordings
          </button>
          <button
            type="button"
            onClick={() => navigate("/settings/calendar")}
            className="text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            Google Calendar
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricing")}
            className="text-sm font-medium text-accent hover:text-blue-700"
          >
            Upgrade Plan
          </button>
          {user?.role === "admin" && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-800"
            >
              Admin Dashboard
            </button>
          )}
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

        {createdMeeting && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl relative text-slate-800">
              <button
                type="button"
                onClick={() => setCreatedMeeting(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Meeting Created!</h3>
              </div>

              {/* Share Meeting Link */}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Share Join Link
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={createdMeeting.meetingLink}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none"
                    onClick={(e) => e.target.select()}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(createdMeeting.meetingLink);
                      alert("Meeting link copied to clipboard!");
                    }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-sm rounded-lg transition-colors border border-indigo-200"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Email Invite Section */}
              <div className="mb-6 border-t border-slate-100 pt-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Invite via Email
                </label>
                <p className="text-xs text-slate-400 mb-2">
                  Enter comma-separated emails to send instant meeting invites.
                </p>
                <div className="flex gap-2">
                  <input
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    placeholder="e.g. partner@example.com, team@example.com"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendInvites}
                    disabled={inviting || !inviteEmails.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50"
                  >
                    {inviting ? "Sending..." : "Invite"}
                  </button>
                </div>
                {inviteStatus && (
                  <p className={`text-xs font-medium mt-2 ${
                    inviteStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {inviteStatus.text}
                  </p>
                )}
              </div>

              {/* Google Calendar Section */}
              <div className="mb-6 border-t border-slate-100 pt-5">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Google Calendar Scheduling
                </label>
                {!calendarConnected ? (
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <span className="text-xs text-slate-500">Google Calendar not connected.</span>
                    <button
                      type="button"
                      onClick={() => navigate("/settings/calendar")}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Connect Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="datetime-local"
                        value={meetingStartTime}
                        onChange={(e) => setMeetingStartTime(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddToCalendar}
                        disabled={addingToCalendar}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                      >
                        {addingToCalendar ? "Adding..." : "Add to Calendar"}
                      </button>
                    </div>
                    {calendarStatus && (
                      <p className={`text-xs font-medium mt-1 ${
                        calendarStatus.type === "success" ? "text-emerald-600" : "text-rose-600"
                      }`}>
                        {calendarStatus.text}
                        {calendarStatus.link && (
                          <a
                            href={calendarStatus.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline ml-1 font-bold hover:text-emerald-800"
                          >
                            Open Event
                          </a>
                        )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Join Meeting Action */}
              <div className="flex gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setCreatedMeeting(null)}
                  className="flex-1 px-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
                >
                  Dismiss
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const roomPath = createdMeeting.meetingLink.replace(window.location.origin, "");
                    navigate(`${roomPath}?name=${encodeURIComponent(user?.name || "Host")}`);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl text-center shadow-md shadow-emerald-100 transition-colors"
                >
                  Join Meeting
                </button>
              </div>
            </div>
          </div>
        )}

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
