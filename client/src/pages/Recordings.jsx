import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import UserProfileMenu from "../components/UserProfileMenu.jsx";

/* ─── Icons ──────────────────────────────────────────────────────── */
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

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary, #f1f5f9)", fontFamily: "'Inter', 'Segoe UI', sans-serif", color: "var(--text-secondary, #1e293b)" },
  /* Top Nav */
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--nav-bg, #fff)", borderBottom: "1px solid var(--nav-border, #e2e8f0)", padding: "0 24px", height: 56, position: "sticky", top: 0, zIndex: 100 },
  topNavLeft: { display: "flex", alignItems: "center", gap: 24 },
  logo: { fontSize: 22, fontWeight: 900, color: "var(--accent-blue, #1a6ff4)", letterSpacing: "-0.5px", fontFamily: "inherit" },
  navLinks: { display: "flex", gap: 4 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav, #475569)", padding: "6px 10px", borderRadius: 8, fontWeight: 500, fontFamily: "inherit" },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, fontFamily: "inherit" },
  navLinkHighlightDrop: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary, #1e293b)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  profileMenu: { position: "absolute", right: 0, top: 44, background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200, padding: "8px 0" },
  profileMenuHeader: { padding: "10px 16px 8px", borderBottom: "1px solid var(--border-color, #f1f5f9)" },
  profileMenuName: { fontWeight: 700, fontSize: 14, color: "var(--text-primary, #1e293b)", margin: 0 },
  profileMenuEmail: { fontSize: 12, color: "var(--text-muted, #94a3b8)", margin: "2px 0 0" },
  profileMenuItem: { display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "9px 16px", fontSize: 14, color: "var(--text-nav, #334155)", cursor: "pointer", fontFamily: "inherit" },
  /* Body */
  bodyRow: { display: "flex", flex: 1 },
  /* Sidebar */
  sidebar: { width: 240, background: "var(--bg-sidebar, #fff)", borderRight: "1px solid var(--border-color, #e2e8f0)", minHeight: "calc(100vh - 56px)", flexShrink: 0 },
  sidebarInner: { padding: "16px 8px" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: 4, marginTop: 0 },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: "1px 0" },
  sidebarBtn: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--sidebar-text, #1e293b)", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", transition: "background 0.15s" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, color: "var(--accent-blue-text, #1a6ff4)", background: "var(--accent-blue-bg, #dbeafe)", borderRadius: 6, padding: "1px 6px" },
  externalIcon: { color: "var(--text-muted, #94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color, #f1f5f9)", margin: "8px 12px" },
  sidebarCollapsible: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--text-nav, #1e293b)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  subMenu: { listStyle: "none", margin: "2px 0 2px 28px", padding: 0 },
  subMenuItem: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted, #475569)", fontFamily: "inherit" },
  subMenuItemActive: { background: "var(--sidebar-active-bg, #eff6ff)", color: "var(--sidebar-active-color, #1a6ff4)", fontWeight: 600 },
  /* Main */
  main: { flex: 1, padding: "32px 32px", overflowY: "auto", background: "var(--bg-secondary, #fff)", color: "var(--text-secondary, #1e293b)" },
};

export default function Recordings() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  /* ── sidebar / nav state ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [myAccountOpen,   setMyAccountOpen]   = useState(false);
  const [activeSubPage,   setActiveSubPage]   = useState(null);

  /* ── recordings state ── */
  const [recordings,       setRecordings]       = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [search,           setSearch]           = useState("");
  const [startDate,        setStartDate]        = useState("");
  const [endDate,          setEndDate]          = useState("");
  const [deletingId,       setDeletingId]       = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [error,            setError]            = useState("");

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };
  const handleHostMeeting = async () => {
    try {
      const { data } = await api.post("/meetings", { title: `${user?.name || "User"}'s Instant Meeting` });
      navigate(`/meet/${data.meetingId}`);
    } catch { alert("Could not start meeting."); }
  };
  const handleJoinMeeting = () => {
    const code = prompt("Enter meeting code:");
    if (code?.trim()) navigate(`/meet/${code.trim().toUpperCase()}`);
  };
  const handleSidebarClick = (label) => {
    if (label === "Recordings") return;
    if (label === "Meetings")   navigate("/meetings");
    if (label === "Calendar")   navigate("/calendar");
    if (label === "Scheduler")  navigate("/schedule");
    if (label === "Tasks")      navigate("/tasks");
  };

  /* ── data fetching ── */
  const fetchRecordings = async () => {
    setLoading(true); setError("");
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (startDate) params.startDate = startDate;
      if (endDate)   params.endDate   = endDate;
      const { data } = await api.get("/recordings", { params });
      setRecordings(data.recordings || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load recordings");
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchRecordings(); }, [startDate, endDate]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchRecordings(); };
  const handleClearFilters = () => {
    setSearch(""); setStartDate(""); setEndDate("");
    setLoading(true);
    api.get("/recordings")
      .then(({ data }) => setRecordings(data.recordings || []))
      .catch((err) => setError(err.response?.data?.message || "Failed to load recordings"))
      .finally(() => setLoading(false));
  };

  const handleDownload = (rec) => {
    const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const url = rec.fileUrl.startsWith("http") ? rec.fileUrl : `${baseURL}${rec.fileUrl}`;
    const a = document.createElement("a");
    a.href = url; a.download = rec.fileName; a.target = "_blank"; a.click();
  };
  const handleDeleteClick  = (rec) => setShowConfirmModal(rec);
  const confirmDelete = async () => {
    if (!showConfirmModal) return;
    const id = showConfirmModal._id;
    setDeletingId(id); setShowConfirmModal(null);
    try {
      await api.delete(`/recordings/${id}`);
      setRecordings((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      alert("Failed to delete: " + (err.response?.data?.message || err.message));
    } finally { setDeletingId(null); }
  };

  /* ── format helpers ── */
  const formatDuration = (s) => {
    if (!s) return "0s";
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return `${h > 0 ? h + "h " : ""}${(m > 0 || h > 0) ? m + "m " : ""}${sec}s`;
  };
  const formatFileSize = (b) => {
    if (!b) return "0 Bytes";
    const k = 1024, sizes = ["Bytes","KB","MB","GB"], i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };
  const formatDate = (d) => new Date(d).toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric", hour:"2-digit", minute:"2-digit" });

  return (
    <div style={st.root}>

      {/* ═══ TOP NAV ═══ */}
      <header style={st.topNav}>
        <div style={st.topNavLeft}>
          <span style={st.logo}>MeetNova</span>
          <nav style={st.navLinks}>
            {["Products","Solutions","Resources","Plans & Pricing"].map((item) => (
              <button key={item} onClick={() => item === "Plans & Pricing" && navigate("/pricing")} style={st.navLink}>
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

          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowProfileMenu((p) => !p)} style={st.avatar} title={user?.name}>
              {initials}
            </button>
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
            {/* Home */}
            <button
              onClick={() => navigate("/")}
              style={{ ...st.sidebarBtn, display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
            >
              <HomeIcon /><span>Home</span>
            </button>
            <div style={st.sidebarDivider} />
            <p style={{ ...st.sidebarGroupLabel, marginTop: 12 }}>My Products</p>
            <ul style={st.sidebarList}>
              {sidebarItems.map((item) => (
                <li key={item.label} style={st.sidebarItem}>
                  <button
                    onClick={() => handleSidebarClick(item.label)}
                    style={{
                      ...st.sidebarBtn,
                      background: item.label === "Recordings" ? "var(--sidebar-active-bg, #eff6ff)" : "none",
                      color:      item.label === "Recordings" ? "var(--sidebar-active-color, #1a6ff4)" : "var(--sidebar-text, #1e293b)",
                      fontWeight: item.label === "Recordings" ? "600"     : "500",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={st.sidebarIcons}>
                      {item.badge    && <span style={st.newBadge}>{item.badge}</span>}
                      {item.external && <span style={st.externalIcon}><ExternalIcon /></span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <div style={st.sidebarDivider} />

            {/* My Account */}
            <button style={st.sidebarCollapsible} onClick={() => setMyAccountOpen((p) => !p)}>
              <span style={{ transition: "transform 0.2s", display: "inline-flex", transform: myAccountOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                <ChevronRight />
              </span>
              <span>My Account</span>
            </button>
            {myAccountOpen && (
              <ul style={st.subMenu}>
                <li>
                  <button style={st.subMenuItem} onClick={() => navigate("/profile")}>Profile</button>
                </li>
                <li>
                  <button style={st.subMenuItem} onClick={() => navigate("/")}>Settings</button>
                </li>
              </ul>
            )}

            {/* Admin */}
            {user?.role === "admin" && (
              <button style={st.sidebarCollapsible} onClick={() => navigate("/admin")}>
                <ChevronRight /><span>Admin</span>
              </button>
            )}
          </div>
        </aside>

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>
          {/* Title */}
          <div style={{ marginBottom: 24 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary, #1e293b)", margin: "0 0 4px" }}>Recording Library</h1>
            <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: 0 }}>Manage and access all call recordings saved to your account</p>
          </div>
 
          {/* Filter Panel */}
          <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 16, padding: "18px 20px", marginBottom: 24, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 16 }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Search</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="text"
                    placeholder="Search by meeting name or room code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ width: "100%", boxSizing: "border-box", paddingLeft: 36, paddingRight: 12, paddingTop: 9, paddingBottom: 9, border: "1px solid var(--border-input, #e2e8f0)", borderRadius: 10, background: "var(--bg-input, #f8fafc)", fontSize: 13, color: "var(--input-text, #1e293b)", outline: "none", fontFamily: "inherit" }}
                  />
                  <svg style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #94a3b8)" }} width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>From Date</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  style={{ border: "1px solid var(--border-input, #e2e8f0)", borderRadius: 10, padding: "9px 12px", background: "var(--bg-input, #f8fafc)", fontSize: 13, color: "var(--input-text, #1e293b)", outline: "none", fontFamily: "inherit" }} />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-muted, #94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>To Date</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  style={{ border: "1px solid var(--border-input, #e2e8f0)", borderRadius: 10, padding: "9px 12px", background: "var(--bg-input, #f8fafc)", fontSize: 13, color: "var(--input-text, #1e293b)", outline: "none", fontFamily: "inherit" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="submit"
                  style={{ background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Search
                </button>
                {(search || startDate || endDate) && (
                  <button type="button" onClick={handleClearFilters}
                    style={{ background: "var(--btn-outline-bg, #fff)", color: "var(--btn-outline-text, #64748b)", border: "1px solid var(--btn-outline-border, #e2e8f0)", borderRadius: 10, padding: "9px 16px", fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                    Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 10, padding: "10px 16px", fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
              <div style={{ width: 40, height: 40, border: "4px solid #dbeafe", borderTop: "4px solid #1a6ff4", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <p style={{ fontSize: 13, color: "#94a3b8" }}>Loading your recordings...</p>
            </div>
          ) : recordings.length === 0 ? (
            <div style={{ background: "var(--bg-card, #fff)", border: "1.5px dashed var(--border-color, #e2e8f0)", borderRadius: 20, padding: "64px 24px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, background: "var(--bg-primary, #f1f5f9)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <svg width="28" height="28" fill="none" viewBox="0 0 24 24" stroke="var(--text-muted, #94a3b8)">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary, #1e293b)", margin: "0 0 6px" }}>No recordings found</h3>
              <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", maxWidth: 340, margin: "0 0 20px" }}>
                {search || startDate || endDate
                  ? "No recordings match your filters. Try adjusting your search."
                  : "Recordings saved during calls will appear here."}
              </p>
              {(search || startDate || endDate) ? (
                <button onClick={handleClearFilters}
                  style={{ background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Reset Filters
                </button>
              ) : (
                <button onClick={() => navigate("/")}
                  style={{ background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 10, padding: "9px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Start a Meeting
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
              {recordings.map((rec) => (
                <div key={rec._id}
                  style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", opacity: deletingId === rec._id ? 0.5 : 1, pointerEvents: deletingId === rec._id ? "none" : "auto" }}>
                  {/* Thumbnail */}
                  <div style={{ height: 130, background: "#0f172a", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)", zIndex: 1 }} />
                    <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(59,130,246,0.9)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, zIndex: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{rec.meetingCode}</span>
                    <span style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.75)", color: "#fff", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, zIndex: 2 }}>{formatDuration(rec.duration)}</span>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}>
                      <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                  {/* Info */}
                  <div style={{ padding: "16px 16px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary, #1e293b)", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={rec.title}>{rec.title}</h3>
                      <p style={{ fontSize: 12, color: "var(--text-muted, #94a3b8)", margin: 0 }}>{formatDate(rec.createdAt)}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--border-color, #f1f5f9)", paddingTop: 10, fontSize: 12, color: "var(--text-muted, #64748b)" }}>
                      <span>Size: <strong style={{ color: "var(--text-primary, #1e293b)" }}>{formatFileSize(rec.fileSize)}</strong></span>
                      <span style={{ background: "var(--bg-primary, #f1f5f9)", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 500, color: "var(--text-secondary, #475569)" }}>
                        {rec.storageType === "s3" ? "Cloud" : "Local Server"}
                      </span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      <button onClick={() => handleDownload(rec)}
                        style={{ background: "var(--accent-blue-bg, #eff6ff)", color: "var(--accent-blue, #1a6ff4)", border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Download
                      </button>
                      <button onClick={() => handleDeleteClick(rec)}
                        style={{ background: "#fff1f2", color: "#e11d48", border: "none", borderRadius: 10, padding: "8px 0", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: "inherit" }}>
                        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
 
      {/* ─── CONFIRM DELETE MODAL ─── */}
      {showConfirmModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: 16 }}>
          <div style={{ background: "var(--bg-card, #fff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: 20, padding: 28, maxWidth: 400, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary, #1e293b)", margin: "0 0 10px" }}>Delete Recording?</h3>
            <p style={{ fontSize: 13, color: "var(--text-muted, #64748b)", margin: "0 0 24px" }}>
              Are you sure you want to permanently delete <strong>{showConfirmModal.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowConfirmModal(null)}
                style={{ background: "var(--btn-outline-bg, #fff)", border: "1px solid var(--btn-outline-border, #e2e8f0)", color: "var(--btn-outline-text, #475569)", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Cancel
              </button>
              <button onClick={confirmDelete}
                style={{ background: "#e11d48", color: "#fff", border: "none", borderRadius: 10, padding: "8px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
