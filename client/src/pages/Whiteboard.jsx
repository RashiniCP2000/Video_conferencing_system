import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import TopNav from "../components/TopNav.jsx";
import WhiteboardCanvas from "../components/WhiteboardCanvas.jsx";
import Sidebar from "../components/Sidebar.jsx";

const LS_KEY = "meetnova_whiteboards";

/* ─── Icons ──────────────────────────────────────────────────────── */
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);
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

/* ─── Sidebar items ─────────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
];

export default function Whiteboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [myAccountOpen, setMyAccountOpen] = useState(false);

  // Whiteboard session state
  const [boards, setBoards] = useState([]);
  const [activeBoardId, setActiveBoardId] = useState(null);
  const [boardName, setBoardName] = useState("Untitled Whiteboard");
  
  // Canvas Elements State
  const [lines, setLines] = useState([]);
  const [notes, setNotes] = useState([]);
  const [images, setImages] = useState([]);

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  // Load list of boards on mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      setBoards(saved);
      if (saved.length > 0) {
        // Load the first board automatically
        loadBoard(saved[0]);
      } else {
        // Create an initial empty board
        handleCreateNewBoard();
      }
    } catch {
      setBoards([]);
      handleCreateNewBoard();
    }
  }, []);



  const handleSidebarClick = (label) => {
    if (label === "Whiteboard") return;
    if (label === "Meetings") navigate("/meetings");
    if (label === "Recordings") navigate("/recordings");
    if (label === "Calendar") navigate("/calendar");
    if (label === "Scheduler") navigate("/schedule");
    if (label === "Tasks") navigate("/tasks");
    if (label === "Notes") navigate("/notes");
  };

  // Create a new empty board session
  const handleCreateNewBoard = () => {
    const newId = "board_" + Date.now();
    const newBoard = {
      id: newId,
      name: "New Whiteboard " + (boards.length + 1),
      lines: [],
      notes: [],
      images: [],
      updatedAt: new Date().toISOString()
    };

    const updated = [newBoard, ...boards];
    setBoards(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));

    setActiveBoardId(newId);
    setBoardName(newBoard.name);
    setLines([]);
    setNotes([]);
    setImages([]);
  };

  // Load selected board details
  const loadBoard = (board) => {
    setActiveBoardId(board.id);
    setBoardName(board.name);
    setLines(board.lines || []);
    setNotes(board.notes || []);
    setImages(board.images || []);
  };

  // Save current board elements to local storage
  const handleSaveBoard = () => {
    if (!activeBoardId) return;

    const updated = boards.map((b) => {
      if (b.id === activeBoardId) {
        return {
          ...b,
          name: boardName,
          lines,
          notes,
          images,
          updatedAt: new Date().toISOString()
        };
      }
      return b;
    });

    setBoards(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
  };

  // Trigger save whenever elements change
  useEffect(() => {
    if (activeBoardId) {
      handleSaveBoard();
    }
  }, [lines, notes, images, boardName]);

  // Delete a board session
  const handleDeleteBoard = (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this whiteboard session?")) return;

    const updated = boards.filter((b) => b.id !== id);
    setBoards(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));

    if (activeBoardId === id) {
      if (updated.length > 0) {
        loadBoard(updated[0]);
      } else {
        handleCreateNewBoard();
      }
    }
  };

  // Export board data as PNG
  const handleExportPNG = () => {
    const canvas = document.querySelector("canvas");
    if (!canvas) return;

    // Create a temporary canvas with white background to export (so transparent drawings render cleanly)
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext("2d");

    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0);

    const dataUrl = tempCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${boardName || "whiteboard"}.png`;
    a.click();
  };

  // Export board data as JSON file
  const handleExportJSON = () => {
    const sessionData = {
      name: boardName,
      lines,
      notes,
      images,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(sessionData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${boardName || "whiteboard"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import board data from JSON file
  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        const newId = "board_" + Date.now();
        const newBoard = {
          id: newId,
          name: (imported.name || "Imported Whiteboard") + " (Imported)",
          lines: imported.lines || [],
          notes: imported.notes || [],
          images: imported.images || [],
          updatedAt: new Date().toISOString()
        };

        const updated = [newBoard, ...boards];
        setBoards(updated);
        localStorage.setItem(LS_KEY, JSON.stringify(updated));

        loadBoard(newBoard);
      } catch (err) {
        alert("Invalid file format. Please upload a valid exported Whiteboard JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  return (
    <div style={st.root}>
      {/* ─── TOP NAV ─── */}
      <TopNav />

      <div style={st.bodyRow}>
        {/* ─── LEFT SIDEBAR ─── */}
        <Sidebar activeTab="Whiteboard" />

        {/* ─── MAIN WHITEBOARD SPACE ─── */}
        <main style={st.main}>
          <div style={st.headerRow}>
            <div style={st.titleArea}>
              <div style={st.titleInputGroup}>
                <span style={{ fontSize: 24 }}>🎨</span>
                <input
                  type="text"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  style={st.titleInput}
                  placeholder="Untitled Whiteboard"
                  title="Click to rename session"
                />
              </div>
              <p style={st.subtitle}>Brainstorm, sketch, draw diagrams, and collaboration sessions.</p>
            </div>
            
            {/* Export and Import Actions */}
            <div style={st.actionGroup}>
              <label style={st.importBtn}>
                📥 Import JSON
                <input
                  type="file"
                  onChange={handleImportJSON}
                  accept=".json"
                  style={{ display: "none" }}
                />
              </label>
              <button onClick={handleExportJSON} style={st.exportBtn}>
                📤 Export JSON
              </button>
              <button onClick={handleExportPNG} style={st.exportBtnHighlight}>
                🖼️ Save as PNG
              </button>
            </div>
          </div>

          <div style={st.workspaceGrid}>
            {/* Left Gallery Panel: Saved Sessions */}
            <div style={st.galleryPanel}>
              <div style={st.galleryHeader}>
                <h3 style={st.galleryTitle}>Saved Sessions</h3>
                <button onClick={handleCreateNewBoard} style={st.newBoardBtn}>
                  + New
                </button>
              </div>
              
              <div style={st.galleryList}>
                {boards.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => loadBoard(b)}
                    style={{
                      ...st.galleryItem,
                      backgroundColor: b.id === activeBoardId ? "var(--bg-hover, #eff6ff)" : "transparent",
                      borderColor: b.id === activeBoardId ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #e2e8f0)"
                    }}
                  >
                    <div style={st.galleryItemInfo}>
                      <span style={{
                        ...st.galleryItemName,
                        fontWeight: b.id === activeBoardId ? 700 : 500
                      }}>
                        {b.name}
                      </span>
                      <span style={st.galleryItemDate}>
                        {new Date(b.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteBoard(b.id, e)}
                      style={st.galleryItemDeleteBtn}
                      title="Delete Session"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Interactive Whiteboard Panel */}
            <div style={st.canvasWrapper}>
              <WhiteboardCanvas
                lines={lines}
                setLines={setLines}
                notes={notes}
                setNotes={setNotes}
                images={images}
                setImages={setImages}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

const st = {
  root: {
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
    background: "var(--bg-primary, #f8fafc)",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
    color: "var(--text-secondary, #1e293b)"
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
    zIndex: 100
  },
  topNavLeft: {
    display: "flex",
    alignItems: "center",
    gap: 32
  },
  logo: {
    fontSize: 28,
    fontWeight: 800,
    color: "var(--accent-blue, #1a6ff4)",
    letterSpacing: "-1px",
    fontStyle: "italic"
  },
  navLinks: {
    display: "flex",
    gap: 24
  },
  navLink: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--text-nav, #374151)",
    padding: "4px 0",
    fontWeight: 500
  },
  topNavRight: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  navLinkHighlight: {
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 6
  },
  navLinkHighlightDrop: {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--accent-blue, #1a6ff4)",
    fontWeight: 600,
    padding: "6px 12px",
    borderRadius: 6
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "linear-gradient(135deg,#1a6ff4,#06b6d4)",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    marginLeft: 8
  },
  bodyRow: {
    display: "flex",
    flex: 1
  },
  sidebar: {
    width: 220,
    minWidth: 220,
    background: "var(--bg-sidebar, #fff)",
    borderRight: "1px solid var(--border-color, #e2e8f0)",
    padding: "20px 0",
    display: "flex",
    flexDirection: "column"
  },
  sidebarInner: {
    flex: 1,
    overflowY: "auto"
  },
  sidebarGroupLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "var(--text-muted, #94a3b8)",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
    padding: "0 16px",
    marginBottom: 6
  },
  sidebarList: {
    listStyle: "none",
    margin: 0,
    padding: 0
  },
  sidebarItem: {
    margin: 0
  },
  sidebarBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    padding: "8px 16px",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    borderRadius: 6,
    textAlign: "left",
    transition: "background 0.15s",
    color: "var(--sidebar-text, #1e293b)"
  },
  sidebarIcons: {
    display: "flex",
    alignItems: "center",
    gap: 4
  },
  newBadge: {
    fontSize: 10,
    fontWeight: 700,
    background: "var(--badge-bg, #10b981)",
    color: "var(--badge-text, #fff)",
    borderRadius: 4,
    padding: "1px 5px"
  },
  externalIcon: {
    color: "var(--text-muted, #94a3b8)",
    display: "inline-flex"
  },
  sidebarDivider: {
    height: 1,
    background: "var(--border-color, #e2e8f0)",
    margin: "12px 16px"
  },
  sidebarCollapsible: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    padding: "8px 16px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 14,
    color: "var(--text-nav, #374151)",
    fontWeight: 600
  },
  subMenu: {
    listStyle: "none",
    margin: 0,
    padding: "0 0 0 32px"
  },
  subMenuItem: {
    display: "block",
    width: "100%",
    padding: "6px 12px",
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    color: "var(--text-muted, #374151)",
    textAlign: "left",
    borderRadius: 6
  },
  main: {
    flex: 1,
    padding: "24px 32px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden"
  },
  headerRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    flexWrap: "wrap",
    gap: 16
  },
  titleArea: {
    display: "flex",
    flexDirection: "column"
  },
  titleInputGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8
  },
  titleInput: {
    fontSize: 22,
    fontWeight: 700,
    color: "var(--text-primary, #0f172a)",
    border: "none",
    outline: "none",
    background: "transparent",
    padding: "2px 4px",
    borderRadius: 6,
    transition: "background 0.15s ease",
    maxWidth: 320,
    cursor: "pointer",
    borderBottom: "1.5px dashed var(--border-color, #cbd5e1)"
  },
  subtitle: {
    fontSize: 13.5,
    color: "var(--text-muted, #64748b)",
    margin: "4px 0 0"
  },
  actionGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10
  },
  importBtn: {
    padding: "8px 16px",
    border: "1px solid var(--btn-outline-border, #cbd5e1)",
    borderRadius: 8,
    background: "var(--btn-outline-bg, #fff)",
    color: "var(--btn-outline-text, #334155)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center"
  },
  exportBtn: {
    padding: "8px 16px",
    border: "1px solid var(--btn-outline-border, #cbd5e1)",
    borderRadius: 8,
    background: "var(--btn-outline-bg, #fff)",
    color: "var(--btn-outline-text, #334155)",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  exportBtnHighlight: {
    padding: "8px 16px",
    border: "none",
    borderRadius: 8,
    background: "var(--accent-blue, #1a6ff4)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer"
  },
  workspaceGrid: {
    display: "flex",
    flex: 1,
    gap: 20,
    minHeight: 0, // critical for nested flex scrolling
    overflow: "hidden"
  },
  galleryPanel: {
    width: 240,
    background: "var(--bg-card, #fff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: 14,
    display: "flex",
    flexDirection: "column",
    padding: 16
  },
  galleryHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14
  },
  galleryTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "var(--text-primary, #0f172a)",
    margin: 0
  },
  newBoardBtn: {
    padding: "4px 10px",
    background: "var(--accent-blue-bg, #eff6ff)",
    color: "var(--accent-blue-text, #1a6ff4)",
    border: "none",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer"
  },
  galleryList: {
    flex: 1,
    overflowY: "auto",
    display: "flex",
    flexDirection: "column",
    gap: 8
  },
  galleryItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid",
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  galleryItemInfo: {
    display: "flex",
    flexDirection: "column",
    gap: 2
  },
  galleryItemName: {
    fontSize: 13,
    color: "var(--text-primary, #0f172a)",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 160
  },
  galleryItemDate: {
    fontSize: 11,
    color: "var(--text-muted, #94a3b8)"
  },
  galleryItemDeleteBtn: {
    background: "none",
    border: "none",
    color: "var(--text-muted, #94a3b8)",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
    padding: "0 4px",
    lineHeight: 1,
    opacity: 0.6,
    transition: "opacity 0.15s ease"
  },
  canvasWrapper: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 0
  }
};
