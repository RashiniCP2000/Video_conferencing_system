import { useState, useEffect, useRef } from "react";

export default function SupportModal({ open, onClose, user }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState("");
  const [shake, setShake] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (open) {
      setName(user?.name || "");
      setEmail(user?.email || "");
      setMessage("");
      setSubmitted(false);
      setIsSubmitting(false);
    }
  }, [open, user]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || !email.trim() || !name.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    setIsSubmitting(true);

    // Mock API call delay
    setTimeout(() => {
      const randomId = "MN-" + Math.floor(10000 + Math.random() * 90000);
      setTicketId(randomId);
      setIsSubmitting(false);
      setSubmitted(true);
    }, 1200);
  };

  return (
    <div style={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.iconWrap}>
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm0-4.5h-2v-5h2v5z" />
            </svg>
          </div>
          <div className="text-left">
            <h2 style={styles.title}>Customer Support</h2>
            <p style={styles.subtitle}>Submit a help request to our team</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Close">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={styles.body}>
          {submitted ? (
            <div style={styles.successWrapper}>
              <div style={styles.successIcon}>✓</div>
              <h3 style={styles.successTitle}>Ticket Submitted Successfully!</h3>
              <p style={styles.successDesc}>
                We have received your support request. Our team will review your inquiry and reply to you at <strong>{email}</strong> within 24 hours.
              </p>
              <div style={styles.ticketBadge}>
                <span style={styles.ticketLabel}>TICKET ID:</span>
                <span style={styles.ticketVal}>{ticketId}</span>
              </div>
              <button style={styles.doneBtn} onClick={onClose}>Close Window</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} ref={formRef} style={shake ? styles.formShake : {}}>
              <div style={styles.formGrid}>
                <div className="text-left">
                  <label style={styles.label} htmlFor="support-name">Name</label>
                  <input
                    id="support-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Name"
                    required
                    style={styles.input}
                  />
                </div>

                <div className="text-left">
                  <label style={styles.label} htmlFor="support-email">Email Address</label>
                  <input
                    id="support-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginTop: "16px" }} className="text-left">
                <label style={styles.label} htmlFor="support-category">Inquiry Category</label>
                <select
                  id="support-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={styles.select}
                >
                  <option value="general">General Inquiry</option>
                  <option value="technical">Technical Issue</option>
                  <option value="billing">Billing / Account</option>
                  <option value="feedback">Feedback & Suggestions</option>
                </select>
              </div>

              <div style={{ marginTop: "16px" }} className="text-left">
                <label style={styles.label} htmlFor="support-message">Message / Details</label>
                <textarea
                  id="support-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or query in detail..."
                  required
                  rows={4}
                  style={styles.textarea}
                />
              </div>

              <div style={styles.footer}>
                <button type="button" style={styles.cancelBtn} onClick={onClose}>Cancel</button>
                <button type="submit" style={styles.submitBtn} disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(-10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes shakeForm {
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  modal: {
    background: "var(--bg-card, #ffffff)",
    borderRadius: "20px",
    boxShadow: "0 32px 80px rgba(0,0,0,0.2)",
    width: "min(520px, 95vw)",
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
    color: "var(--text-primary, #0f172a)",
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
  },
  body: { padding: "22px" },
  formShake: {
    animation: "shakeForm 0.4s ease",
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
  },
  label: {
    display: "block", fontSize: "12px", fontWeight: "600",
    color: "var(--text-muted, #64748b)", textTransform: "uppercase",
    letterSpacing: "0.07em", marginBottom: "8px",
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    background: "var(--bg-secondary, #f8fafc)",
    fontSize: "14px",
    color: "var(--text-primary, #0f172a)",
    outline: "none",
  },
  select: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    background: "var(--bg-secondary, #f8fafc)",
    fontSize: "14px",
    color: "var(--text-primary, #0f172a)",
    outline: "none",
  },
  textarea: {
    width: "100%",
    padding: "10px 14px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    borderRadius: "12px",
    background: "var(--bg-secondary, #f8fafc)",
    fontSize: "14px",
    color: "var(--text-primary, #0f172a)",
    outline: "none",
    resize: "none",
  },
  footer: {
    display: "flex", gap: "10px", justifyContent: "flex-end",
    marginTop: "20px",
  },
  cancelBtn: {
    padding: "9px 20px", borderRadius: "10px",
    border: "1.5px solid var(--border-color, #e2e8f0)",
    background: "var(--bg-card, #ffffff)", color: "var(--text-muted, #64748b)",
    fontSize: "13.5px", fontWeight: "600", cursor: "pointer",
  },
  submitBtn: {
    padding: "9px 22px", borderRadius: "10px", border: "none",
    background: "linear-gradient(135deg, #1a6ff4, #06b6d4)",
    color: "#ffffff", fontSize: "13.5px", fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 14px rgba(26,111,244,0.35)",
  },
  successWrapper: {
    textAlign: "center",
    padding: "16px 0",
  },
  successIcon: {
    width: "56px", height: "56px", borderRadius: "50%",
    background: "#10b981", color: "#fff", fontSize: "28px",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto 16px",
    boxShadow: "0 4px 14px rgba(16,185,129,0.3)",
  },
  successTitle: {
    fontSize: "18px", fontWeight: "700",
    color: "var(--text-primary, #0f172a)", margin: "0 0 10px",
  },
  successDesc: {
    fontSize: "14px", color: "var(--text-muted, #64748b)",
    lineHeight: 1.5, margin: "0 0 20px",
  },
  ticketBadge: {
    background: "var(--bg-secondary, #f8fafc)",
    border: "1px dashed var(--border-color, #e2e8f0)",
    padding: "12px", borderRadius: "12px",
    display: "inline-flex", gap: "8px", alignItems: "center",
    margin: "0 auto 24px",
  },
  ticketLabel: {
    fontSize: "11px", fontWeight: "600", color: "var(--text-muted, #94a3b8)",
  },
  ticketVal: {
    fontFamily: "monospace", fontSize: "14px", fontWeight: "700", color: "var(--accent-blue, #1a6ff4)",
  },
  doneBtn: {
    display: "block", width: "100%", padding: "10px", borderRadius: "10px",
    border: "none", background: "var(--bg-secondary, #f8fafc)", color: "var(--text-primary, #0f172a)",
    fontWeight: "600", fontSize: "14px", cursor: "pointer",
    transition: "background 0.2s",
  },
};
