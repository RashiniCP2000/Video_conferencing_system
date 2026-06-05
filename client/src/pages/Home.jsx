import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "../components/UserProfileMenu.jsx";

/* ─── Icon helpers ─────────────────────────────────────────────── */
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

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);

const ExternalIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
  </svg>
);

const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z" />
  </svg>
);

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M7 10l5 5 5-5z" />
  </svg>
);

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
  </svg>
);

/* ─── Sidebar nav items ─────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings", external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Hub", external: true, badge: "New" },
  { label: "Notes", external: false, badge: null },
  { label: "Tasks", external: true, badge: null },
  { label: "Scheduler", external: true, badge: null },
  { label: "Calendar", external: false, badge: null },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const { user, logout, theme, changeTheme, setUserFromBootstrap } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState(null); // 'profile' | 'settings' | null
  const [meetings, setMeetings] = useState([]);

  // Settings view states
  const [settingsLanguage, setSettingsLanguage] = useState(() => localStorage.getItem("meetnova_lang") || "English (US)");
  const [settingsNotifs, setSettingsNotifs] = useState(() => {
    try {
      const saved = localStorage.getItem("meetnova_notifs");
      return saved ? JSON.parse(saved) : { emailAlerts: true, meetingReminders: true, soundAlerts: false };
    } catch {
      return { emailAlerts: true, meetingReminders: true, soundAlerts: false };
    }
  });

  // Profile edit form states
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileStatus, setProfileStatus] = useState({ type: null, message: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Sync profile form states when user context updates or sub-page changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfileEmail(user.email || "");
    }
  }, [user, activeSubPage]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meetnova_scheduled_meetings") || "[]");
      const now = new Date();
      const parseMeetingDateTime = (m) => {
        if (!m.date) return new Date(0);
        const timeStr = m.time || "00:00";
        return new Date(`${m.date}T${timeStr}`);
      };
      const upcoming = saved.filter((m) => parseMeetingDateTime(m) >= now).sort((a,b) => parseMeetingDateTime(a) - parseMeetingDateTime(b));
      setMeetings(upcoming);
    } catch (e) {
      console.error(e);
    }
  }, []);

  const PERSONAL_ID = "543 517 4501";

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleHostMeeting = async () => {
    try {
      const { data } = await api.post("/meetings", { title: `${user?.name || "User"}'s Instant Meeting` });
      navigate(`/meet/${data.meetingId}`);
    } catch (err) {
      console.error("Failed to host meeting:", err);
      alert("Could not start an instant meeting. Please try again.");
    }
  };

  const handleJoinMeeting = () => {
    const code = prompt("Enter meeting code (e.g. ABCD):");
    if (code && code.trim()) {
      navigate(`/meet/${code.trim().toUpperCase()}`);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(PERSONAL_ID.replace(/ /g, ""));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  const handleLanguageChange = (lang) => {
    setSettingsLanguage(lang);
    localStorage.setItem("meetnova_lang", lang);
  };

  const handleNotifToggle = (key) => {
    setSettingsNotifs((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem("meetnova_notifs", JSON.stringify(updated));
      return updated;
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileStatus({ type: null, message: "" });
    setIsSavingProfile(true);

    try {
      const { data } = await api.put("/auth/profile", {
        name: profileName,
        email: profileEmail,
      });
      setUserFromBootstrap(data.user);
      setProfileStatus({ type: "success", message: "Profile updated successfully!" });
      setTimeout(() => setProfileStatus({ type: null, message: "" }), 3000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update profile. Please try again.";
      setProfileStatus({ type: "error", message: msg });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const renderDashboard = () => (
    <>
      {/* Profile Card */}
      <div style={styles.profileCard}>
        {/* Avatar */}
        <div style={styles.profileAvatar}>
          {initials}
        </div>
        <div style={styles.profileInfo}>
          <h1 style={styles.profileName}>{user?.name || "User"}</h1>
          <p style={styles.profilePlan}>
            Plan:{" "}
            <a href="#" style={styles.planLink}>Workplace Basic</a>
          </p>
          <button onClick={() => navigate("/pricing")} style={styles.managePlanBtn}>Manage Plan</button>
          <a href="#" style={styles.viewPlanLink}>View Plan Details</a>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={styles.recentActivity}>
        <h2 style={styles.recentTitle}>Recent activity</h2>
        <div style={styles.emptyState}>
          {/* Box illustration */}
          <svg width="110" height="90" viewBox="0 0 110 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="38" width="80" height="48" rx="4" fill="#BFDBFE"/>
            <rect x="15" y="38" width="80" height="48" rx="4" fill="url(#boxGrad)"/>
            <path d="M15 38h80l-8-20H23L15 38z" fill="#60A5FA"/>
            <path d="M55 18v20" stroke="#BFDBFE" strokeWidth="2"/>
            <path d="M35 38l10-20" stroke="#93C5FD" strokeWidth="1.5"/>
            <path d="M75 38l-10-20" stroke="#93C5FD" strokeWidth="1.5"/>
            <path d="M15 38l40 12 40-12" stroke="#3B82F6" strokeWidth="1.5"/>
            <path d="M55 50v36" stroke="#3B82F6" strokeWidth="1.5"/>
            <rect x="38" y="24" width="34" height="8" rx="2" fill="#93C5FD"/>
            <defs>
              <linearGradient id="boxGrad" x1="15" y1="38" x2="95" y2="86" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DBEAFE"/>
                <stop offset="1" stopColor="#93C5FD"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </>
  );

  const renderSettings = () => (
    <div style={styles.settingsContainer}>
      <h2 style={styles.settingsSectionTitle}>Account Settings</h2>
      <p style={styles.settingsSectionDesc}>Manage your display theme, preferred language, and notification alerts.</p>
      
      {/* 1. Theme Setting */}
      <div style={styles.settingsGroup}>
        <h3 style={styles.settingsGroupTitle}>Appearance Theme</h3>
        <div style={styles.themeGrid}>
          {/* Light Theme Card */}
          <button 
            onClick={() => changeTheme("Light")}
            style={{
              ...styles.themeCard,
              borderColor: theme.toLowerCase() === "light" ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #e2e8f0)",
              background: theme.toLowerCase() === "light" ? "var(--bg-hover, #eff6ff)" : "var(--bg-card, #ffffff)",
            }}
          >
            <div style={{ ...styles.themeCardIcon, color: "#eab308" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </div>
            <div style={styles.themeCardText}>
              <span style={styles.themeCardLabel}>Light Mode</span>
              {theme.toLowerCase() === "light" && <span style={styles.checkmark}>✓ Active</span>}
            </div>
          </button>

          {/* Dark Theme Card */}
          <button 
            onClick={() => changeTheme("Dark")}
            style={{
              ...styles.themeCard,
              borderColor: theme.toLowerCase() === "dark" ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #e2e8f0)",
              background: theme.toLowerCase() === "dark" ? "var(--bg-hover, #eff6ff)" : "var(--bg-card, #ffffff)",
            }}
          >
            <div style={{ ...styles.themeCardIcon, color: "#a855f7" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="28" height="28">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </div>
            <div style={styles.themeCardText}>
              <span style={styles.themeCardLabel}>Dark Mode</span>
              {theme.toLowerCase() === "dark" && <span style={styles.checkmark}>✓ Active</span>}
            </div>
          </button>
        </div>
      </div>

      {/* 2. Language Setting */}
      <div style={styles.settingsGroup}>
        <h3 style={styles.settingsGroupTitle}>Language & Region</h3>
        <p style={styles.settingsGroupDesc}>Set your preferred language for the system interface.</p>
        <div style={{ position: "relative", maxWidth: "300px" }}>
          <select 
            value={settingsLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value)} 
            style={styles.settingsSelect}
          >
            <option value="English (US)">English (US)</option>
            <option value="Español">Español</option>
            <option value="Français">Français</option>
            <option value="Deutsch">Deutsch</option>
          </select>
        </div>
      </div>

      {/* 3. Notifications */}
      <div style={styles.settingsGroup}>
        <h3 style={styles.settingsGroupTitle}>Notifications Preferences</h3>
        <div style={styles.checkboxList}>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settingsNotifs.emailAlerts} 
              onChange={() => handleNotifToggle("emailAlerts")}
              style={styles.checkboxInput}
            />
            <span>Receive email notifications for scheduled meetings</span>
          </label>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settingsNotifs.meetingReminders} 
              onChange={() => handleNotifToggle("meetingReminders")}
              style={styles.checkboxInput}
            />
            <span>Show dashboard alert reminders 15 minutes before meetings</span>
          </label>
          <label style={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={settingsNotifs.soundAlerts} 
              onChange={() => handleNotifToggle("soundAlerts")}
              style={styles.checkboxInput}
            />
            <span>Enable sounds for new incoming participant requests</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div style={styles.settingsContainer}>
      <h2 style={styles.settingsSectionTitle}>My Profile</h2>
      <p style={styles.settingsSectionDesc}>Manage your profile details and view your subscription status.</p>

      {profileStatus.message && (
        <div style={{
          ...styles.alertBanner,
          background: profileStatus.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          borderColor: profileStatus.type === "success" ? "#10b981" : "#ef4444",
          color: profileStatus.type === "success" ? "#10b981" : "#ef4444"
        }}>
          {profileStatus.message}
        </div>
      )}

      <div style={styles.profileLayout}>
        {/* Left Form: Edit Details */}
        <form onSubmit={handleProfileSubmit} style={styles.profileForm}>
          <h3 style={styles.settingsGroupTitle}>Personal Details</h3>
          
          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Full Name</label>
            <input 
              type="text" 
              value={profileName} 
              onChange={(e) => setProfileName(e.target.value)} 
              required
              placeholder="Your full name"
              style={styles.formInput}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.formLabel}>Email Address</label>
            <input 
              type="email" 
              value={profileEmail} 
              onChange={(e) => setProfileEmail(e.target.value)} 
              required
              placeholder="yourname@domain.com"
              style={styles.formInput}
            />
          </div>

          <button 
            type="submit" 
            disabled={isSavingProfile}
            style={{
              ...styles.submitBtn,
              opacity: isSavingProfile ? 0.7 : 1,
              cursor: isSavingProfile ? "not-allowed" : "pointer"
            }}
          >
            {isSavingProfile ? "Saving changes..." : "Save Profile Details"}
          </button>
        </form>

        {/* Right Info: Account Metadata */}
        <div style={styles.profileInfoPanel}>
          <h3 style={styles.settingsGroupTitle}>Account Status</h3>
          <div style={styles.infoMetaCard}>
            <div style={styles.infoMetaRow}>
              <span style={styles.infoMetaLabel}>User Role</span>
              <span style={styles.infoMetaValue}>{user?.role?.toUpperCase() || "HOST"}</span>
            </div>
            <div style={styles.infoMetaRow}>
              <span style={styles.infoMetaLabel}>Current Plan</span>
              <span style={styles.infoMetaValue}>{user?.plan?.toUpperCase() || "FREE"}</span>
            </div>
            <div style={styles.infoMetaRow}>
              <span style={styles.infoMetaLabel}>Subscription</span>
              <span style={{
                ...styles.infoMetaValue,
                color: user?.subscriptionStatus === "active" ? "#10b981" : "var(--text-muted, #64748b)",
                fontWeight: "700"
              }}>
                {user?.subscriptionStatus?.toUpperCase() || "INACTIVE"}
              </span>
            </div>
            <div style={styles.infoMetaRow}>
              <span style={styles.infoMetaLabel}>Personal Meeting ID</span>
              <span style={styles.infoMetaValue}>{PERSONAL_ID}</span>
            </div>
          </div>
          
          <div style={{ marginTop: 20 }}>
            <button onClick={() => navigate("/pricing")} style={styles.managePlanBtn}>
              Change Subscription Plan
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  return (
    <div style={styles.root}>
      {/* ── Top Navigation ── */}
      <header style={styles.topNav}>
        <div style={styles.topNavLeft}>
          {/* MeetNova logo */}
          <span style={styles.logo}>MeetNova</span>
          <nav style={styles.navLinks}>
            {["Products", "Solutions", "Resources", "Plans & Pricing"].map((item) => (
              <button
                key={item}
                onClick={() => {
                  if (item === "Plans & Pricing") {
                    navigate("/pricing");
                  }
                }}
                style={styles.navLink}
              >
                {item}
              </button>
            ))}
          </nav>
        </div>

        <div style={styles.topNavRight}>
          <button onClick={() => navigate("/schedule")} style={styles.navLinkHighlight}>Schedule</button>
          <button onClick={handleJoinMeeting} style={styles.navLinkHighlight}>Join</button>
          <button onClick={handleHostMeeting} style={styles.navLinkHighlightDrop}>
            Host <ChevronDown />
          </button>
          <button style={styles.navLinkHighlightDrop}>
            Web App <ChevronDown />
          </button>

          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowProfileMenu((p) => !p)}
              style={styles.avatar}
              title={user?.name}
            >
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

      <div style={styles.bodyRow}>
        {/* ── Left Sidebar ── */}
        <aside style={styles.sidebar}>
          <div style={styles.sidebarInner}>
            {/* ── Home ── */}
            <button
              onClick={() => {
                setActiveSubPage(null);
                navigate("/");
              }}
              style={{
                ...styles.sidebarBtn,
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
                background: activeSubPage === null ? "var(--sidebar-active-bg, #eff6ff)" : "none",
                color: activeSubPage === null ? "var(--sidebar-active-color, #1a6ff4)" : "var(--sidebar-text, #1e293b)",
                fontWeight: activeSubPage === null ? "600" : "500",
              }}
            >
              <HomeIcon />
              <span>Home</span>
            </button>
            <div style={styles.sidebarDivider} />
            <p style={{ ...styles.sidebarGroupLabel, marginTop: 12 }}>My Products</p>
            <ul style={styles.sidebarList}>
              {sidebarItems.map((item) => (
                <li key={item.label} style={styles.sidebarItem}>
                  <button
                    onClick={() => {
                      if (item.label === "Recordings") {
                        navigate("/recordings");
                      } else if (item.label === "Meetings") {
                        navigate("/meetings");
                      } else if (item.label === "Calendar") {
                        navigate("/calendar");
                      } else if (item.label === "Scheduler") {
                        navigate("/schedule");
                      }
                    }}
                    style={{
                      ...styles.sidebarBtn,
                      background: "none",
                      color: "var(--sidebar-text, #1e293b)",
                      fontWeight: "500",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={styles.sidebarIcons}>
                      {item.badge && (
                        <span style={styles.newBadge}>{item.badge}</span>
                      )}
                      {item.external && (
                        <span style={styles.externalIcon}><ExternalIcon /></span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {/* Divider */}
            <div style={styles.sidebarDivider} />

            {/* My Account */}
            <button
              style={styles.sidebarCollapsible}
              onClick={() => setMyAccountOpen((p) => !p)}
            >
              <span style={{ transition: "transform 0.2s", display: "inline-flex", transform: myAccountOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
                <ChevronRight />
              </span>
              <span>My Account</span>
            </button>
            {myAccountOpen && (
              <ul style={styles.subMenu}>
                <li>
                  <button
                    style={styles.subMenuItem}
                    onClick={() => navigate("/profile")}
                  >
                    Profile
                  </button>
                </li>
                <li>
                  <button
                    style={{
                      ...styles.subMenuItem,
                      ...(activeSubPage === "settings" ? styles.subMenuItemActive : {}),
                    }}
                    onClick={() => setActiveSubPage("settings")}
                  >
                    Settings
                  </button>
                </li>
              </ul>
            )}

            {/* Admin */}
            {user?.role === "admin" && (
              <button
                style={styles.sidebarCollapsible}
                onClick={() => navigate("/admin")}
              >
                <ChevronRight />
                <span>Admin</span>
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main style={styles.main}>
          {activeSubPage === "settings" ? (
            renderSettings()
          ) : activeSubPage === "profile" ? (
            renderProfile()
          ) : (
            renderDashboard()
          )}
        </main>

        {/* ── Right Panel ── */}
        <aside style={styles.rightPanel}>
          {/* Schedule / Join / Host */}
          <div style={styles.actionCard}>
            <div style={styles.actionButtons}>
              <div style={styles.actionItem}>
                <button onClick={() => navigate("/schedule")} style={{ ...styles.actionBtn, background: "#2563EB" }}>
                  <CalendarIcon />
                </button>
                <span style={styles.actionLabel}>Schedule</span>
              </div>
              <div style={styles.actionItem}>
                <button onClick={handleJoinMeeting} style={{ ...styles.actionBtn, background: "#2563EB" }}>
                  <PlusIcon />
                </button>
                <span style={styles.actionLabel}>Join</span>
              </div>
              <div style={styles.actionItem}>
                <button onClick={handleHostMeeting} style={{ ...styles.actionBtn, background: "#EA580C" }}>
                  <VideoIcon />
                </button>
                <span style={styles.actionLabel}>Host</span>
              </div>
            </div>

            {/* Personal Meeting ID */}
            <div style={styles.meetingIdSection}>
              <p style={styles.meetingIdTitle}>Personal Meeting ID</p>
              <div style={styles.meetingIdRow}>
                <span style={styles.meetingIdNumber}>{PERSONAL_ID}</span>
                <button
                  style={styles.copyBtn}
                  onClick={handleCopyId}
                  title="Copy ID"
                >
                  {copiedId ? "✓" : <CopyIcon />}
                </button>
              </div>
            </div>
          </div>

          {/* Meetings Card */}
          <div style={styles.meetingsCard}>
            <div style={styles.meetingsCardHeader}>
              <span style={styles.meetingsCardTitle}>Meetings</span>
              <button onClick={() => navigate("/meetings")} style={{ ...styles.visitLink, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>Visit Meetings</button>
            </div>
            {meetings.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 180, overflowY: "auto", marginBottom: 12 }}>
                {meetings.slice(0, 3).map((m) => (
                  <div key={m.meetingId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-primary, #f8fafc)", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border-color, #e2e8f0)" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{m.topic}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted, #64748b)" }}>{m.date} at {m.time}</span>
                    </div>
                    <button onClick={() => navigate("/meetings/upcoming")} style={{ background: "var(--accent-blue, #1a6ff4)", color: "#fff", border: "none", borderRadius: 4, padding: "4px 8px", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                      View
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={styles.noMeetings}>
                <span style={styles.noMeetingsText}>No Upcoming Meetings</span>
              </div>
            )}
            <button style={styles.testAvBtn}>Test Audio and Video</button>
          </div>
        </aside>
      </div>

      {/* ── Floating Chat Button ── */}
      <button style={styles.chatFab} title="Support chat">
        <ChatIcon />
      </button>
    </div>
  );
}

/* ─── Styles ────────────────────────────────────────────────────── */
const styles = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "var(--bg-primary, #f8fafc)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "var(--text-secondary, #1e293b)",
    position: "relative",
  },

  /* Top Nav */
  topNav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: "56px",
    padding: "0 24px",
    background: "var(--nav-bg, #ffffff)",
    borderBottom: "1px solid var(--nav-border, #e2e8f0)",
    position: "sticky",
    top: 0,
    zIndex: 100,
  },
  topNavLeft: {
    display: "flex",
    alignItems: "center",
    gap: "32px",
  },
  logo: {
    fontSize: "28px",
    fontWeight: "800",
    color: "var(--accent-blue, #1a6ff4)",
    letterSpacing: "-1px",
    fontStyle: "italic",
  },
  navLinks: {
    display: "flex",
    gap: "24px",
  },
  navLink: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--text-nav, #374151)",
    padding: "4px 0",
    fontWeight: "500",
    fontFamily: "inherit",
  },
  topNavRight: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  navLinkHighlight: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: "600",
    padding: "4px 0",
    fontFamily: "inherit",
  },
  navLinkHighlightDrop: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    padding: "4px 0",
    fontFamily: "inherit",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
    color: "#fff",
    fontWeight: "700",
    fontSize: "15px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  profileMenu: {
    position: "absolute",
    right: 0,
    top: "44px",
    width: "200px",
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "10px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
    overflow: "hidden",
    zIndex: 200,
  },
  profileMenuHeader: {
    padding: "12px 16px",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
  },
  profileMenuName: {
    margin: 0,
    fontWeight: "700",
    fontSize: "14px",
    color: "var(--text-primary, #0f172a)",
  },
  profileMenuEmail: {
    margin: "2px 0 0",
    fontSize: "12px",
    color: "var(--text-muted, #64748b)",
  },
  profileMenuItem: {
    display: "block",
    width: "100%",
    padding: "10px 16px",
    textAlign: "left",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--text-nav, #374151)",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },

  /* Body Row */
  bodyRow: {
    display: "flex",
    flex: 1,
    minHeight: 0,
  },

  /* Sidebar */
  sidebar: {
    width: "210px",
    minWidth: "210px",
    background: "var(--bg-sidebar, #fff)",
    borderRight: "1px solid var(--border-color, #e2e8f0)",
    overflowY: "auto",
  },
  sidebarInner: {
    padding: "20px 0 16px",
  },
  sidebarGroupLabel: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--text-muted, #94a3b8)",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    padding: "0 18px",
    margin: "0 0 8px",
  },
  sidebarList: {
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  sidebarItem: {
    margin: 0,
  },
  sidebarBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 18px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--sidebar-text, #1e293b)",
    fontWeight: "500",
    textAlign: "left",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
  sidebarIcons: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  newBadge: {
    fontSize: "10px",
    fontWeight: "700",
    background: "var(--badge-bg, #10b981)",
    color: "var(--badge-text, #fff)",
    borderRadius: "4px",
    padding: "1px 5px",
    lineHeight: "1.5",
  },
  externalIcon: {
    color: "var(--text-muted, #94a3b8)",
    display: "flex",
    alignItems: "center",
  },
  sidebarDivider: {
    height: "1px",
    background: "var(--border-color, #e2e8f0)",
    margin: "12px 18px",
  },
  sidebarCollapsible: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    width: "100%",
    padding: "9px 18px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    color: "var(--text-nav, #374151)",
    fontWeight: "500",
    textAlign: "left",
    fontFamily: "inherit",
  },
  subMenu: {
    listStyle: "none",
    margin: "0",
    padding: "0 0 4px 0",
  },
  subMenuItem: {
    display: "block",
    width: "100%",
    padding: "8px 18px 8px 40px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    color: "var(--text-muted, #475569)",
    fontWeight: "500",
    textAlign: "left",
    transition: "background 0.15s, color 0.15s",
    fontFamily: "inherit",
  },
  subMenuItemActive: {
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: "600",
    background: "var(--sidebar-active-bg, #eff6ff)",
  },

  /* Main */
  main: {
    flex: 1,
    padding: "32px 36px",
    overflowY: "auto",
    background: "var(--bg-secondary, #ffffff)",
  },

  /* Profile Card */
  profileCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: "20px",
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    padding: "28px 32px",
    marginBottom: "28px",
    maxWidth: "680px",
  },
  profileAvatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #60a5fa, #1d4ed8)",
    color: "#fff",
    fontSize: "32px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: "3px solid var(--border-color, #e0f2fe)",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    margin: "0 0 4px",
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-primary, #0f172a)",
  },
  profilePlan: {
    margin: "0 0 18px",
    fontSize: "14px",
    color: "var(--text-muted, #475569)",
  },
  planLink: {
    color: "var(--accent-blue, #1a6ff4)",
    textDecoration: "none",
    fontWeight: "600",
  },
  managePlanBtn: {
    display: "block",
    width: "100%",
    maxWidth: "380px",
    padding: "10px",
    border: "1px solid var(--border-input, #cbd5e1)",
    borderRadius: "8px",
    background: "var(--btn-outline-bg, #fff)",
    color: "var(--text-primary, #0f172a)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    marginBottom: "12px",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },
  viewPlanLink: {
    color: "var(--accent-blue, #1a6ff4)",
    fontSize: "14px",
    fontWeight: "600",
    textDecoration: "none",
  },

  /* Recent Activity */
  recentActivity: {
    maxWidth: "680px",
  },
  recentTitle: {
    fontSize: "22px",
    fontWeight: "700",
    color: "var(--text-primary, #0f172a)",
    margin: "0 0 20px",
  },
  emptyState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "220px",
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
  },

  /* Right Panel */
  rightPanel: {
    width: "260px",
    minWidth: "260px",
    padding: "28px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    background: "var(--bg-primary, #f8fafc)",
    borderLeft: "1px solid var(--border-color, #e2e8f0)",
  },

  /* Action Card */
  actionCard: {
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    padding: "20px",
  },
  actionButtons: {
    display: "flex",
    justifyContent: "space-around",
    marginBottom: "20px",
  },
  actionItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  actionBtn: {
    width: "56px",
    height: "56px",
    borderRadius: "14px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  actionLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-nav, #374151)",
  },

  /* Meeting ID */
  meetingIdSection: {
    borderTop: "1px solid var(--border-color, #e2e8f0)",
    paddingTop: "16px",
    textAlign: "center",
  },
  meetingIdTitle: {
    margin: "0 0 6px",
    fontSize: "13px",
    fontWeight: "700",
    color: "var(--text-primary, #0f172a)",
  },
  meetingIdRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  meetingIdNumber: {
    fontSize: "15px",
    fontWeight: "600",
    color: "var(--text-secondary, #1e293b)",
    letterSpacing: "0.04em",
  },
  copyBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted, #64748b)",
    display: "flex",
    alignItems: "center",
    padding: "4px",
    borderRadius: "4px",
    transition: "background 0.15s",
    fontSize: "13px",
    fontWeight: "700",
  },

  /* Meetings Card */
  meetingsCard: {
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    padding: "18px 20px",
  },
  meetingsCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "12px",
  },
  meetingsCardTitle: {
    fontWeight: "700",
    fontSize: "15px",
    color: "var(--text-primary, #0f172a)",
  },
  visitLink: {
    fontSize: "13px",
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: "600",
    textDecoration: "none",
  },
  noMeetings: {
    background: "var(--bg-input, #f8fafc)",
    borderRadius: "8px",
    padding: "12px",
    marginBottom: "12px",
    textAlign: "center",
  },
  noMeetingsText: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-nav, #374151)",
  },
  testAvBtn: {
    width: "100%",
    padding: "9px",
    border: "1px solid var(--border-input, #cbd5e1)",
    borderRadius: "8px",
    background: "var(--btn-outline-bg, #fff)",
    color: "var(--btn-outline-text, #374151)",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer",
    transition: "background 0.15s",
    fontFamily: "inherit",
  },

  /* Floating Chat Button */
  chatFab: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    width: "52px",
    height: "52px",
    borderRadius: "50%",
    background: "#1a6ff4",
    color: "#fff",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 16px rgba(26,111,244,0.4)",
    zIndex: 300,
    transition: "transform 0.2s, box-shadow 0.2s",
  },

  /* Settings Page styles */
  settingsContainer: {
    maxWidth: "800px",
    fontFamily: "'Inter', sans-serif",
  },
  settingsSectionTitle: {
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--text-primary, #0f172a)",
    margin: "0 0 6px 0",
    letterSpacing: "-0.5px",
  },
  settingsSectionDesc: {
    fontSize: "14px",
    color: "var(--text-muted, #64748b)",
    margin: "0 0 32px 0",
  },
  settingsGroup: {
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
  },
  settingsGroupTitle: {
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary, #0f172a)",
    margin: "0 0 6px 0",
  },
  settingsGroupDesc: {
    fontSize: "13.5px",
    color: "var(--text-muted, #64748b)",
    margin: "0 0 16px 0",
  },
  themeGrid: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "16px",
  },
  themeCard: {
    flex: "1 1 200px",
    maxWidth: "300px",
    border: "2px solid",
    borderRadius: "12px",
    padding: "20px",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    transition: "border-color 0.2s, background-color 0.2s, transform 0.15s",
    fontFamily: "inherit",
    textAlign: "center",
    outline: "none",
  },
  themeCardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  themeCardText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },
  themeCardLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary, #0f172a)",
  },
  checkmark: {
    fontSize: "11px",
    fontWeight: "700",
    color: "var(--accent-blue, #1a6ff4)",
  },
  settingsSelect: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-input, #cbd5e1)",
    backgroundColor: "var(--input-bg, #ffffff)",
    color: "var(--input-text, #1e293b)",
    fontSize: "14px",
    fontWeight: "500",
    cursor: "pointer",
    fontFamily: "inherit",
    outline: "none",
  },
  checkboxList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "12px",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "14px",
    color: "var(--text-secondary, #1e293b)",
    cursor: "pointer",
    userSelect: "none",
  },
  checkboxInput: {
    width: "16px",
    height: "16px",
    cursor: "pointer",
    accentColor: "var(--accent-blue, #1a6ff4)",
  },
  alertBanner: {
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "24px",
    display: "flex",
    alignItems: "center",
  },
  profileLayout: {
    display: "flex",
    flexWrap: "wrap",
    gap: "24px",
    alignItems: "start",
  },
  profileForm: {
    flex: "1 1 350px",
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  formLabel: {
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--text-label, #334155)",
  },
  formInput: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-input, #cbd5e1)",
    backgroundColor: "var(--input-bg, #ffffff)",
    color: "var(--input-text, #1e293b)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    transition: "border-color 0.15s",
  },
  submitBtn: {
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--accent-blue, #1a6ff4)",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "14px",
    transition: "background-color 0.15s, opacity 0.15s",
    fontFamily: "inherit",
  },
  profileInfoPanel: {
    flex: "1 1 300px",
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
  },
  infoMetaCard: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
    marginTop: "16px",
  },
  infoMetaRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: "10px",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
  },
  infoMetaLabel: {
    fontSize: "13.5px",
    color: "var(--text-muted, #64748b)",
    fontWeight: "500",
  },
  infoMetaValue: {
    fontSize: "13.5px",
    color: "var(--text-primary, #0f172a)",
    fontWeight: "600",
  },
};
