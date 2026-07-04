import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "../components/UserProfileMenu.jsx";
import Sidebar from "../components/Sidebar.jsx";
import TopNav from "../components/TopNav.jsx";
import JoinMeetingModal from "../components/JoinMeetingModal.jsx";
import { getUserStorageKey } from "../utils/userStorage.js";

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
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes", external: false, badge: null },
  { label: "Tasks", external: true, badge: null },
  { label: "Scheduler", external: true, badge: null },
  { label: "Calendar", external: false, badge: null },
];

/* ─── Component ─────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, theme, changeTheme, setUserFromBootstrap } = useAuth();

  // ── ALL hooks must be declared before any conditional return ──
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [myAccountOpen, setMyAccountOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [activeSubPage, setActiveSubPage] = useState(null); // 'profile' | 'settings' | null
  const [meetings, setMeetings] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [loadingRecordings, setLoadingRecordings] = useState(true);

  // ── AV Test modal state ──
  const [avOpen, setAvOpen] = useState(false);
  const [avStream, setAvStream] = useState(null);
  const [avCameras, setAvCameras] = useState([]);
  const [avMics, setAvMics] = useState([]);
  const [avSpeakers, setAvSpeakers] = useState([]);
  const [avSelectedCam, setAvSelectedCam] = useState("");
  const [avSelectedMic, setAvSelectedMic] = useState("");
  const [avSelectedSpk, setAvSelectedSpk] = useState("");
  const [avVolume, setAvVolume] = useState(0);
  const [avCamOff, setAvCamOff] = useState(false);
  const [avMicOff, setAvMicOff] = useState(false);
  const [avError, setAvError] = useState("");
  const [avSpeakerPlaying, setAvSpeakerPlaying] = useState(false);
  const avVideoRef = useRef(null);
  const avStreamRef = useRef(null);
  const avAnalyserRef = useRef(null);
  const avRafRef = useRef(null);

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

  // Sync subpage state with router navigation state
  useEffect(() => {
    if (location.state && location.state.activeSubPage !== undefined) {
      setActiveSubPage(location.state.activeSubPage);
    }
  }, [location]);

  // Load dashboard data (meetings, tasks, recordings)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const meetingsKey = getUserStorageKey(user, "meetnova_scheduled_meetings");
    const tasksKey = getUserStorageKey(user, "meetnova_tasks");

    // 1. Scheduled meetings
    try {
      const saved = JSON.parse(localStorage.getItem(meetingsKey) || "[]");
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

    // 2. Tasks
    try {
      const savedTasks = JSON.parse(localStorage.getItem(tasksKey) || "[]");
      setTasks(savedTasks);
    } catch (e) {
      console.error(e);
    }

    // 3. Recordings
    setLoadingRecordings(true);
    api.get("/recordings")
      .then(({ data }) => {
        setRecordings(data.recordings || []);
      })
      .catch((err) => {
        console.error("Failed to load recordings", err);
      })
      .finally(() => {
        setLoadingRecordings(false);
      });
  }, [isAuthenticated, user, activeSubPage]);

  // ── Conditional render AFTER all hooks ──
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

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
    setJoinOpen(true);
  };

  const handleJoinConfirm = (code) => {
    setJoinOpen(false);
    navigate(`/meet/${code}`);
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

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(t => {
      if (t.id === taskId) {
        const newStatus = t.status === "completed" ? "todo" : "completed";
        return { ...t, status: newStatus };
      }
      return t;
    });
    setTasks(updated);
    localStorage.setItem(getUserStorageKey(user, "meetnova_tasks"), JSON.stringify(updated));
  };

  const renderDashboard = () => {
    const firstName = user?.name ? user.name.split(" ")[0] : "User";
    const pendingTasksCount = tasks.filter(t => t.status !== "completed").length;
    const upcomingMeetingsCount = meetings.length;

    return (
      <>
        {/* Welcome Section */}
        <div style={styles.welcomeCard}>
          <div style={styles.welcomeLeft}>
            <div style={styles.largeAvatar}>
              {initials}
            </div>
            <div style={styles.welcomeTextGroup}>
              <h1 style={styles.welcomeTitle}>Hello, {firstName}! 👋</h1>
              <p style={styles.welcomeSubtitle}>
                Welcome back to MeetNova. You have <strong style={{color: "var(--accent-blue)"}}>{upcomingMeetingsCount}</strong> upcoming meetings, <strong style={{color: "#ef4444"}}>{pendingTasksCount}</strong> pending tasks, and <strong style={{color: "#10b981"}}>{recordings.length}</strong> recordings available in your cloud library.
              </p>
              <div style={styles.planBadge}>
                <span style={styles.planBadgeText}>Plan: {user?.plan || "Workplace Basic"}</span>
              </div>
            </div>
          </div>
          <div style={styles.welcomeRight}>
            <button onClick={() => navigate("/pricing")} style={styles.welcomePrimaryBtn}>Upgrade Plan</button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{upcomingMeetingsCount}</span>
              <span style={styles.statLabel}>Scheduled Meetings</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: "rgba(239, 68, 68, 0.1)", color: "#ef4444" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{pendingTasksCount}</span>
              <span style={styles.statLabel}>Pending Tasks</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: "rgba(16, 185, 129, 0.1)", color: "#10b981" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <path d="M23 7l-7 5 7 5V7z" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{recordings.length}</span>
              <span style={styles.statLabel}>Cloud Recordings</span>
            </div>
          </div>

          <div style={styles.statCard}>
            <div style={{ ...styles.statIconContainer, background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b" }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div style={styles.statInfo}>
              <span style={styles.statValue}>{(meetings.length * 0.75).toFixed(1)}h</span>
              <span style={styles.statLabel}>Meeting Hours</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content Grid */}
        <div style={styles.dashboardGrid}>
          <div style={styles.gridLeftCol}>
            {/* Checklist Widget */}
            <div style={styles.widgetCard}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>Active Tasks Checklist</h3>
                <button onClick={() => navigate("/tasks")} style={styles.widgetActionLink}>Manage Tasks</button>
              </div>
              <div style={styles.widgetContent}>
                {tasks.length > 0 ? (
                  <div style={styles.taskList}>
                    {tasks.slice(0, 4).map((task) => {
                      const isCompleted = task.status === "completed";
                      const priorityColor = task.priority === "high" ? "#ef4444" : task.priority === "medium" ? "#f59e0b" : "#10b981";
                      const priorityBg = task.priority === "high" ? "rgba(239, 68, 68, 0.1)" : task.priority === "medium" ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)";
                      return (
                        <div key={task.id} style={{ ...styles.taskRow, opacity: isCompleted ? 0.6 : 1 }}>
                          <button
                            onClick={() => handleToggleTask(task.id)}
                            style={{
                              ...styles.taskCheckbox,
                              borderColor: isCompleted ? "#10b981" : "var(--border-input)",
                              background: isCompleted ? "#10b981" : "transparent"
                            }}
                          >
                            {isCompleted && (
                              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" width="10" height="10">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </button>
                          <div style={styles.taskDetails}>
                            <span style={{
                              ...styles.taskNameText,
                              textDecoration: isCompleted ? "line-through" : "none"
                            }}>
                              {task.title}
                            </span>
                            <div style={styles.taskMetaRow}>
                              <span style={{ ...styles.priorityTag, color: priorityColor, background: priorityBg }}>
                                {task.priority?.toUpperCase()}
                              </span>
                              {task.dueDate && (
                                <span style={styles.taskDueDateText}>
                                  📅 Due {task.dueDate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={styles.emptyWidgetState}>
                    <p style={styles.emptyWidgetText}>No pending tasks found.</p>
                    <button onClick={() => navigate("/tasks")} style={styles.widgetPrimaryBtn}>Create a Task</button>
                  </div>
                )}
              </div>
            </div>

            {/* Recordings Widget */}
            <div style={styles.widgetCard}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>Recent Recordings</h3>
                <button onClick={() => navigate("/recordings")} style={styles.widgetActionLink}>Library</button>
              </div>
              <div style={styles.widgetContent}>
                {loadingRecordings ? (
                  <div style={styles.emptyWidgetState}>
                    <p style={styles.emptyWidgetText}>Loading recordings...</p>
                  </div>
                ) : recordings.length > 0 ? (
                  <div style={styles.recordingsList}>
                    {recordings.slice(0, 3).map((rec) => (
                      <div key={rec._id || rec.id} style={styles.recordingRow}>
                        <div style={styles.recordingIconWrapper}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                            <path d="M23 7l-7 5 7 5V7z" />
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                          </svg>
                        </div>
                        <div style={styles.recordingDetails}>
                          <span style={styles.recordingNameText}>{rec.topic || rec.meetingTitle || "Recorded Meeting"}</span>
                          <span style={styles.recordingMetaText}>{rec.date || "Today"} · {rec.duration || "N/A"}</span>
                        </div>
                        <button
                          onClick={() => navigate("/recordings")}
                          style={styles.recordingPlayBtn}
                          title="View recording"
                        >
                          Play
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={styles.emptyWidgetState}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: 8 }}>
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <p style={styles.emptyWidgetText}>No recordings available.</p>
                    <span style={styles.emptyWidgetSubtext}>Host a meeting and hit record to see files here.</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={styles.gridRightCol}>
            {/* Activity Feed Widget */}
            <div style={styles.widgetCard}>
              <div style={styles.widgetHeader}>
                <h3 style={styles.widgetTitle}>Activity Feed</h3>
              </div>
              <div style={styles.widgetContent}>
                <div style={styles.timelineList}>
                  <div style={styles.timelineRow}>
                    <span style={styles.timelineDot} />
                    <div style={styles.timelineContent}>
                      <p style={styles.timelineText}>Joined MeetNova Platform</p>
                      <span style={styles.timelineTime}>System event</span>
                    </div>
                  </div>
                  {meetings.length > 0 && (
                    <div style={styles.timelineRow}>
                      <span style={{ ...styles.timelineDot, background: "#3b82f6" }} />
                      <div style={styles.timelineContent}>
                        <p style={styles.timelineText}>Scheduled meeting: <strong>{meetings[0].topic}</strong></p>
                        <span style={styles.timelineTime}>Recently</span>
                      </div>
                    </div>
                  )}
                  {tasks.length > 0 && (
                    <div style={styles.timelineRow}>
                      <span style={{ ...styles.timelineDot, background: "#f59e0b" }} />
                      <div style={styles.timelineContent}>
                        <p style={styles.timelineText}>Synchronized task list from storage</p>
                        <span style={styles.timelineTime}>Active sync</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

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

  /* ─── AV Test helpers ─────────────────────────────────────────── */
  const stopAvStream = () => {
    cancelAnimationFrame(avRafRef.current);
    if (avStreamRef.current) {
      avStreamRef.current.getTracks().forEach(t => t.stop());
      avStreamRef.current = null;
    }
  };

  const startVolumeMeter = (stream) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      src.connect(analyser);
      avAnalyserRef.current = analyser;
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAvVolume(Math.min(100, Math.round((avg / 128) * 100)));
        avRafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.warn("AudioContext not available", e);
    }
  };

  const openAvTest = async () => {
    setAvOpen(true);
    setAvError("");
    setAvCamOff(false);
    setAvMicOff(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      avStreamRef.current = stream;
      setAvStream(stream);
      // Attach to video element
      setTimeout(() => {
        if (avVideoRef.current) avVideoRef.current.srcObject = stream;
      }, 100);
      // Enumerate devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cams = devices.filter(d => d.kind === "videoinput");
      const mics = devices.filter(d => d.kind === "audioinput");
      const spks = devices.filter(d => d.kind === "audiooutput");
      setAvCameras(cams);
      setAvMics(mics);
      setAvSpeakers(spks);
      const vidTrack = stream.getVideoTracks()[0];
      const audTrack = stream.getAudioTracks()[0];
      if (vidTrack) setAvSelectedCam(vidTrack.getSettings().deviceId || (cams[0]?.deviceId ?? ""));
      if (audTrack) setAvSelectedMic(audTrack.getSettings().deviceId || (mics[0]?.deviceId ?? ""));
      if (spks.length > 0) setAvSelectedSpk(spks[0].deviceId);
      startVolumeMeter(stream);
    } catch (err) {
      console.error(err);
      setAvError("⚠️ Could not access camera/microphone. Please allow permissions in your browser.");
    }
  };

  const closeAvTest = () => {
    stopAvStream();
    setAvOpen(false);
    setAvStream(null);
    setAvVolume(0);
    setAvCamOff(false);
    setAvMicOff(false);
    setAvError("");
    setAvSpeakerPlaying(false);
  };

  const toggleAvCam = () => {
    const stream = avStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach(t => { t.enabled = avCamOff; });
    setAvCamOff(v => !v);
  };

  const toggleAvMic = () => {
    const stream = avStreamRef.current;
    if (!stream) return;
    stream.getAudioTracks().forEach(t => { t.enabled = avMicOff; });
    setAvMicOff(v => !v);
  };

  const switchCamera = async (deviceId) => {
    setAvSelectedCam(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: avSelectedMic ? { deviceId: { exact: avSelectedMic } } : true });
      stopAvStream();
      avStreamRef.current = newStream;
      setAvStream(newStream);
      if (avVideoRef.current) avVideoRef.current.srcObject = newStream;
      startVolumeMeter(newStream);
    } catch (e) {
      setAvError("Could not switch camera: " + e.message);
    }
  };

  const switchMic = async (deviceId) => {
    setAvSelectedMic(deviceId);
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: avSelectedCam ? { deviceId: { exact: avSelectedCam } } : true, audio: { deviceId: { exact: deviceId } } });
      stopAvStream();
      avStreamRef.current = newStream;
      setAvStream(newStream);
      if (avVideoRef.current) avVideoRef.current.srcObject = newStream;
      startVolumeMeter(newStream);
    } catch (e) {
      setAvError("Could not switch microphone: " + e.message);
    }
  };

  const testSpeaker = () => {
    if (avSpeakerPlaying) return;
    setAvSpeakerPlaying(true);
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 1.5);
    osc.onended = () => { setAvSpeakerPlaying(false); ctx.close(); };
  };

  /* ─── AV Modal styles ─────────────────────────────────────────── */
  const avStyles = {
    overlay: {
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    modal: {
      background: "var(--bg-card, #ffffff)", borderRadius: "20px",
      boxShadow: "0 24px 60px rgba(0,0,0,0.18)", width: "min(520px, 95vw)",
      padding: "0", overflow: "hidden",
      border: "1px solid var(--border-color, #e2e8f0)",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 22px", borderBottom: "1px solid var(--border-color, #e2e8f0)",
      background: "var(--bg-secondary, #f8fafc)",
    },
    headerTitle: { fontSize: "16px", fontWeight: "700", color: "var(--text-primary, #0f172a)" },
    closeBtn: {
      background: "none", border: "none", cursor: "pointer",
      fontSize: "18px", color: "var(--text-muted, #64748b)",
      width: "32px", height: "32px", borderRadius: "8px", display: "flex",
      alignItems: "center", justifyContent: "center",
    },
    errorBanner: {
      margin: "14px 22px 0", padding: "10px 14px", borderRadius: "10px",
      background: "rgba(239,68,68,0.1)", color: "#ef4444",
      fontSize: "13px", border: "1px solid rgba(239,68,68,0.2)",
    },
    videoWrap: {
      position: "relative", background: "#0f172a", aspectRatio: "16/9",
      margin: "16px 22px", borderRadius: "14px", overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
    },
    video: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "14px", transform: "scaleX(-1)" },
    camOff: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
    videoControls: {
      position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
      display: "flex", gap: "10px",
    },
    ctrl: {
      width: "40px", height: "40px", borderRadius: "50%", border: "none", cursor: "pointer",
      background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)",
      color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.2s",
    },
    ctrlOff: { background: "#ef4444" },
    section: { padding: "0 22px 16px" },
    label: { fontSize: "11.5px", fontWeight: "600", color: "var(--text-muted, #64748b)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "6px", display: "block" },
    meterBar: { height: "10px", borderRadius: "99px", background: "var(--bg-hover, #f1f5f9)", overflow: "hidden", marginTop: "6px" },
    meterFill: { height: "100%", borderRadius: "99px", transition: "width 0.08s ease, background 0.3s" },
    devicesGrid: { padding: "0 22px 4px", display: "flex", flexDirection: "column", gap: "12px" },
    deviceRow: { display: "flex", flexDirection: "column", gap: "4px" },
    select: {
      width: "100%", padding: "8px 12px", borderRadius: "10px",
      border: "1px solid var(--border-color, #e2e8f0)", fontSize: "13px",
      background: "var(--bg-secondary, #f8fafc)", color: "var(--text-primary, #0f172a)",
      outline: "none", cursor: "pointer",
    },
    testSpkBtn: {
      padding: "8px 18px", borderRadius: "10px", border: "1px solid var(--border-color, #e2e8f0)",
      background: "var(--bg-secondary, #f8fafc)", color: "var(--text-primary, #0f172a)",
      fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
    },
    testSpkBtnActive: { background: "rgba(26,111,244,0.1)", color: "var(--accent-blue, #1a6ff4)", borderColor: "var(--accent-blue, #1a6ff4)" },
    footer: {
      padding: "14px 22px 20px", display: "flex", justifyContent: "flex-end",
      borderTop: "1px solid var(--border-color, #e2e8f0)", background: "var(--bg-secondary, #f8fafc)",
    },
    doneBtn: {
      padding: "9px 28px", borderRadius: "12px", border: "none",
      background: "var(--accent-blue, #1a6ff4)", color: "#ffffff",
      fontSize: "14px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit",
    },
  };

  return (
    <div style={styles.root}>
      {/* ── Top Navigation ── */}
      <TopNav />

      <div style={styles.bodyRow}>
        {/* ── Left Sidebar ── */}
        <Sidebar activeTab="Home" activeSubPage={activeSubPage} onSubPageChange={setActiveSubPage} />

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
            <button style={styles.testAvBtn} onClick={openAvTest}>Test Audio and Video</button>
          </div>
        </aside>
      </div>

      {/* ── Floating Chat Button ── */}
      <button style={styles.chatFab} title="Support chat">
        <ChatIcon />
      </button>

      {/* ── AV Test Modal ── */}
      {avOpen && (
        <div style={avStyles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeAvTest(); }}>
          <div style={avStyles.modal}>
            {/* Header */}
            <div style={avStyles.header}>
              <span style={avStyles.headerTitle}>🎙️ Test Audio &amp; Video</span>
              <button style={avStyles.closeBtn} onClick={closeAvTest}>✕</button>
            </div>

            {avError && <div style={avStyles.errorBanner}>{avError}</div>}

            {/* Camera preview */}
            <div style={avStyles.videoWrap}>
              {avCamOff ? (
                <div style={avStyles.camOff}>
                  <svg viewBox="0 0 24 24" fill="white" width="48" height="48">
                    <path d="M21 6.5l-4-4-14 14 4 4 14-14zm-3.5 1.5L19 9.5V17h-2v-5l-1 1v4H4V9h5l1-1H4.5L3 8v10a1 1 0 001 1h13a1 1 0 001-1V9l-1.5-1z"/>
                    <path d="M0 0h24v24H0z" fill="none"/>
                  </svg>
                  <p style={{color:'#94a3b8',margin:'8px 0 0'}}>Camera is off</p>
                </div>
              ) : (
                <video ref={avVideoRef} autoPlay muted playsInline style={avStyles.video} />
              )}
              <div style={avStyles.videoControls}>
                <button style={{...avStyles.ctrl, ...(avCamOff?avStyles.ctrlOff:{})}} onClick={toggleAvCam} title={avCamOff?'Turn camera on':'Turn camera off'}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    {avCamOff
                      ? <path d="M21 6.5l-4-4-14 14 4 4 14-14zm-2 7v-3.5l-4 4V17H4V9h5l-1-1H3a1 1 0 00-1 1v10a1 1 0 001 1h13a1 1 0 001-1V13.5z"/>
                      : <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>}
                  </svg>
                </button>
                <button style={{...avStyles.ctrl, ...(avMicOff?avStyles.ctrlOff:{})}} onClick={toggleAvMic} title={avMicOff?'Unmute mic':'Mute mic'}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    {avMicOff
                      ? <path d="M19 11h-1.7c0 .74-.16 1.43-.43 2.05l1.23 1.23c.56-.98.9-2.09.9-3.28zm-4.02.17c0-.06.02-.11.02-.17V5c0-1.66-1.34-3-3-3S9 3.34 9 5v.18l5.98 5.99zM4.27 3L3 4.27l6.01 6.01V11c0 1.66 1.33 3 2.99 3 .22 0 .44-.03.65-.08l1.66 1.66c-.71.33-1.5.52-2.31.52-2.76 0-5.3-2.1-5.3-5.1H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c.91-.13 1.77-.45 2.54-.9L19.73 21 21 19.73 4.27 3z"/>
                      : <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/>}
                  </svg>
                </button>
              </div>
            </div>

            {/* Mic volume meter */}
            <div style={avStyles.section}>
              <label style={avStyles.label}>Microphone level</label>
              <div style={avStyles.meterBar}>
                <div style={{...avStyles.meterFill, width: `${avVolume}%`, background: avVolume > 75 ? '#ef4444' : avVolume > 40 ? '#f59e0b' : '#22c55e'}} />
              </div>
            </div>

            {/* Device selectors */}
            <div style={avStyles.devicesGrid}>
              <div style={avStyles.deviceRow}>
                <label style={avStyles.label}>Camera</label>
                <select style={avStyles.select} value={avSelectedCam} onChange={e => switchCamera(e.target.value)}>
                  {avCameras.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,8)}`}</option>)}
                </select>
              </div>
              <div style={avStyles.deviceRow}>
                <label style={avStyles.label}>Microphone</label>
                <select style={avStyles.select} value={avSelectedMic} onChange={e => switchMic(e.target.value)}>
                  {avMics.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Microphone ${d.deviceId.slice(0,8)}`}</option>)}
                </select>
              </div>
              {avSpeakers.length > 0 && (
                <div style={avStyles.deviceRow}>
                  <label style={avStyles.label}>Speaker</label>
                  <select style={avStyles.select} value={avSelectedSpk} onChange={e => setAvSelectedSpk(e.target.value)}>
                    {avSpeakers.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker ${d.deviceId.slice(0,8)}`}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Speaker test */}
            <div style={avStyles.section}>
              <button style={{...avStyles.testSpkBtn, ...(avSpeakerPlaying?avStyles.testSpkBtnActive:{})}} onClick={testSpeaker}>
                {avSpeakerPlaying ? '🔊 Playing...' : '🔈 Test Speaker'}
              </button>
            </div>

            {/* Footer */}
            <div style={avStyles.footer}>
              <button style={avStyles.doneBtn} onClick={closeAvTest}>Done</button>
            </div>
          </div>
        </div>
      )}
      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoin={handleJoinConfirm} />
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
  welcomeCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-hover) 100%)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "32px",
    marginBottom: "28px",
    boxShadow: "var(--card-shadow)",
  },
  welcomeLeft: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  },
  largeAvatar: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--accent-blue) 0%, #3b82f6 100%)",
    color: "#ffffff",
    fontSize: "28px",
    fontWeight: "800",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "3px solid var(--border-color)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  },
  welcomeTextGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  welcomeTitle: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "800",
    color: "var(--text-primary)",
    letterSpacing: "-0.5px",
  },
  welcomeSubtitle: {
    margin: 0,
    fontSize: "14px",
    color: "var(--text-secondary)",
    lineHeight: "1.5",
    maxWidth: "580px",
  },
  planBadge: {
    display: "inline-flex",
    alignSelf: "flex-start",
    marginTop: "4px",
    background: "var(--bg-input)",
    border: "1px solid var(--border-color)",
    borderRadius: "20px",
    padding: "4px 12px",
  },
  planBadgeText: {
    fontSize: "12px",
    fontWeight: "700",
    color: "var(--text-muted)",
  },
  welcomeRight: {
    flexShrink: 0,
  },
  welcomePrimaryBtn: {
    padding: "10px 20px",
    borderRadius: "24px",
    border: "none",
    background: "var(--accent-blue)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(26,111,244,0.3)",
    transition: "transform 0.15s, opacity 0.15s",
    fontFamily: "inherit",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "20px",
    marginBottom: "28px",
  },
  statCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "14px",
    padding: "20px",
    boxShadow: "var(--card-shadow)",
    transition: "transform 0.15s, box-shadow 0.15s",
  },
  statIconContainer: {
    width: "44px",
    height: "44px",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  statValue: {
    fontSize: "22px",
    fontWeight: "800",
    color: "var(--text-primary)",
    lineHeight: "1.1",
  },
  statLabel: {
    fontSize: "12px",
    fontWeight: "600",
    color: "var(--text-muted)",
  },
  dashboardGrid: {
    display: "grid",
    gridTemplateColumns: "1.4fr 1fr",
    gap: "24px",
  },
  gridLeftCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  gridRightCol: {
    display: "flex",
    flexDirection: "column",
    gap: "24px",
  },
  widgetCard: {
    background: "var(--bg-card)",
    border: "1px solid var(--border-color)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow)",
  },
  widgetHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "18px",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "12px",
  },
  widgetTitle: {
    margin: 0,
    fontSize: "16px",
    fontWeight: "700",
    color: "var(--text-primary)",
  },
  widgetActionLink: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    color: "var(--accent-blue)",
    fontFamily: "inherit",
    padding: 0,
  },
  widgetContent: {
    minHeight: "100px",
  },
  emptyWidgetState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "32px 16px",
  },
  emptyWidgetText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-muted)",
    margin: "0 0 8px",
  },
  emptyWidgetSubtext: {
    fontSize: "12px",
    color: "var(--text-muted)",
    opacity: 0.8,
  },
  widgetPrimaryBtn: {
    marginTop: "8px",
    padding: "8px 16px",
    borderRadius: "18px",
    border: "none",
    background: "var(--accent-blue)",
    color: "#ffffff",
    fontWeight: "600",
    fontSize: "12px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  taskList: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  taskRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "10px",
    padding: "12px 16px",
    transition: "opacity 0.2s",
  },
  taskCheckbox: {
    width: "20px",
    height: "20px",
    borderRadius: "6px",
    border: "2px solid",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    transition: "background-color 0.2s, border-color 0.2s",
  },
  taskDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    flex: 1,
  },
  taskNameText: {
    fontSize: "14px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  taskMetaRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  priorityTag: {
    fontSize: "10px",
    fontWeight: "700",
    borderRadius: "4px",
    padding: "1px 6px",
  },
  taskDueDateText: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  recordingsList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  recordingRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "10px 12px",
    borderRadius: "10px",
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
  },
  recordingIconWrapper: {
    width: "36px",
    height: "36px",
    borderRadius: "8px",
    background: "rgba(16, 185, 129, 0.1)",
    color: "#10b981",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  recordingDetails: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    flex: 1,
  },
  recordingNameText: {
    fontSize: "13.5px",
    fontWeight: "600",
    color: "var(--text-primary)",
  },
  recordingMetaText: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
  recordingPlayBtn: {
    padding: "5px 12px",
    borderRadius: "14px",
    background: "var(--bg-card)",
    color: "var(--accent-blue)",
    fontWeight: "700",
    fontSize: "11.5px",
    cursor: "pointer",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    border: "1px solid var(--border-color)",
    fontFamily: "inherit",
  },
  timelineList: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    position: "relative",
    paddingLeft: "8px",
  },
  timelineRow: {
    display: "flex",
    alignItems: "flex-start",
    gap: "16px",
    position: "relative",
  },
  timelineDot: {
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    background: "#10b981",
    marginTop: "5px",
    zIndex: 2,
    flexShrink: 0,
  },
  timelineContent: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  timelineText: {
    margin: 0,
    fontSize: "13.5px",
    color: "var(--text-primary)",
    lineHeight: "1.4",
  },
  timelineTime: {
    fontSize: "11px",
    color: "var(--text-muted)",
  },
};
