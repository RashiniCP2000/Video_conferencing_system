import { useState, useEffect, useRef } from "react";

export default function WhiteboardCanvas({
  lines,
  setLines,
  notes,
  setNotes,
  images,
  setImages,
  onBroadcastDraw,
  onBroadcastNotes,
  onBroadcastImages,
  onBroadcastClear
}) {
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  const [activeTool, setActiveTool] = useState("pen"); // 'pen' | 'line' | 'rect' | 'circle' | 'arrow' | 'eraser'
  const [brushColor, setBrushColor] = useState("#3b82f6");
  const [brushSize, setBrushSize] = useState(4);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [currentPath, setCurrentPath] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Synchronise history index with lines length
  useEffect(() => {
    setHistoryIndex(lines.length - 1);
    redrawCanvas();
  }, [lines]);

  // Adjust canvas size to parent container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = canvasContainerRef.current;
      if (!canvas || !container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      redrawCanvas();
    };

    window.addEventListener("resize", handleResize);
    // Delay slightly to ensure layout is ready
    const timer = setTimeout(handleResize, 100);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Redraw all shapes/lines from the active history
  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw up to the current history index
    const activeLines = lines.slice(0, historyIndex + 1);

    activeLines.forEach((item) => {
      ctx.beginPath();
      ctx.strokeStyle = item.color;
      ctx.lineWidth = item.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (item.isEraser) {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      if (item.type === "pen" && item.points) {
        if (item.points.length < 1) return;
        ctx.moveTo(item.points[0].x, item.points[0].y);
        for (let i = 1; i < item.points.length; i++) {
          ctx.lineTo(item.points[i].x, item.points[i].y);
        }
        ctx.stroke();
      } else if (item.type === "line") {
        ctx.moveTo(item.x1, item.y1);
        ctx.lineTo(item.x2, item.y2);
        ctx.stroke();
      } else if (item.type === "rect") {
        ctx.strokeRect(item.x1, item.y1, item.x2 - item.x1, item.y2 - item.y1);
      } else if (item.type === "circle") {
        const rx = Math.abs(item.x2 - item.x1);
        const ry = Math.abs(item.y2 - item.y1);
        ctx.beginPath();
        ctx.ellipse(item.x1, item.y1, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (item.type === "arrow") {
        drawArrow(ctx, item.x1, item.y1, item.x2, item.y2);
      }
    });

    // Reset composite operation
    ctx.globalCompositeOperation = "source-over";
  };

  // Helper to draw an arrow
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headlen = 12; // length of head in pixels
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  // Canvas Mouse Event Handlers
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPos({ x, y });
    setLastPos({ x, y });

    if (activeTool === "pen" || activeTool === "eraser") {
      setCurrentPath([{ x, y }]);
    }
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");

    if (activeTool === "pen" || activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = activeTool === "eraser" ? "transparent" : brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (activeTool === "eraser") {
        ctx.globalCompositeOperation = "destination-out";
      } else {
        ctx.globalCompositeOperation = "source-over";
      }

      ctx.stroke();
      setLastPos({ x, y });
      setCurrentPath((prev) => [...prev, { x, y }]);
    } else {
      // Shape Preview: redraw canvas and draw shape overlay
      redrawCanvas();
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalCompositeOperation = "source-over";

      if (activeTool === "line") {
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(x, y);
        ctx.stroke();
      } else if (activeTool === "rect") {
        ctx.strokeRect(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
      } else if (activeTool === "circle") {
        const rx = Math.abs(x - startPos.x);
        const ry = Math.abs(y - startPos.y);
        ctx.ellipse(startPos.x, startPos.y, rx, ry, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (activeTool === "arrow") {
        drawArrow(ctx, startPos.x, startPos.y, x, y);
      }
    }
  };

  const endDrawing = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let newShape = null;

    if (activeTool === "pen" || activeTool === "eraser") {
      if (currentPath.length > 0) {
        newShape = {
          type: "pen",
          points: currentPath,
          color: brushColor,
          size: brushSize,
          isEraser: activeTool === "eraser"
        };
      }
    } else {
      newShape = {
        type: activeTool,
        x1: startPos.x,
        y1: startPos.y,
        x2: x,
        y2: y,
        color: brushColor,
        size: brushSize
      };
    }

    if (newShape) {
      const updatedLines = [...lines.slice(0, historyIndex + 1), newShape];
      setLines(updatedLines);
      setHistoryIndex(updatedLines.length - 1);

      if (onBroadcastDraw) {
        onBroadcastDraw(newShape);
      }
    }

    redrawCanvas();
    setCurrentPath([]);
  };

  // Undo & Redo Handlers
  const handleUndo = () => {
    if (historyIndex >= 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      // Wait for state sync or update immediately
      const activeLines = lines.slice(0, newIndex + 1);
      if (onBroadcastClear) {
        onBroadcastClear();
        activeLines.forEach((item) => onBroadcastDraw?.(item));
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < lines.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const targetShape = lines[newIndex];
      if (onBroadcastDraw && targetShape) {
        onBroadcastDraw(targetShape);
      }
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear the whiteboard?")) {
      setLines([]);
      setNotes([]);
      setImages([]);
      setHistoryIndex(-1);
      if (onBroadcastClear) {
        onBroadcastClear();
      }
    }
  };

  // Draggable Sticky Notes Handlers
  const addStickyNote = () => {
    const container = canvasContainerRef.current.getBoundingClientRect();
    const newNote = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      text: "Double click to edit",
      x: container.width / 2 - 75,
      y: container.height / 2 - 75,
      width: 150,
      height: 150,
      color: "#fef08a" // default light yellow
    };

    const updated = [...notes, newNote];
    setNotes(updated);
    if (onBroadcastNotes) {
      onBroadcastNotes(updated);
    }
  };

  const updateNote = (id, newProps) => {
    const updated = notes.map((n) => (n.id === id ? { ...n, ...newProps } : n));
    setNotes(updated);
  };

  const deleteNote = (id) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    if (onBroadcastNotes) {
      onBroadcastNotes(updated);
    }
  };

  const handleNoteDragStart = (e, noteId) => {
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const container = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - note.x;
    const startY = e.clientY - note.y;

    const handleDrag = (moveEvent) => {
      let x = moveEvent.clientX - startX;
      let y = moveEvent.clientY - startY;

      x = Math.max(0, Math.min(container.width - note.width, x));
      y = Math.max(0, Math.min(container.height - note.height, y));

      updateNote(noteId, { x, y });
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
      // Broadcast final note list
      const finalNotes = notes.map((n) => {
        const active = notes.find((curr) => curr.id === n.id);
        return active && n.id === noteId ? { ...n, x: active.x, y: active.y } : n;
      });
      if (onBroadcastNotes) {
        onBroadcastNotes(notes);
      }
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleNoteResizeStart = (e, noteId) => {
    e.preventDefault();
    e.stopPropagation();
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const startWidth = note.width;
    const startHeight = note.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleResize = (moveEvent) => {
      const w = Math.max(120, startWidth + (moveEvent.clientX - startX));
      const h = Math.max(120, startHeight + (moveEvent.clientY - startY));
      updateNote(noteId, { width: w, height: h });
    };

    const handleResizeEnd = () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
      if (onBroadcastNotes) {
        onBroadcastNotes(notes);
      }
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  // Image insertion handlers
  const triggerImageUpload = () => {
    fileInputRef.current.click();
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const container = canvasContainerRef.current.getBoundingClientRect();
      const newImg = {
        id: "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
        src: event.target.result,
        x: container.width / 2 - 120,
        y: container.height / 2 - 90,
        width: 240,
        height: 180
      };

      const updated = [...images, newImg];
      setImages(updated);
      if (onBroadcastImages) {
        onBroadcastImages(updated);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null; // reset
  };

  const updateImage = (id, newProps) => {
    const updated = images.map((img) => (img.id === id ? { ...img, ...newProps } : img));
    setImages(updated);
  };

  const deleteImage = (id) => {
    const updated = images.filter((img) => img.id !== id);
    setImages(updated);
    if (onBroadcastImages) {
      onBroadcastImages(updated);
    }
  };

  const handleImageDragStart = (e, imgId) => {
    if (e.target.tagName === "BUTTON") return;
    e.preventDefault();
    const img = images.find((i) => i.id === imgId);
    if (!img) return;

    const container = canvasContainerRef.current.getBoundingClientRect();
    const startX = e.clientX - img.x;
    const startY = e.clientY - img.y;

    const handleDrag = (moveEvent) => {
      let x = moveEvent.clientX - startX;
      let y = moveEvent.clientY - startY;

      x = Math.max(0, Math.min(container.width - img.width, x));
      y = Math.max(0, Math.min(container.height - img.height, y));

      updateImage(imgId, { x, y });
    };

    const handleDragEnd = () => {
      document.removeEventListener("mousemove", handleDrag);
      document.removeEventListener("mouseup", handleDragEnd);
      if (onBroadcastImages) {
        onBroadcastImages(images);
      }
    };

    document.addEventListener("mousemove", handleDrag);
    document.addEventListener("mouseup", handleDragEnd);
  };

  const handleImageResizeStart = (e, imgId) => {
    e.preventDefault();
    e.stopPropagation();
    const img = images.find((i) => i.id === imgId);
    if (!img) return;

    const startWidth = img.width;
    const startHeight = img.height;
    const startX = e.clientX;
    const startY = e.clientY;

    const handleResize = (moveEvent) => {
      const w = Math.max(60, startWidth + (moveEvent.clientX - startX));
      const h = Math.max(45, startHeight + (moveEvent.clientY - startY));
      updateImage(imgId, { width: w, height: h });
    };

    const handleResizeEnd = () => {
      document.removeEventListener("mousemove", handleResize);
      document.removeEventListener("mouseup", handleResizeEnd);
      if (onBroadcastImages) {
        onBroadcastImages(images);
      }
    };

    document.addEventListener("mousemove", handleResize);
    document.addEventListener("mouseup", handleResizeEnd);
  };

  return (
    <div style={style.wrapper}>
      {/* ── CANVAS TOOLBAR ── */}
      <div style={style.toolbar}>
        {/* Draw Tools */}
        <div style={style.toolGroup}>
          {[
            { id: "pen", label: "✏️", title: "Pen Tool" },
            { id: "line", label: "📏", title: "Line Tool" },
            { id: "rect", label: "⏹️", title: "Rectangle Tool" },
            { id: "circle", label: "⚪", title: "Circle Tool" },
            { id: "arrow", label: "➡️", title: "Arrow Tool" },
            { id: "eraser", label: "🧹", title: "Eraser Tool" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTool(t.id)}
              title={t.title}
              style={{
                ...style.toolBtn,
                background: activeTool === t.id ? "var(--accent-blue, #1a6ff4)" : "var(--bg-card, #fff)",
                color: activeTool === t.id ? "#fff" : "var(--text-secondary, #1e293b)",
                borderColor: activeTool === t.id ? "var(--accent-blue, #1a6ff4)" : "var(--border-color, #cbd5e1)"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={style.divider} />

        {/* Colors (Hide if eraser active) */}
        {activeTool !== "eraser" && (
          <div style={style.colorGroup}>
            {["#0f172a", "#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#a855f7"].map((c) => (
              <button
                key={c}
                onClick={() => setBrushColor(c)}
                style={{
                  ...style.colorCircle,
                  backgroundColor: c,
                  border: brushColor === c ? "2.5px solid #000" : "1px solid var(--border-color, #e2e8f0)",
                  transform: brushColor === c ? "scale(1.15)" : "scale(1)"
                }}
              />
            ))}
          </div>
        )}

        {/* Brush Size */}
        <div style={style.sizeGroup}>
          <span style={style.sizeLabel}>Size</span>
          <input
            type="range"
            min="1"
            max="20"
            value={brushSize}
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            style={style.sizeSlider}
          />
          <span style={style.sizeValue}>{brushSize}px</span>
        </div>

        {/* Divider */}
        <div style={style.divider} />

        {/* Sticky notes & Insert Image */}
        <div style={style.toolGroup}>
          <button onClick={addStickyNote} title="Add Sticky Note" style={style.actionBtn}>
            📌 Note
          </button>
          <button onClick={triggerImageUpload} title="Insert Image" style={style.actionBtn}>
            🖼️ Image
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            style={{ display: "none" }}
          />
        </div>

        {/* Divider */}
        <div style={style.divider} />

        {/* Undo, Redo, Clear */}
        <div style={style.toolGroup}>
          <button
            onClick={handleUndo}
            disabled={historyIndex < 0}
            title="Undo stroke"
            style={{ ...style.actionBtn, opacity: historyIndex < 0 ? 0.4 : 1 }}
          >
            ↩️
          </button>
          <button
            onClick={handleRedo}
            disabled={historyIndex >= lines.length - 1}
            title="Redo stroke"
            style={{ ...style.actionBtn, opacity: historyIndex >= lines.length - 1 ? 0.4 : 1 }}
          >
            ↪️
          </button>
          <button onClick={handleClear} title="Clear board" style={{ ...style.actionBtn, color: "#ef4444" }}>
            🗑️ Clear
          </button>
        </div>
      </div>

      {/* ── CANVAS WORKSPACE CONTAINER ── */}
      <div ref={canvasContainerRef} style={style.canvasContainer}>
        {/* Sticky Notes Render */}
        {notes.map((note) => (
          <div
            key={note.id}
            onMouseDown={(e) => handleNoteDragStart(e, note.id)}
            style={{
              ...style.stickyNote,
              backgroundColor: note.color,
              left: note.x,
              top: note.y,
              width: note.width,
              height: note.height
            }}
          >
            {/* Note Controls */}
            <div style={style.noteHeader}>
              <div style={style.noteColors}>
                {["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa"].map((col) => (
                  <button
                    key={col}
                    onClick={() => {
                      updateNote(note.id, { color: col });
                      if (onBroadcastNotes) {
                        onBroadcastNotes(
                          notes.map((n) => (n.id === note.id ? { ...n, color: col } : n))
                        );
                      }
                    }}
                    style={{ ...style.noteColorCircle, backgroundColor: col }}
                  />
                ))}
              </div>
              <button onClick={() => deleteNote(note.id)} style={style.noteDeleteBtn}>
                ×
              </button>
            </div>

            {/* Note Content */}
            <textarea
              value={note.text}
              onChange={(e) => {
                updateNote(note.id, { text: e.target.value });
              }}
              onBlur={() => {
                if (onBroadcastNotes) {
                  onBroadcastNotes(notes);
                }
              }}
              style={style.noteTextarea}
            />

            {/* Resize handle */}
            <div
              onMouseDown={(e) => handleNoteResizeStart(e, note.id)}
              style={style.noteResizeHandle}
            />
          </div>
        ))}

        {/* Images Render */}
        {images.map((img) => (
          <div
            key={img.id}
            onMouseDown={(e) => handleImageDragStart(e, img.id)}
            style={{
              ...style.imageCard,
              left: img.x,
              top: img.y,
              width: img.width,
              height: img.height
            }}
          >
            <img src={img.src} alt="whiteboard-asset" style={style.imageEl} />

            {/* Controls */}
            <button onClick={() => deleteImage(img.id)} style={style.imageDeleteBtn}>
              ×
            </button>

            {/* Resize handle */}
            <div
              onMouseDown={(e) => handleImageResizeStart(e, img.id)}
              style={style.imageResizeHandle}
            />
          </div>
        ))}

        {/* Main Drawings Layer */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          style={style.canvas}
        />
      </div>
    </div>
  );
}

// Styling components using vanilla CSS rules
const style = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    flex: 1,
    height: "100%",
    borderRadius: 14,
    overflow: "hidden",
    border: "1px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-primary, #f8fafc)",
    boxShadow: "var(--card-shadow, 0 1px 4px rgba(0,0,0,0.05))"
  },
  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
    padding: "10px 16px",
    background: "var(--bg-card, #fff)",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
    zIndex: 10
  },
  toolGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  toolBtn: {
    border: "1px solid",
    borderRadius: 8,
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 15,
    cursor: "pointer",
    transition: "all 0.15s ease"
  },
  colorGroup: {
    display: "flex",
    alignItems: "center",
    gap: 6
  },
  colorCircle: {
    width: 20,
    height: 20,
    borderRadius: "50%",
    cursor: "pointer",
    padding: 0,
    transition: "all 0.15s ease"
  },
  sizeGroup: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 12,
    color: "var(--text-muted, #64748b)",
    fontWeight: 600
  },
  sizeLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: "0.05em"
  },
  sizeSlider: {
    width: 80,
    cursor: "pointer",
    accentColor: "var(--accent-blue, #1a6ff4)"
  },
  sizeValue: {
    minWidth: 32,
    textAlign: "right"
  },
  actionBtn: {
    padding: "6px 12px",
    border: "1px solid var(--border-color, #cbd5e1)",
    borderRadius: 8,
    background: "var(--bg-card, #fff)",
    color: "var(--text-secondary, #1e293b)",
    fontSize: 12.5,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center"
  },
  divider: {
    width: 1,
    height: 24,
    background: "var(--border-color, #e2e8f0)"
  },
  canvasContainer: {
    position: "relative",
    flex: 1,
    width: "100%",
    height: "100%",
    overflow: "hidden",
    cursor: "crosshair"
  },
  canvas: {
    display: "block",
    position: "absolute",
    left: 0,
    top: 0,
    width: "100%",
    height: "100%",
    zIndex: 1
  },
  stickyNote: {
    position: "absolute",
    zIndex: 5,
    borderRadius: 12,
    boxShadow: "0 6px 20px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
    padding: "10px 10px 18px",
    display: "flex",
    flexDirection: "column",
    cursor: "move",
    overflow: "hidden"
  },
  noteHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    height: 16
  },
  noteColors: {
    display: "flex",
    gap: 4
  },
  noteColorCircle: {
    width: 12,
    height: 12,
    borderRadius: "50%",
    border: "1px solid rgba(0,0,0,0.15)",
    padding: 0,
    cursor: "pointer"
  },
  noteDeleteBtn: {
    background: "none",
    border: "none",
    color: "rgba(0,0,0,0.4)",
    fontSize: 16,
    fontWeight: "bold",
    cursor: "pointer",
    padding: 0,
    lineHeight: 1
  },
  noteTextarea: {
    flex: 1,
    background: "none",
    border: "none",
    resize: "none",
    fontFamily: "inherit",
    fontSize: 13,
    color: "#1e293b",
    lineHeight: "1.4",
    outline: "none",
    padding: 0
  },
  noteResizeHandle: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    cursor: "se-resize",
    background: "linear-gradient(135deg, transparent 40%, rgba(0,0,0,0.2) 40%)"
  },
  imageCard: {
    position: "absolute",
    zIndex: 4,
    borderRadius: 8,
    border: "2px dashed var(--accent-blue, #1a6ff4)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
    cursor: "move",
    background: "#fff",
    overflow: "hidden"
  },
  imageEl: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    pointerEvents: "none"
  },
  imageDeleteBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 18,
    height: 18,
    borderRadius: "50%",
    background: "rgba(0,0,0,0.6)",
    color: "#fff",
    border: "none",
    fontSize: 12,
    fontWeight: "bold",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0
  },
  imageResizeHandle: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 14,
    height: 14,
    cursor: "se-resize",
    background: "linear-gradient(135deg, transparent 40%, var(--accent-blue, #1a6ff4) 40%)"
  }
};
