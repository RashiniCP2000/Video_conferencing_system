import { useState, useEffect, useRef } from "react";

/**
 * JoinMeetingModal
 *
 * Props:
 *   open       {boolean}  – whether the modal is visible
 *   onClose    {fn}       – called when the user cancels
 *   onJoin     {fn(code)} – called with the trimmed meeting code when user confirms
 */
export default function JoinMeetingModal({ open, onClose, onJoin }) {
  const [code, setCode] = useState("");
  const [shake, setShake] = useState(false);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      setCode("");
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  if (!open) return null;

  const handleJoin = () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      inputRef.current?.focus();
      return;
    }
    onJoin(trimmed);
    setCode("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleJoin();
    if (e.key === "Escape") onClose();
  };

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
            </svg>
          </div>
          <div>
            <h2 style={styles.title}>Join a Meeting</h2>
            <p style={styles.subtitle}>Enter the meeting code shared by the host</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          <label style={styles.label} htmlFor="join-code-input">Meeting Code</label>
          <div style={{ ...styles.inputWrap, ...(shake ? styles.inputShake : {}) }}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" style={styles.inputIcon}>
              <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
            </svg>
            <input
              id="join-code-input"
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={handleKeyDown}
              placeholder="e.g. ABCD-1234"
              maxLength={20}
              style={styles.input}
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <p style={styles.hint}>💡 Meeting codes are provided by the meeting host.</p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={styles.joinBtn} onClick={handleJoin}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
            </svg>
            Join Now
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shakeInput {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-8px); }
          40%      { transform: translateX(8px); }
          60%      { transform: translateX(-5px); }
          80%      { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 99999,
    background: "rgba(15,23,42,0.5)", backdropFilter: "blur(6px)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    background: "var(--bg-card, #ffffff)",
    borderRadius: "20px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
    width: "min(460px, 95vw)",
    overflow: "hidden",
    border: "1px solid var(--border-color, #e2e8f0)",
    animation: "modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1) both",
  },
  header: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "20px 22px 18px",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-secondary, #f8fafc)",
  },
  iconWrap: {
    width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
    background: "linear-gradient(135deg, #1a6ff4, #06b6d4)",
    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 12px rgba(26,111,244,0.3)",
  },
  title: {
    margin: 0, fontSize: "16px", fontWeight: "700",
    color: "var(--text-primary, #0f172a)", lineHeight: 1.2,
  },
  subtitle: {
    margin: "3px 0 0", fontSize: "12.5px",
    color: "var(--text-muted, #64748b)",
  },
  closeBtn: {
    marginLeft: "auto", background: "none", border: "none",
    cursor: "pointer", color: "var(--text-muted, #94a3b8)",
    width: "32px", height: "32px", borderRadius: "8px",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  body: { padding: "22px 22px 14px" },
  label: {
    display: "block", fontSize: "12px", fontWeight: "600",
    color: "var(--text-muted, #64748b)", textTransform: "uppercase",
    letterSpacing: "0.07em", marginBottom: "8px",
  },
  inputWrap: {
    display: "flex", alignItems: "center", gap: "10px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px", padding: "0 14px",
    background: "var(--bg-secondary, #f8fafc)",
    transition: "border-color 0.2s, box-shadow 0.2s",
  },
  inputShake: {
    animation: "shakeInput 0.4s ease",
    borderColor: "#ef4444",
    boxShadow: "0 0 0 3px rgba(239,68,68,0.15)",
  },
  inputIcon: { color: "var(--text-muted, #94a3b8)", flexShrink: 0 },
  input: {
    flex: 1, padding: "13px 0", border: "none", outline: "none",
    background: "transparent", fontSize: "15px", fontWeight: "600",
    color: "var(--text-primary, #0f172a)", letterSpacing: "0.08em",
    fontFamily: "'Courier New', monospace",
  },
  hint: {
    margin: "10px 0 0", fontSize: "12px",
    color: "var(--text-muted, #94a3b8)", lineHeight: 1.5,
  },
  footer: {
    display: "flex", gap: "10px", justifyContent: "flex-end",
    padding: "14px 22px 20px",
    borderTop: "1px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-secondary, #f8fafc)",
  },
  cancelBtn: {
    padding: "9px 20px", borderRadius: "10px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-card, #ffffff)", color: "var(--text-muted, #64748b)",
    fontSize: "13.5px", fontWeight: "600", cursor: "pointer", fontFamily: "inherit",
  },
  joinBtn: {
    padding: "9px 22px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #1a6ff4, #06b6d4)",
    color: "#ffffff", fontSize: "13.5px", fontWeight: "700",
    cursor: "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", gap: "6px",
    boxShadow: "0 4px 14px rgba(26,111,244,0.35)",
  },
};
