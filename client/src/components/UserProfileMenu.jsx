import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import avatarPhoto from "../assets/avatar_photo.png";

/* ─── Icons ──────────────────────────────────────────────────────── */
const ProfileIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);
const NotificationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);
const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function UserProfileMenu({ user, onLogout, onClose }) {
  const navigate = useNavigate();
  const { theme, changeTheme } = useAuth();
  const [view, setView] = useState("main"); // "main" | "settings"
  const [notification, setNotification] = useState("Allow");
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [language, setLanguage] = useState("Eng");
  const [showThemeDrop, setShowThemeDrop] = useState(false);
  const [showLangDrop, setShowLangDrop] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown on clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  const handleProfileClick = () => {
    navigate("/profile");
    onClose();
  };

  return (
    <div ref={containerRef} style={styles.menuContainer}>
      
      {/* ── VIEW 1: MAIN USER MENU ── */}
      {view === "main" && (
        <div style={styles.card}>
          {/* User Info Header */}
          <div style={styles.userInfo}>
            <img src={avatarPhoto} alt="User Profile" style={styles.avatarImg} />
            <div style={styles.userText}>
              <h4 style={styles.userName}>{user?.name || "Your name"}</h4>
              <p style={styles.userEmail}>{user?.email || "yourname@gmail.com"}</p>
            </div>
          </div>

          <div style={styles.divider} />

          {/* Menu Items */}
          <div style={styles.menuList}>
            <button onClick={handleProfileClick} style={styles.menuItem}>
              <span style={styles.menuItemLeft}>
                <span style={styles.iconSpan}><ProfileIcon /></span>
                <span style={styles.itemLabel}>My Profile</span>
              </span>
              <span style={styles.chevronSpan}><ChevronRight /></span>
            </button>

            <button onClick={() => setView("settings")} style={styles.menuItem}>
              <span style={styles.menuItemLeft}>
                <span style={styles.iconSpan}><SettingsIcon /></span>
                <span style={styles.itemLabel}>Settings</span>
              </span>
              <span style={styles.chevronSpan}><ChevronRight /></span>
            </button>

            {/* Notification Row with Sub-Dropdown */}
            <div style={{ position: "relative" }}>
              <div style={styles.menuItemStatic}>
                <span style={styles.menuItemLeft}>
                  <span style={styles.iconSpan}><NotificationIcon /></span>
                  <span style={styles.itemLabel}>Notification</span>
                </span>
                <button 
                  onClick={() => setShowNotifDropdown(!showNotifDropdown)} 
                  style={styles.notifToggleBtn}
                >
                  {notification}
                </button>
              </div>

              {showNotifDropdown && (
                <div style={styles.subDropdown}>
                  <button 
                    onClick={() => { setNotification("Allow"); setShowNotifDropdown(false); }}
                    style={{ ...styles.subDropdownItem, color: notification === "Allow" ? "#1a6ff4" : "#475569", fontWeight: notification === "Allow" ? "600" : "500" }}
                  >
                    Allow
                  </button>
                  <button 
                    onClick={() => { setNotification("Mute"); setShowNotifDropdown(false); }}
                    style={{ ...styles.subDropdownItem, color: notification === "Mute" ? "#1a6ff4" : "#475569", fontWeight: notification === "Mute" ? "600" : "500" }}
                  >
                    Mute
                  </button>
                </div>
              )}
            </div>

            <button onClick={onLogout} style={{ ...styles.menuItem, borderTop: "1px solid #f1f5f9", marginTop: 6, paddingTop: 14 }}>
              <span style={styles.menuItemLeft}>
                <span style={{ ...styles.iconSpan, color: "#e11d48" }}><LogoutIcon /></span>
                <span style={{ ...styles.itemLabel, color: "#e11d48", fontWeight: "600" }}>Log Out</span>
              </span>
            </button>
          </div>
        </div>
      )}

      {/* ── VIEW 2: SETTINGS CARD ── */}
      {view === "settings" && (
        <div style={styles.card}>
          <div style={styles.settingsHeader}>
            <h3 style={styles.settingsTitle}>Settings</h3>
            <button onClick={() => setView("main")} style={styles.closeBtn} title="Back">
              <CloseIcon />
            </button>
          </div>

          <div style={styles.divider} />

          <div style={styles.settingsBody}>
            {/* Theme Row */}
            <div style={styles.settingsRow}>
              <span style={styles.settingLabel}>Theme</span>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowThemeDrop(!showThemeDrop)} style={styles.selectBtn}>
                  {theme} <span style={styles.arrowSpan}><ChevronDown /></span>
                </button>
                {showThemeDrop && (
                  <div style={styles.settingsDropdown}>
                    {["Light", "Dark"].map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => { changeTheme(opt); setShowThemeDrop(false); }}
                        style={{
                          ...styles.settingsDropdownItem,
                          color: theme === opt ? "#1a6ff4" : styles.settingsDropdownItem.color,
                          fontWeight: theme === opt ? "700" : "500",
                          background: theme === opt ? "var(--accent-blue-bg, #eff6ff)" : "none",
                        }}
                      >
                        {opt === "Light" ? "☀️ Light" : "🌙 Dark"}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Language Row */}
            <div style={styles.settingsRow}>
              <span style={styles.settingLabel}>Language</span>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowLangDrop(!showLangDrop)} style={styles.selectBtn}>
                  {language} <span style={styles.arrowSpan}><ChevronDown /></span>
                </button>
                {showLangDrop && (
                  <div style={styles.settingsDropdown}>
                    {["Eng", "Esp", "Fra", "Deu"].map((opt) => (
                      <button 
                        key={opt}
                        onClick={() => { setLanguage(opt); setShowLangDrop(false); }}
                        style={styles.settingsDropdownItem}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ─── Styles (uses CSS variables from index.css for dark/light theming) ── */
const styles = {
  menuContainer: {
    position: "absolute",
    top: 48,
    right: 0,
    zIndex: 9999,
    width: 300,
  },
  card: {
    background: "var(--bg-card, #ffffff)",
    borderRadius: 20,
    boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
    border: "1px solid var(--border-color, #e2e8f0)",
    padding: "24px 20px",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  userInfo: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  avatarImg: {
    width: 54,
    height: 54,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid var(--border-color, #e2e8f0)",
  },
  userText: {
    display: "flex",
    flexDirection: "column",
    gap: 2,
    overflow: "hidden",
  },
  userName: {
    margin: 0,
    fontSize: 15,
    fontWeight: 700,
    color: "var(--text-primary, #0f172a)",
    letterSpacing: "-0.2px",
  },
  userEmail: {
    margin: 0,
    fontSize: 12.5,
    color: "var(--text-muted, #64748b)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  divider: {
    height: 1,
    background: "var(--border-color, #e2e8f0)",
    margin: "12px 0 16px 0",
  },
  menuList: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  menuItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    background: "none",
    border: "none",
    padding: "11px 12px",
    borderRadius: 12,
    cursor: "pointer",
    textAlign: "left",
    transition: "background 0.15s, transform 0.1s",
    fontFamily: "inherit",
  },
  menuItemStatic: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "11px 12px",
    borderRadius: 12,
    fontFamily: "inherit",
  },
  menuItemLeft: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  iconSpan: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-muted, #64748b)",
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-secondary, #1e293b)",
  },
  chevronSpan: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-muted, #94a3b8)",
  },
  notifToggleBtn: {
    background: "none",
    border: "none",
    fontSize: 13.5,
    color: "var(--text-muted, #94a3b8)",
    fontWeight: 600,
    cursor: "pointer",
    padding: "2px 8px",
    borderRadius: 6,
    transition: "color 0.15s",
    fontFamily: "inherit",
  },
  subDropdown: {
    position: "absolute",
    right: 12,
    top: 36,
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "6px",
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 90,
  },
  subDropdownItem: {
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--text-secondary, #1e293b)",
    borderRadius: 8,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.1s",
  },

  /* Settings View styles */
  settingsHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  settingsTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: "var(--text-primary, #0f172a)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted, #94a3b8)",
    cursor: "pointer",
    padding: 4,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.15s, color 0.15s",
  },
  settingsBody: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    padding: "4px 0",
  },
  settingsRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "6px 0",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: 500,
    color: "var(--text-label, #334155)",
  },
  selectBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: "var(--bg-hover, #eff6ff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 600,
    color: "var(--accent-blue, #1a6ff4)",
    cursor: "pointer",
    padding: "5px 10px",
    fontFamily: "inherit",
    transition: "background 0.15s",
  },
  arrowSpan: {
    display: "flex",
    alignItems: "center",
    color: "var(--text-muted, #94a3b8)",
  },
  settingsDropdown: {
    position: "absolute",
    right: 0,
    top: 36,
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: 10,
    boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
    padding: "4px",
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    gap: 2,
    minWidth: 110,
  },
  settingsDropdownItem: {
    background: "none",
    border: "none",
    width: "100%",
    textAlign: "left",
    padding: "8px 12px",
    fontSize: 13,
    color: "var(--text-secondary, #334155)",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
    transition: "background 0.1s",
  },
};

// Add hover effect via JS or inline elements dynamically if needed, but styling provides standard appearance
