import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Sidebar from "../components/Sidebar.jsx";

/* ─── Storage key ─────────────────────────────────────────── */
const LS_KEY = "meetnova_notes";
const MEETINGS_KEY = "meetnova_scheduled_meetings";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ─── Color options ───────────────────────────────────────── */
const NOTE_COLORS = [
  { id: "default", label: "Default", bg: "var(--bg-card,#fff)",      border: "var(--border-color,#e2e8f0)", dot: "#cbd5e1", text: "var(--text-primary,#0f172a)" },
  { id: "blue",    label: "Blue",    bg: "#eff6ff",                   border: "#bfdbfe",                   dot: "#3b82f6", text: "#1e40af" },
  { id: "green",   label: "Green",   bg: "#f0fdf4",                   border: "#bbf7d0",                   dot: "#22c55e", text: "#166534" },
  { id: "yellow",  label: "Yellow",  bg: "#fefce8",                   border: "#fde68a",                   dot: "#eab308", text: "#854d0e" },
  { id: "pink",    label: "Pink",    bg: "#fdf2f8",                   border: "#f9a8d4",                   dot: "#ec4899", text: "#9d174d" },
  { id: "purple",  label: "Purple",  bg: "#faf5ff",                   border: "#d8b4fe",                   dot: "#a855f7", text: "#6b21a8" },
  { id: "orange",  label: "Orange",  bg: "#fff7ed",                   border: "#fed7aa",                   dot: "#f97316", text: "#9a3412" },
];

const CATEGORIES = ["All", "Meeting Notes", "Project Notes", "Personal Notes", "Research Notes"];

/* ─── Icons ───────────────────────────────────────────────── */
const StarIcon   = ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="15" height="15"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const PinIcon    = ({ filled }) => <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
const TrashIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const EditIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const ArchiveIcon= () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z"/></svg>;
const SearchIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const PlusIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const CloseIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const BoldIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z"/></svg>;
const ItalicIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z"/></svg>;
const UnderIcon  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z"/></svg>;
const BulletIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M4 10.5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5zm0-6c-.83 0-1.5.67-1.5 1.5S3.17 7.5 4 7.5 5.5 6.83 5.5 6 4.83 4.5 4 4.5zm0 12c-.83 0-1.5.68-1.5 1.5s.68 1.5 1.5 1.5 1.5-.68 1.5-1.5-.67-1.5-1.5-1.5zM7 19h14v-2H7v2zm0-6h14v-2H7v2zm0-8v2h14V5H7z"/></svg>;
const HomeIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const ChevDown   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 10l5 5 5-5z"/></svg>;
const ChevRight  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/></svg>;
const ExternalIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>;
const MeetingIcon= () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const TagIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41s-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z"/></svg>;
const ExportIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>;

/* ─── Sidebar items ───────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

/* ─── Empty note template ─────────────────────────────────── */
const emptyNote = () => ({
  id: genId(),
  title: "",
  content: "",
  category: "Personal Notes",
  tags: [],
  color: "default",
  isPinned: false,
  isFavorite: false,
  isArchived: false,
  linkedMeeting: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

/* ─── Relative time helper ────────────────────────────────── */
function relativeTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

/* ─── Strip HTML helper ───────────────────────────────────── */
function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export default function Notes() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const editorRef = useRef(null);

  /* ── nav/sidebar state ── */
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  /* ── notes state ── */
  const [notes,         setNotes]         = useState([]);
  const [search,        setSearch]        = useState("");
  const [activeCategory,setActiveCategory] = useState("All");
  const [filterFav,     setFilterFav]     = useState(false);
  const [showArchived,  setShowArchived]  = useState(false);

  /* ── modal state ── */
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingNote, setEditingNote] = useState(null); // null = new note
  const [draft,       setDraft]       = useState(emptyNote());
  const [tagInput,    setTagInput]    = useState("");
  const [savedMsg,    setSavedMsg]    = useState(false);

  /* ── meetings for integration ── */
  const [meetings, setMeetings] = useState([]);

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  /* ── Load notes & meetings from localStorage ── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      setNotes(saved);
    } catch { setNotes([]); }

    try {
      const m = JSON.parse(localStorage.getItem(MEETINGS_KEY) || "[]");
      setMeetings(m);
    } catch { setMeetings([]); }
  }, []);

  /* ── Persist notes ── */
  const saveNotes = useCallback((updated) => {
    setNotes(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  }, []);

  /* ── Open modal for new note ── */
  const openNew = (prefill = null) => {
    const n = prefill ? { ...emptyNote(), ...prefill } : emptyNote();
    setDraft(n);
    setEditingNote(null);
    setTagInput("");
    setModalOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = n.content || "";
    }, 50);
  };

  /* ── Open modal for edit ── */
  const openEdit = (note) => {
    setDraft({ ...note });
    setEditingNote(note.id);
    setTagInput("");
    setModalOpen(true);
    setTimeout(() => {
      if (editorRef.current) editorRef.current.innerHTML = note.content || "";
    }, 50);
  };

  /* ── Create from meeting ── */
  const createFromMeeting = (meeting) => {
    const prefill = {
      title: `Meeting Notes: ${meeting.topic || "Untitled"}`,
      content: `<p><strong>Meeting:</strong> ${meeting.topic || "Untitled"}</p><p><strong>Date:</strong> ${meeting.date || "—"} at ${meeting.time || "—"}</p><p><strong>Participants:</strong> —</p><hr/><p><strong>Summary:</strong></p><p>&nbsp;</p><p><strong>Action Items:</strong></p><ul><li>&nbsp;</li></ul>`,
      category: "Meeting Notes",
      linkedMeeting: meeting.topic || meeting.meetingId || "Meeting",
      color: "blue",
    };
    openNew(prefill);
  };

  /* ── Save draft ── */
  const saveDraft = () => {
    const content = editorRef.current ? editorRef.current.innerHTML : draft.content;
    const note = { ...draft, content, updatedAt: new Date().toISOString() };

    let updated;
    if (editingNote) {
      updated = notes.map(n => n.id === editingNote ? note : n);
    } else {
      updated = [note, ...notes];
    }
    saveNotes(updated);
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
    setModalOpen(false);
  };

  /* ── Delete note ── */
  const deleteNote = (id) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  /* ── Toggle pin ── */
  const togglePin = (id) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, isPinned: !n.isPinned } : n));
  };

  /* ── Toggle favorite ── */
  const toggleFav = (id) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, isFavorite: !n.isFavorite } : n));
  };

  /* ── Toggle archive ── */
  const toggleArchive = (id) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, isArchived: !n.isArchived, isPinned: false } : n));
  };

  /* ── Add tag ── */
  const addTag = (e) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const tag = tagInput.trim().replace(/^#/, "");
      if (tag && !draft.tags.includes(tag)) {
        setDraft(d => ({ ...d, tags: [...d.tags, tag] }));
      }
      setTagInput("");
    }
  };
  const removeTag = (tag) => {
    setDraft(d => ({ ...d, tags: d.tags.filter(t => t !== tag) }));
  };

  /* ── Rich text exec ── */
  const exec = (cmd, val = null) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  };

  /* ── Export note as text ── */
  const exportNote = (note) => {
    const text = `${note.title}\n${"─".repeat(40)}\n${stripHtml(note.content)}\n\nCategory: ${note.category}\nTags: ${note.tags.map(t => "#" + t).join(" ")}\nCreated: ${new Date(note.createdAt).toLocaleString()}`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "note"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ── Sidebar nav ── */
  const handleSidebarClick = (label) => {
    if (label === "Notes")      return;
    if (label === "Meetings")   navigate("/meetings");
    if (label === "Recordings") navigate("/recordings");
    if (label === "Calendar")   navigate("/calendar");
    if (label === "Scheduler")  navigate("/schedule");
    if (label === "Tasks")      navigate("/tasks");
    if (label === "Whiteboard") navigate("/whiteboard");
  };
  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  /* ── Filter & sort notes ── */
  const activeNotes = notes.filter(n => {
    if (n.isArchived && !showArchived) return false;
    if (showArchived && !n.isArchived) return false;
    if (filterFav && !n.isFavorite) return false;
    if (activeCategory !== "All" && n.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.title.toLowerCase().includes(q) ||
             stripHtml(n.content).toLowerCase().includes(q) ||
             n.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const pinnedNotes  = activeNotes.filter(n => n.isPinned && !n.isArchived);
  const regularNotes = activeNotes.filter(n => !n.isPinned);
  const recentNotes  = [...notes]
    .filter(n => !n.isArchived)
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, 4);

  /* ── Stats ── */
  const totalNotes    = notes.filter(n => !n.isArchived).length;
  const favCount      = notes.filter(n => n.isFavorite && !n.isArchived).length;
  const pinnedCount   = notes.filter(n => n.isPinned && !n.isArchived).length;
  const archivedCount = notes.filter(n => n.isArchived).length;

  const colorOf = (id) => NOTE_COLORS.find(c => c.id === id) || NOTE_COLORS[0];

  /* ════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════ */
  return (
    <div style={st.root}>
      {/* ═══ TOP NAV ═══ */}
      <header style={st.topNav}>
        <div style={st.topNavLeft}>
          <Link to="/" style={{ ...st.logo, textDecoration: "none" }}>MeetNova</Link>
          <nav style={st.navLinks}>
            {["Products", "Solutions", "Resources", "Plans & Pricing"].map(item => (
              <button key={item} style={st.navLink}
                onClick={() => item === "Plans & Pricing" && navigate("/pricing")}>
                {item}
              </button>
            ))}
          </nav>
        </div>
        <div style={st.topNavRight}>
          <button style={st.navLinkHighlight} onClick={() => navigate("/schedule")}>Schedule</button>
          <button style={st.navLinkHighlight}>Join</button>
          <button style={st.navLinkHighlightDrop}>Host <ChevDown /></button>
          <button style={st.navLinkHighlightDrop}>Web App <ChevDown /></button>
          <div style={{ position: "relative" }}>
            <button style={st.avatar} onClick={() => setShowProfileMenu(p => !p)} title={user?.name}>
              {initials}
            </button>
            {showProfileMenu && (
              <div style={st.profileMenu}>
                <div style={st.profileMenuHeader}>
                  <p style={st.profileMenuName}>{user?.name}</p>
                  <p style={st.profileMenuEmail}>{user?.email}</p>
                </div>
                <button style={st.profileMenuItem} onClick={() => navigate("/profile")}>Profile</button>
                <button style={st.profileMenuItem} onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div style={st.bodyRow}>
        {/* ─── Sidebar ─── */}
        <Sidebar activeTab="Notes" />

        {/* ─── Main Content ─── */}
        <main style={st.main}>

          {/* ── Page Header ── */}
          <div style={st.pageHeader}>
            <div>
              <h1 style={st.pageTitle}>📝 My Notes</h1>
              <p style={st.pageSubtitle}>Your personal workspace for meeting notes, ideas, and projects.</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                style={{ ...st.outlineBtn, color: showArchived ? "#ef4444" : undefined, borderColor: showArchived ? "#ef4444" : undefined }}
                onClick={() => setShowArchived(a => !a)}
              >
                {showArchived ? "📁 Hide Archive" : "📁 Archive"}
              </button>
              <button style={st.primaryBtn} onClick={() => openNew()}>
                <PlusIcon /> New Note
              </button>
            </div>
          </div>

          {/* ── Search + Filter Bar ── */}
          <div style={st.filterRow}>
            <div style={st.searchWrap}>
              <span style={st.searchIcon}><SearchIcon /></span>
              <input
                style={st.searchInput}
                placeholder="Search notes by title, content or tag..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button style={st.clearSearch} onClick={() => setSearch("")}>×</button>
              )}
            </div>
            <button
              style={{ ...st.filterBtn, background: filterFav ? "#fef3c7" : undefined, color: filterFav ? "#92400e" : undefined, borderColor: filterFav ? "#fde68a" : undefined }}
              onClick={() => setFilterFav(f => !f)}
            >
              ⭐ Favorites
            </button>
          </div>

          {/* ── Summary Cards ── */}
          <div style={st.statsGrid}>
            {[
              { label: "Total Notes",    value: totalNotes,    icon: "📝", color: "#3b82f6", bg: "rgba(59,130,246,0.08)" },
              { label: "Favorites",      value: favCount,      icon: "⭐", color: "#eab308", bg: "rgba(234,179,8,0.08)" },
              { label: "Pinned",         value: pinnedCount,   icon: "📌", color: "#a855f7", bg: "rgba(168,85,247,0.08)" },
              { label: "Archived",       value: archivedCount, icon: "📁", color: "#64748b", bg: "rgba(100,116,139,0.08)" },
            ].map(card => (
              <div key={card.label} style={st.statCard}>
                <div style={{ ...st.statIcon, background: card.bg, color: card.color }}>{card.icon}</div>
                <div>
                  <div style={{ ...st.statValue, color: card.color }}>{card.value}</div>
                  <div style={st.statLabel}>{card.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Category Tabs ── */}
          <div style={st.categoryTabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  ...st.categoryTab,
                  background:   activeCategory === cat ? "var(--accent-blue,#1a6ff4)" : "var(--bg-card,#fff)",
                  color:        activeCategory === cat ? "#fff" : "var(--text-muted,#64748b)",
                  borderColor:  activeCategory === cat ? "var(--accent-blue,#1a6ff4)" : "var(--border-color,#e2e8f0)",
                  fontWeight:   activeCategory === cat ? 700 : 500,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Meeting Integration Banner ── */}
          {meetings.length > 0 && !showArchived && !search && activeCategory === "All" && (
            <div style={st.meetingBanner}>
              <div style={st.meetingBannerLeft}>
                <span style={st.meetingBannerIcon}><MeetingIcon /></span>
                <div>
                  <p style={st.meetingBannerTitle}>Create notes from your meetings</p>
                  <p style={st.meetingBannerSub}>Auto-fill meeting title, date, and action items</p>
                </div>
              </div>
              <div style={st.meetingPills}>
                {meetings.slice(0, 3).map((m, i) => (
                  <button key={i} style={st.meetingPill} onClick={() => createFromMeeting(m)}>
                    + {m.topic || "Meeting"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Pinned Notes ── */}
          {pinnedNotes.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 style={st.sectionTitle}>📌 Pinned Notes</h3>
              <div style={st.notesGrid}>
                {pinnedNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={openEdit}
                    onDelete={deleteNote}
                    onPin={togglePin}
                    onFav={toggleFav}
                    onArchive={toggleArchive}
                    onExport={exportNote}
                    colorOf={colorOf}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── Recent Notes (only when no filters active) ── */}
          {!search && activeCategory === "All" && !filterFav && !showArchived && recentNotes.length > 0 && (
            <section style={{ marginBottom: 28 }}>
              <h3 style={st.sectionTitle}>🕐 Recent Notes</h3>
              <div style={st.recentRow}>
                {recentNotes.map(note => (
                  <button key={note.id} style={st.recentChip} onClick={() => openEdit(note)}>
                    <span style={{ ...st.recentChipDot, background: colorOf(note.color).dot }} />
                    <div style={{ textAlign: "left" }}>
                      <div style={st.recentChipTitle}>{note.title || "Untitled"}</div>
                      <div style={st.recentChipTime}>{relativeTime(note.updatedAt)}</div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── All / Filtered Notes ── */}
          <section>
            <h3 style={st.sectionTitle}>
              {showArchived ? "📁 Archived Notes" : filterFav ? "⭐ Favorites" : search ? `Results for "${search}"` : "All Notes"}
              <span style={st.sectionCount}>{regularNotes.length}</span>
            </h3>

            {regularNotes.length === 0 ? (
              <div style={st.emptyState}>
                <div style={st.emptyIcon}>📝</div>
                <p style={st.emptyTitle}>
                  {showArchived ? "No archived notes" : search ? "No notes match your search" : "No notes yet"}
                </p>
                <p style={st.emptySubtitle}>
                  {!showArchived && !search && "Click \"New Note\" to create your first note!"}
                </p>
                {!showArchived && !search && (
                  <button style={st.primaryBtn} onClick={() => openNew()}>
                    <PlusIcon /> Create First Note
                  </button>
                )}
              </div>
            ) : (
              <div style={st.notesGrid}>
                {regularNotes.map(note => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={openEdit}
                    onDelete={deleteNote}
                    onPin={togglePin}
                    onFav={toggleFav}
                    onArchive={toggleArchive}
                    onExport={exportNote}
                    colorOf={colorOf}
                  />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ════════════ NOTE EDITOR MODAL ════════════ */}
      {modalOpen && (
        <div style={st.modalOverlay} onClick={() => setModalOpen(false)}>
          <div
            style={{
              ...st.modal,
              background: colorOf(draft.color).bg,
              borderColor: colorOf(draft.color).border,
              color: colorOf(draft.color).text,
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ ...st.modalHeader, borderColor: colorOf(draft.color).border }}>
              <h2 style={{ ...st.modalTitle, color: colorOf(draft.color).text }}>{editingNote ? "Edit Note" : "New Note"}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {savedMsg && <span style={st.savedMsg}>✓ Saved!</span>}
                <button style={{ ...st.iconBtn, color: colorOf(draft.color).text }} onClick={() => setModalOpen(false)}><CloseIcon /></button>
              </div>
            </div>

            {/* Title */}
            <input
              style={{ ...st.titleInput, color: colorOf(draft.color).text }}
              placeholder="Note title..."
              value={draft.title}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            />

            {/* Meta Row */}
            <div style={{ ...st.metaRow, borderColor: colorOf(draft.color).border }}>
              {/* Category */}
              <select
                style={st.metaSelect}
                value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              >
                {CATEGORIES.filter(c => c !== "All").map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Color picker */}
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>Color:</span>
                {NOTE_COLORS.map(c => (
                  <button
                    key={c.id}
                    title={c.label}
                    onClick={() => setDraft(d => ({ ...d, color: c.id }))}
                    style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: c.dot,
                      border: draft.color === c.id ? "2.5px solid #0f172a" : "2px solid transparent",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>

              {/* Meeting link */}
              {meetings.length > 0 && (
                <select
                  style={st.metaSelect}
                  value={draft.linkedMeeting || ""}
                  onChange={e => setDraft(d => ({ ...d, linkedMeeting: e.target.value || null }))}
                >
                  <option value="">No meeting link</option>
                  {meetings.map((m, i) => (
                    <option key={i} value={m.topic || m.meetingId}>
                      📅 {m.topic || "Meeting"} — {m.date}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Rich Text Toolbar */}
            <div style={{ ...st.toolbar, borderColor: colorOf(draft.color).border }}>
              {[
                { cmd: "bold",           icon: <BoldIcon />,   title: "Bold (Ctrl+B)" },
                { cmd: "italic",         icon: <ItalicIcon />, title: "Italic (Ctrl+I)" },
                { cmd: "underline",      icon: <UnderIcon />,  title: "Underline (Ctrl+U)" },
              ].map(({ cmd, icon, title }) => (
                <button key={cmd} style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec(cmd); }} title={title}>
                  {icon}
                </button>
              ))}
              <span style={st.toolbarDivider} />
              <button style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec("insertUnorderedList"); }} title="Bullet List"><BulletIcon /></button>
              <button style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec("insertOrderedList"); }} title="Numbered List">1.</button>
              <button style={st.toolbarBtnText} onMouseDown={e => {
                e.preventDefault();
                exec("insertHTML", "<input type='checkbox' disabled /> ");
              }} title="Checkbox">☑</button>
              <span style={st.toolbarDivider} />
              <button style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "h3"); }} title="Heading">H</button>
              <button style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec("formatBlock", "p"); }} title="Paragraph">¶</button>
              <button style={st.toolbarBtn} onMouseDown={e => {
                e.preventDefault();
                const url = prompt("Enter link URL:");
                if (url) exec("createLink", url);
              }} title="Insert Link">🔗</button>
              <button style={st.toolbarBtn} onMouseDown={e => { e.preventDefault(); exec("removeFormat"); }} title="Clear Formatting">Tx</button>
            </div>

            {/* Content Editor */}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              style={{ ...st.editor, color: colorOf(draft.color).text }}
              data-placeholder="Start writing your note..."
            />

            {/* Tags */}
            <div style={{ ...st.tagsSection, borderColor: colorOf(draft.color).border }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}><TagIcon /> Tags:</span>
                {draft.tags.map(tag => (
                  <span key={tag} style={st.tagChip}>
                    #{tag}
                    <button style={st.tagRemove} onClick={() => removeTag(tag)}>×</button>
                  </span>
                ))}
                <input
                  style={st.tagInput}
                  placeholder="Add tag (Enter)"
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ ...st.modalFooter, borderColor: colorOf(draft.color).border }}>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...st.checkLabel, color: colorOf(draft.color).text }}>
                  <input type="checkbox" checked={draft.isPinned} onChange={e => setDraft(d => ({ ...d, isPinned: e.target.checked }))} style={{ accentColor: "var(--accent-blue)" }} />
                  📌 Pin
                </label>
                <label style={{ ...st.checkLabel, color: colorOf(draft.color).text }}>
                  <input type="checkbox" checked={draft.isFavorite} onChange={e => setDraft(d => ({ ...d, isFavorite: e.target.checked }))} style={{ accentColor: "#eab308" }} />
                  ⭐ Favorite
                </label>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <button style={st.outlineBtn} onClick={() => setModalOpen(false)}>Cancel</button>
                <button style={st.primaryBtn} onClick={saveDraft}>
                  {editingNote ? "Update Note" : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   NOTE CARD COMPONENT
   ════════════════════════════════════════════════════════════ */
function NoteCard({ note, onEdit, onDelete, onPin, onFav, onArchive, onExport, colorOf }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const col = colorOf(note.color);
  const preview = stripHtml(note.content).slice(0, 120);

  return (
    <div
      style={{
        ...st.noteCard,
        background: col.bg,
        borderColor: col.border,
        opacity: note.isArchived ? 0.7 : 1,
      }}
    >
      {/* Card Top */}
      <div style={st.noteCardTop}>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={{ ...st.iconBtnSm, color: note.isFavorite ? "#eab308" : "var(--text-muted)" }}
            onClick={() => onFav(note.id)}
            title="Favorite"
          >
            <StarIcon filled={note.isFavorite} />
          </button>
          <button
            style={{ ...st.iconBtnSm, color: note.isPinned ? "#a855f7" : "var(--text-muted)" }}
            onClick={() => onPin(note.id)}
            title="Pin"
          >
            <PinIcon filled={note.isPinned} />
          </button>
        </div>
        <div style={{ position: "relative" }}>
          <button style={st.iconBtnSm} onClick={() => setMenuOpen(m => !m)}>⋯</button>
          {menuOpen && (
            <div style={st.cardMenu} onMouseLeave={() => setMenuOpen(false)}>
              <button style={st.cardMenuItem} onClick={() => { onEdit(note); setMenuOpen(false); }}>
                <EditIcon /> Edit
              </button>
              <button style={st.cardMenuItem} onClick={() => { onExport(note); setMenuOpen(false); }}>
                <ExportIcon /> Export
              </button>
              <button style={st.cardMenuItem} onClick={() => { onArchive(note.id); setMenuOpen(false); }}>
                <ArchiveIcon /> {note.isArchived ? "Unarchive" : "Archive"}
              </button>
              <button style={{ ...st.cardMenuItem, color: "#ef4444" }} onClick={() => { onDelete(note.id); setMenuOpen(false); }}>
                <TrashIcon /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 style={{ ...st.noteTitle, color: col.text }} onClick={() => onEdit(note)}>
        {note.title || "Untitled Note"}
      </h4>

      {/* Preview */}
      <p style={{ ...st.notePreview, color: col.text, opacity: 0.85 }}>{preview || "No content yet..."}</p>

      {/* Linked meeting badge */}
      {note.linkedMeeting && (
        <div style={st.linkedMeetingBadge}>
          <MeetingIcon /> {note.linkedMeeting}
        </div>
      )}

      {/* Tags */}
      {note.tags.length > 0 && (
        <div style={st.noteTags}>
          {note.tags.slice(0, 3).map(t => (
            <span key={t} style={st.noteTag}>#{t}</span>
          ))}
          {note.tags.length > 3 && <span style={st.noteTag}>+{note.tags.length - 3}</span>}
        </div>
      )}

      {/* Footer */}
      <div style={st.noteFooter}>
        <span style={st.noteCategoryBadge}>{note.category}</span>
        <span style={st.noteTime}>{relativeTime(note.updatedAt)}</span>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   STYLES
   ════════════════════════════════════════════════════════════ */
const st = {
  root: { display: "flex", flexDirection: "column", minHeight: "100vh", background: "var(--bg-primary,#f8fafc)", fontFamily: "'Inter','Segoe UI',sans-serif", color: "var(--text-secondary,#1e293b)" },

  /* ── Nav ── */
  topNav: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--nav-bg,#fff)", borderBottom: "1px solid var(--nav-border,#e2e8f0)", padding: "0 24px", height: 56, position: "sticky", top: 0, zIndex: 100 },
  topNavLeft: { display: "flex", alignItems: "center", gap: 24 },
  logo: { fontSize: 22, fontWeight: 900, color: "var(--accent-blue,#1a6ff4)", letterSpacing: "-0.5px", fontStyle: "italic" },
  navLinks: { display: "flex", gap: 4 },
  navLink: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-nav,#475569)", padding: "6px 10px", borderRadius: 8, fontWeight: 500, fontFamily: "inherit" },
  topNavRight: { display: "flex", alignItems: "center", gap: 8 },
  navLinkHighlight: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary,#1e293b)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, fontFamily: "inherit" },
  navLinkHighlightDrop: { background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-secondary,#1e293b)", padding: "6px 12px", borderRadius: 8, fontWeight: 600, display: "flex", alignItems: "center", gap: 4, fontFamily: "inherit" },
  avatar: { width: 34, height: 34, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit" },
  profileMenu: { position: "absolute", right: 0, top: 44, background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 14, boxShadow: "0 8px 32px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 200, padding: "8px 0" },
  profileMenuHeader: { padding: "10px 16px 8px", borderBottom: "1px solid var(--border-color,#f1f5f9)" },
  profileMenuName: { fontWeight: 700, fontSize: 14, color: "var(--text-primary,#0f172a)", margin: 0 },
  profileMenuEmail: { fontSize: 12, color: "var(--text-muted,#94a3b8)", margin: "2px 0 0" },
  profileMenuItem: { display: "block", width: "100%", background: "none", border: "none", textAlign: "left", padding: "9px 16px", fontSize: 14, color: "var(--text-nav,#334155)", cursor: "pointer", fontFamily: "inherit" },

  /* ── Body / Sidebar ── */
  bodyRow: { display: "flex", flex: 1 },
  sidebar: { width: 220, background: "var(--bg-sidebar,#fff)", borderRight: "1px solid var(--border-color,#e2e8f0)", minHeight: "calc(100vh - 56px)", flexShrink: 0 },
  sidebarInner: { padding: "16px 8px" },
  sidebarGroupLabel: { fontSize: 11, fontWeight: 700, color: "var(--text-muted,#94a3b8)", textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 12px", marginBottom: 4, marginTop: 0, display: "block" },
  sidebarList: { listStyle: "none", margin: 0, padding: 0 },
  sidebarItem: { margin: "1px 0" },
  sidebarBtn: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--sidebar-text,#1e293b)", fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: "inherit", transition: "background 0.15s" },
  sidebarIcons: { display: "flex", alignItems: "center", gap: 4 },
  newBadge: { fontSize: 10, fontWeight: 700, color: "#fff", background: "#10b981", borderRadius: 6, padding: "1px 6px" },
  externalIcon: { color: "var(--text-muted,#94a3b8)", display: "inline-flex" },
  sidebarDivider: { height: 1, background: "var(--border-color,#e2e8f0)", margin: "8px 12px" },
  sidebarCollapsible: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "8px 12px", borderRadius: 10, cursor: "pointer", fontSize: 13.5, color: "var(--text-nav,#1e293b)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" },
  subMenu: { listStyle: "none", margin: "2px 0 2px 28px", padding: 0 },
  subMenuItem: { width: "100%", background: "none", border: "none", textAlign: "left", padding: "7px 12px", borderRadius: 8, cursor: "pointer", fontSize: 13, color: "var(--text-muted,#475569)", fontFamily: "inherit" },

  /* ── Main ── */
  main: { flex: 1, padding: "32px 36px", overflowY: "auto", background: "var(--bg-secondary,#f8fafc)" },

  /* ── Page Header ── */
  pageHeader: { display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 },
  pageTitle: { margin: "0 0 4px", fontSize: 26, fontWeight: 800, color: "var(--text-primary,#0f172a)", letterSpacing: "-0.5px" },
  pageSubtitle: { margin: 0, fontSize: 14, color: "var(--text-muted,#64748b)" },

  /* ── Buttons ── */
  primaryBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 24, border: "none", background: "var(--accent-blue,#1a6ff4)", color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer", boxShadow: "0 4px 14px rgba(26,111,244,0.25)", fontFamily: "inherit", transition: "opacity 0.15s" },
  outlineBtn: { display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 24, border: "1.5px solid var(--border-input,#cbd5e1)", background: "var(--bg-card,#fff)", color: "var(--text-secondary,#1e293b)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" },
  iconBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted,#94a3b8)", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, fontFamily: "inherit" },

  /* ── Filter bar ── */
  filterRow: { display: "flex", gap: 10, marginBottom: 20, alignItems: "center" },
  searchWrap: { display: "flex", alignItems: "center", background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 12, padding: "0 12px", flex: 1, gap: 8 },
  searchIcon: { color: "var(--text-muted,#94a3b8)", display: "flex", alignItems: "center" },
  searchInput: { border: "none", outline: "none", background: "transparent", fontSize: 14, color: "var(--text-primary,#0f172a)", flex: 1, padding: "10px 0", fontFamily: "inherit" },
  clearSearch: { background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1 },
  filterBtn: { padding: "9px 14px", borderRadius: 12, border: "1.5px solid var(--border-color,#e2e8f0)", background: "var(--bg-card,#fff)", color: "var(--text-muted,#64748b)", fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" },

  /* ── Stats ── */
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 24 },
  statCard: { display: "flex", alignItems: "center", gap: 14, background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 14, padding: "16px 20px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
  statIcon: { width: 40, height: 40, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 800, lineHeight: 1.1 },
  statLabel: { fontSize: 11.5, fontWeight: 600, color: "var(--text-muted,#64748b)" },

  /* ── Category tabs ── */
  categoryTabs: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 },
  categoryTab: { padding: "7px 16px", borderRadius: 20, border: "1.5px solid", fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" },

  /* ── Meeting banner ── */
  meetingBanner: { display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg,#eff6ff,#eef2ff)", border: "1px solid #c7d2fe", borderRadius: 14, padding: "14px 20px", marginBottom: 24, gap: 12, flexWrap: "wrap" },
  meetingBannerLeft: { display: "flex", alignItems: "center", gap: 10 },
  meetingBannerIcon: { width: 32, height: 32, borderRadius: 8, background: "#e0e7ff", color: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center" },
  meetingBannerTitle: { margin: 0, fontSize: 13.5, fontWeight: 700, color: "#3730a3" },
  meetingBannerSub: { margin: 0, fontSize: 12, color: "#6366f1" },
  meetingPills: { display: "flex", gap: 8, flexWrap: "wrap" },
  meetingPill: { padding: "6px 14px", borderRadius: 20, border: "1.5px solid #a5b4fc", background: "#fff", color: "#4f46e5", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" },

  /* ── Section ── */
  sectionTitle: { margin: "0 0 14px", fontSize: 15, fontWeight: 700, color: "var(--text-primary,#0f172a)", display: "flex", alignItems: "center", gap: 8 },
  sectionCount: { background: "var(--bg-input,#f1f5f9)", borderRadius: 20, padding: "2px 8px", fontSize: 12, fontWeight: 700, color: "var(--text-muted)" },

  /* ── Recent row ── */
  recentRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 28 },
  recentChip: { display: "flex", alignItems: "center", gap: 10, background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 12, padding: "10px 14px", cursor: "pointer", fontFamily: "inherit", transition: "box-shadow 0.15s", minWidth: 160 },
  recentChipDot: { width: 8, height: 8, borderRadius: "50%", flexShrink: 0 },
  recentChipTitle: { fontSize: 13, fontWeight: 700, color: "var(--text-primary,#0f172a)", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  recentChipTime: { fontSize: 11, color: "var(--text-muted,#94a3b8)" },

  /* ── Notes grid ── */
  notesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(270px,1fr))", gap: 16 },
  noteCard: { borderRadius: 16, border: "1.5px solid", padding: 20, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 2px 8px rgba(0,0,0,0.05)", transition: "box-shadow 0.2s, transform 0.15s", cursor: "default" },
  noteCardTop: { display: "flex", justifyContent: "space-between", alignItems: "center" },
  noteTitle: { margin: 0, fontSize: 15, fontWeight: 700, color: "var(--text-primary,#0f172a)", cursor: "pointer", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  notePreview: { margin: 0, fontSize: 13, color: "var(--text-muted,#64748b)", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" },
  linkedMeetingBadge: { display: "inline-flex", alignItems: "center", gap: 5, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: "#1d4ed8" },
  noteTags: { display: "flex", gap: 6, flexWrap: "wrap" },
  noteTag: { background: "var(--bg-input,#f1f5f9)", borderRadius: 20, padding: "2px 8px", fontSize: 11, fontWeight: 600, color: "var(--text-muted,#475569)" },
  noteFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(0,0,0,0.06)" },
  noteCategoryBadge: { fontSize: 10.5, fontWeight: 700, color: "var(--accent-blue,#1a6ff4)", background: "var(--accent-blue-bg,#eff6ff)", borderRadius: 20, padding: "2px 8px" },
  noteTime: { fontSize: 11, color: "var(--text-muted,#94a3b8)" },
  iconBtnSm: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, color: "var(--text-muted,#94a3b8)", fontFamily: "inherit", fontSize: 16 },
  cardMenu: { position: "absolute", right: 0, top: 28, background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 140, zIndex: 50, padding: "6px 0" },
  cardMenuItem: { display: "flex", alignItems: "center", gap: 8, width: "100%", background: "none", border: "none", padding: "8px 14px", fontSize: 13, cursor: "pointer", color: "var(--text-nav,#334155)", fontFamily: "inherit", textAlign: "left" },

  /* ── Empty state ── */
  emptyState: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "64px 24px", textAlign: "center", background: "var(--bg-card,#fff)", border: "1px solid var(--border-color,#e2e8f0)", borderRadius: 20 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: "var(--text-primary,#0f172a)", margin: "0 0 6px" },
  emptySubtitle: { fontSize: 13.5, color: "var(--text-muted,#64748b)", margin: "0 0 20px" },

  /* ── Modal ── */
  modalOverlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(2px)" },
  modal: { background: "var(--bg-card,#fff)", borderRadius: 20, width: "min(90vw,820px)", maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.2)", overflow: "hidden" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px 12px", borderBottom: "1px solid var(--border-color,#e2e8f0)" },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 800, color: "var(--text-primary,#0f172a)" },
  savedMsg: { fontSize: 13, fontWeight: 700, color: "#10b981" },
  titleInput: { border: "none", outline: "none", fontSize: 20, fontWeight: 800, color: "var(--text-primary,#0f172a)", padding: "14px 24px 8px", background: "transparent", fontFamily: "inherit", width: "100%", boxSizing: "border-box" },
  metaRow: { display: "flex", gap: 10, padding: "8px 24px 10px", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border-color,#e2e8f0)" },
  metaSelect: { padding: "6px 10px", borderRadius: 8, border: "1px solid var(--border-input,#cbd5e1)", background: "var(--bg-input,#f8fafc)", color: "var(--text-primary,#0f172a)", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" },

  /* ── Toolbar ── */
  toolbar: { display: "flex", alignItems: "center", gap: 2, padding: "8px 24px", borderBottom: "1px solid var(--border-color,#e2e8f0)", flexWrap: "wrap" },
  toolbarBtn: { background: "none", border: "none", cursor: "pointer", padding: "5px 7px", borderRadius: 6, color: "var(--text-secondary,#1e293b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: "inherit", transition: "background 0.1s" },
  toolbarBtnText: { background: "none", border: "none", cursor: "pointer", padding: "5px 8px", borderRadius: 6, color: "var(--text-secondary,#1e293b)", fontSize: 14, fontWeight: 700, fontFamily: "inherit" },
  toolbarDivider: { width: 1, height: 18, background: "var(--border-color,#e2e8f0)", margin: "0 4px" },

  /* ── Editor ── */
  editor: {
    flex: 1, minHeight: 200, maxHeight: 320, overflowY: "auto",
    padding: "16px 24px", outline: "none", fontSize: 14.5,
    lineHeight: 1.7, color: "var(--text-primary,#0f172a)",
    fontFamily: "inherit",
  },

  /* ── Tags section ── */
  tagsSection: { padding: "10px 24px", borderTop: "1px solid var(--border-color,#e2e8f0)" },
  tagChip: { display: "inline-flex", alignItems: "center", gap: 4, background: "var(--bg-input,#f1f5f9)", borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "var(--text-secondary,#1e293b)" },
  tagRemove: { background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, color: "var(--text-muted)", padding: 0, marginLeft: 2 },
  tagInput: { border: "none", outline: "none", background: "transparent", fontSize: 12, fontFamily: "inherit", color: "var(--text-primary,#0f172a)", minWidth: 100 },

  /* ── Modal footer ── */
  modalFooter: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid var(--border-color,#e2e8f0)" },
  checkLabel: { display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-secondary,#1e293b)", cursor: "pointer" },
};
