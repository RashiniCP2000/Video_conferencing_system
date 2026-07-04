import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "../components/UserProfileMenu.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav.jsx";

/* ─── Icons ──────────────────────────────────────────────────────── */
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 10l5 5 5-5z" /></svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" /></svg>
);
const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" /></svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
);
const GoogleCalIcon = () => (
  <svg viewBox="0 0 48 48" width="18" height="18">
    <rect width="48" height="48" rx="8" fill="#fff" stroke="#dadce0" strokeWidth="2"/>
    <path d="M33 15H15v18h18V15z" fill="#fff"/>
    <path d="M33 33H15V24h18v9z" fill="#4285F4" opacity=".2"/>
    <path d="M24 26a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" fill="#4285F4"/>
    <text x="24" y="21" textAnchor="middle" fontSize="9" fill="#4285F4" fontWeight="bold">G</text>
  </svg>
);
const OutlookIcon = () => (
  <svg viewBox="0 0 48 48" width="18" height="18">
    <rect width="48" height="48" rx="8" fill="#0078D4"/>
    <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="bold">O</text>
  </svg>
);
const YahooIcon = () => (
  <svg viewBox="0 0 48 48" width="18" height="18">
    <rect width="48" height="48" rx="8" fill="#6001D2"/>
    <text x="24" y="32" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="bold">Y</text>
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

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary, #f1f5f9)", fontFamily: "'Inter','Segoe UI',sans-serif", color: "var(--text-secondary, #1e293b)" },
  topNav: { display: "flex", alignItems: "center", justifycontent: "space-between", background: "var(--nav-bg, #fff)", borderBottom: "1px solid var(--nav-border, #e2e8f0)", padding: "0 24px", height: 56, position: "sticky", top: 0, zIndex: 100 },
  topNavLeft: { display: "flex", alignItems: "center", gap: 24 },
  logo: { fontSize: 22, fontWeight: 900, color: "var(--accent-blue, #1a6ff4)", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: 4 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #475569)", padding: "6px 10px", borderRadius: 8, fontWeight: 500, fontFamily: "inherit" },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-blue, #1a6ff4)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, fontFamily: "inherit" },
  navLinkHighlightDrop: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-blue, #1a6ff4)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent-blue, #3b82f6), #6366f1)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  profileMenu: { position: "absolute", right: 0, top: 44, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200, padding: "8px 0" },
  profileMenuHeader: { padding: "10px 16px 8px", borderBottom: "1px solid var(--border-color, #f1f5f9)" },
  profileMenuName: { fontWeight: 700, fontSize: 14, color: "var(--text-primary, #1e293b)", margin: 0 },
  profileMenuEmail: { fontSize: 12, color: "var(--text-muted, #94a3b8)", margin: "2px 0 0" },
  profileMenuItem: { display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "9px 16px", fontSize: 14, color: "var(--text-nav, #334155)", cursor: "pointer", fontFamily: "inherit" },
  bodyRow: { display: "flex", flex: 1 },
  sidebar: { width: 240, background: "var(--bg-sidebar, #fff)", borderRight: "1px solid var(--border-color, #e2e8f0)", minHeight: "calc(100vh - 56px)", flexShrink: 0 },
  sidebarInner: { padding: "16px 8px" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: 4, marginTop: 0 },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: "1px 0" },
  sidebarBtn: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--sidebar-text, #1e293b)", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, color: "var(--badge-text, #fff)", background: "var(--badge-bg, #10b981)", borderRadius: 6, padding: "1px 6px" },
  externalIcon: { color: "var(--text-muted, #94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color, #f1f5f9)", margin: "8px 12px" },
  sidebarCollapsible: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--text-nav, #1e293b)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  subMenu: { listStyle: "none", margin: "2px 0 2px 28px", padding: 0 },
  subMenuItem: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted, #475569)", fontFamily: "inherit" },
  subMenuItemActive: { background: "var(--sidebar-active-bg, #eff6ff)", color: "var(--sidebar-active-color, #1a6ff4)", fontWeight: 600 },
  main: { flex: 1, padding: "32px 40px", overflowY: "auto", background: "var(--bg-secondary, #fff)" },
};

export default function MeetingDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  /* meeting data passed from ScheduleMeeting via navigate state */
  const meeting = location.state?.meeting || {};
  const {
    topic       = "My Meeting",
    date        = "",
    time        = "",
    timezone    = "Asia/Colombo",
    passcode    = "------",
    meetingId   = "000 0000 0000",
    description = "",
    invitees    = "",
    recurring   = false,
    durationHrs = "1",
    durationMins = "0",
  } = meeting;

  /* ── sidebar / nav state ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [myAccountOpen,   setMyAccountOpen]   = useState(false);
  const [activeSubPage,   setActiveSubPage]   = useState(null);
  const [activeTab,       setActiveTab]       = useState("details");
  const [showPasscode,    setShowPasscode]    = useState(false);
  const [copied,          setCopied]          = useState(false);

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  /* formatted display values */
  const formattedTime = date && time
    ? new Date(`${date}T${time}`).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      }) + ` ${timezone.split("/")[1] || timezone}`
    : "—";

  const cleanId = meetingId.replace(/\s/g, "");
  const formattedMeetingId = cleanId.length === 10
    ? cleanId.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3")
    : cleanId.length === 11
    ? cleanId.replace(/(\d{3})(\d{4})(\d{4})/, "$1 $2 $3")
    : meetingId;
  const inviteLink = `https://meetnova.us/j/${cleanId}?pwd=${passcode}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyInvitation = () => {
    const text = `MeetNova Meeting\n\nTopic: ${topic}\nTime: ${formattedTime}\n\nJoin Meeting:\n${inviteLink}\n\nMeeting ID: ${formattedMeetingId}\nPasscode: ${passcode}`;
    navigator.clipboard.writeText(text);
    alert("Invitation copied to clipboard!");
  };

  const handleStart = async () => {
    try {
      const { data } = await api.post("/meetings", { title: topic });
      navigate(`/meet/${data.meetingId}`);
    } catch { alert("Could not start meeting. Please try again."); }
  };

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const handleSidebarClick = (label) => {
    if (label === "Meetings")   navigate("/meetings");
    if (label === "Recordings") navigate("/recordings");
    if (label === "Calendar")   navigate("/calendar");
    if (label === "Scheduler")  navigate("/schedule");
    if (label === "Tasks")      navigate("/tasks");
    if (label === "Notes")      navigate("/notes");
    if (label === "Whiteboard") navigate("/whiteboard");
  };

  return (
    <div style={st.root}>

      {/* ═══ TOP NAV ═══ */}
      <TopNav />

      <div style={st.bodyRow}>

        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeTab="Meetings" />

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>

          {/* Breadcrumb */}
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:24, fontSize:14 }}>
            <button
              onClick={() => navigate("/")}
              style={{ background:"none", border:"none", cursor:"pointer", color:"var(--accent-blue, #1a6ff4)", fontSize:14, fontWeight:500, padding:0, fontFamily:"inherit" }}
            >
              My Meetings
            </button>
            <span style={{ color:"var(--text-muted, #94a3b8)" }}>›</span>
            <span style={{ color:"var(--text-primary, #1e293b)", fontWeight:600 }}>Manage &quot;{topic}&quot;</span>
          </div>

          {/* Card */}
          <div style={{ background:"var(--bg-card, #fff)", borderRadius:16, border:"1px solid var(--border-color, #e2e8f0)", boxShadow:"var(--card-shadow, 0 1px 6px rgba(0,0,0,0.06))", overflow:"hidden" }}>

            {/* Tabs */}
            <div style={{ display:"flex", borderBottom:"1px solid var(--border-color, #e2e8f0)", padding:"0 24px" }}>
              {["details", "live-streaming"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "14px 16px", fontSize: 14, fontWeight: 600, fontFamily: "inherit",
                    color: activeTab === tab ? "var(--tab-active-color, #1a6ff4)" : "var(--tab-inactive, #64748b)",
                    borderBottom: activeTab === tab ? "2px solid var(--tab-active-color, #1a6ff4)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {tab === "details" ? "Details" : "Live Streaming"}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
              <div style={{ padding: "8px 0 24px" }}>

                {/* Row helper */}
                {[
                  {
                    label: "Topic",
                    content: <span style={{ fontSize:15, color:"var(--text-primary, #1e293b)" }}>{topic}</span>,
                  },
                  {
                    label: "Time",
                    content: (
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:15, color:"var(--text-primary, #1e293b)" }}>{formattedTime}</span>
                        {recurring && <span style={{ fontSize:11, background:"var(--accent-blue-bg, #dbeafe)", color:"var(--accent-blue, #1a6ff4)", borderRadius:6, padding:"2px 8px", fontWeight:600 }}>Recurring</span>}
                      </div>
                    ),
                  },
                  {
                    label: "Meeting ID",
                    content: <span style={{ fontSize:15, color:"var(--text-primary, #1e293b)", letterSpacing:"0.04em" }}>{formattedMeetingId}</span>,
                  },
                  {
                    label: "Security",
                    content: (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <CheckIcon />
                        <span style={{ fontSize:14, color:"var(--text-primary, #1e293b)" }}>Passcode</span>
                        <span style={{ fontSize:14, color:"var(--text-muted, #94a3b8)", letterSpacing:2 }}>
                          {showPasscode ? passcode : "••••••••"}
                        </span>
                        <button
                          onClick={() => setShowPasscode((p) => !p)}
                          style={{ background:"none", border:"none", cursor:"pointer", color:"var(--accent-blue, #1a6ff4)", fontSize:13, fontWeight:600, fontFamily:"inherit", padding:0 }}
                        >
                          {showPasscode ? "Hide" : "Show"}
                        </button>
                      </div>
                    ),
                  },
                  {
                    label: "Invite Link",
                    content: (
                      <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                        <a href={inviteLink} target="_blank" rel="noreferrer"
                          style={{ color:"var(--accent-blue-text, #1a6ff4)", fontSize:13, wordBreak:"break-all", maxWidth:480 }}>
                          {inviteLink}
                        </a>
                        <button
                          onClick={handleCopyLink}
                          style={{ background:"none", border:"none", cursor:"pointer", color: copied ? "#16a34a" : "var(--text-muted, #94a3b8)", display:"flex", alignItems:"center", gap:4, fontFamily:"inherit", fontSize:12, fontWeight:600, padding:0 }}
                        >
                          {copied ? <><CheckIcon /> Copied!</> : <CopyIcon />}
                        </button>
                      </div>
                    ),
                  },
                  {
                    label: "Add to",
                    content: (
                      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                        <a href={`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(topic)}&details=${encodeURIComponent(`Join: ${inviteLink}`)}`}
                          target="_blank" rel="noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:6, color:"#4285F4", fontSize:13, fontWeight:600, textDecoration:"none", background:"#f0f7ff", borderRadius:8, padding:"6px 12px" }}>
                          <GoogleCalIcon /> Google Calendar
                        </a>
                        <a href={`data:text/calendar;charset=utf8,BEGIN:VCALENDAR%0AVERSION:2.0%0ABEGIN:VEVENT%0ASUMMARY:${encodeURIComponent(topic)}%0ADESCRIPTION:${encodeURIComponent(inviteLink)}%0AEND:VEVENT%0AEND:VCALENDAR`}
                          download="meeting.ics"
                          style={{ display:"flex", alignItems:"center", gap:6, color:"#0078D4", fontSize:13, fontWeight:600, textDecoration:"none", background:"#eff8ff", borderRadius:8, padding:"6px 12px" }}>
                          <OutlookIcon /> Outlook Calendar (.ics)
                        </a>
                        <a href={`https://calendar.yahoo.com/?v=60&title=${encodeURIComponent(topic)}&desc=${encodeURIComponent(inviteLink)}`}
                          target="_blank" rel="noreferrer"
                          style={{ display:"flex", alignItems:"center", gap:6, color:"#6001D2", fontSize:13, fontWeight:600, textDecoration:"none", background:"#f5f0ff", borderRadius:8, padding:"6px 12px" }}>
                          <YahooIcon /> Yahoo Calendar
                        </a>
                      </div>
                    ),
                  },
                  ...(description ? [{
                    label: "Description",
                    content: <span style={{ fontSize:14, color:"var(--text-secondary, #475569)", whiteSpace:"pre-wrap" }}>{description}</span>,
                  }] : []),
                  ...(invitees ? [{
                    label: "Invitees",
                    content: <span style={{ fontSize:14, color:"var(--text-secondary, #475569)" }}>{invitees}</span>,
                  }] : []),
                ].map(({ label, content }) => (
                  <div key={label} style={{ display:"flex", alignItems:"flex-start", padding:"16px 28px", borderBottom:"1px solid var(--border-color, #f8fafc)", gap:24 }}>
                    <span style={{ minWidth:120, fontSize:14, color:"var(--text-muted, #64748b)", fontWeight:500, paddingTop:1 }}>{label}</span>
                    <div style={{ flex:1 }}>{content}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Live Streaming Tab */}
            {activeTab === "live-streaming" && (
              <div style={{ padding:"48px 28px", textAlign:"center", color:"var(--text-muted, #94a3b8)", fontSize:14 }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📡</div>
                <p style={{ fontWeight:600, color:"var(--text-secondary, #475569)", marginBottom:6 }}>Live Streaming</p>
                <p>Configure live streaming for this meeting. Upgrade your plan to enable streaming to YouTube, Facebook, and more.</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:24, flexWrap:"wrap" }}>
            <button
              onClick={handleStart}
              style={{ background:"var(--accent-blue, #1a6ff4)", color:"#fff", border:"none", borderRadius:10, padding:"10px 24px", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 2px 8px rgba(26,111,244,0.25)" }}
            >
              Start
            </button>
            <button
              onClick={handleCopyInvitation}
              style={{ background:"var(--btn-outline-bg, #fff)", color:"var(--btn-outline-text, #1e293b)", border:"1px solid var(--btn-outline-border, #e2e8f0)", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit", display:"flex", alignItems:"center", gap:6 }}
            >
              <CopyIcon /> Copy Invitation
            </button>
            <button
              onClick={() => navigate("/schedule", { state: { editMeeting: meeting } })}
              style={{ background:"var(--btn-outline-bg, #fff)", color:"var(--btn-outline-text, #1e293b)", border:"1px solid var(--btn-outline-border, #e2e8f0)", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
            >
              Edit
            </button>
            <button
              onClick={() => { if (window.confirm("Delete this meeting?")) navigate("/"); }}
              style={{ background:"var(--btn-outline-bg, #fff)", color:"#e11d48", border:"1px solid #fecaca", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}
            >
              Delete
            </button>
            <button
              style={{ marginLeft:"auto", background:"var(--btn-outline-bg, #fff)", color:"var(--text-muted, #64748b)", border:"1px solid var(--btn-outline-border, #e2e8f0)", borderRadius:10, padding:"10px 18px", fontSize:14, fontWeight:500, cursor:"pointer", fontFamily:"inherit" }}
            >
              Save as Template
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
