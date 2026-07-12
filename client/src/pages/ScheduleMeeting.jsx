import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import TopNav from "../components/TopNav.jsx";
import Sidebar from "../components/Sidebar.jsx";

/* ─── Icons ──────────────────────────────────────────────────────── */
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
  </svg>
);
const VideoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="26" height="26">
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M7 10l5 5 5-5z" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" />
  </svg>
);
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);
const WhiteboardIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12z" />
  </svg>
);
const DocIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z" />
  </svg>
);
const WarnIcon = () => (
  <svg viewBox="0 0 24 24" fill="#F59E0B" width="16" height="16">
    <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
  </svg>
);

/* ─── Sidebar items ─────────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

/* ─── Helpers ───────────────────────────────────────────────────── */
function generatePasscode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function nextHalfHour() {
  const d = new Date();
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60, 0, 0);
  return d.toTimeString().slice(0, 5);
}

/* ═══════════════════════════════════════════════════════════════════ */
export default function ScheduleMeeting() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  /* ── nav / sidebar state ── */
  const [activeSubPage,   setActiveSubPage]     = useState(null);

  /* ── form state ── */
  const [topic,         setTopic]         = useState("");
  const [date,          setDate]          = useState(todayStr());
  const [time,          setTime]          = useState(nextHalfHour());
  const [durationHrs,   setDurationHrs]   = useState("1");
  const [durationMins,  setDurationMins]  = useState("0");
  const [timezone,      setTimezone]      = useState("Asia/Colombo");
  const [recurring,     setRecurring]     = useState(false);
  const [description,   setDescription]   = useState("");
  const [invitees,      setInvitees]      = useState("");
  const [meetingIdType, setMeetingIdType] = useState("auto");
  const [template,      setTemplate]      = useState("");
  const [passcodeEnabled, setPasscodeEnabled] = useState(true);
  const [passcode,      setPasscode]      = useState(generatePasscode());
  const [waitingRoom,   setWaitingRoom]   = useState(false);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);

  const PERSONAL_ID = "543 517 4501";

  const editMeeting = location.state?.editMeeting;
  const templateParam = location.state?.template;

  useEffect(() => {
    if (editMeeting) {
      const scheduledDate = editMeeting.scheduledFor ? new Date(editMeeting.scheduledFor) : null;
      const scheduledDateStr = scheduledDate ? scheduledDate.toISOString().slice(0, 10) : todayStr();
      const scheduledTimeStr = scheduledDate
        ? `${String(scheduledDate.getHours()).padStart(2, "0")}:${String(
            scheduledDate.getMinutes()
          ).padStart(2, "0")}`
        : nextHalfHour();
      const durationMinutes = Number(editMeeting.durationMinutes || 60);
      setTopic(editMeeting.title || editMeeting.topic || "");
      setDate(editMeeting.date || scheduledDateStr);
      setTime(editMeeting.time || scheduledTimeStr);
      setDurationHrs(String(editMeeting.durationHrs || Math.floor(durationMinutes / 60)));
      setDurationMins(String(editMeeting.durationMins || durationMinutes % 60));
      setTimezone(editMeeting.timezone || "Asia/Colombo");
      setRecurring(!!editMeeting.recurring);
      setDescription(editMeeting.description || "");
      setInvitees(Array.isArray(editMeeting.invitees) ? editMeeting.invitees.join(", ") : (editMeeting.invitees || ""));
      setMeetingIdType("auto");
      setPasscodeEnabled(Boolean(editMeeting.passcode || editMeeting.hasPasscode));
      setPasscode(editMeeting.passcode || generatePasscode());
      if (typeof editMeeting.waitingRoomEnabled === "boolean") {
        setWaitingRoom(editMeeting.waitingRoomEnabled);
      }
    }
  }, [editMeeting]);

  useEffect(() => {
    if (templateParam) {
      setTemplate(templateParam);
      if (templateParam === "standup") {
        setTopic("Daily Standup");
        setDurationHrs("0");
        setDurationMins("15");
        setDescription("Daily sync meeting.");
      } else if (templateParam === "interview") {
        setTopic("Interview");
        setDurationHrs("1");
        setDurationMins("0");
        setDescription("Candidate interview.");
      } else if (templateParam === "webinar") {
        setTopic("Webinar");
        setDurationHrs("2");
        setDurationMins("0");
        setDescription("Webinar presentation.");
      } else if (templateParam === "training") {
        setTopic("Training Session");
        setDurationHrs("1");
        setDurationMins("30");
        setDescription("Training session.");
      }
    }
  }, [templateParam]);
  const initials = user?.name?.charAt(0).toUpperCase() || "U";



  const handleSave = async (e) => {
    e.preventDefault();
    if (!topic.trim()) { alert("Please enter a meeting topic."); return; }
    setSaving(true);
    setSaved(false);

    try {
      const payload = {
        title: topic.trim(),
        date,
        time,
        timezone,
        durationMinutes: Number(durationHrs || 0) * 60 + Number(durationMins || 0),
        description: description.trim(),
        invitees: invitees
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        waitingRoomEnabled: waitingRoom,
        passcode: passcodeEnabled ? passcode.trim() : "",
      };

      const response = editMeeting?.meetingCode
        ? await api.put(`/meetings/scheduled/${editMeeting.meetingCode}`, payload)
        : await api.post("/meetings/scheduled", payload);

      const meeting = response.data?.meeting;
      if (!meeting) {
        throw new Error("Missing meeting in response");
      }
      const scheduleDate = meeting.scheduledFor ? new Date(meeting.scheduledFor) : null;
      const detailsMeeting = {
        meetingCode: meeting.meetingCode,
        topic: meeting.title,
        title: meeting.title,
        date: scheduleDate ? scheduleDate.toISOString().slice(0, 10) : date,
        time: scheduleDate
          ? `${String(scheduleDate.getHours()).padStart(2, "0")}:${String(
              scheduleDate.getMinutes()
            ).padStart(2, "0")}`
          : time,
        timezone: meeting.timezone || timezone,
        passcode: passcodeEnabled ? passcode : "",
        meetingId: meeting.meetingCode,
        description: meeting.description || "",
        invitees: (meeting.invitees || []).join(", "),
        recurring,
        durationHrs,
        durationMins,
        waitingRoomEnabled: meeting.waitingRoomEnabled,
        meetingLink: `${window.location.origin}/meet/${meeting.meetingCode}`,
      };

      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        navigate("/meetings/details", { state: { meeting: detailsMeeting } });
      }, 600);
    } catch (err) {
      setSaving(false);
      alert(err.response?.data?.message || "Failed to save meeting.");
    }
  };

  /* ════════════════════════════ RENDER ═══════════════════════════ */
  return (
    <div style={st.root}>

      {/* ═══ TOP NAV ═══ */}
      <TopNav />

      {/* ═══ BODY ROW ═══ */}
      <div style={st.bodyRow}>

        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeTab="Scheduler" />

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>
          <div style={st.card}>
            <h1 style={st.pageTitle}>Schedule a Meeting</h1>

            <form onSubmit={handleSave}>

              {/* TOPIC */}
              <div style={st.row}>
                <label style={st.label}>Topic</label>
                <div style={st.control}>
                  <input style={st.input} type="text" placeholder="My Meeting" value={topic} onChange={(e) => setTopic(e.target.value)} required />
                </div>
              </div>

              {/* DATE & TIME */}
              <div style={st.row}>
                <label style={st.label}>Date &amp; Time</label>
                <div style={{ ...st.control, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <input style={{ ...st.input, width: 170 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                  <input style={{ ...st.input, width: 130 }} type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                </div>
              </div>

              {/* DURATION */}
              <div style={st.row}>
                <label style={st.label}>Duration</label>
                <div style={{ ...st.control, display: "flex", gap: 12, alignItems: "center" }}>
                  <div style={st.selectWrap}>
                    <select style={st.select} value={durationHrs} onChange={(e) => setDurationHrs(e.target.value)}>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i} value={i}>{i} hr{i !== 1 ? "s" : ""}</option>
                      ))}
                    </select>
                    <span style={st.selectArrow}><ChevronDown /></span>
                  </div>
                  <div style={st.selectWrap}>
                    <select style={st.select} value={durationMins} onChange={(e) => setDurationMins(e.target.value)}>
                      {[0, 15, 30, 45].map((m) => (
                        <option key={m} value={m}>{m} mins</option>
                      ))}
                    </select>
                    <span style={st.selectArrow}><ChevronDown /></span>
                  </div>
                </div>
              </div>

              {/* TIMEZONE */}
              <div style={st.row}>
                <label style={st.label}>Time Zone</label>
                <div style={st.control}>
                  <div style={st.selectWrap}>
                    <select style={{ ...st.select, width: 300 }} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                      <option value="Asia/Colombo">(GMT+5:30) Sri Lanka Standard Time</option>
                      <option value="UTC">(GMT+0:00) UTC</option>
                      <option value="America/New_York">(GMT-5:00) Eastern Time</option>
                      <option value="America/Los_Angeles">(GMT-8:00) Pacific Time</option>
                      <option value="Europe/London">(GMT+0:00) London</option>
                      <option value="Asia/Kolkata">(GMT+5:30) India Standard Time</option>
                      <option value="Asia/Tokyo">(GMT+9:00) Japan Standard Time</option>
                    </select>
                    <span style={st.selectArrow}><ChevronDown /></span>
                  </div>
                </div>
              </div>

              {/* RECURRING */}
              <div style={st.row}>
                <label style={st.label} />
                <div style={st.control}>
                  <label style={st.checkboxLabel}>
                    <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} style={st.checkbox} />
                    Recurring meeting
                  </label>
                </div>
              </div>

              {/* DESCRIPTION */}
              <div style={st.row}>
                <label style={st.label}>Description<br /><span style={st.optional}>(Optional)</span></label>
                <div style={st.control}>
                  <textarea style={st.textarea} placeholder="Add a description..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                </div>
              </div>

              <div style={st.divider} />

              {/* INVITEES */}
              <div style={st.row}>
                <label style={st.label}>Invitees</label>
                <div style={st.control}>
                  <input style={st.input} type="text" placeholder="Enter user names or email addresses" value={invitees} onChange={(e) => setInvitees(e.target.value)} />
                  <div style={st.warnBanner}>
                    <WarnIcon />
                    <span style={st.warnText}>
                      Participants won't receive this meeting invite until your calendar is connected.{" "}
                      <button type="button" style={st.connectLink} onClick={() => navigate("/settings/calendar")}>
                        Connect calendar
                      </button>
                    </span>
                  </div>
                </div>
              </div>

              {/* MEETING ID */}
              <div style={st.row}>
                <label style={st.label}>Meeting ID</label>
                <div style={st.control}>
                  <div style={st.radioGroup}>
                    <label style={st.radioLabel}>
                      <input type="radio" name="meetingId" value="auto" checked={meetingIdType === "auto"} onChange={() => setMeetingIdType("auto")} style={st.radio} />
                      Generate Automatically
                    </label>
                    <label style={st.radioLabel}>
                      <input type="radio" name="meetingId" value="personal" checked={meetingIdType === "personal"} onChange={() => setMeetingIdType("personal")} style={st.radio} />
                      Personal Meeting ID&nbsp;<span style={st.personalId}>{PERSONAL_ID}</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* TEMPLATE */}
              <div style={st.row}>
                <label style={st.label}>Template</label>
                <div style={st.control}>
                  <div style={st.selectWrap}>
                    <select style={{ ...st.select, width: 300 }} value={template} onChange={(e) => setTemplate(e.target.value)}>
                      <option value="">Select a template</option>
                      <option value="standup">Daily Standup</option>
                      <option value="interview">Interview</option>
                      <option value="webinar">Webinar</option>
                      <option value="training">Training Session</option>
                    </select>
                    <span style={st.selectArrow}><ChevronDown /></span>
                  </div>
                </div>
              </div>

              {/* WHITEBOARD */}
              <div style={st.row}>
                <label style={st.label}>Whiteboard <span style={st.infoCircle} title="Add a shared whiteboard">ⓘ</span></label>
                <div style={st.control}>
                  <button type="button" style={st.outlineBtn}><WhiteboardIcon /> Add Whiteboard</button>
                </div>
              </div>

              {/* DOCS */}
              <div style={st.row}>
                <label style={st.label}>Docs</label>
                <div style={st.control}>
                  <button type="button" style={st.outlineBtn}><DocIcon /> Add Docs</button>
                </div>
              </div>

              {/* SECURITY */}
              <div style={st.row}>
                <label style={st.label}>Security</label>
                <div style={st.control}>
                  <div style={st.securityRow}>
                    <label style={st.checkboxLabel}>
                      <input type="checkbox" checked={passcodeEnabled} onChange={(e) => setPasscodeEnabled(e.target.checked)} style={st.checkbox} />
                      Passcode
                    </label>
                    {passcodeEnabled && (
                      <input style={{ ...st.input, width: 120, marginLeft: 12 }} type="text" value={passcode} onChange={(e) => setPasscode(e.target.value)} maxLength={10} />
                    )}
                  </div>
                  <p style={st.hintText}>Only users who have the invite link or passcode can join the meeting</p>

                  <div style={{ ...st.securityRow, marginTop: 14 }}>
                    <label style={st.checkboxLabel}>
                      <input type="checkbox" checked={waitingRoom} onChange={(e) => setWaitingRoom(e.target.checked)} style={st.checkbox} />
                      Waiting Room
                    </label>
                  </div>
                  <p style={st.hintText}>Only users admitted by the host can join the meeting</p>
                </div>
              </div>

              {/* BUTTONS */}
              <div style={st.actionRow}>
                <button type="submit" style={{ ...st.saveBtn, opacity: saving ? 0.7 : 1 }} disabled={saving}>
                  {saving ? "Saving…" : saved ? "✓ Saved!" : "Save"}
                </button>
                <button type="button" style={st.cancelBtn} onClick={() => navigate("/")}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary, #f8fafc)", fontFamily: "'Inter','Segoe UI',sans-serif", color: "var(--text-secondary, #1e293b)" },

  /* Top Nav */
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 24px", background: "var(--nav-bg, #fff)", borderBottom: "1px solid var(--nav-border, #e2e8f0)", position: "sticky", top: 0, zIndex: 100 },
  topNavLeft: { display: "flex", alignItems: "center", gap: 32 },
  logo: { fontSize: 28, fontWeight: 800, color: "var(--accent-blue, #1a6ff4)", letterSpacing: "-1px", fontStyle: "italic" },
  navLinks: { display: "flex", gap: 24 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", padding: "4px 0", fontWeight: 500 },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-blue, #1a6ff4)", fontWeight: 600, padding: "6px 12px", borderRadius: 6 },
  navLinkHighlightDrop: { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-blue, #1a6ff4)", fontWeight: 600, padding: "6px 12px", borderRadius: 6 },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a6ff4,#06b6d4)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginLeft: 8 },
  profileMenu: { position: "absolute", top: 44, right: 0, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200 },
  profileMenuHeader: { padding: "14px 16px", borderBottom: "1px solid var(--border-color, #e2e8f0)" },
  profileMenuName: { fontWeight: 700, fontSize: 14, color: "var(--text-primary, #0f172a)", margin: 0 },
  profileMenuEmail: { fontSize: 12, color: "var(--text-muted, #64748b)", margin: "2px 0 0" },
  profileMenuItem: { display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)" },

  /* Body */
  bodyRow: { display: "flex", flex: 1 },

  /* Sidebar */
  sidebar: { width: 220, minWidth: 220, background: "var(--bg-sidebar, #fff)", borderRight: "1px solid var(--border-color, #e2e8f0)", padding: "20px 0", display: "flex", flexDirection: "column" },
  sidebarInner: { flex: 1, overflowY: "auto" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 6 },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: 0 },
  sidebarBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 14, borderRadius: 6, textAlign: "left", transition: "background 0.15s", color: "var(--sidebar-text, #1e293b)" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, background: "var(--badge-bg, #10b981)", color: "var(--badge-text, #fff)", borderRadius: 4, padding: "1px 5px" },
  externalIcon: { color: "var(--text-muted, #94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color, #e2e8f0)", margin: "12px 16px" },
  sidebarCollapsible: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", fontWeight: 600 },
  subMenu: { listStyle: "none", margin: 0, padding: "0 0 0 32px" },
  subMenuItem: { display: "block", width: "100%", padding: "6px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-muted, #374151)", textAlign: "left", borderRadius: 6 },
  subMenuItemActive: { background: "var(--sidebar-active-bg, #eff6ff)", color: "var(--sidebar-active-color, #1a6ff4)", fontWeight: 600 },

  /* Main */
  main: { flex: 1, padding: "28px 32px 60px", overflowY: "auto", background: "var(--bg-secondary, #fff)", color: "var(--text-secondary, #1e293b)" },
  card: { background: "var(--bg-card, #fff)", borderRadius: 12, border: "1px solid var(--border-color, #e2e8f0)", padding: "36px 48px", boxShadow: "0 2px 12px rgba(0,0,0,0.06)", maxWidth: 760 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--border-color, #e2e8f0)" },

  /* Form */
  row: { display: "flex", alignItems: "flex-start", gap: 0, marginBottom: 22 },
  label: { width: 150, minWidth: 150, fontSize: 14, fontWeight: 600, color: "var(--text-label, #374151)", paddingTop: 8, lineHeight: "1.5" },
  optional: { fontWeight: 400, color: "var(--text-muted, #94a3b8)", fontSize: 12 },
  control: { flex: 1 },
  input: { width: "100%", padding: "8px 12px", border: "1px solid var(--input-border, #d1d5db)", borderRadius: 6, fontSize: 14, color: "var(--input-text, #1e293b)", outline: "none", background: "var(--input-bg, #fff)", boxSizing: "border-box" },
  textarea: { width: "100%", padding: "8px 12px", border: "1px solid var(--input-border, #d1d5db)", borderRadius: 6, fontSize: 14, color: "var(--input-text, #1e293b)", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" },
  selectWrap: { position: "relative", display: "inline-flex", alignItems: "center" },
  select: { padding: "8px 36px 8px 12px", border: "1px solid var(--input-border, #d1d5db)", borderRadius: 6, fontSize: 14, color: "var(--input-text, #1e293b)", appearance: "none", background: "var(--input-bg, #fff)", cursor: "pointer", outline: "none" },
  selectArrow: { position: "absolute", right: 10, pointerEvents: "none", color: "var(--text-muted, #64748b)" },
  checkboxLabel: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-secondary, #374151)", cursor: "pointer", fontWeight: 500 },
  checkbox: { width: 16, height: 16, accentColor: "var(--accent-blue, #1a6ff4)", cursor: "pointer" },
  radioGroup: { display: "flex", alignItems: "center", gap: 28, flexWrap: "wrap" },
  radioLabel: { display: "inline-flex", alignItems: "center", gap: 8, fontSize: 14, color: "var(--text-secondary, #374151)", cursor: "pointer", fontWeight: 500 },
  radio: { width: 16, height: 16, accentColor: "var(--accent-blue, #1a6ff4)", cursor: "pointer" },
  personalId: { color: "var(--accent-blue, #1a6ff4)", fontWeight: 600 },
  warnBanner: { display: "flex", alignItems: "flex-start", gap: 8, marginTop: 10, background: "var(--bg-alert, #fffbeb)", border: "1px solid var(--border-color, #fde68a)", borderRadius: 6, padding: "10px 14px" },
  warnText: { fontSize: 13, color: "var(--text-label, #78350f)", lineHeight: "1.5" },
  connectLink: { background: "none", border: "none", color: "var(--accent-blue, #1a6ff4)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: 0, textDecoration: "underline" },
  outlineBtn: { display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px", border: "1px solid var(--btn-outline-border, #d1d5db)", borderRadius: 6, background: "var(--btn-outline-bg, #fff)", fontSize: 14, color: "var(--btn-outline-text, #374151)", cursor: "pointer", fontWeight: 500 },
  securityRow: { display: "flex", alignItems: "center" },
  hintText: { fontSize: 12, color: "var(--text-muted, #64748b)", marginTop: 4, marginLeft: 24 },
  divider: { height: 1, background: "var(--border-color, #e2e8f0)", margin: "24px 0" },
  actionRow: { display: "flex", alignItems: "center", gap: 12, marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border-color, #e2e8f0)" },
  saveBtn: { padding: "10px 36px", background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 6, fontSize: 15, fontWeight: 700, cursor: "pointer" },
  cancelBtn: { padding: "10px 28px", background: "var(--btn-outline-bg, #fff)", color: "var(--btn-outline-text, #374151)", border: "1px solid var(--btn-outline-border, #d1d5db)", borderRadius: 6, fontSize: 15, fontWeight: 500, cursor: "pointer" },
  infoCircle: { fontSize: 13, color: "var(--text-muted, #94a3b8)", cursor: "help" },
};
