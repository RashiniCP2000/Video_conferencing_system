import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "../components/UserProfileMenu.jsx";
import avatarPhoto from "../assets/avatar_photo.png";

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

/* ─── Sidebar items ─────────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Hub",        external: true,  badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, setUserFromBootstrap } = useAuth();

  /* ── nav / sidebar state ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(true);

  /* ── Personal Info states ── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [hostKey, setHostKey] = useState("");

  const [savingInfo, setSavingInfo] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: "" });

  /* ── Meetings details state ── */
  const [copiedId, setCopiedId] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  const PERSONAL_ID = "543 517 4501";
  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  // Sync profile details from AuthContext when available
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setJobTitle(user.jobTitle || "");
      setCompany(user.company || "");
      setCountry(user.country || "");
      setHostKey(user.hostKey || "");
    }
  }, [user]);

  // Load upcoming meetings from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meetnova_scheduled_meetings") || "[]");
      const now = new Date();
      const parseMeetingDateTime = (m) => {
        if (!m.date) return new Date(0);
        const timeStr = m.time || "00:00";
        return new Date(`${m.date}T${timeStr}`);
      };
      const upcoming = saved
        .filter((m) => parseMeetingDateTime(m) >= now)
        .sort((a, b) => parseMeetingDateTime(a) - parseMeetingDateTime(b));
      setUpcomingMeetings(upcoming);
    } catch (e) {
      console.error("Failed to load upcoming meetings:", e);
    }
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleHostMeeting = async () => {
    try {
      const { data } = await api.post("/meetings", { title: `${user?.name || "User"}'s Instant Meeting` });
      navigate(`/meet/${data.meetingId}`);
    } catch {
      alert("Could not start meeting.");
    }
  };

  const handleJoinMeeting = () => {
    const code = prompt("Enter meeting code:");
    if (code?.trim()) navigate(`/meet/${code.trim().toUpperCase()}`);
  };

  const handleSidebarClick = (label) => {
    if (label === "Meetings")   navigate("/meetings");
    else if (label === "Recordings") navigate("/recordings");
    else if (label === "Calendar")   navigate("/calendar");
    else if (label === "Scheduler")  navigate("/schedule");
    else if (label === "Tasks")      navigate("/tasks");
  };

  const handleCopyPersonalId = () => {
    navigator.clipboard.writeText(PERSONAL_ID.replace(/\s/g, ""));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setStatusMsg({ type: null, text: "" });

    try {
      const { data } = await api.put("/auth/profile", {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        company,
        country,
        hostKey,
      });
      setUserFromBootstrap(data.user);
      setStatusMsg({ type: "success", text: "Profile details saved successfully!" });
      setTimeout(() => setStatusMsg({ type: null, text: "" }), 4000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update profile details. Please try again.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div style={st.root}>
      {/* ═══ TOP NAVIGATION ═══ */}
      <header style={st.topNav}>
        <div style={st.topNavLeft}>
          <span style={st.logo}>MeetNova</span>
          <nav style={st.navLinks}>
            {["Products", "Solutions", "Resources", "Plans & Pricing"].map((item) => (
              <button
                key={item}
                onClick={() => item === "Plans & Pricing" && navigate("/pricing")}
                style={st.navLink}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div style={st.topNavRight}>
          <button onClick={() => navigate("/schedule")} style={st.navLinkHighlight}>Schedule</button>
          <button onClick={handleJoinMeeting}           style={st.navLinkHighlight}>Join</button>
          <button onClick={handleHostMeeting}           style={st.navLinkHighlightDrop}>Host <ChevronDown /></button>
          <button                                       style={st.navLinkHighlightDrop}>Web App <ChevronDown /></button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowProfileMenu((p) => !p)} style={st.avatar} title={user?.name}>{initials}</button>
            {showProfileMenu && (
              <UserProfileMenu
                user={user}
                onLogout={handleLogout}
                onClose={() => setShowProfileMenu(false)}
              />
            )}
          </div>
        </div>
      </header>

      <div style={st.bodyRow}>
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside style={st.sidebar}>
          <div style={st.sidebarInner}>
            <button onClick={() => navigate("/")} style={{ ...st.sidebarBtn, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <HomeIcon /><span>Home</span>
            </button>
            <div style={st.sidebarDivider} />
            <p style={{ ...st.sidebarGroupLabel, marginTop: 12 }}>My Products</p>
            <ul style={st.sidebarList}>
              {sidebarItems.map((item) => (
                <li key={item.label} style={st.sidebarItem}>
                  <button
                    onClick={() => handleSidebarClick(item.label)}
                    style={st.sidebarBtn}
                  >
                    <span>{item.label}</span>
                    <span style={st.sidebarIcons}>
                      {item.badge && <span style={st.newBadge}>{item.badge}</span>}
                      {item.external && <span style={st.externalIcon}><ExternalIcon /></span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div style={st.sidebarDivider} />
            <button style={st.sidebarCollapsible} onClick={() => setMyAccountOpen((p) => !p)}>
              <span style={{ transition: "transform 0.2s", display: "inline-flex", transform: myAccountOpen ? "rotate(90deg)" : "rotate(0deg)" }}><ChevronRight /></span>
              <span>My Account</span>
            </button>
            {myAccountOpen && (
              <ul style={st.subMenu}>
                <li>
                  <button
                    style={{ ...st.subMenuItem, ...st.subMenuItemActive }}
                    onClick={() => navigate("/profile")}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    style={st.subMenuItem}
                    onClick={() => navigate("/")}
                  >
                    Settings
                  </button>
                </li>
              </ul>
            )}
            {user?.role === "admin" && (
              <button style={st.sidebarCollapsible} onClick={() => navigate("/admin")}>
                <ChevronRight /><span>Admin</span>
              </button>
            )}
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>
          <div style={st.pageContainer}>
            
            {/* ─── TOP PROFILE INFO HEADER CARD ─── */}
            <div style={st.profileHeaderCard}>
              <img src={avatarPhoto} alt="User Profile" style={st.profileHeaderPhoto} />
              <div style={st.profileHeaderDetails}>
                <h1 style={st.profileHeaderName}>{user?.name || "Your Name"}</h1>
                <div style={st.profileHeaderPlanRow}>
                  <span style={st.planBadge}>
                    Plan: {user?.plan ? user.plan.toUpperCase() : "FREE"}
                  </span>
                  {user?.subscriptionStatus === "active" && (
                    <span style={st.activeStatusBadge}>Active Subscription</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notification alert banner */}
            {statusMsg.text && (
              <div style={{
                ...st.alertBanner,
                background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                borderColor: statusMsg.type === "success" ? "#10b981" : "#ef4444",
                color: statusMsg.type === "success" ? "#10b981" : "#ef4444"
              }}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={st.profileFormGrid}>
              
              {/* ─── SECTION 1: PERSONAL INFORMATION ─── */}
              <div style={st.sectionCard}>
                <h2 style={st.sectionTitle}>1. Personal Information</h2>
                <p style={st.sectionDesc}>Edit your contact details, job title, and location preferences below.</p>
                
                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Product Manager"
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Inc."
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>Country / Zone</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States / GMT-5"
                    style={st.input}
                  />
                </div>
              </div>

              {/* ─── SECTION 2: MEETING DETAILS ─── */}
              <div style={st.sectionCard}>
                <h2 style={st.sectionTitle}>2. Meeting Details</h2>
                <p style={st.sectionDesc}>Configure your personal room ID, claim code, and view scheduled syncs.</p>

                <div style={st.meetingDetailField}>
                  <span style={st.detailLabel}>Personal Meeting ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={st.detailVal}>{PERSONAL_ID}</span>
                    <button type="button" onClick={handleCopyPersonalId} style={st.copyBtn}>
                      {copiedId ? "✓ Copied" : <><CopyIcon /> Copy</>}
                    </button>
                  </div>
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>Host Key (6-digit PIN)</label>
                  <input
                    type="text"
                    value={hostKey}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setHostKey(val);
                    }}
                    placeholder="e.g. 123456"
                    style={{ ...st.input, letterSpacing: "0.2em", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                  <small style={st.hintText}>Used to claim host privileges in video meetings.</small>
                </div>

                {/* Upcoming Meetings List */}
                <div style={{ marginTop: 24 }}>
                  <span style={{ ...st.detailLabel, display: "block", marginBottom: 10 }}>Upcoming Meetings</span>
                  {upcomingMeetings.length > 0 ? (
                    <div style={st.upcomingList}>
                      {upcomingMeetings.slice(0, 3).map((meeting, index) => (
                        <div key={index} style={st.upcomingItem}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={st.upcomingTopic}>{meeting.topic}</span>
                            <span style={st.upcomingTime}>{meeting.date} at {meeting.time} ({meeting.timezone})</span>
                          </div>
                          <span style={st.upcomingId}>ID: {meeting.meetingId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={st.emptyMeetings}>
                      No upcoming meetings scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* ─── SECTION 3: ACCOUNT STATUS & ACTION ─── */}
              <div style={{ ...st.sectionCard, gridColumn: "1 / -1" }}>
                <h2 style={st.sectionTitle}>3. Account Settings</h2>
                <p style={st.sectionDesc}>View your current licensing options and unlock additional features.</p>
                
                <div style={st.accountInfoRow}>
                  <div style={st.accountField}>
                    <span style={st.detailLabel}>License Type</span>
                    <span style={st.detailVal}>{user?.plan ? user.plan.toUpperCase() : "FREE"}</span>
                  </div>
                  
                  <div style={st.accountField}>
                    <span style={st.detailLabel}>Meeting Limit</span>
                    <span style={st.detailVal}>
                      {user?.plan === "free" ? "40 mins per meeting" : "Unlimited (up to 30 hrs)"}
                    </span>
                  </div>

                  <div style={st.accountField}>
                    <span style={st.detailLabel}>User Role</span>
                    <span style={st.detailVal}>{user?.role ? user.role.toUpperCase() : "HOST"}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate("/pricing")}
                    style={st.upgradeBtn}
                  >
                    Upgrade Plan
                  </button>
                </div>
              </div>

              {/* Form Actions Footer */}
              <div style={st.formFooter}>
                <button
                  type="submit"
                  disabled={savingInfo}
                  style={{ ...st.saveBtn, opacity: savingInfo ? 0.7 : 1 }}
                >
                  {savingInfo ? "Saving Changes..." : "Save Profile Details"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  style={st.cancelBtn}
                >
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

/* ─── Styles ─── */
const st = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "var(--bg-primary, #f8fafc)",
    color: "var(--text-secondary, #1e293b)",
    fontFamily: "'Inter', sans-serif",
  },
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    padding: "0 24px",
    background: "var(--nav-bg, #fff)",
    borderBottom: "1px solid var(--nav-border, #e2e8f0)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topNavLeft: { display: "flex", alignItems: "center", gap: 32 },
  logo: { fontSize: 24, fontWeight: 900, color: "var(--accent-blue, #1a6ff4)", letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: 24 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", padding: "4px 0", fontWeight: 500, fontFamily: "inherit" },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", fontWeight: 600, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  navLinkHighlightDrop: { display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", fontWeight: 600, padding: "6px 12px", borderRadius: 8, fontFamily: "inherit" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#1a6ff4,#06b6d4)", color: "#fff", fontSize: 14, fontWeight: 700, border: "none", cursor: "pointer", marginLeft: 8 },

  bodyRow: { display: "flex", flex: 1 },

  /* Sidebar */
  sidebar: { width: 220, minWidth: 220, background: "var(--bg-sidebar, #fff)", borderRight: "1px solid var(--border-color, #e2e8f0)", padding: "20px 0", display: "flex", flexDirection: "column" },
  sidebarInner: { flex: 1, overflowY: "auto" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 16px", marginBottom: 6 },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: 0 },
  sidebarBtn: { display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", padding: "8px 16px", border: "none", cursor: "pointer", fontSize: 14, borderRadius: 6, textAlign: "left", transition: "background 0.15s", fontFamily: "inherit", color: "var(--sidebar-text, #1e293b)", background: "none" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, background: "var(--badge-bg, #10b981)", color: "var(--badge-text, #fff)", borderRadius: 4, padding: "1px 5px" },
  externalIcon: { color: "var(--text-muted, #94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color, #e2e8f0)", margin: "12px 16px" },
  sidebarCollapsible: { display: "flex", alignItems: "center", gap: 6, width: "100%", padding: "8px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #374151)", fontWeight: 600, fontFamily: "inherit" },
  subMenu: { listStyle: "none", margin: 0, padding: "0 0 0 32px" },
  subMenuItem: { display: "block", width: "100%", padding: "6px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-nav, #374151)", textAlign: "left", borderRadius: 6, fontFamily: "inherit" },
  subMenuItemActive: { background: "var(--sidebar-active-bg, #eff6ff)", color: "var(--sidebar-active-color, #1a6ff4)", fontWeight: 600 },

  /* Main */
  main: { flex: 1, padding: "32px 40px", overflowY: "auto", background: "var(--bg-secondary, #fff)" },
  pageContainer: { maxWidth: "900px", margin: "0 auto" },

  /* Profile Header Card */
  profileHeaderCard: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
  },
  profileHeaderPhoto: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid var(--border-color, #e2e8f0)",
  },
  profileHeaderDetails: { display: "flex", flexDirection: "column", gap: "6px" },
  profileHeaderName: { fontSize: "22px", fontWeight: "800", color: "var(--text-primary, #0f172a)", margin: 0 },
  profileHeaderPlanRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  planBadge: { fontSize: "11px", fontWeight: "700", background: "var(--accent-blue-bg, #eff6ff)", color: "var(--accent-blue, #1a6ff4)", padding: "4px 8px", borderRadius: "6px" },
  activeStatusBadge: { fontSize: "11px", fontWeight: "700", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "4px 8px", borderRadius: "6px" },

  /* Section Cards */
  profileFormGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  sectionCard: {
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "var(--text-primary, #0f172a)", margin: 0 },
  sectionDesc: { fontSize: "13px", color: "var(--text-muted, #64748b)", margin: "0 0 4px 0" },

  /* Forms */
  formRow: { display: "flex", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-label, #334155)" },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-input, #cbd5e1)",
    backgroundColor: "var(--input-bg, #ffffff)",
    color: "var(--input-text, #1e293b)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
  },
  hintText: { fontSize: "11px", color: "var(--text-muted, #64748b)" },

  /* Details inside cards */
  meetingDetailField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
  },
  detailLabel: { fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)" },
  detailVal: { fontSize: "15px", fontWeight: "700", color: "var(--text-primary, #0f172a)" },
  copyBtn: {
    background: "var(--bg-hover, #eff6ff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    color: "var(--accent-blue, #1a6ff4)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },

  /* Upcoming list */
  upcomingList: { display: "flex", flexDirection: "column", gap: "8px" },
  upcomingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg-primary, #f8fafc)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  upcomingTopic: { fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary, #0f172a)" },
  upcomingTime: { fontSize: "11px", color: "var(--text-muted, #64748b)" },
  upcomingId: { fontSize: "12px", color: "var(--text-muted, #64748b)", fontFamily: "monospace" },
  emptyMeetings: {
    padding: "16px",
    borderRadius: "8px",
    background: "var(--bg-primary, #f8fafc)",
    border: "1px dashed var(--border-color, #cbd5e1)",
    fontSize: "13px",
    color: "var(--text-muted, #64748b)",
    textAlign: "center",
  },

  /* Account status section */
  accountInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "8px",
  },
  accountField: { display: "flex", flexDirection: "column", gap: "4px" },
  upgradeBtn: {
    background: "var(--accent-blue, #1a6ff4)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    marginLeft: "auto",
  },

  /* Footer & banners */
  formFooter: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px",
    paddingTop: "20px",
    borderTop: "1px solid var(--border-color, #e2e8f0)",
  },
  saveBtn: {
    padding: "12px 28px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--accent-blue, #1a6ff4)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cancelBtn: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid var(--btn-outline-border, #cbd5e1)",
    backgroundColor: "var(--btn-outline-bg, #fff)",
    color: "var(--btn-outline-text, #334155)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  alertBanner: {
    gridColumn: "1 / -1",
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
};
