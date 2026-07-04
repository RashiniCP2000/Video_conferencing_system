import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import TopNav from "../components/TopNav.jsx";
import { getUserStorageKey } from "../utils/userStorage.js";
import Sidebar from "../components/Sidebar.jsx";

/* ─── Icons ─────────────────────────────────────────────────────── */
const ChevronDown  = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M7 10l5 5 5-5z"/></svg>;
const ChevronRight = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8.59 16.34l4.58-4.59-4.58-4.59L10 5.75l6 6-6 6z"/></svg>;
const ExternalIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M19 19H5V5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>;
const HomeIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>;
const PlusIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>;
const SearchIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>;
const TrashIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>;
const EditIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>;
const CheckIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>;
const BellIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>;
const LinkIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>;
const CloseIcon    = () => <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>;
const ListIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>;
const KanbanIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M4 4h4v12H4zm6 0h4v8h-4zm6 0h4v16h-4z"/></svg>;
const DragIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></svg>;
const UserIcon     = () => <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>;

/* ─── Sidebar items ──────────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

/* ─── Constants ──────────────────────────────────────────────────── */
const PRIORITY_COLORS = {
  low:    { bg: "rgba(16,185,129,0.12)", color: "#10b981", label: "Low" },
  medium: { bg: "rgba(245,158,11,0.12)", color: "#f59e0b", label: "Medium" },
  high:   { bg: "rgba(239,68,68,0.12)",  color: "#ef4444", label: "High" },
};

const STATUS_COLUMNS = [
  { id: "todo",       label: "To Do",       color: "#64748b", bg: "rgba(100,116,139,0.1)" },
  { id: "inprogress", label: "In Progress", color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  { id: "completed",  label: "Completed",   color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "completed") return false;
  return new Date(task.dueDate) < new Date(new Date().toDateString());
}

/* ─── Notification Toast ─────────────────────────────────────────── */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 2000,
      background: type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#3b82f6",
      color: "#fff", padding: "12px 20px", borderRadius: 10,
      fontSize: 14, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
      display: "flex", alignItems: "center", gap: 8, minWidth: 240,
      animation: "slideIn 0.3s ease",
    }}>
      <BellIcon />{message}
      <button onClick={onClose} style={{ background:"none", border:"none", color:"#fff", cursor:"pointer", marginLeft:"auto", opacity:0.8 }}><CloseIcon /></button>
    </div>
  );
}

/* ─── Task Card (Shared) ─────────────────────────────────────────── */
function TaskCard({ task, onEdit, onDelete, onStatusChange, draggable, onDragStart }) {
  const pri = PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium;
  const overdue = isOverdue(task);
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      style={{
        ...st.taskCard,
        borderLeft: `4px solid ${overdue ? "#ef4444" : pri.color}`,
        opacity: task.status === "completed" ? 0.75 : 1,
        cursor: draggable ? "grab" : "default",
      }}
    >
      {/* Top row */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, flex:1 }}>
          <button
            onClick={() => onStatusChange(task.id, task.status === "completed" ? "todo" : "completed")}
            style={{
              ...st.checkCircle,
              background: task.status === "completed" ? "#10b981" : "transparent",
              borderColor: task.status === "completed" ? "#10b981" : "var(--border-input,#cbd5e1)",
            }}
            title={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
          >
            {task.status === "completed" && <CheckIcon />}
          </button>
          <h4 style={{
            ...st.taskTitle,
            textDecoration: task.status === "completed" ? "line-through" : "none",
            color: task.status === "completed" ? "var(--text-muted,#94a3b8)" : "var(--text-primary,#0f172a)",
          }}>
            {task.title}
          </h4>
        </div>
        {draggable && <span style={{ color:"var(--text-muted,#94a3b8)", display:"flex" }}><DragIcon /></span>}
      </div>

      {/* Description */}
      {task.description && (
        <p style={st.taskDesc}>{task.description}</p>
      )}

      {/* Meta chips */}
      <div style={st.taskMeta}>
        <span style={{ ...st.chip, background: pri.bg, color: pri.color }}>{pri.label}</span>
        {task.dueDate && (
          <span style={{ ...st.chip, background: overdue ? "rgba(239,68,68,0.1)" : "var(--bg-primary,#f1f5f9)", color: overdue ? "#ef4444" : "var(--text-muted,#64748b)" }}>
            📅 {task.dueDate}{overdue ? " · Overdue" : ""}
          </span>
        )}
        {task.assignee && (
          <span style={{ ...st.chip, background:"var(--bg-primary,#f1f5f9)", color:"var(--text-muted,#64748b)" }}>
            <UserIcon /> {task.assignee}
          </span>
        )}
        {task.linkedMeeting && (
          <span style={{ ...st.chip, background:"rgba(59,130,246,0.08)", color:"#3b82f6" }}>
            <LinkIcon /> {task.linkedMeeting}
          </span>
        )}
      </div>

      {/* Actions */}
      <div style={st.taskActions}>
        <button onClick={() => onEdit(task)} style={st.iconBtn} title="Edit task"><EditIcon /></button>
        <button onClick={() => onDelete(task.id)} style={{ ...st.iconBtn, color:"#ef4444" }} title="Delete task"><TrashIcon /></button>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */
export default function Tasks() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const tasksStorageKey = getUserStorageKey(user, "meetnova_tasks");
  const meetingsStorageKey = getUserStorageKey(user, "meetnova_scheduled_meetings");



  /* ── View Mode ── */
  const [viewMode, setViewMode] = useState("list"); // "list" | "kanban"

  /* ── Tasks data ── */
  const [tasks, setTasks] = useState([]);

  /* ── Modal ── */
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  /* ── Form fields ── */
  const [fTitle, setFTitle]             = useState("");
  const [fDesc, setFDesc]               = useState("");
  const [fPriority, setFPriority]       = useState("medium");
  const [fStatus, setFStatus]           = useState("todo");
  const [fDueDate, setFDueDate]         = useState("");
  const [fAssignee, setFAssignee]       = useState("");
  const [fLinkedMeeting, setFLinkedMeeting] = useState("");
  const [fNotes, setFNotes]             = useState("");

  /* ── Filters ── */
  const [filterStatus, setFilterStatus]     = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery]       = useState("");

  /* ── Toast ── */
  const [toast, setToast] = useState(null);

  /* ── Drag state (Kanban) ── */
  const dragTaskId  = useRef(null);
  const dragOverCol = useRef(null);

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  /* ── Load tasks from localStorage ── */
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(tasksStorageKey) || "[]");
      setTasks(saved);
    } catch { setTasks([]); }
  }, [tasksStorageKey, user]);

  /* ── Persist tasks ── */
  const persist = (list) => {
    setTasks(list);
    localStorage.setItem(tasksStorageKey, JSON.stringify(list));
  };

  /* ── Reminders check ── */
  useEffect(() => {
    const overdueTasks = tasks.filter(isOverdue);
    if (overdueTasks.length > 0) {
      setToast({ message: `You have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}!`, type: "error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Meetings list for linking ── */
  const [meetings, setMeetings] = useState([]);
  useEffect(() => {
    try {
      const m = JSON.parse(localStorage.getItem(meetingsStorageKey) || "[]");
      setMeetings(m);
    } catch { /* ignore */ }
  }, [meetingsStorageKey, user]);

  const showToast = (message, type = "success") => setToast({ message, type });


  const handleSidebarClick = (label) => {
    if (label === "Meetings")   navigate("/meetings");
    else if (label === "Recordings") navigate("/recordings");
    else if (label === "Calendar")   navigate("/calendar");
    else if (label === "Scheduler")  navigate("/schedule");
    else if (label === "Tasks")      navigate("/tasks");
    else if (label === "Notes")      navigate("/notes");
    else if (label === "Whiteboard") navigate("/whiteboard");
  };

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditingTask(null);
    setFTitle(""); setFDesc(""); setFPriority("medium"); setFStatus("todo");
    setFDueDate(""); setFAssignee(""); setFLinkedMeeting(""); setFNotes("");
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditingTask(task);
    setFTitle(task.title || "");
    setFDesc(task.description || "");
    setFPriority(task.priority || "medium");
    setFStatus(task.status || "todo");
    setFDueDate(task.dueDate || "");
    setFAssignee(task.assignee || "");
    setFLinkedMeeting(task.linkedMeeting || "");
    setFNotes(task.notes || "");
    setShowModal(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!fTitle.trim()) return;
    const newTask = {
      id: editingTask ? editingTask.id : generateId(),
      title: fTitle.trim(),
      description: fDesc.trim(),
      priority: fPriority,
      status: fStatus,
      dueDate: fDueDate,
      assignee: fAssignee.trim(),
      linkedMeeting: fLinkedMeeting.trim(),
      notes: fNotes.trim(),
      createdAt: editingTask ? editingTask.createdAt : new Date().toISOString(),
    };
    let updated;
    if (editingTask) {
      updated = tasks.map(t => t.id === editingTask.id ? newTask : t);
      showToast("Task updated successfully!");
    } else {
      updated = [newTask, ...tasks];
      showToast("Task created successfully!");
    }
    persist(updated);
    setShowModal(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Delete this task?")) return;
    persist(tasks.filter(t => t.id !== id));
    showToast("Task deleted.", "info");
  };

  const handleStatusChange = (id, newStatus) => {
    const updated = tasks.map(t => t.id === id ? { ...t, status: newStatus } : t);
    persist(updated);
    if (newStatus === "completed") showToast("Task marked as completed! 🎉");
  };

  /* ── Drag & Drop (Kanban) ── */
  const handleDragStart = (taskId) => { dragTaskId.current = taskId; };
  const handleDragOver  = (e, colId) => { e.preventDefault(); dragOverCol.current = colId; };
  const handleDrop = () => {
    if (!dragTaskId.current || !dragOverCol.current) return;
    const updated = tasks.map(t =>
      t.id === dragTaskId.current ? { ...t, status: dragOverCol.current } : t
    );
    persist(updated);
    if (dragOverCol.current === "completed") showToast("Task moved to Completed! 🎉");
    dragTaskId.current = null; dragOverCol.current = null;
  };

  /* ── Derived stats ── */
  const stats = {
    total:      tasks.length,
    todo:       tasks.filter(t => t.status === "todo").length,
    inprogress: tasks.filter(t => t.status === "inprogress").length,
    completed:  tasks.filter(t => t.status === "completed").length,
    overdue:    tasks.filter(isOverdue).length,
  };

  /* ── Filtered tasks ── */
  const filtered = tasks.filter(t => {
    if (filterStatus !== "all" && t.status !== filterStatus) return false;
    if (filterPriority !== "all" && t.priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.title.toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q) ||
        (t.assignee || "").toLowerCase().includes(q);
    }
    return true;
  });

  const getColumnTasks = (colId) => filtered.filter(t => t.status === colId);

  return (
    <div style={st.root}>
      {/* ─── Keyframes ─── */}
      <style>{`
        @keyframes slideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn  { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ═══ TOP NAVIGATION ═══ */}
      <TopNav />

      <div style={st.bodyRow}>
        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeTab="Tasks" />

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>

          {/* ─── Page Header ─── */}
          <div style={st.pageHeader}>
            <div>
              <h1 style={st.pageTitle}>Tasks</h1>
              <p style={st.pageSubtitle}>Manage action items, assignments, and deadlines from your meetings.</p>
            </div>
            <button onClick={openCreate} style={st.primaryBtn}>
              <PlusIcon /> New Task
            </button>
          </div>

          {/* ─── Stats Dashboard ─── */}
          <div style={st.statsRow}>
            {[
              { label:"Total Tasks",    value: stats.total,      color:"#3b82f6", bg:"rgba(59,130,246,0.1)",  icon:"📋" },
              { label:"To Do",          value: stats.todo,       color:"#64748b", bg:"rgba(100,116,139,0.1)", icon:"🔲" },
              { label:"In Progress",    value: stats.inprogress, color:"#f59e0b", bg:"rgba(245,158,11,0.1)",  icon:"⚙️" },
              { label:"Completed",      value: stats.completed,  color:"#10b981", bg:"rgba(16,185,129,0.1)",  icon:"✅" },
              { label:"Overdue",        value: stats.overdue,    color:"#ef4444", bg:"rgba(239,68,68,0.1)",   icon:"🚨" },
            ].map(s => (
              <div key={s.label} style={{ ...st.statCard, borderTop:`3px solid ${s.color}` }}>
                <span style={{ fontSize:24 }}>{s.icon}</span>
                <span style={{ ...st.statVal, color: s.color }}>{s.value}</span>
                <span style={st.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* ─── Toolbar: Search, Filters, View Toggle ─── */}
          <div style={st.toolbar}>
            <div style={st.searchBox}>
              <span style={st.searchIcon}><SearchIcon /></span>
              <input
                type="text"
                placeholder="Search tasks by title, description or assignee…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={st.searchInput}
              />
            </div>
            <div style={st.filters}>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={st.filterSelect}>
                <option value="all">All Statuses</option>
                <option value="todo">To Do</option>
                <option value="inprogress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={st.filterSelect}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div style={st.viewToggle}>
              <button
                onClick={() => setViewMode("list")}
                style={{ ...st.viewToggleBtn, background: viewMode === "list" ? "var(--accent-blue,#1a6ff4)" : "none", color: viewMode === "list" ? "#fff" : "var(--text-secondary,#334155)" }}
                title="List View"
              >
                <ListIcon /> List
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                style={{ ...st.viewToggleBtn, background: viewMode === "kanban" ? "var(--accent-blue,#1a6ff4)" : "none", color: viewMode === "kanban" ? "#fff" : "var(--text-secondary,#334155)" }}
                title="Kanban View"
              >
                <KanbanIcon /> Board
              </button>
            </div>
          </div>

          {/* ─── LIST VIEW ─── */}
          {viewMode === "list" && (
            <div style={{ display:"flex", flexDirection:"column", gap:12, animation:"fadeIn 0.3s ease" }}>
              {filtered.length === 0 ? (
                <div style={st.emptyState}>
                  <span style={{ fontSize:48 }}>📋</span>
                  <h3 style={{ color:"var(--text-primary,#0f172a)", margin:0 }}>No tasks found</h3>
                  <p style={{ color:"var(--text-muted,#64748b)", margin:0 }}>Create your first task or adjust your filters.</p>
                  <button onClick={openCreate} style={st.primaryBtn}><PlusIcon /> Create Task</button>
                </div>
              ) : (
                filtered.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    draggable={false}
                  />
                ))
              )}
            </div>
          )}

          {/* ─── KANBAN VIEW ─── */}
          {viewMode === "kanban" && (
            <div style={st.kanbanBoard}>
              {STATUS_COLUMNS.map(col => (
                <div
                  key={col.id}
                  onDragOver={e => handleDragOver(e, col.id)}
                  onDrop={handleDrop}
                  style={st.kanbanCol}
                >
                  <div style={st.kanbanColHeader}>
                    <span style={{ ...st.kanbanColDot, background: col.color }} />
                    <span style={{ ...st.kanbanColLabel, color: col.color }}>{col.label}</span>
                    <span style={{ ...st.kanbanColCount, background: col.bg, color: col.color }}>
                      {getColumnTasks(col.id).length}
                    </span>
                  </div>
                  <div style={st.kanbanColBody}>
                    {getColumnTasks(col.id).map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={openEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                        draggable
                        onDragStart={() => handleDragStart(task.id)}
                      />
                    ))}
                    {getColumnTasks(col.id).length === 0 && (
                      <div style={st.kanbanEmpty}>
                        Drop tasks here or create a new one.
                      </div>
                    )}
                  </div>
                  {col.id === "todo" && (
                    <button onClick={openCreate} style={st.kanbanAddBtn}><PlusIcon /> Add Task</button>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ═══ CREATE / EDIT MODAL ═══ */}
      {showModal && (
        <div style={st.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={st.modalBox} onClick={e => e.stopPropagation()}>
            <div style={st.modalHeader}>
              <h2 style={st.modalTitle}>{editingTask ? "Edit Task" : "Create New Task"}</h2>
              <button onClick={() => setShowModal(false)} style={st.modalCloseBtn}><CloseIcon /></button>
            </div>

            <form onSubmit={handleSave} style={st.modalForm}>
              {/* Title */}
              <div style={st.formGroup}>
                <label style={st.formLabel}>Task Title <span style={{color:"#ef4444"}}>*</span></label>
                <input
                  type="text"
                  value={fTitle}
                  onChange={e => setFTitle(e.target.value)}
                  placeholder="e.g. Prepare Q3 report slides"
                  required
                  style={st.formInput}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div style={st.formGroup}>
                <label style={st.formLabel}>Description</label>
                <textarea
                  value={fDesc}
                  onChange={e => setFDesc(e.target.value)}
                  placeholder="Describe the task in detail…"
                  rows={3}
                  style={st.formTextarea}
                />
              </div>

              {/* Priority & Status row */}
              <div style={st.formRow}>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Priority</label>
                  <select value={fPriority} onChange={e => setFPriority(e.target.value)} style={st.formSelect}>
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Status</label>
                  <select value={fStatus} onChange={e => setFStatus(e.target.value)} style={st.formSelect}>
                    <option value="todo">To Do</option>
                    <option value="inprogress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Due Date & Assignee row */}
              <div style={st.formRow}>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Due Date</label>
                  <input
                    type="date"
                    value={fDueDate}
                    onChange={e => setFDueDate(e.target.value)}
                    style={st.formInput}
                  />
                </div>
                <div style={st.formGroup}>
                  <label style={st.formLabel}>Assign To</label>
                  <input
                    type="text"
                    value={fAssignee}
                    onChange={e => setFAssignee(e.target.value)}
                    placeholder="Name or email"
                    style={st.formInput}
                  />
                </div>
              </div>

              {/* Link to Meeting */}
              <div style={st.formGroup}>
                <label style={st.formLabel}>Link to Meeting</label>
                <select value={fLinkedMeeting} onChange={e => setFLinkedMeeting(e.target.value)} style={st.formSelect}>
                  <option value="">— Not linked —</option>
                  {meetings.map(m => (
                    <option key={m.meetingId} value={m.topic}>{m.topic} ({m.date})</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div style={st.formGroup}>
                <label style={st.formLabel}>Additional Notes</label>
                <textarea
                  value={fNotes}
                  onChange={e => setFNotes(e.target.value)}
                  placeholder="Any extra context or meeting action items…"
                  rows={2}
                  style={st.formTextarea}
                />
              </div>

              <div style={st.modalActions}>
                <button type="submit" style={st.primaryBtn}>{editingTask ? "Save Changes" : "Create Task"}</button>
                <button type="button" onClick={() => setShowModal(false)} style={st.outlineBtn}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Toast Notification ─── */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: {
    display:"flex", flexDirection:"column", minHeight:"100vh",
    background:"var(--bg-primary,#f8fafc)", color:"var(--text-secondary,#1e293b)",
    fontFamily:"'Inter',sans-serif",
  },

  /* Top Nav */
  topNav: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    height:56, padding:"0 24px", background:"var(--nav-bg,#fff)",
    borderBottom:"1px solid var(--nav-border,#e2e8f0)",
    position:"sticky", top:0, zIndex:100,
  },
  topNavLeft:  { display:"flex", alignItems:"center", gap:32 },
  logo:        { fontSize:24, fontWeight:900, color:"var(--accent-blue,#1a6ff4)", letterSpacing:"-0.5px" },
  navLinks:    { display:"flex", gap:24 },
  navLink:     { background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--text-nav,#374151)", padding:"4px 0", fontWeight:500, fontFamily:"inherit" },
  topNavRight: { display:"flex", alignItems:"center", gap:8 },
  navLinkHighlight:     { background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--text-secondary,#1e293b)", fontWeight:600, padding:"6px 12px", borderRadius:8, fontFamily:"inherit" },
  navLinkHighlightDrop: { display:"inline-flex", alignItems:"center", gap:4, background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--text-secondary,#1e293b)", fontWeight:600, padding:"6px 12px", borderRadius:8, fontFamily:"inherit" },
  avatar:      { width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg,#1a6ff4,#06b6d4)", color:"#fff", fontSize:14, fontWeight:700, border:"none", cursor:"pointer", marginLeft:8 },

  bodyRow: { display:"flex", flex:1 },

  /* Sidebar */
  sidebar:          { width:220, minWidth:220, background:"var(--bg-sidebar,#fff)", borderRight:"1px solid var(--border-color,#e2e8f0)", padding:"20px 0", display:"flex", flexDirection:"column" },
  sidebarInner:     { flex:1, overflowY:"auto" },
  sidebarGroupLabel:{ fontSize:11, fontWeight:700, color:"var(--text-muted,#94a3b8)", textTransform:"uppercase", letterSpacing:"0.08em", padding:"0 16px", marginBottom:6 },
  sidebarList:      { listStyle:"none", margin:0, padding:0 },
  sidebarItem:      { margin:0 },
  sidebarBtn:       { display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%", padding:"8px 16px", border:"none", cursor:"pointer", fontSize:14, borderRadius:6, textAlign:"left", transition:"background 0.15s", fontFamily:"inherit", color:"var(--sidebar-text,#1e293b)", background:"none" },
  sidebarIcons:     { display:"flex", alignItems:"center", gap:4 },
  newBadge:         { fontSize:10, fontWeight:700, background:"var(--badge-bg,#10b981)", color:"var(--badge-text,#fff)", borderRadius:4, padding:"1px 5px" },
  externalIcon:     { color:"var(--text-muted,#94a3b8)", display:"inline-flex" },
  sidebarDivider:   { height:1, background:"var(--border-color,#e2e8f0)", margin:"12px 16px" },
  sidebarCollapsible:{ display:"flex", alignItems:"center", gap:6, width:"100%", padding:"8px 16px", background:"none", border:"none", cursor:"pointer", fontSize:14, color:"var(--text-nav,#374151)", fontWeight:600, fontFamily:"inherit" },
  subMenu:          { listStyle:"none", margin:0, padding:"0 0 0 32px" },
  subMenuItem:      { display:"block", width:"100%", padding:"6px 12px", background:"none", border:"none", cursor:"pointer", fontSize:13, color:"var(--text-nav,#374151)", textAlign:"left", borderRadius:6, fontFamily:"inherit" },

  /* Main */
  main: { flex:1, padding:"28px 36px", overflowY:"auto", background:"var(--bg-secondary,#fff)" },

  pageHeader:   { display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:16 },
  pageTitle:    { fontSize:26, fontWeight:800, color:"var(--text-primary,#0f172a)", margin:0 },
  pageSubtitle: { fontSize:14, color:"var(--text-muted,#64748b)", margin:"4px 0 0" },

  /* Stats */
  statsRow: {
    display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",
    gap:16, marginBottom:24,
  },
  statCard: {
    background:"var(--bg-card,#fff)", border:"1px solid var(--border-color,#e2e8f0)",
    borderRadius:14, padding:"18px 20px", display:"flex", flexDirection:"column",
    gap:4, boxShadow:"var(--card-shadow,0 1px 3px rgba(0,0,0,0.06))",
  },
  statVal:   { fontSize:28, fontWeight:800 },
  statLabel: { fontSize:12, color:"var(--text-muted,#64748b)", fontWeight:600 },

  /* Toolbar */
  toolbar: {
    display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap",
  },
  searchBox:   { display:"flex", alignItems:"center", background:"var(--bg-card,#fff)", border:"1px solid var(--border-color,#e2e8f0)", borderRadius:10, padding:"0 12px", flex:"1 1 220px", gap:8, minWidth:220 },
  searchIcon:  { color:"var(--text-muted,#94a3b8)", display:"flex" },
  searchInput: { flex:1, border:"none", outline:"none", fontSize:14, padding:"10px 0", background:"transparent", color:"var(--text-primary,#0f172a)", fontFamily:"inherit" },
  filters:     { display:"flex", gap:8, flexWrap:"wrap" },
  filterSelect:{ padding:"9px 12px", borderRadius:8, border:"1px solid var(--border-color,#e2e8f0)", background:"var(--bg-card,#fff)", color:"var(--text-primary,#0f172a)", fontSize:13, cursor:"pointer", fontFamily:"inherit", outline:"none" },
  viewToggle:  { display:"flex", background:"var(--bg-primary,#f1f5f9)", padding:3, borderRadius:10, border:"1px solid var(--border-color,#e2e8f0)" },
  viewToggleBtn: { display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px", border:"none", borderRadius:8, cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"inherit", transition:"all 0.2s" },

  /* Task Card */
  taskCard: {
    background:"var(--bg-card,#fff)", border:"1px solid var(--border-color,#e2e8f0)",
    borderRadius:12, padding:"16px 18px",
    boxShadow:"var(--card-shadow,0 1px 3px rgba(0,0,0,0.05))",
    display:"flex", flexDirection:"column", gap:10,
    transition:"transform 0.15s, box-shadow 0.15s",
    position:"relative",
  },
  checkCircle: {
    width:22, height:22, borderRadius:"50%", border:"2px solid",
    display:"inline-flex", alignItems:"center", justifyContent:"center",
    cursor:"pointer", flexShrink:0, transition:"all 0.2s",
    color:"#fff", padding:0,
  },
  taskTitle: { fontSize:15, fontWeight:700, margin:0, flex:1, lineHeight:1.3 },
  taskDesc:  { fontSize:13, color:"var(--text-muted,#64748b)", margin:0, lineHeight:1.5 },
  taskMeta:  { display:"flex", flexWrap:"wrap", gap:6, alignItems:"center" },
  chip:      { display:"inline-flex", alignItems:"center", gap:4, fontSize:11, fontWeight:600, padding:"3px 8px", borderRadius:6 },
  taskActions: { display:"flex", gap:8, justifyContent:"flex-end" },
  iconBtn:   { background:"none", border:"none", cursor:"pointer", padding:"4px", color:"var(--text-muted,#94a3b8)", display:"inline-flex", borderRadius:6, transition:"color 0.15s" },

  /* Primary & Outline Btns */
  primaryBtn: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"10px 20px", borderRadius:10, border:"none",
    background:"var(--accent-blue,#1a6ff4)", color:"#fff",
    fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
    transition:"opacity 0.2s",
  },
  outlineBtn: {
    display:"inline-flex", alignItems:"center", gap:6,
    padding:"10px 20px", borderRadius:10,
    border:"1px solid var(--border-color,#cbd5e1)",
    background:"var(--btn-outline-bg,#fff)", color:"var(--text-secondary,#334155)",
    fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  },

  /* Empty state */
  emptyState: {
    display:"flex", flexDirection:"column", alignItems:"center", gap:14,
    padding:"80px 24px", textAlign:"center",
    background:"var(--bg-card,#fff)", borderRadius:16,
    border:"1px dashed var(--border-color,#cbd5e1)",
  },

  /* Kanban */
  kanbanBoard: {
    display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20,
    alignItems:"start", animation:"fadeIn 0.3s ease",
  },
  kanbanCol: {
    background:"var(--bg-primary,#f8fafc)", borderRadius:14,
    border:"1px solid var(--border-color,#e2e8f0)",
    display:"flex", flexDirection:"column", minHeight:480,
  },
  kanbanColHeader: {
    display:"flex", alignItems:"center", gap:8, padding:"14px 16px",
    borderBottom:"1px solid var(--border-color,#e2e8f0)",
  },
  kanbanColDot:   { width:10, height:10, borderRadius:"50%", flexShrink:0 },
  kanbanColLabel: { fontSize:14, fontWeight:700, flex:1 },
  kanbanColCount: { fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:12 },
  kanbanColBody:  { flex:1, padding:12, display:"flex", flexDirection:"column", gap:10, overflowY:"auto" },
  kanbanEmpty:    { flex:1, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, color:"var(--text-muted,#94a3b8)", padding:"24px 12px", textAlign:"center", border:"2px dashed var(--border-color,#e2e8f0)", borderRadius:10, margin:4 },
  kanbanAddBtn:   { margin:"0 12px 12px", padding:"8px", borderRadius:8, border:"1px dashed var(--border-color,#cbd5e1)", background:"none", color:"var(--accent-blue,#1a6ff4)", fontSize:13, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6, fontFamily:"inherit" },

  /* Modal */
  modalOverlay: {
    position:"fixed", inset:0, zIndex:1000,
    display:"flex", alignItems:"center", justifyContent:"center",
    background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)", padding:16,
  },
  modalBox: {
    background:"var(--bg-card,#fff)", border:"1px solid var(--border-color,#e2e8f0)",
    borderRadius:20, padding:"28px", maxWidth:560, width:"100%",
    boxShadow:"0 24px 64px rgba(0,0,0,0.25)", maxHeight:"90vh", overflowY:"auto",
    animation:"fadeIn 0.25s ease",
  },
  modalHeader:   { display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20, paddingBottom:14, borderBottom:"1px solid var(--border-color,#e2e8f0)" },
  modalTitle:    { fontSize:18, fontWeight:800, color:"var(--text-primary,#0f172a)", margin:0 },
  modalCloseBtn: { background:"none", border:"none", cursor:"pointer", color:"var(--text-muted,#94a3b8)", display:"flex", padding:4, borderRadius:6 },
  modalForm:     { display:"flex", flexDirection:"column", gap:16 },
  modalActions:  { display:"flex", gap:10, justifyContent:"flex-end", paddingTop:8 },

  formRow:     { display:"flex", gap:14 },
  formGroup:   { display:"flex", flexDirection:"column", gap:6, flex:1 },
  formLabel:   { fontSize:13, fontWeight:600, color:"var(--text-label,#334155)" },
  formInput:   { padding:"10px 12px", borderRadius:8, border:"1px solid var(--border-input,#cbd5e1)", background:"var(--input-bg,#fff)", color:"var(--input-text,#1e293b)", fontSize:13.5, fontFamily:"inherit", outline:"none", width:"100%" },
  formSelect:  { padding:"10px 12px", borderRadius:8, border:"1px solid var(--border-input,#cbd5e1)", background:"var(--input-bg,#fff)", color:"var(--input-text,#1e293b)", fontSize:13.5, fontFamily:"inherit", outline:"none", width:"100%", cursor:"pointer" },
  formTextarea:{ padding:"10px 12px", borderRadius:8, border:"1px solid var(--border-input,#cbd5e1)", background:"var(--input-bg,#fff)", color:"var(--input-text,#1e293b)", fontSize:13.5, fontFamily:"inherit", outline:"none", resize:"vertical", width:"100%" },
};
