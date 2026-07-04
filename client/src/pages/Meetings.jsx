import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "../components/UserProfileMenu.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav.jsx";
import { getUserStorageKey } from "../utils/userStorage.js";

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
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" /></svg>
);
const InfoIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" /></svg>
);
const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
);
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
);
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" /></svg>
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

export default function Meetings() {
  const navigate = useNavigate();
  const { tab = "upcoming" } = useParams();
  const { user, logout } = useAuth();
  const meetingsStorageKey = getUserStorageKey(user, "meetnova_scheduled_meetings");

  /* ── State ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const PERSONAL_ID = "543 517 4501";
  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  // Date ranges for filters
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);
  const dateRangeStr = `${today.toLocaleDateString("en-GB").replace(/\//g, "-")} to ${threeDaysLater.toLocaleDateString("en-GB").replace(/\//g, "-")}`;

  /* Load meetings from localStorage */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(meetingsStorageKey) || "[]");
      setMeetings(saved);
    } catch (err) {
      console.error("Error loading meetings:", err);
    }
  }, [meetingsStorageKey]);

  /* Save/Sync helper */
  const saveMeetings = (list) => {
    setMeetings(list);
    localStorage.setItem(meetingsStorageKey, JSON.stringify(list));
  };

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const handleHostMeeting = async () => {
    try {
      const { data } = await api.post("/meetings", { title: `${user?.name || "User"}'s Instant Meeting` });
      navigate(`/meet/${data.meetingId}`);
    } catch { alert("Could not start meeting."); }
  };

  const handleSidebarClick = (label) => {
    if (label === "Meetings")   navigate("/meetings/upcoming");
    if (label === "Recordings") navigate("/recordings");
    if (label === "Calendar")   navigate("/calendar");
    if (label === "Scheduler")  navigate("/schedule");
    if (label === "Tasks")      navigate("/tasks");
    if (label === "Notes")      navigate("/notes");
    if (label === "Whiteboard") navigate("/whiteboard");
  };

  const handleStartMeeting = async (topic) => {
    try {
      const { data } = await api.post("/meetings", { title: topic });
      navigate(`/meet/${data.meetingId}`);
    } catch { alert("Could not start meeting."); }
  };

  const handleDeleteMeeting = (id) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      const updated = meetings.filter((m) => m.meetingId !== id);
      saveMeetings(updated);
    }
  };

  const handleCopyPersonalId = () => {
    navigator.clipboard.writeText(PERSONAL_ID.replace(/\s/g, ""));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Divide meetings into upcoming and past
  const parseMeetingDateTime = (m) => {
    if (!m.date) return new Date(0);
    const timeStr = m.time || "00:00";
    return new Date(`${m.date}T${timeStr}`);
  };

  const now = new Date();
  const upcomingList = meetings.filter((m) => parseMeetingDateTime(m) >= now).sort((a,b) => parseMeetingDateTime(a) - parseMeetingDateTime(b));
  const previousList = meetings.filter((m) => parseMeetingDateTime(m) < now).sort((a,b) => parseMeetingDateTime(b) - parseMeetingDateTime(a));

  // End time calculation helper
  const calculateEndTime = (timeStr, hrs, mins) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const dateObj = new Date();
    dateObj.setHours(h, m, 0, 0);
    dateObj.setMinutes(dateObj.getMinutes() + (Number(hrs || 0) * 60) + Number(mins || 0));
    return dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatStartTime = (timeStr) => {
    if (!timeStr) return "";
    const [h, m] = timeStr.split(":").map(Number);
    const dateObj = new Date();
    dateObj.setHours(h, m, 0, 0);
    return dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatGroupDate = (dateStr) => {
    if (!dateStr) return "";
    const dateObj = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    if (dateObj.toDateString() === today.toDateString()) return "Today";
    if (dateObj.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  return (
    <div style={st.root}>

      {/* ═══ TOP NAVIGATION ═══ */}
      <TopNav />

      <div style={st.bodyRow}>

        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeTab="Meetings" />

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>

          {/* Heading */}
          <div style={st.headerRow}>
            <h1 style={st.pageTitle}>Meetings</h1>
            <div style={{ position: "relative" }}>
              <button onClick={() => navigate("/schedule")} style={st.scheduleBtn}>
                + Schedule a Meeting
                <span style={{ marginLeft: 8, display:"inline-flex", borderLeft:"1px solid rgba(255,255,255,0.3)", paddingLeft:8 }}><ChevronDown /></span>
              </button>
            </div>
          </div>

          {/* Alert Banner */}
          <div style={st.alertBanner}>
            Your current Basic plan allows you to schedule meetings for up to 40 minutes each. Upgrade to MeetNova Workplace Pro to schedule meetings for up to 30 hours with advanced meeting features. <a href="/pricing" style={st.alertLink}>Discover MeetNova Workplace Pro</a>
          </div>

          {/* Tab Bar */}
          <div style={st.tabBar}>
            {[
              { id: "upcoming", label: "Upcoming" },
              { id: "previous", label: "Previous" },
              { id: "personal-room", label: "Personal Room" },
              { id: "templates", label: "Meeting Templates" },
              { id: "agendas", label: "Meeting Agendas" },
            ].map((t) => (
              <Link
                key={t.id}
                to={`/meetings/${t.id}`}
                style={{
                  ...st.tabBtn,
                  color: tab === t.id ? "var(--tab-active-color, #1a6ff4)" : "var(--tab-inactive, #64748b)",
                  borderBottom: tab === t.id ? "3px solid var(--tab-active-color, #1a6ff4)" : "3px solid transparent",
                  fontWeight: tab === t.id ? "700" : "500",
                }}
              >
                {t.label}
              </Link>
            ))}
          </div>

          {/* Tab Content Panels */}
          <div style={{ marginTop: 24 }}>

            {/* ── 1. UPCOMING TAB ── */}
            {tab === "upcoming" && (
              <div>
                {upcomingList.length > 0 ? (
                  <div>
                    {/* Date filter simulation */}
                    <div style={st.filterRow}>
                      <span style={st.dateFilter}>
                        <CalendarIcon />
                        <span style={{ fontSize:14, fontWeight:500 }}>{dateRangeStr}</span>
                      </span>
                      <span style={{ color:"#94a3b8", cursor:"help" }} title="Dates of meetings shown"><InfoIcon /></span>
                    </div>

                    {/* Group meetings */}
                    {Object.entries(
                      upcomingList.reduce((acc, m) => {
                        const dateName = formatGroupDate(m.date);
                        if (!acc[dateName]) acc[dateName] = [];
                        acc[dateName].push(m);
                        return acc;
                      }, {})
                    ).map(([dateLabel, groupMeetings]) => (
                      <div key={dateLabel} style={{ marginBottom: 28 }}>
                        <h3 style={st.dateGroupHeader}>{dateLabel}</h3>
                        {groupMeetings.map((m) => {
                          const formattedMeetingId = m.meetingId.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1 $2 $3");
                          return (
                            <div key={m.meetingId} style={st.meetingCard}>
                              {/* Left column: Time details */}
                              <div style={st.meetingCardTimeCol}>
                                <div style={st.meetingTimeRange}>
                                  {formatStartTime(m.time)} - {calculateEndTime(m.time, m.durationHrs, m.durationMins)}
                                </div>
                                <div style={st.meetingTimeUpgrade}>
                                  Need more meeting time?<br />
                                  <a href="/pricing" style={st.inlineUpgradeLink}>Upgrade to MeetNova Workplace Pro</a>
                                </div>
                              </div>

                              {/* Center column: Topic details */}
                              <div style={st.meetingCardTopicCol}>
                                <button
                                  onClick={() => navigate("/meetings/details", { state: { meeting: m } })}
                                  style={st.meetingTopicLink}
                                >
                                  {m.topic}
                                </button>
                                <div style={st.meetingCardId}>
                                  Meeting ID: {formattedMeetingId}
                                </div>
                              </div>

                              {/* Right column: Action buttons */}
                              <div style={st.meetingCardActionsCol}>
                                <button onClick={() => handleStartMeeting(m.topic)} style={st.meetingStartBtn}>Start</button>
                                <button onClick={() => alert(`Chat room ID: ${m.meetingId}`)} style={st.meetingOutlineBtn}>Chat</button>
                                <button onClick={() => navigate("/schedule", { state: { editMeeting: m } })} style={st.meetingOutlineBtn}>Edit</button>
                                <button onClick={() => handleDeleteMeeting(m.meetingId)} style={{ ...st.meetingOutlineBtn, color:"#e11d48", borderColor:"#fecaca" }}>Delete</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Upcoming Empty State */
                  <div style={st.emptyState}>
                    <div style={st.emptyBoxIcon}>
                      <svg width="120" height="100" viewBox="0 0 120 100" fill="none">
                        <rect x="20" y="42" width="80" height="50" rx="8" fill="#DBEAFE"/>
                        <path d="M20 42h80l-8-22H28L20 42z" fill="#60A5FA"/>
                        <path d="M20 42l40 12 40-12M60 54v38" stroke="#2563EB" strokeWidth="1.5"/>
                        <rect x="42" y="28" width="36" height="8" rx="2" fill="#93C5FD"/>
                      </svg>
                    </div>
                    <h2 style={st.emptyStateTitle}>Welcome to MeetNova Meetings!</h2>
                    <p style={st.emptyStateText}>
                      Schedule new and manage existing meetings all in one place. You are currently limited to 40 minutes per meeting. Upgrade now if you need more time. <a href="/pricing" style={{ color:"#1a6ff4", textDecoration:"none", fontWeight:600 }}>Learn More</a>
                    </p>
                    <div style={{ display:"flex", gap:12, justifyContent:"center", marginTop:24 }}>
                      <button onClick={() => navigate("/schedule")} style={st.emptyScheduleBtn}>Schedule a Meeting</button>
                      <button onClick={() => navigate("/pricing")} style={st.emptyUpgradeBtn}>Upgrade Now</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 2. PREVIOUS TAB ── */}
            {tab === "previous" && (
              <div>
                {previousList.length > 0 ? (
                  <div>
                    <h3 style={{ ...st.dateGroupHeader, marginBottom:16 }}>Past Meetings</h3>
                    {previousList.map((m) => {
                      const formattedMeetingId = m.meetingId.replace(/(\d{3})(\d{3,4})(\d{4})/, "$1 $2 $3");
                      return (
                        <div key={m.meetingId} style={st.meetingCard}>
                          <div style={st.meetingCardTimeCol}>
                            <div style={st.meetingPastDate}>{m.date}</div>
                            <div style={st.meetingPastTime}>{formatStartTime(m.time)}</div>
                          </div>
                          <div style={st.meetingCardTopicCol}>
                            <button
                              onClick={() => navigate("/meetings/details", { state: { meeting: m } })}
                              style={st.meetingTopicLink}
                            >
                              {m.topic}
                            </button>
                            <div style={st.meetingCardId}>
                              Meeting ID: {formattedMeetingId}
                            </div>
                          </div>
                          <div style={st.meetingCardActionsCol}>
                            <button onClick={() => handleStartMeeting(m.topic)} style={st.meetingStartBtn}>Restart</button>
                            <button onClick={() => handleDeleteMeeting(m.meetingId)} style={{ ...st.meetingOutlineBtn, color:"#e11d48", borderColor:"#fecaca" }}>Delete</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Previous Empty State */
                  <div style={st.emptyState}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📅</div>
                    <h2 style={st.emptyStateTitle}>No Past Meetings</h2>
                    <p style={st.emptyStateText}>
                      No meetings held in the past 30 days. Meetings will appear here after they are concluded or expired.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── 3. PERSONAL ROOM TAB ── */}
            {tab === "personal-room" && (
              <div style={st.detailsCard}>
                <h2 style={st.detailsCardTitle}>{user?.name || "User"}&apos;s Personal Meeting Room</h2>

                <div style={st.detailsTable}>
                  {[
                    { label: "Topic", val: `${user?.name || "User"}'s Personal Meeting Room` },
                    {
                      label: "Meeting ID",
                      val: (
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <span style={{ fontWeight: 600 }}>{PERSONAL_ID}</span>
                          <button onClick={handleCopyPersonalId} style={st.iconTextBtn}>
                            {copiedId ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy ID</>}
                          </button>
                        </div>
                      )
                    },
                    { label: "Passcode", val: <span style={{ fontFamily:"monospace" }}>MeetNova</span> },
                    {
                      label: "Invite Link",
                      val: (
                        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                          <span style={{ color: "#1a6ff4", wordBreak: "break-all" }}>
                            {`https://meetnova.us/j/${PERSONAL_ID.replace(/\s/g, "")}?pwd=MeetNova`}
                          </span>
                          <button onClick={() => handleCopyLink(`https://meetnova.us/j/${PERSONAL_ID.replace(/\s/g, "")}?pwd=MeetNova`)} style={st.iconTextBtn}>
                            {copiedLink ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy Link</>}
                          </button>
                        </div>
                      )
                    },
                    { label: "Host Video", val: "On" },
                    { label: "Participant Video", val: "On" },
                    { label: "Audio Option", val: "Telephone and Computer Audio" },
                  ].map((row, idx) => (
                    <div key={idx} style={st.detailsRow}>
                      <span style={st.detailsLabel}>{row.label}</span>
                      <div style={st.detailsValue}>{row.val}</div>
                    </div>
                  ))}
                </div>

                <div style={st.detailsActions}>
                  <button onClick={() => handleStartMeeting(`${user?.name || "User"}'s Personal Meeting Room`)} style={st.meetingStartBtn}>Start Room</button>
                  <button onClick={() => alert("Invitation text copied to clipboard!")} style={st.meetingOutlineBtn}>Copy Invitation</button>
                  <button onClick={() => alert("To edit Personal Room settings, please upgrade to a Pro Plan.")} style={st.meetingOutlineBtn}>Edit Settings</button>
                </div>
              </div>
            )}

            {/* ── 4. MEETING TEMPLATES TAB ── */}
            {tab === "templates" && (
              <div>
                <h3 style={{ ...st.dateGroupHeader, marginBottom:16 }}>Reusable Meeting Templates</h3>
                <p style={{ color:"#64748b", fontSize:14, marginBottom:20 }}>
                  Select a template to quickly pre-populate the Schedule Meeting form with matching configurations.
                </p>

                <div style={st.templatesGrid}>
                  {[
                    {
                      id: "standup",
                      title: "Daily Standup",
                      duration: "15 mins",
                      desc: "Quick morning team alignment session. Preconfigured for short duration and recurring schedule.",
                      icon: "☕",
                    },
                    {
                      id: "interview",
                      title: "Job Interview",
                      duration: "1 hour",
                      desc: "Preconfigured for candidate screening, passcode security, and waiting room enabled.",
                      icon: "👔",
                    },
                    {
                      id: "webinar",
                      title: "Webinar / Training",
                      duration: "2 hours",
                      desc: "Optimized for one-to-many broadcasts. Q&A and waiting room disabled, public attendance.",
                      icon: "🎓",
                    },
                  ].map((tpl) => (
                    <div key={tpl.id} style={st.templateCard}>
                      <div style={st.templateIcon}>{tpl.icon}</div>
                      <h4 style={st.templateTitle}>{tpl.title}</h4>
                      <div style={st.templateDuration}>Duration: {tpl.duration}</div>
                      <p style={st.templateDesc}>{tpl.desc}</p>
                      <button
                        onClick={() => navigate("/schedule", { state: { template: tpl.id } })}
                        style={st.templateUseBtn}
                      >
                        Use Template
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── 5. MEETING AGENDAS TAB ── */}
            {tab === "agendas" && (
              <div style={st.emptyState}>
                <div style={{ fontSize: 50, marginBottom: 12 }}>📝</div>
                <h2 style={st.emptyStateTitle}>Collaborative Agendas</h2>
                <p style={st.emptyStateText}>
                  Add agendas, notes, action items, and share documents with your invitees before the meeting begins. Ensure productive syncs with everyone aligned.
                </p>
                <div style={{ marginTop: 24 }}>
                  <button onClick={() => alert("Agendas module is coming soon!")} style={st.emptyScheduleBtn}>Create an Agenda</button>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>

      {/* Floating Support Chat Icon */}
      <button style={st.chatFab} onClick={() => alert("Support chat is currently offline.")} title="Support chat">
        <ChatIcon />
      </button>

    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary, #f8fafc)", fontFamily: "'Inter','Segoe UI',sans-serif", color: "var(--text-secondary, #1e293b)" },
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", height: 56, padding: "0 24px", background: "var(--nav-bg, #fff)", borderBottom: "1px solid var(--nav-border, #e2e8f0)", position: "sticky", top: 0, zIndex: 100 },
  topNavLeft: { display: "flex", alignItems: "center", gap: 32 },
  logo: { fontSize: 24, fontWeight: 900, color: "var(--accent-blue, #1a6ff4)", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: 24 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", padding: "4px 0", fontWeight: 500, fontFamily: "inherit" },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", fontWeight: 600, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  navLinkHighlightDrop: { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", fontWeight: 600, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a6ff4,#06b6d4)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginLeft: 8 },
  profileMenu: { position: "absolute", top: 44, right: 0, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 10, boxShadow: "0 8px 30px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200 },
  profileMenuHeader: { padding: "14px 16px", borderBottom: "1px solid var(--border-color, #e2e8f0)" },
  profileMenuName: { fontWeight: 700, fontSize: 14, color: "var(--text-primary, #0f172a)", margin: 0 },
  profileMenuEmail: { fontSize: 12, color: "var(--text-muted, #64748b)", margin: "2px 0 0" },
  profileMenuItem: { display: "block", width: "100%", textAlign: "left", padding: "10px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", fontFamily: "inherit" },
  bodyRow: { display: "flex", flex: 1 },
  sidebar: { width: 220, minWidth: 220, background: "var(--bg-sidebar, #fff)", borderRight: "1px solid var(--border-color, #e2e8f0)", padding: "20px 0", display: "flex", flexDirection: "column" },
  sidebarInner: { flex: 1, overflowY: "auto" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 6 },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: 0 },
  sidebarBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 14, borderRadius: 6, textAlign: "left", transition: "background 0.15s", fontFamily: "inherit", color: "var(--sidebar-text, #1e293b)" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, background: "var(--badge-bg, #10b981)", color: "var(--badge-text, #fff)", borderRadius: 4, padding: "1px 5px" },
  externalIcon: { color: "var(--text-muted, #94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color, #e2e8f0)", margin: "12px 16px" },
  sidebarCollapsible: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", fontWeight: 600, fontFamily: "inherit" },
  subMenu: { listStyle: "none", margin: 0, padding: "0 0 0 32px" },
  subMenuItem: { display: "block", width: "100%", padding: "6px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-nav, #374151)", textAlign: "left", borderRadius: 6, fontFamily: "inherit" },
  main: { flex: 1, padding: "32px 40px", overflowY: "auto", background: "var(--bg-secondary, #fff)" },

  /* Header row with Title & schedule */
  headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  pageTitle: { fontSize: 24, fontWeight: 800, color: "var(--text-primary, #0f172a)", margin: 0 },
  scheduleBtn: { display: "inline-flex", alignItems: "center", background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.2s" },

  /* Alert Banner */
  alertBanner: { background: "var(--bg-alert, #f8fafc)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 8, padding: "14px 20px", fontSize: 13.5, lineHeight: "1.6", color: "var(--text-label, #334155)", marginBottom: 28 },
  alertLink: { color: "var(--accent-blue, #1a6ff4)", textDecoration: "none", fontWeight: 600 },

  /* Tabs */
  tabBar: { display: "flex", borderBottom: "1px solid var(--border-color, #e2e8f0)", gap: 32 },
  tabBtn: { background: "none", border: "none", cursor: "pointer", padding: "12px 0", fontSize: 15, fontFamily: "inherit", textDecoration: "none", transition: "all 0.15s", borderBottomWidth: 3 },

  /* Filter */
  filterRow: { display: "flex", alignItems: "center", gap: 10, margin: "20px 0 24px" },
  dateFilter: { display: "inline-flex", alignItems: "center", gap: 8, border: "1px solid var(--border-input, #cbd5e1)", borderRadius: 8, padding: "8px 16px", color: "var(--text-label, #334155)", background: "var(--bg-card, #fff)" },

  /* Empty state */
  emptyState: { textAlign: "center", padding: "80px 24px" },
  emptyBoxIcon: { marginBottom: 20 },
  emptyStateTitle: { fontSize: 20, fontWeight: 700, color: "var(--text-primary, #0f172a)", marginBottom: 8, margin: 0 },
  emptyStateText: { fontSize: 14, color: "var(--text-muted, #64748b)", maxWidth: 480, margin: "0 auto 24px", lineHeight: "1.6" },
  emptyScheduleBtn: { background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  emptyUpgradeBtn: { background: "var(--btn-outline-bg, #fff)", color: "var(--btn-outline-text, #334155)", border: "1px solid var(--border-input, #cbd5e1)", borderRadius: 8, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },

  /* Date grouping headers */
  dateGroupHeader: { fontSize: 14, fontWeight: 700, color: "var(--text-muted, #475569)", background: "var(--bg-input, #f8fafc)", padding: "8px 16px", borderRadius: 6, margin: "0 0 12px 0" },

  /* Meeting Card row */
  meetingCard: { display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-color, #f1f5f9)", padding: "16px 8px", transition: "background 0.2s" },
  meetingCardTimeCol: { width: 180, display: "flex", flexDirection: "column", gap: 4 },
  meetingTimeRange: { fontSize: 14, fontWeight: 700, color: "var(--text-secondary, #1e293b)" },
  meetingTimeUpgrade: { fontSize: 11, color: "var(--text-muted, #64748b)", lineHeight: "1.4" },
  inlineUpgradeLink: { color: "var(--accent-blue, #1a6ff4)", textDecoration: "none" },
  meetingPastDate: { fontSize: 13, fontWeight: 600, color: "var(--text-muted, #64748b)" },
  meetingPastTime: { fontSize: 14, fontWeight: 700, color: "var(--text-secondary, #1e293b)" },

  meetingCardTopicCol: { flex: 1, padding: "0 24px", display: "flex", flexDirection: "column", gap: 4 },
  meetingTopicLink: { background: "none", border: "none", textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 700, color: "var(--accent-blue-text, #1a6ff4)", padding: 0, fontFamily: "inherit" },
  meetingCardId: { fontSize: 13, color: "var(--text-muted, #64748b)" },

  meetingCardActionsCol: { display: "flex", gap: 8 },
  meetingStartBtn: { background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" },
  meetingOutlineBtn: { background: "var(--btn-outline-bg, #fff)", color: "var(--btn-outline-text, #334155)", border: "1px solid var(--btn-outline-border, #cbd5e1)", borderRadius: 6, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },

  /* Details Card style (Personal Room) */
  detailsCard: { border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 12, padding: 32, background: "var(--bg-card, #fff)", maxWidth: 840 },
  detailsCardTitle: { fontSize: 18, fontWeight: 700, color: "var(--text-primary, #0f172a)", margin: "0 0 24px 0" },
  detailsTable: { display: "flex", flexDirection: "column" },
  detailsRow: { display: "flex", padding: "14px 0", borderBottom: "1px solid var(--border-color, #f1f5f9)" },
  detailsLabel: { width: 180, fontSize: 13.5, color: "var(--text-muted, #64748b)", fontWeight: 600 },
  detailsValue: { flex: 1, fontSize: 14, color: "var(--text-secondary, #1e293b)" },
  detailsActions: { display: "flex", gap: 12, marginTop: 32 },
  iconTextBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--accent-blue, #1a6ff4)", fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "inherit" },

  /* Templates */
  templatesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 20, marginTop: 12 },
  templateCard: { background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 12, padding: 24, display: "flex", flexDirection: "column" },
  templateIcon: { fontSize: 28, marginBottom: 12 },
  templateTitle: { fontSize: 16, fontWeight: 700, color: "var(--text-primary, #0f172a)", margin: "0 0 4px 0" },
  templateDuration: { fontSize: 12, color: "var(--text-muted, #64748b)", fontWeight: 600, marginBottom: 8 },
  templateDesc: { fontSize: 13, color: "var(--text-muted, #475569)", flex: 1, margin: "0 0 16px 0", lineHeight: "1.5" },
  templateUseBtn: { background: "var(--accent-blue-bg, #eff6ff)", color: "var(--accent-blue, #1a6ff4)", border: "none", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" },

  /* Floating chat */
  chatFab: { position: "fixed", bottom: 24, right: 24, width: 48, height: 48, borderRadius: "50%", background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 16px rgba(26,111,244,0.3)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
};
