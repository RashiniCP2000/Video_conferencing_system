import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import TopNav from "../components/TopNav.jsx";
import Sidebar from "../components/Sidebar.jsx";

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
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M15 19l-7-7 7-7" /></svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="M9 5l7 7-7 7" /></svg>
);

const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

const CATEGORIES = [
  { id: "team", label: "Team Meeting", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" },
  { id: "client", label: "Client Meeting", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" },
  { id: "training", label: "Training Session", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" },
  { id: "personal", label: "Personal Event", color: "#f97316", bg: "rgba(249, 115, 22, 0.15)" },
];

export default function Calendar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  /* ── nav / sidebar state ── */
  /* ── calendar configuration state ── */
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("month"); // "month" | "week" | "day"
  const [meetings, setMeetings] = useState([]);
  const [gcalConnected, setGcalConnected] = useState(false);
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(false);
  const [loadingMeetings, setLoadingMeetings] = useState(true);
  const [pageMessage, setPageMessage] = useState("");

  /* ── modals ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  /* ── form fields ── */
  const [formTopic, setFormTopic] = useState("");
  const [formCategory, setFormCategory] = useState("team");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDurationHrs, setFormDurationHrs] = useState("1");
  const [formDurationMins, setFormDurationMins] = useState("0");
  const [formDescription, setFormDescription] = useState("");
  const [formInvitees, setFormInvitees] = useState("");
  const [formPasscode, setFormPasscode] = useState("");

  const initials = user?.name?.charAt(0).toUpperCase() || "U";
  const PERSONAL_ID = "543 517 4501";

  // Load meetings and fetch Google Calendar connection status
  useEffect(() => {
    loadMeetings();
    fetchGoogleCalendarStatus();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("success") === "true") {
      setPageMessage("Google Calendar connected successfully.");
    } else if (params.get("error")) {
      setPageMessage("Google Calendar connection failed.");
    }
  }, [location.search]);

  const mapScheduledMeeting = (meeting) => {
    const scheduled = meeting.scheduledFor ? new Date(meeting.scheduledFor) : null;
    const date = scheduled ? scheduled.toISOString().slice(0, 10) : "";
    const time = scheduled
      ? `${String(scheduled.getHours()).padStart(2, "0")}:${String(scheduled.getMinutes()).padStart(2, "0")}`
      : "09:00";
    const durationMinutes = Number(meeting.durationMinutes || 60);
    return {
      meetingId: meeting.meetingCode,
      meetingCode: meeting.meetingCode,
      topic: meeting.title,
      category: "team",
      date,
      time,
      durationHrs: String(Math.floor(durationMinutes / 60)),
      durationMins: String(durationMinutes % 60),
      description: meeting.description || "",
      invitees: Array.isArray(meeting.invitees) ? meeting.invitees.join(", ") : "",
      passcode: meeting.hasPasscode ? "Protected" : "",
      timezone: meeting.timezone || "UTC",
      waitingRoomEnabled: meeting.waitingRoomEnabled !== false,
      calendarEventLink: meeting.calendarEventLink || "",
      meetingLink: meeting.meetingLink || `${window.location.origin}/meet/${meeting.meetingCode}`,
    };
  };

  const loadMeetings = async () => {
    try {
      setLoadingMeetings(true);
      const { data } = await api.get("/meetings/scheduled");
      setMeetings((data.meetings || []).map(mapScheduledMeeting));
    } catch (err) {
      console.error("Failed to load meetings:", err);
      setPageMessage("Failed to load scheduled meetings.");
    } finally {
      setLoadingMeetings(false);
    }
  };

  const fetchGoogleCalendarStatus = async () => {
    try {
      const { data } = await api.get("/calendar/status");
      setGcalConnected(data.connected);
    } catch (err) {
      console.error("Failed to fetch Google Calendar status:", err);
    }
  };

  const handleConnectCalendar = async () => {
    try {
      const { data } = await api.get("/calendar/auth-url");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setPageMessage(err.response?.data?.message || "Failed to start Google Calendar connection.");
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      await api.post("/calendar/disconnect");
      setGcalConnected(false);
      setPageMessage("Google Calendar disconnected.");
    } catch (err) {
      setPageMessage(err.response?.data?.message || "Failed to disconnect Google Calendar.");
    }
  };



  /* ── Navigation helpers ── */
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      if (currentView === "month") date.setMonth(prev.getMonth() - 1);
      else if (currentView === "week") date.setDate(prev.getDate() - 7);
      else if (currentView === "day") date.setDate(prev.getDate() - 1);
      return date;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const date = new Date(prev);
      if (currentView === "month") date.setMonth(prev.getMonth() + 1);
      else if (currentView === "week") date.setDate(prev.getDate() + 7);
      else if (currentView === "day") date.setDate(prev.getDate() + 1);
      return date;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /* ── Form actions ── */
  const openAddModal = (dateObj = null) => {
    const defaultDate = dateObj 
      ? dateObj.toISOString().slice(0, 10) 
      : new Date().toISOString().slice(0, 10);
    setFormTopic("");
    setFormCategory("team");
    setFormDate(defaultDate);
    setFormTime("09:00");
    setFormDurationHrs("1");
    setFormDurationMins("0");
    setFormDescription("");
    setFormInvitees("");
    setFormPasscode(Math.random().toString(36).slice(2, 8).toUpperCase());
    setSyncGoogleCalendar(gcalConnected);
    setIsEditing(false);
    setShowAddModal(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormTopic(event.topic || "");
    setFormCategory(event.category || "team");
    setFormDate(event.date || "");
    setFormTime(event.time || "09:00");
    setFormDurationHrs(String(event.durationHrs || "1"));
    setFormDurationMins(String(event.durationMins || "0"));
    setFormDescription(event.description || "");
    setFormInvitees(event.invitees || "");
    setFormPasscode(event.passcode || "");
    setSyncGoogleCalendar(Boolean(event.calendarEventLink) || gcalConnected);
    setIsEditing(true);
    setShowViewModal(false);
    setShowAddModal(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    if (!formTopic.trim()) return;

    setPageMessage("");
    try {
      const payload = {
        title: formTopic.trim(),
        date: formDate,
        time: formTime,
        timezone: "Asia/Colombo",
        durationMinutes: Number(formDurationHrs || 0) * 60 + Number(formDurationMins || 0),
        description: formDescription.trim(),
        invitees: formInvitees
          .split(",")
          .map((v) => v.trim())
          .filter(Boolean),
        waitingRoomEnabled: true,
        passcode: formPasscode.trim(),
        syncGoogleCalendar,
      };

      if (isEditing && selectedEvent?.meetingId) {
        await api.put(`/meetings/scheduled/${selectedEvent.meetingId}`, payload);
      } else {
        await api.post("/meetings/scheduled", payload);
      }

      await loadMeetings();
      setShowAddModal(false);
      setShowViewModal(false);
      setPageMessage(syncGoogleCalendar && gcalConnected
        ? "Meeting saved and synced to Google Calendar."
        : "Meeting saved successfully.");
    } catch (err) {
      setPageMessage(err.response?.data?.message || "Failed to save meeting.");
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) {
      return;
    }

    try {
      await api.delete(`/meetings/scheduled/${id}`);
      await loadMeetings();
      setShowViewModal(false);
      setPageMessage("Meeting canceled and calendar sync updated.");
    } catch (err) {
      setPageMessage(err.response?.data?.message || "Failed to delete meeting.");
    }
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowViewModal(true);
  };

  /* ── Calculations & Grids ── */
  // Date Helpers
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Month view cells generator
  const getMonthCells = () => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay(); // 0 = Sunday
    const numDays = new Date(year, month + 1, 0).getDate();
    const prevMonthNumDays = new Date(year, month, 0).getDate();

    const cells = [];
    // Previous month padding
    for (let i = dayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthNumDays - i),
        isCurrent: false,
      });
    }
    // Current month days
    for (let i = 1; i <= numDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrent: true,
      });
    }
    // Next month padding
    const totalCellsNeeded = 42; // standard 6 weeks
    const remaining = totalCellsNeeded - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrent: false,
      });
    }
    return cells;
  };

  // Week view columns generator
  const getWeekDays = () => {
    const currentDayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDayOfWeek);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }
    return weekDays;
  };

  // Format date to YYYY-MM-DD local string
  const formatYYYYMMDD = (d) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Find meetings matching a specific date string (YYYY-MM-DD)
  const getMeetingsForDate = (dateStr) => {
    return meetings.filter((m) => m.date === dateStr);
  };

  const getCategoryTheme = (catId) => {
    return CATEGORIES.find((c) => c.id === catId) || CATEGORIES[0];
  };

  // Stats Calculations
  const meetingsThisMonth = meetings.filter((m) => {
    if (!m.date) return false;
    const d = new Date(m.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });

  const hoursThisMonth = meetingsThisMonth.reduce((acc, m) => {
    const hrs = Number(m.durationHrs || 0);
    const mins = Number(m.durationMins || 0);
    return acc + hrs + (mins / 60);
  }, 0);

  const upcomingList = meetings
    .filter((m) => {
      if (!m.date) return false;
      const todayStr = formatYYYYMMDD(new Date());
      return m.date >= todayStr;
    })
    .sort((a, b) => new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`));

  return (
    <div style={st.root}>
      {/* ═══ TOP NAVIGATION ═══ */}
      <TopNav />

      <div style={st.bodyRow}>
        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeTab="Calendar" />

        {/* ═══ MAIN CALENDAR CONTENT ═══ */}
        <main style={st.main}>
          <div style={st.calendarLayout}>
            
            {/* Left Main Calendar Panel */}
            <div style={st.calendarContainer}>
              {pageMessage && (
                <div style={{
                  marginBottom: 16,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(59, 130, 246, 0.08)",
                  color: "#1d4ed8",
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  {pageMessage}
                </div>
              )}
              
              {/* Calendar Toolbar */}
              <div style={st.toolbar}>
                <div style={st.navControls}>
                  <button onClick={handlePrev} style={st.iconNavBtn}><ChevronLeftIcon /></button>
                  <button onClick={handleToday} style={st.todayBtn}>Today</button>
                  <button onClick={handleNext} style={st.iconNavBtn}><ChevronRightIcon /></button>
                  <span style={st.calendarTitle}>
                    {monthNames[month]} {year}
                  </span>
                </div>

                <div style={st.rightControls}>
                  <div style={st.viewSwitcher}>
                    {["month", "week", "day"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setCurrentView(v)}
                        style={{
                          ...st.viewBtn,
                          background: currentView === v ? "var(--accent-blue, #1a6ff4)" : "none",
                          color: currentView === v ? "#fff" : "var(--text-secondary, #334155)",
                          fontWeight: currentView === v ? "700" : "500",
                        }}
                      >
                        {v.toUpperCase()}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => openAddModal()} style={st.scheduleBtn}>
                    + Schedule Event
                  </button>
                </div>
              </div>

              {/* Grid Views */}
              {currentView === "month" && (
                <div style={st.monthGrid}>
                  {/* Sun - Sat header */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} style={st.weekdayHeader}>{day}</div>
                  ))}
                  {getMonthCells().map((cell, idx) => {
                    const dateStr = formatYYYYMMDD(cell.date);
                    const dayEvents = getMeetingsForDate(dateStr);
                    const isToday = formatYYYYMMDD(new Date()) === dateStr;

                    return (
                      <div
                        key={idx}
                        onClick={() => openAddModal(cell.date)}
                        style={{
                          ...st.dayCell,
                          opacity: cell.isCurrent ? 1 : 0.4,
                          background: isToday ? "var(--bg-hover, #eff6ff)" : "var(--bg-card, #ffffff)",
                          borderColor: isToday ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #e2e8f0)",
                        }}
                      >
                        <div style={{ ...st.dayNumber, fontWeight: isToday ? "800" : "500", color: isToday ? "var(--accent-blue, #1a6ff4)" : "var(--text-primary, #0f172a)" }}>
                          {cell.date.getDate()}
                        </div>
                        <div style={st.cellEventsContainer}>
                          {dayEvents.map((ev) => {
                            const theme = getCategoryTheme(ev.category);
                            return (
                              <div
                                key={ev.meetingId}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEventClick(ev);
                                }}
                                style={{
                                  ...st.eventPill,
                                  background: theme.bg,
                                  color: theme.color,
                                  borderLeft: `3px solid ${theme.color}`,
                                }}
                                title={ev.topic}
                              >
                                {ev.time} - {ev.topic}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentView === "week" && (
                <div style={st.weekGrid}>
                  {getWeekDays().map((day, idx) => {
                    const dateStr = formatYYYYMMDD(day);
                    const dayEvents = getMeetingsForDate(dateStr);
                    const isToday = formatYYYYMMDD(new Date()) === dateStr;
                    const weekdayLabel = day.toLocaleDateString("en-US", { weekday: "short" });

                    return (
                      <div
                        key={idx}
                        style={{
                          ...st.weekColumn,
                          background: isToday ? "var(--bg-hover, #eff6ff)" : "var(--bg-card, #ffffff)",
                          borderColor: isToday ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #e2e8f0)",
                        }}
                      >
                        <div style={st.weekColumnHeader}>
                          <span style={{ fontSize: 13, color: "var(--text-muted, #64748b)" }}>{weekdayLabel}</span>
                          <span style={{ fontSize: 18, fontWeight: "700", color: isToday ? "var(--accent-blue, #1a6ff4)" : "var(--text-primary, #0f172a)" }}>
                            {day.getDate()}
                          </span>
                        </div>
                        
                        <div style={st.weekEventsContainer}>
                          {dayEvents.length > 0 ? (
                            dayEvents.map((ev) => {
                              const theme = getCategoryTheme(ev.category);
                              return (
                                <div
                                  key={ev.meetingId}
                                  onClick={() => handleEventClick(ev)}
                                  style={{
                                    ...st.weekEventCard,
                                    background: theme.bg,
                                    color: theme.color,
                                    borderLeft: `4px solid ${theme.color}`,
                                  }}
                                >
                                  <span style={st.weekEventTime}>{ev.time}</span>
                                  <span style={st.weekEventTopic}>{ev.topic}</span>
                                </div>
                              );
                            })
                          ) : (
                            <button onClick={() => openAddModal(day)} style={st.quickAddBtn}>+ Add</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {currentView === "day" && (
                <div style={st.dayView}>
                  <div style={st.dayViewHeader}>
                    <h2 style={st.dayViewTitle}>
                      {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </h2>
                    {formatYYYYMMDD(new Date()) === formatYYYYMMDD(currentDate) && (
                      <span style={st.todayBadge}>Today</span>
                    )}
                  </div>
                  <div style={st.dayEventsList}>
                    {getMeetingsForDate(formatYYYYMMDD(currentDate)).length > 0 ? (
                      getMeetingsForDate(formatYYYYMMDD(currentDate)).map((ev) => {
                        const theme = getCategoryTheme(ev.category);
                        return (
                          <div
                            key={ev.meetingId}
                            onClick={() => handleEventClick(ev)}
                            style={{
                              ...st.dayEventRow,
                              background: theme.bg,
                              color: theme.color,
                              borderLeft: `6px solid ${theme.color}`,
                            }}
                          >
                            <span style={st.dayEventTimeSlot}>{ev.time}</span>
                            <div style={st.dayEventInfo}>
                              <h4 style={st.dayEventTopicName}>{ev.topic}</h4>
                              <p style={st.dayEventDesc}>{ev.description || "No description provided."}</p>
                            </div>
                            <span style={st.dayEventDuration}>{ev.durationHrs}h {ev.durationMins}m</span>
                          </div>
                        );
                      })
                    ) : (
                      <div style={st.emptyDayState}>
                        <p style={{ color: "var(--text-muted, #64748b)" }}>No meetings scheduled for this day.</p>
                        <button onClick={() => openAddModal(currentDate)} style={st.scheduleBtn}>Schedule Event</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Right Statistics & Quick Info Panel */}
            <aside style={st.sidePanel}>
              
              {/* Google Calendar Sync Card */}
              <div style={st.sideCard}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 20 }}>📅</span>
                  <h3 style={st.sideCardTitle}>Google Integration</h3>
                </div>
                <div style={{ display: "flex", alignItems: "center", justifycontent: "space-between", gap: 10 }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted, #64748b)" }}>
                    {gcalConnected ? "Synchronized" : "Not synchronized"}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: "bold",
                    padding: "2px 8px",
                    borderRadius: 12,
                    background: gcalConnected ? "rgba(16, 185, 129, 0.15)" : "var(--border-color, #cbd5e1)",
                    color: gcalConnected ? "#10b981" : "var(--text-muted, #64748b)"
                  }}>
                    {gcalConnected ? "GCAL SYNC ON" : "GCAL OFF"}
                  </span>
                </div>
                <button
                  onClick={gcalConnected ? handleDisconnectCalendar : handleConnectCalendar}
                  style={st.syncSettingsBtn}
                >
                  {gcalConnected ? "Disconnect Google Calendar" : "Connect Google Calendar"}
                </button>
                <div style={{ marginTop: 10, fontSize: 12, color: "var(--text-muted, #64748b)", lineHeight: 1.5 }}>
                  When synced, meetings are added with email + popup reminders and participants are invited automatically.
                </div>
              </div>

              {/* Stats Card */}
              <div style={st.sideCard}>
                <h3 style={st.sideCardTitle}>Month Statistics</h3>
                <div style={st.statsGrid}>
                  <div style={st.statItem}>
                    <span style={st.statVal}>{meetingsThisMonth.length}</span>
                    <span style={st.statLabel}>Events Scheduled</span>
                  </div>
                  <div style={st.statItem}>
                    <span style={st.statVal}>{hoursThisMonth.toFixed(1)}h</span>
                    <span style={st.statLabel}>Total Time Planned</span>
                  </div>
                </div>
              </div>

              {/* Category Legend */}
              <div style={st.sideCard}>
                <h3 style={st.sideCardTitle}>Event Categories</h3>
                <div style={st.legendList}>
                  {CATEGORIES.map((c) => (
                    <div key={c.id} style={st.legendItem}>
                      <span style={{ ...st.legendDot, background: c.color }} />
                      <span style={st.legendLabel}>{c.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Upcoming List */}
              <div style={st.sideCard}>
                <h3 style={st.sideCardTitle}>Upcoming Reminders</h3>
                <div style={st.upcomingWrapper}>
                  {loadingMeetings ? (
                    <span style={{ fontSize: 13, color: "var(--text-muted, #64748b)" }}>Loading scheduled meetings...</span>
                  ) : upcomingList.length > 0 ? (
                    upcomingList.slice(0, 3).map((m) => {
                      const theme = getCategoryTheme(m.category);
                      return (
                        <div key={m.meetingId} onClick={() => handleEventClick(m)} style={st.upcomingCard}>
                          <span style={{ ...st.upcomingTopicText, color: theme.color }}>{m.topic}</span>
                          <span style={st.upcomingDateText}>{m.date} at {m.time}</span>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ fontSize: 13, color: "var(--text-muted, #64748b)" }}>No upcoming events.</span>
                  )}
                </div>
              </div>

            </aside>

          </div>
        </main>
      </div>

      {/* ─── MODAL 1: VIEW EVENT DETAILS ─── */}
      {showViewModal && selectedEvent && (
        <div style={st.modalOverlay}>
          <div style={st.modalContent}>
            <div style={st.modalHeader}>
              <h3 style={st.modalTitle}>Event Details</h3>
              <button onClick={() => setShowViewModal(false)} style={st.modalCloseBtn}>×</button>
            </div>
            
            <div style={st.detailsTable}>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Topic / Title</span>
                <span style={st.detailsValue}>{selectedEvent.topic}</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Category</span>
                <span style={{
                  ...st.detailsValue,
                  color: getCategoryTheme(selectedEvent.category).color,
                  fontWeight: "bold"
                }}>
                  {getCategoryTheme(selectedEvent.category).label}
                </span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Date & Time</span>
                <span style={st.detailsValue}>{selectedEvent.date} at {selectedEvent.time}</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Duration</span>
                <span style={st.detailsValue}>{selectedEvent.durationHrs} hr {selectedEvent.durationMins} mins</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Description</span>
                <span style={st.detailsValue}>{selectedEvent.description || "—"}</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Invitees</span>
                <span style={st.detailsValue}>{selectedEvent.invitees || "—"}</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Meeting ID</span>
                <span style={st.detailsValue}>{selectedEvent.meetingId}</span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Google Calendar</span>
                <span style={st.detailsValue}>
                  {selectedEvent.calendarEventLink ? (
                    <a href={selectedEvent.calendarEventLink} target="_blank" rel="noreferrer" style={{ color: "#1a6ff4", fontWeight: 700 }}>
                      Synced event
                    </a>
                  ) : (
                    "Not synced"
                  )}
                </span>
              </div>
              <div style={st.detailsRow}>
                <span style={st.detailsLabel}>Passcode</span>
                <span style={st.detailsValue}>{selectedEvent.passcode || "—"}</span>
              </div>
            </div>

            <div style={st.modalActions}>
              <button
                onClick={() => navigate(selectedEvent.meetingLink || `/meet/${selectedEvent.meetingId.replace(/\s/g, "")}`)}
                style={st.joinBtn}
              >
                Join Meeting
              </button>
              <button onClick={() => openEditModal(selectedEvent)} style={st.editBtn}>
                Edit Event
              </button>
              <button onClick={() => handleDeleteEvent(selectedEvent.meetingId)} style={st.deleteBtn}>
                Delete Event
              </button>
              <button onClick={() => setShowViewModal(false)} style={st.cancelBtn}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 2: SCHEDULE / EDIT EVENT ─── */}
      {showAddModal && (
        <div style={st.modalOverlay}>
          <div style={st.modalContent}>
            <div style={st.modalHeader}>
              <h3 style={st.modalTitle}>{isEditing ? "Edit Event" : "Schedule Event"}</h3>
              <button onClick={() => setShowAddModal(false)} style={st.modalCloseBtn}>×</button>
            </div>

            <form onSubmit={handleSaveEvent} style={st.formContainer}>
              <div style={st.formGroup}>
                <label style={st.formLabel}>Title / Topic</label>
                <input
                  type="text"
                  value={formTopic}
                  onChange={(e) => setFormTopic(e.target.value)}
                  placeholder="Daily Standup..."
                  required
                  style={st.formInput}
                />
              </div>

              <div style={st.formGroup}>
                <label style={st.formLabel}>Event Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  style={st.formSelect}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div style={st.formRow}>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    style={st.formInput}
                  />
                </div>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    style={st.formInput}
                  />
                </div>
              </div>

              <div style={st.formRow}>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Duration (Hours)</label>
                  <select
                    value={formDurationHrs}
                    onChange={(e) => setFormDurationHrs(e.target.value)}
                    style={st.formSelect}
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{i} hr{i !== 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Duration (Minutes)</label>
                  <select
                    value={formDurationMins}
                    onChange={(e) => setFormDurationMins(e.target.value)}
                    style={st.formSelect}
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>{m} mins</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={st.formGroup}>
                <label style={st.formLabel}>Description (Optional)</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Sync items..."
                  style={st.formTextarea}
                  rows={3}
                />
              </div>

              <div style={st.formGroup}>
                <label style={st.formLabel}>Invitees (Optional)</label>
                <input
                  type="text"
                  value={formInvitees}
                  onChange={(e) => setFormInvitees(e.target.value)}
                  placeholder="name@domain.com, guest2..."
                  style={st.formInput}
                />
              </div>

              <div style={st.formGroup}>
                <label style={st.formLabel}>Passcode</label>
                <input
                  type="text"
                  value={formPasscode}
                  onChange={(e) => setFormPasscode(e.target.value)}
                  placeholder="Security passcode..."
                  style={st.formInput}
                />
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--text-secondary, #334155)" }}>
                <input
                  type="checkbox"
                  checked={syncGoogleCalendar}
                  onChange={(e) => setSyncGoogleCalendar(e.target.checked)}
                />
                Sync this meeting with Google Calendar
              </label>
              <div style={{ fontSize: 12, color: "var(--text-muted, #64748b)", lineHeight: 1.5 }}>
                Google Calendar reminders are added automatically (popup 10 min, email 30 min) when sync is enabled.
              </div>

              <div style={st.modalActions}>
                <button type="submit" style={st.joinBtn}>
                  {isEditing ? "Save Changes" : "Create Event"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} style={st.cancelBtn}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

  /* Main panel styles */
  main: { flex: 1, padding: "24px 32px", overflowY: "auto", background: "var(--bg-secondary, #fff)" },
  calendarLayout: { display: "grid", gridTemplateColumns: "1fr 280px", gap: "24px", alignItems: "start" },
  calendarContainer: { background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "16px", padding: "20px", boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))" },

  /* Toolbar */
  toolbar: { display: "flex", justifycontent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "20px" },
  navControls: { display: "flex", alignItems: "center", gap: "12px" },
  iconNavBtn: { width: "34px", height: "34px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--btn-outline-bg, #fff)", color: "var(--text-primary, #0f172a)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" },
  todayBtn: { padding: "6px 16px", borderRadius: "8px", border: "1px solid var(--border-color, #cbd5e1)", background: "var(--btn-outline-bg, #fff)", color: "var(--text-primary, #0f172a)", fontWeight: "600", fontSize: "13.5px", cursor: "pointer", fontFamily: "inherit" },
  calendarTitle: { fontSize: "18px", fontWeight: "800", color: "var(--text-primary, #0f172a)", marginLeft: "8px" },

  rightControls: { display: "flex", alignItems: "center", gap: "12px" },
  viewSwitcher: { display: "flex", background: "var(--bg-primary, #f1f5f9)", padding: "2px", borderRadius: "10px", border: "1px solid var(--border-color, #cbd5e1)" },
  viewBtn: { padding: "6px 12px", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "11px", fontFamily: "inherit", transition: "all 0.2s" },
  scheduleBtn: { padding: "8px 16px", borderRadius: "8px", border: "none", background: "var(--accent-blue, #1a6ff4)", color: "#fff", fontWeight: "700", fontSize: "13.5px", cursor: "pointer", fontFamily: "inherit" },

  /* Month View */
  monthGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "var(--border-color, #e2e8f0)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", overflow: "hidden" },
  weekdayHeader: { background: "var(--bg-primary, #f8fafc)", padding: "10px", textAlign: "center", fontWeight: "700", fontSize: "12.5px", color: "var(--text-muted, #64748b)" },
  dayCell: { background: "var(--bg-card, #fff)", minHeight: "100px", padding: "8px", display: "flex", flexDirection: "column", gap: "6px", cursor: "pointer", transition: "background 0.15s" },
  dayNumber: { fontSize: "13px", alignSelf: "flex-end" },
  cellEventsContainer: { display: "flex", flexDirection: "column", gap: "4px", flex: 1, overflowY: "auto" },
  eventPill: { fontSize: "10.5px", fontWeight: "600", padding: "2px 6px", borderRadius: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" },

  /* Week View */
  weekGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "1px", background: "var(--border-color, #e2e8f0)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "12px", overflow: "hidden" },
  weekColumn: { background: "var(--bg-card, #fff)", minHeight: "450px", display: "flex", flexDirection: "column" },
  weekColumnHeader: { display: "flex", flexDirection: "column", alignItems: "center", gap: "2px", padding: "12px", borderBottom: "1px solid var(--border-color, #f1f5f9)" },
  weekEventsContainer: { display: "flex", flexDirection: "column", gap: "8px", padding: "8px", flex: 1, overflowY: "auto" },
  weekEventCard: { display: "flex", flexDirection: "column", gap: "2px", padding: "6px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer", transition: "transform 0.15s" },
  weekEventTime: { fontWeight: "800" },
  weekEventTopic: { fontWeight: "600", wordBreak: "break-word" },
  quickAddBtn: { width: "100%", padding: "6px", background: "none", border: "1px dashed var(--border-color, #cbd5e1)", borderRadius: "6px", color: "var(--text-muted, #64748b)", fontSize: "11px", cursor: "pointer", fontWeight: "600" },

  /* Day View */
  dayView: { padding: "12px" },
  dayViewHeader: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color, #e2e8f0)" },
  dayViewTitle: { fontSize: "18px", fontWeight: "800", color: "var(--text-primary, #0f172a)", margin: 0 },
  todayBadge: { fontSize: "10px", fontWeight: "800", background: "var(--accent-blue-bg, #eff6ff)", color: "var(--accent-blue, #1a6ff4)", padding: "2px 8px", borderRadius: "6px" },
  dayEventsList: { display: "flex", flexDirection: "column", gap: "12px" },
  dayEventRow: { display: "flex", alignItems: "center", gap: "16px", padding: "16px", borderRadius: "10px", cursor: "pointer", transition: "transform 0.15s" },
  dayEventTimeSlot: { fontSize: "14px", fontWeight: "800", minWidth: "80px" },
  dayEventInfo: { flex: 1, display: "flex", flexDirection: "column", gap: "4px" },
  dayEventTopicName: { fontSize: "14.5px", fontWeight: "700", margin: 0 },
  dayEventDesc: { fontSize: "12px", margin: 0, opacity: 0.8 },
  dayEventDuration: { fontSize: "13px", fontWeight: "600", opacity: 0.8 },
  emptyDayState: { display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "64px", textAlign: "center" },

  /* Side Panel */
  sidePanel: { display: "flex", flexDirection: "column", gap: "20px" },
  sideCard: { background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "16px", padding: "20px", boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))" },
  sideCardTitle: { fontSize: "14px", fontWeight: "700", color: "var(--text-primary, #0f172a)", margin: "0 0 12px 0" },
  syncSettingsBtn: { width: "100%", padding: "8px", background: "none", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "8px", color: "var(--text-secondary, #334155)", fontSize: "12px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit", marginTop: "12px" },
  
  statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" },
  statItem: { display: "flex", flexDirection: "column", gap: "2px" },
  statVal: { fontSize: "18px", fontWeight: "800", color: "var(--accent-blue, #1a6ff4)" },
  statLabel: { fontSize: "10.5px", color: "var(--text-muted, #64748b)", lineHeight: "1.3" },

  legendList: { display: "flex", flexDirection: "column", gap: "8px" },
  legendItem: { display: "flex", alignItems: "center", gap: "8px" },
  legendDot: { width: "10px", height: "10px", borderRadius: "50%" },
  legendLabel: { fontSize: "12px", color: "var(--text-secondary, #334155)", fontWeight: "500" },

  upcomingWrapper: { display: "flex", flexDirection: "column", gap: "10px" },
  upcomingCard: { display: "flex", flexDirection: "column", gap: "2px", padding: "8px 10px", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "8px", background: "var(--bg-primary, #f8fafc)", cursor: "pointer", transition: "transform 0.15s" },
  upcomingTopicText: { fontSize: "12.5px", fontWeight: "700" },
  upcomingDateText: { fontSize: "11px", color: "var(--text-muted, #64748b)" },

  /* Modals */
  modalOverlay: { position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", padding: "16px" },
  modalContent: { background: "var(--bg-card, #ffffff)", border: "1px solid var(--border-color, #e2e8f0)", borderRadius: "20px", padding: "24px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", paddingBottom: "12px", borderBottom: "1px solid var(--border-color, #e2e8f0)" },
  modalTitle: { fontSize: "16.5px", fontWeight: "700", color: "var(--text-primary, #0f172a)", margin: 0 },
  modalCloseBtn: { background: "none", border: "none", fontSize: "22px", cursor: "pointer", color: "var(--text-muted, #94a3b8)", lineHeight: "1" },
  
  detailsTable: { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" },
  detailsRow: { display: "flex", borderBottom: "1px solid var(--border-color, #f1f5f9)", paddingBottom: "8px" },
  detailsLabel: { width: "120px", fontSize: "12.5px", color: "var(--text-muted, #64748b)", fontWeight: "600" },
  detailsValue: { flex: 1, fontSize: 13.5, color: "var(--text-primary, #0f172a)" },
  
  modalActions: { display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "20px" },
  joinBtn: { padding: "10px 20px", border: "none", borderRadius: "8px", background: "var(--accent-blue, #1a6ff4)", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  editBtn: { padding: "10px 16px", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "8px", background: "var(--btn-outline-bg, #fff)", color: "var(--text-secondary, #334155)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },
  deleteBtn: { padding: "10px 16px", border: "none", borderRadius: "8px", background: "#e11d48", color: "#fff", fontSize: "13px", fontWeight: "700", cursor: "pointer", fontFamily: "inherit" },
  cancelBtn: { padding: "10px 16px", border: "1px solid var(--border-color, #cbd5e1)", borderRadius: "8px", background: "var(--btn-outline-bg, #fff)", color: "var(--text-muted, #64748b)", fontSize: "13px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit" },

  formContainer: { display: "flex", flexDirection: "column", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px" },
  formLabel: { fontSize: "12.5px", fontWeight: "600", color: "var(--text-label, #334155)" },
  formInput: { padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-input, #cbd5e1)", background: "var(--input-bg, #fff)", color: "var(--input-text, #1e293b)", fontSize: "13.5px", fontFamily: "inherit", outline: "none", width: "100%" },
  formSelect: { padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-input, #cbd5e1)", background: "var(--input-bg, #fff)", color: "var(--input-text, #1e293b)", fontSize: "13.5px", fontFamily: "inherit", outline: "none", width: "100%", cursor: "pointer" },
  formTextarea: { padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--border-input, #cbd5e1)", background: "var(--input-bg, #fff)", color: "var(--input-text, #1e293b)", fontSize: "13.5px", fontFamily: "inherit", outline: "none", resize: "vertical", width: "100%" },
  formRow: { display: "flex", gap: "16px" },
};
