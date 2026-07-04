import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import TopNav from "../components/TopNav.jsx";
import avatarPhoto from "../assets/avatar_photo.png";
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
const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
);

/* ─── Sidebar items ─────────────────────────────────────────────── */
const sidebarItems = [
  { label: "Meetings",   external: false, badge: null },
  { label: "Recordings", external: false, badge: null },
  { label: "Whiteboard", external: false, badge: "New" },
  { label: "Notes",      external: false, badge: null },
  { label: "Tasks",      external: false, badge: null },
  { label: "Scheduler",  external: true,  badge: null },
  { label: "Calendar",   external: false, badge: null },
];

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, setUserFromBootstrap } = useAuth();

  /* ── nav / sidebar state ── */
  const [billingHistory, setBillingHistory] = useState([]);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    if (user) {
      api.get("/payments/billing-history")
        .then(({ data }) => setBillingHistory(data.history || []))
        .catch((err) => console.error("Failed to load billing history:", err));
    }
  }, [user]);

  const handleCancelSubscription = async () => {
    try {
      const { data } = await api.post("/payments/cancel-subscription");
      setUserFromBootstrap({
        ...user,
        plan: data.plan,
        subscriptionStatus: data.subscriptionStatus
      });
      setShowCancelModal(false);
      alert("Subscription cancelled successfully.");
    } catch (err) {
      alert("Failed to cancel subscription: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDownloadInvoice = (invoice) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - MeetNova</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #1a6ff4; }
            .details { margin: 40px 0; line-height: 1.6; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #eee; padding: 12px; text-align: left; }
            .table th { background: #f9f9f9; }
            .footer { border-top: 2px solid #eee; margin-top: 50px; padding-top: 20px; font-size: 12px; color: #888; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">MeetNova Inc.</div>
            <div><strong>Invoice ID:</strong> INV-\${invoice._id.substring(0, 8).toUpperCase()}</div>
          </div>
          <div class="details">
            <strong>Billed To:</strong><br />
            Name: \${user?.name}<br />
            Email: \${user?.email}<br />
            Date: \${new Date(invoice.createdAt).toLocaleDateString()}
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Cycle</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>MeetNova \${invoice.plan.toUpperCase()} Premium License Upgrade</td>
                <td>Active Period Ending \${new Date(invoice.currentPeriodEnd).toLocaleDateString()}</td>
                <td>\${invoice.plan === "student" ? "$4.99" : "$9.99"}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer">
            Thank you for your business. For support, contact billing@meetnova.com
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  /* ── Personal Info states ── */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [hostKey, setHostKey] = useState("");

  const [savingInfo, setSavingInfo] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: "" });

  /* ── Meetings details state ── */
  const [copiedId, setCopiedId] = useState(false);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);

  const PERSONAL_ID = "543 517 4501";
  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  // Sync profile details from AuthContext when available
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setJobTitle(user.jobTitle || "");
      setCompany(user.company || "");
      setCountry(user.country || "");
      setHostKey(user.hostKey || "");
    }
  }, [user]);

  // Load upcoming meetings from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meetnova_scheduled_meetings") || "[]");
      const now = new Date();
      const parseMeetingDateTime = (m) => {
        if (!m.date) return new Date(0);
        const timeStr = m.time || "00:00";
        return new Date(`${m.date}T${timeStr}`);
      };
      const upcoming = saved
        .filter((m) => parseMeetingDateTime(m) >= now)
        .sort((a, b) => parseMeetingDateTime(a) - parseMeetingDateTime(b));
      setUpcomingMeetings(upcoming);
    } catch (e) {
      console.error("Failed to load upcoming meetings:", e);
    }
  }, []);



  const handleCopyPersonalId = () => {
    navigator.clipboard.writeText(PERSONAL_ID.replace(/\s/g, ""));
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setStatusMsg({ type: null, text: "" });

    try {
      const { data } = await api.put("/auth/profile", {
        firstName,
        lastName,
        email,
        phone,
        jobTitle,
        company,
        country,
        hostKey,
      });
      setUserFromBootstrap(data.user);
      setStatusMsg({ type: "success", text: "Profile details saved successfully!" });
      setTimeout(() => setStatusMsg({ type: null, text: "" }), 4000);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "Failed to update profile details. Please try again.";
      setStatusMsg({ type: "error", text: msg });
    } finally {
      setSavingInfo(false);
    }
  };

  return (
    <div style={st.root}>
      {/* ═══ TOP NAVIGATION ═══ */}
      <TopNav />

      <div style={st.bodyRow}>
        {/* ═══ LEFT SIDEBAR ═══ */}
        <Sidebar activeSubPage="profile" />

        {/* ═══ MAIN CONTENT ═══ */}
        <main style={st.main}>
          <div style={st.pageContainer}>
            
            {/* ─── TOP PROFILE INFO HEADER CARD ─── */}
            <div style={st.profileHeaderCard}>
              <img src={avatarPhoto} alt="User Profile" style={st.profileHeaderPhoto} />
              <div style={st.profileHeaderDetails}>
                <h1 style={st.profileHeaderName}>{user?.name || "Your Name"}</h1>
                <div style={st.profileHeaderPlanRow}>
                  <span style={st.planBadge}>
                    Plan: {user?.plan ? user.plan.toUpperCase() : "FREE"}
                  </span>
                  {user?.subscriptionStatus === "active" && (
                    <span style={st.activeStatusBadge}>Active Subscription</span>
                  )}
                </div>
              </div>
            </div>

            {/* Notification alert banner */}
            {statusMsg.text && (
              <div style={{
                ...st.alertBanner,
                background: statusMsg.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                borderColor: statusMsg.type === "success" ? "#10b981" : "#ef4444",
                color: statusMsg.type === "success" ? "#10b981" : "#ef4444"
              }}>
                {statusMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveProfile} style={st.profileFormGrid}>
              
              {/* ─── SECTION 1: PERSONAL INFORMATION ─── */}
              <div style={st.sectionCard}>
                <h2 style={st.sectionTitle}>1. Personal Information</h2>
                <p style={st.sectionDesc}>Edit your contact details, job title, and location preferences below.</p>
                
                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Enter first name"
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Enter last name"
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      required
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +1 555-0199"
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formRow}>
                  <div style={st.formGroup}>
                    <label style={st.label}>Job Title</label>
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      placeholder="e.g. Product Manager"
                      style={st.input}
                    />
                  </div>
                  <div style={st.formGroup}>
                    <label style={st.label}>Company / Organization</label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      placeholder="e.g. Acme Inc."
                      style={st.input}
                    />
                  </div>
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>Country / Zone</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. United States / GMT-5"
                    style={st.input}
                  />
                </div>
              </div>

              {/* ─── SECTION 2: MEETING DETAILS ─── */}
              <div style={st.sectionCard}>
                <h2 style={st.sectionTitle}>2. Meeting Details</h2>
                <p style={st.sectionDesc}>Configure your personal room ID, claim code, and view scheduled syncs.</p>

                <div style={st.meetingDetailField}>
                  <span style={st.detailLabel}>Personal Meeting ID</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={st.detailVal}>{PERSONAL_ID}</span>
                    <button type="button" onClick={handleCopyPersonalId} style={st.copyBtn}>
                      {copiedId ? "✓ Copied" : <><CopyIcon /> Copy</>}
                    </button>
                  </div>
                </div>

                <div style={st.formGroup}>
                  <label style={st.label}>Host Key (6-digit PIN)</label>
                  <input
                    type="text"
                    value={hostKey}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      if (val.length <= 6) setHostKey(val);
                    }}
                    placeholder="e.g. 123456"
                    style={{ ...st.input, letterSpacing: "0.2em", fontFamily: "monospace", fontWeight: "bold" }}
                  />
                  <small style={st.hintText}>Used to claim host privileges in video meetings.</small>
                </div>

                {/* Upcoming Meetings List */}
                <div style={{ marginTop: 24 }}>
                  <span style={{ ...st.detailLabel, display: "block", marginBottom: 10 }}>Upcoming Meetings</span>
                  {upcomingMeetings.length > 0 ? (
                    <div style={st.upcomingList}>
                      {upcomingMeetings.slice(0, 3).map((meeting, index) => (
                        <div key={index} style={st.upcomingItem}>
                          <div style={{ display: "flex", flexDirection: "column" }}>
                            <span style={st.upcomingTopic}>{meeting.topic}</span>
                            <span style={st.upcomingTime}>{meeting.date} at {meeting.time} ({meeting.timezone})</span>
                          </div>
                          <span style={st.upcomingId}>ID: {meeting.meetingId}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={st.emptyMeetings}>
                      No upcoming meetings scheduled.
                    </div>
                  )}
                </div>
              </div>

              {/* ─── SECTION 3: ACCOUNT STATUS & ACTION ─── */}
              <div style={{ ...st.sectionCard, gridColumn: "1 / -1" }}>
                <h2 style={st.sectionTitle}>3. Subscription & Billing</h2>
                <p style={st.sectionDesc}>Manage your active plans, billing history, and license tiers.</p>
                
                <div style={st.accountInfoRow}>
                  <div style={st.accountField}>
                    <span style={st.detailLabel}>License Type</span>
                    <span style={{ ...st.detailVal, color: user?.plan !== "free" ? "#1a6ff4" : "var(--text-primary)" }}>
                      {user?.plan ? user.plan.toUpperCase() : "FREE"}
                    </span>
                  </div>
                  
                  <div style={st.accountField}>
                    <span style={st.detailLabel}>Meeting Limit</span>
                    <span style={st.detailVal}>
                      {user?.plan === "free" ? "40 mins per meeting" : "Unlimited (up to 30 hrs)"}
                    </span>
                  </div>

                  <div style={st.accountField}>
                    <span style={st.detailLabel}>User Role</span>
                    <span style={st.detailVal}>{user?.role ? user.role.toUpperCase() : "HOST"}</span>
                  </div>

                  <div style={{ display: "flex", gap: "10px", marginLeft: "auto" }}>
                    {user?.plan !== "free" && user?.subscriptionStatus === "active" && (
                      <button
                        type="button"
                        onClick={() => setShowCancelModal(true)}
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "10px 16px",
                          fontSize: "13px",
                          fontWeight: "700",
                          cursor: "pointer",
                          fontFamily: "inherit",
                        }}
                      >
                        Cancel Subscription
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate("/pricing")}
                      style={st.upgradeBtn}
                    >
                      {user?.plan === "free" ? "Upgrade Plan" : "Change Plan"}
                    </button>
                  </div>
                </div>

                {/* Billing History Section */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border-color, #e2e8f0)" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px", color: "var(--text-primary)" }}>Invoice History</h3>
                  {billingHistory.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                        <thead>
                          <tr style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)", textAlign: "left" }}>
                            <th style={{ padding: "8px 0", color: "var(--text-muted, #64748b)" }}>Invoice ID</th>
                            <th style={{ padding: "8px 0", color: "var(--text-muted, #64748b)" }}>Date</th>
                            <th style={{ padding: "8px 0", color: "var(--text-muted, #64748b)" }}>Plan</th>
                            <th style={{ padding: "8px 0", color: "var(--text-muted, #64748b)" }}>Status</th>
                            <th style={{ padding: "8px 0", textAlign: "right", color: "var(--text-muted, #64748b)" }}>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billingHistory.map((invoice) => (
                            <tr key={invoice._id} style={{ borderBottom: "1px solid var(--border-color, #e2e8f0)" }}>
                              <td style={{ padding: "10px 0", fontFamily: "monospace" }}>INV-{invoice._id.substring(0, 8).toUpperCase()}</td>
                              <td style={{ padding: "10px 0" }}>{new Date(invoice.createdAt).toLocaleDateString()}</td>
                              <td style={{ padding: "10px 0", textTransform: "capitalize" }}>{invoice.plan}</td>
                              <td style={{ padding: "10px 0" }}>
                                <span style={{
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  background: invoice.status === "active" ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)",
                                  color: invoice.status === "active" ? "#10b981" : "#ef4444",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}>
                                  {invoice.status.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: "10px 0", textAlign: "right" }}>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  style={{
                                    background: "none",
                                    border: "none",
                                    color: "#1a6ff4",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    fontSize: "13px"
                                  }}
                                >
                                  View Invoice
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ fontSize: "13px", color: "var(--text-muted, #64748b)", margin: 0 }}>No invoice history found.</p>
                  )}
                </div>

                {/* Cancel Subscription Confirmation Modal */}
                {showCancelModal && (
                  <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: "rgba(15, 20, 25, 0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 9999
                  }}>
                    <div style={{
                      background: "var(--bg-card, #ffffff)",
                      border: "1px solid var(--border-color, #e2e8f0)",
                      padding: "28px",
                      borderRadius: "16px",
                      maxWidth: "400px",
                      width: "100%",
                      boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                      textAlign: "center"
                    }}>
                      <h3 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "12px", color: "var(--text-primary)" }}>Cancel Subscription?</h3>
                      <p style={{ fontSize: "14px", color: "var(--text-muted, #64748b)", lineHeight: "1.5", marginBottom: "24px" }}>
                        Are you sure you want to cancel your premium subscription? Your license will immediately downgrade back to the Free plan.
                      </p>
                      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                        <button
                          type="button"
                          onClick={() => setShowCancelModal(false)}
                          style={{
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "1px solid var(--border-color, #cbd5e1)",
                            background: "var(--btn-outline-bg, #fff)",
                            color: "var(--btn-outline-text, #334155)",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer"
                          }}
                        >
                          Keep Plan
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelSubscription}
                          style={{
                            padding: "10px 20px",
                            borderRadius: "8px",
                            border: "none",
                            background: "#ef4444",
                            color: "#ffffff",
                            fontSize: "13px",
                            fontWeight: "750",
                            cursor: "pointer"
                          }}
                        >
                          Confirm Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Form Actions Footer */}
              <div style={st.formFooter}>
                <button
                  type="submit"
                  disabled={savingInfo}
                  style={{ ...st.saveBtn, opacity: savingInfo ? 0.7 : 1 }}
                >
                  {savingInfo ? "Saving Changes..." : "Save Profile Details"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  style={st.cancelBtn}
                >
                  Cancel
                </button>
              </div>

            </form>
          </div>
        </main>
      </div>
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

  /* Main */
  main: { flex: 1, padding: "32px 40px", overflowY: "auto", background: "var(--bg-secondary, #fff)" },
  pageContainer: { maxWidth: "900px", margin: "0 auto" },

  /* Profile Header Card */
  profileHeaderCard: {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    marginBottom: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
  },
  profileHeaderPhoto: {
    width: "72px",
    height: "72px",
    borderRadius: "50%",
    objectFit: "cover",
    border: "3px solid var(--border-color, #e2e8f0)",
  },
  profileHeaderDetails: { display: "flex", flexDirection: "column", gap: "6px" },
  profileHeaderName: { fontSize: "22px", fontWeight: "800", color: "var(--text-primary, #0f172a)", margin: 0 },
  profileHeaderPlanRow: { display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" },
  planBadge: { fontSize: "11px", fontWeight: "700", background: "var(--accent-blue-bg, #eff6ff)", color: "var(--accent-blue, #1a6ff4)", padding: "4px 8px", borderRadius: "6px" },
  activeStatusBadge: { fontSize: "11px", fontWeight: "700", background: "rgba(16, 185, 129, 0.12)", color: "#10b981", padding: "4px 8px", borderRadius: "6px" },

  /* Section Cards */
  profileFormGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  sectionCard: {
    background: "var(--bg-card, #ffffff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "16px",
    padding: "24px",
    boxShadow: "var(--card-shadow, 0 1px 3px rgba(0,0,0,0.06))",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
  },
  sectionTitle: { fontSize: "16px", fontWeight: "700", color: "var(--text-primary, #0f172a)", margin: 0 },
  sectionDesc: { fontSize: "13px", color: "var(--text-muted, #64748b)", margin: "0 0 4px 0" },

  /* Forms */
  formRow: { display: "flex", gap: "16px" },
  formGroup: { display: "flex", flexDirection: "column", gap: "6px", flex: 1 },
  label: { fontSize: "13px", fontWeight: "600", color: "var(--text-label, #334155)" },
  input: {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid var(--border-input, #cbd5e1)",
    backgroundColor: "var(--input-bg, #ffffff)",
    color: "var(--input-text, #1e293b)",
    fontSize: "14px",
    fontFamily: "inherit",
    outline: "none",
    width: "100%",
  },
  hintText: { fontSize: "11px", color: "var(--text-muted, #64748b)" },

  /* Details inside cards */
  meetingDetailField: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    paddingBottom: "12px",
    borderBottom: "1px solid var(--border-color, #e2e8f0)",
  },
  detailLabel: { fontSize: "13px", fontWeight: "600", color: "var(--text-muted, #64748b)" },
  detailVal: { fontSize: "15px", fontWeight: "700", color: "var(--text-primary, #0f172a)" },
  copyBtn: {
    background: "var(--bg-hover, #eff6ff)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "6px",
    padding: "4px 8px",
    fontSize: "12px",
    color: "var(--accent-blue, #1a6ff4)",
    cursor: "pointer",
    fontFamily: "inherit",
    fontWeight: "600",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
  },

  /* Upcoming list */
  upcomingList: { display: "flex", flexDirection: "column", gap: "8px" },
  upcomingItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "var(--bg-primary, #f8fafc)",
    border: "1px solid var(--border-color, #e2e8f0)",
    borderRadius: "8px",
    padding: "10px 12px",
  },
  upcomingTopic: { fontSize: "13.5px", fontWeight: "700", color: "var(--text-primary, #0f172a)" },
  upcomingTime: { fontSize: "11px", color: "var(--text-muted, #64748b)" },
  upcomingId: { fontSize: "12px", color: "var(--text-muted, #64748b)", fontFamily: "monospace" },
  emptyMeetings: {
    padding: "16px",
    borderRadius: "8px",
    background: "var(--bg-primary, #f8fafc)",
    border: "1px dashed var(--border-color, #cbd5e1)",
    fontSize: "13px",
    color: "var(--text-muted, #64748b)",
    textAlign: "center",
  },

  /* Account status section */
  accountInfoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginTop: "8px",
  },
  accountField: { display: "flex", flexDirection: "column", gap: "4px" },
  upgradeBtn: {
    background: "var(--accent-blue, #1a6ff4)",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    padding: "10px 20px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    fontFamily: "inherit",
    marginLeft: "auto",
  },

  /* Footer & banners */
  formFooter: {
    gridColumn: "1 / -1",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "8px",
    paddingTop: "20px",
    borderTop: "1px solid var(--border-color, #e2e8f0)",
  },
  saveBtn: {
    padding: "12px 28px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "var(--accent-blue, #1a6ff4)",
    color: "#ffffff",
    fontWeight: "700",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  cancelBtn: {
    padding: "12px 24px",
    borderRadius: "8px",
    border: "1px solid var(--btn-outline-border, #cbd5e1)",
    backgroundColor: "var(--btn-outline-bg, #fff)",
    color: "var(--btn-outline-text, #334155)",
    fontWeight: "600",
    fontSize: "14px",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  alertBanner: {
    gridColumn: "1 / -1",
    border: "1px solid",
    borderRadius: "8px",
    padding: "12px 16px",
    fontSize: "14px",
    fontWeight: "600",
    display: "flex",
    alignItems: "center",
  },
};
