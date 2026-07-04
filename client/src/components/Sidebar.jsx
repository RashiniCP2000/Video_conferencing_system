import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/* ─── Modern outline SVG Icons ───────────────────────────────────── */
const DoubleCrescentLogo = () => (
  <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor" style={{ color: "var(--accent-blue)" }}>
    <path d="M12 3c-4.42 0-8 2.24-8 5 0 1.04.5 2.02 1.41 2.82.25-.97.98-1.78 1.99-2.22 1.34-.58 2.94-.85 4.6-.85s3.26.27 4.6.85c1.01.44 1.74 1.25 1.99 2.22.91-.8 1.41-1.78 1.41-2.82 0-2.76-3.58-5-8-5z" opacity="0.75" />
    <path d="M12 21c4.42 0 8-2.24 8-5 0-1.04-.5-2.02-1.41-2.82-.25.97-.98 1.78-1.99 2.22-1.34.58-2.94.85-4.6.85s-3.26-.27-4.6-.85c-1.01-.44-1.74-1.25-1.99-2.22C4.5 13.98 4 14.96 4 16c0 2.76 3.58 5 8 5z" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const MeetingsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const RecordingsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="23 7 16 12 23 17 23 7" />
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);

const WhiteboardIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);

const NotesIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const TasksIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 11 12 14 22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

const SchedulerIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const NotificationIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const DiamondIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 22 8.5 12 22 2 8.5 12 2" />
  </svg>
);

const PlusIcon = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="7 7 17 7 17 17" />
  </svg>
);

// Switcher track SVGs
const BarChartIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);

const SliderControlsIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="2" y1="14" x2="6" y2="14" />
    <line x1="10" y1="8" x2="14" y2="8" />
    <line x1="18" y1="16" x2="22" y2="16" />
  </svg>
);

const GridSquaresIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const sidebarItemsList = [
  { label: "Home", icon: <HomeIcon />, path: "/" },
  { label: "Meetings", icon: <MeetingsIcon />, path: "/meetings" },
  { label: "Recordings", icon: <RecordingsIcon />, path: "/recordings" },
  { label: "Whiteboard", icon: <WhiteboardIcon />, path: "/whiteboard", badge: "New" },
  { label: "Notes", icon: <NotesIcon />, path: "/notes" },
  { label: "Tasks", icon: <TasksIcon />, path: "/tasks", external: true },
  { label: "Scheduler", icon: <SchedulerIcon />, path: "/schedule", external: true },
  { label: "Calendar", icon: <CalendarIcon />, path: "/calendar" },
];

export default function Sidebar({ activeTab, activeSubPage, onSubPageChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, theme, changeTheme } = useAuth();

  const handleTabClick = (item) => {
    if (item.label === "Home") {
      if (onSubPageChange) {
        onSubPageChange(null);
      }
      navigate("/", { state: { activeSubPage: null } });
    } else {
      navigate(item.path);
    }
  };

  const handleSubPageNavigate = (subpage) => {
    if (onSubPageChange) {
      onSubPageChange(subpage);
      navigate("/", { state: { activeSubPage: subpage } });
    } else {
      navigate("/", { state: { activeSubPage: subpage } });
    }
  };

  const handleThemeToggle = () => {
    const nextTheme = theme === "Light" ? "Dark" : "Light";
    changeTheme(nextTheme);
  };

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  // Check which page is currently active
  const checkIsActive = (item) => {
    if (activeSubPage !== null && activeSubPage !== undefined) {
      return false; // Subpage settings/profile overrides main active tab styling
    }
    if (activeTab) {
      return activeTab.toLowerCase() === item.label.toLowerCase();
    }
    return location.pathname === item.path;
  };

  const styles = {
    container: {
      display: "flex",
      height: "calc(100vh - 56px)",
      position: "sticky",
      top: "56px",
      zIndex: 90,
      background: "var(--bg-sidebar, #ffffff)",
      borderRight: "1px solid var(--border-color, #e2e8f0)",
      userSelect: "none",
    },
    logoWrapper: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: "8px",
    },
    switcherGroup: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: "16px",
      flex: 1,
    },
    switcherIconActive: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      background: "var(--accent-blue, #1a6ff4)",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 4px 10px rgba(26, 111, 244, 0.3)",
      cursor: "pointer",
      transition: "transform 0.2s, background-color 0.2s",
    },
    switcherIconInactive: {
      width: "44px",
      height: "44px",
      borderRadius: "50%",
      color: "var(--text-muted, #64748b)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      transition: "color 0.2s, background-color 0.2s",
    },
    trackDivider: {
      width: "36px",
      height: "1px",
      background: "var(--border-color, #e2e8f0)",
    },
    trackUtilityBtn: {
      background: "none",
      border: "none",
      cursor: "pointer",
      color: "var(--text-muted, #64748b)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "36px",
      height: "36px",
      borderRadius: "8px",
      transition: "color 0.2s, background-color 0.2s",
    },
    trackUtilityBtnActive: {
      background: "var(--bg-hover, #eff6ff)",
      color: "var(--accent-blue, #1a6ff4)",
    },
    // Theme slider pill
    themePillContainer: {
      width: "30px",
      height: "56px",
      borderRadius: "15px",
      background: theme === "Dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
      border: "1px solid var(--border-color, #e2e8f0)",
      position: "relative",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "4px 0",
      boxShadow: "inset 0 1px 3px rgba(0,0,0,0.08)",
    },
    themeIndicatorDot: {
      width: "22px",
      height: "22px",
      borderRadius: "50%",
      background: "var(--bg-secondary, #ffffff)",
      border: "1px solid var(--border-color, #e2e8f0)",
      position: "absolute",
      left: "3px",
      transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
      boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
      transform: theme === "Dark" ? "translateY(24px)" : "translateY(0px)",
      zIndex: 1,
    },
    themeIcon: {
      zIndex: 2,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "var(--text-muted, #64748b)",
      transition: "color 0.2s",
      width: "22px",
      height: "22px",
    },
    themeIconActive: {
      color: "var(--accent-blue, #1a6ff4)",
    },
    avatarWrapper: {
      width: "36px",
      height: "36px",
      borderRadius: "50%",
      background: "linear-gradient(135deg, #1a6ff4, #06b6d4)",
      color: "#ffffff",
      fontWeight: "700",
      fontSize: "14px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
      border: "2px solid var(--border-color, #e2e8f0)",
      transition: "transform 0.2s",
    },

    // Nav column
    navTrack: {
      width: "220px",
      minWidth: "220px",
      display: "flex",
      flexDirection: "column",
      padding: "20px 0 16px",
    },
    workspacePill: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "8px 14px",
      border: "1px solid var(--border-color, #e2e8f0)",
      borderRadius: "20px",
      margin: "0 14px 20px 14px",
      background: "var(--bg-secondary, #ffffff)",
      cursor: "pointer",
      boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.04))",
    },
    workspaceTitle: {
      fontSize: "13.5px",
      fontWeight: "700",
      color: "var(--text-primary, #0f172a)",
    },
    workspacePlus: {
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      background: "rgba(16, 185, 129, 0.12)",
      color: "#10b981",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    tabList: {
      listStyle: "none",
      margin: 0,
      padding: 0,
      display: "flex",
      flexDirection: "column",
      gap: "2px",
    },
    tabItem: {
      margin: "0 12px",
    },
    tabBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "9px 14px",
      borderRadius: "20px",
      border: "none",
      cursor: "pointer",
      fontSize: "13.5px",
      textAlign: "left",
      fontFamily: "inherit",
      transition: "all 0.2s ease",
      position: "relative",
    },
    tabBtnActive: {
      background: theme === "Dark" ? "#ffffff" : "var(--accent-blue, #1a6ff4)",
      color: theme === "Dark" ? "#0f172a" : "#ffffff",
      fontWeight: "600",
      boxShadow: theme === "Dark" ? "none" : "0 4px 12px rgba(26, 111, 244, 0.2)",
    },
    tabBtnInactive: {
      background: "none",
      color: "var(--text-muted, #64748b)",
      fontWeight: "500",
    },
    badge: {
      fontSize: "9px",
      fontWeight: "700",
      background: "var(--badge-bg, #10b981)",
      color: "var(--badge-text, #ffffff)",
      borderRadius: "4px",
      padding: "1px 5px",
      marginLeft: "auto",
      textTransform: "uppercase",
    },
    externalSymbol: {
      marginLeft: "auto",
      color: "var(--text-muted, #94a3b8)",
      display: "flex",
      alignItems: "center",
    },
    navDivider: {
      height: "1px",
      background: "var(--border-color, #e2e8f0)",
      margin: "16px 14px",
    },
    accountHeader: {
      fontSize: "10.5px",
      fontWeight: "700",
      color: "var(--text-muted, #94a3b8)",
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      padding: "0 18px",
      marginBottom: "6px",
    },
    // Promo upgrade card
    promoCard: {
      margin: "auto 14px 0 14px",
      padding: "14px",
      borderRadius: "14px",
      border: "1px solid var(--accent-blue, #1a6ff4)",
      background: "var(--accent-blue-bg, #eff6ff)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      textAlign: "center",
      gap: "10px",
      boxShadow: "0 2px 8px rgba(26, 111, 244, 0.05)",
    },
    promoText: {
      fontSize: "11.5px",
      fontWeight: "600",
      color: "var(--text-secondary, #1e293b)",
      lineHeight: "1.4",
      margin: 0,
    },
    upgradeBtn: {
      width: "100%",
      padding: "7px 12px",
      borderRadius: "16px",
      border: "none",
      background: theme === "Dark" ? "#ffffff" : "var(--accent-blue, #1a6ff4)",
      color: theme === "Dark" ? "#0f172a" : "#ffffff",
      fontSize: "11.5px",
      fontWeight: "700",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "5px",
      transition: "opacity 0.2s",
      fontFamily: "inherit",
    },
  };

  return (
    <div style={styles.container}>
      {/* COLUMN 2: RIGHT TRACK */}
      <div style={styles.navTrack}>
        {/* Workspace Dropper */}
        <div style={styles.workspacePill} onClick={() => navigate("/")}>
          <span style={styles.workspaceTitle}>MeetNova</span>
          <span style={styles.workspacePlus}>
            <PlusIcon />
          </span>
        </div>

        {/* Tabs List */}
        <ul style={styles.tabList}>
          {sidebarItemsList.map((item) => {
            const isActive = checkIsActive(item);
            return (
              <li key={item.label} style={styles.tabItem}>
                <button
                  onClick={() => handleTabClick(item)}
                  style={{
                    ...styles.tabBtn,
                    ...(isActive ? styles.tabBtnActive : styles.tabBtnInactive),
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "var(--bg-hover, #eff6ff)";
                      e.currentTarget.style.color = "var(--accent-blue, #1a6ff4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.background = "none";
                      e.currentTarget.style.color = "var(--text-muted, #64748b)";
                    }
                  }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.badge && <span style={styles.badge}>{item.badge}</span>}
                  {item.external && (
                    <span style={styles.externalSymbol}>
                      <ExternalIcon />
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div style={styles.navDivider} />



        {/* Promo panel */}
        <div style={styles.promoCard}>
          <p style={styles.promoText}>Get Unlimited Access & More!</p>
          <button 
            style={styles.upgradeBtn} 
            onClick={() => navigate("/pricing")}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "1";
            }}
          >
            <DiamondIcon />
            <span>Upgrade Plan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
