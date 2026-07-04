import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import MeetNovaLogo from "./MeetNovaLogo.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import api from "../api/client.js";
import UserProfileMenu from "./UserProfileMenu.jsx";
import JoinMeetingModal from "./JoinMeetingModal.jsx";

const ChevronDown = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
    <path d="M7 10l5 5 5-5z" />
  </svg>
);

export default function TopNav() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleJoinMeeting = () => setJoinOpen(true);
  const handleJoinConfirm = (code) => {
    setJoinOpen(false);
    navigate(`/meet/${code}`);
  };

  const handleHostMeeting = async () => {
    try {
      const { data } = await api.post("/meetings", { title: `${user?.name || "User"}'s Instant Meeting` });
      navigate(`/meet/${data.meetingId}`);
    } catch (err) {
      alert("Error starting meeting");
    }
  };

  const initials = user?.name?.charAt(0).toUpperCase() || "U";

  const styles = {
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
      userSelect: "none",
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
      textDecoration: "none",
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
  };

  return (
    <header style={styles.topNav}>
      <div style={styles.topNavLeft}>
        {/* MeetNova logo */}
        <MeetNovaLogo size="md" variant="dynamic" linkTo="/" />
      </div>

      <div style={styles.topNavRight}>
        <button onClick={() => navigate("/schedule")} style={styles.navLinkHighlight}>Schedule</button>
        <button onClick={handleJoinMeeting} style={styles.navLinkHighlight}>Join</button>
        <button onClick={handleHostMeeting} style={styles.navLinkHighlightDrop}>
          Host <ChevronDown />
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
      <JoinMeetingModal open={joinOpen} onClose={() => setJoinOpen(false)} onJoin={handleJoinConfirm} />
    </header>
  );
}
