import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";

/* ─── Keyframe injection ─────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes successPop {
    0%   { transform: scale(0.5); opacity: 0; }
    70%  { transform: scale(1.12); }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.35); }
    50%       { box-shadow: 0 0 0 10px rgba(124,58,237,0); }
  }
  .fp-input:focus { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
  .fp-otp:focus   { border-color: #7c3aed !important; box-shadow: 0 0 0 4px rgba(124,58,237,0.18); transform: scale(1.06); }
  .fp-btn:hover:not(:disabled) { opacity: 0.88; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(109,40,217,0.35); }
  .fp-btn:active:not(:disabled) { transform: translateY(0); }
  .fp-link:hover { color: #6d28d9 !important; }
  .fp-step-anim { animation: fadeSlideIn 0.38s cubic-bezier(.4,0,.2,1) both; }
  .fp-success-icon { animation: successPop 0.5s cubic-bezier(.4,0,.2,1) both; }
`;

/* ─── SVG Illustrations ──────────────────────────────────────────── */
const IllustrationForgot = () => (
  <svg viewBox="0 0 260 230" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ maxHeight: 220 }}>
    {/* Background blob */}
    <ellipse cx="130" cy="115" rx="105" ry="90" fill="rgba(255,255,255,0.1)" />
    {/* Desk */}
    <rect x="40" y="174" width="180" height="10" rx="5" fill="rgba(255,255,255,0.3)" />
    {/* Monitor stand */}
    <rect x="122" y="162" width="16" height="15" rx="3" fill="rgba(255,255,255,0.35)" />
    {/* Monitor */}
    <rect x="75" y="85" width="115" height="80" rx="10" fill="rgba(255,255,255,0.95)" />
    {/* Screen lock+question */}
    <rect x="110" y="98" width="50" height="54" rx="6" fill="#f5f3ff" />
    <rect x="118" y="114" width="34" height="22" rx="5" fill="#7c3aed" opacity="0.85" />
    <path d="M126 114V109a8 8 0 0 1 16 0v5" stroke="#7c3aed" strokeWidth="2.8" strokeLinecap="round" fill="none" />
    <circle cx="135" cy="123" r="3" fill="white" />
    <rect x="133" y="125" width="3" height="5" rx="1.5" fill="white" />
    {/* Screen dots (password) */}
    <rect x="112" y="142" width="46" height="7" rx="3.5" fill="#ede9fe" />
    {[0,1,2,3].map(i => <circle key={i} cx={121 + i*12} cy={145} r="2.5" fill="#7c3aed" />)}
    {/* Question mark badge */}
    <circle cx="170" cy="90" r="14" fill="#fbbf24" />
    <text x="170" y="96" textAnchor="middle" fill="white" fontSize="16" fontWeight="900" fontFamily="Arial">?</text>

    {/* Person - sitting */}
    <ellipse cx="57" cy="158" rx="17" ry="10" fill="rgba(255,255,255,0.15)" /> {/* shadow */}
    {/* Body */}
    <rect x="44" y="152" width="26" height="28" rx="9" fill="#6d28d9" />
    {/* Head */}
    <circle cx="57" cy="140" r="15" fill="#fecdd3" />
    {/* Hair */}
    <path d="M43 136 Q57 124 71 136" fill="#1e1b4b" />
    <ellipse cx="57" cy="130" rx="14" ry="8" fill="#1e1b4b" />
    {/* Face */}
    <circle cx="53" cy="141" r="1.5" fill="#374151" />
    <circle cx="61" cy="141" r="1.5" fill="#374151" />
    <path d="M53 146 Q57 149 61 146" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    {/* Arms */}
    <path d="M44 158 Q32 162 36 174" stroke="#fecdd3" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M70 158 Q82 162 78 174" stroke="#fecdd3" strokeWidth="7" strokeLinecap="round" fill="none" />
    {/* Plants decoration */}
    <ellipse cx="218" cy="152" rx="11" ry="20" fill="rgba(255,255,255,0.25)" />
    <ellipse cx="226" cy="158" rx="7" ry="13" fill="rgba(255,255,255,0.18)" />
    <rect x="215" y="164" width="5" height="16" rx="2" fill="rgba(255,255,255,0.35)" />
    {/* Floating dots */}
    <circle cx="208" cy="88" r="6" fill="rgba(255,255,255,0.3)" />
    <circle cx="222" cy="72" r="4" fill="rgba(255,255,255,0.2)" />
    <circle cx="35" cy="95" r="5" fill="rgba(255,255,255,0.2)" />
    <circle cx="25" cy="115" r="3" fill="rgba(255,255,255,0.15)" />
  </svg>
);

const IllustrationVerify = () => (
  <svg viewBox="0 0 260 230" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ maxHeight: 220 }}>
    <ellipse cx="130" cy="115" rx="105" ry="90" fill="rgba(255,255,255,0.1)" />
    {/* Envelope */}
    <rect x="72" y="82" width="116" height="82" rx="10" fill="rgba(255,255,255,0.95)" />
    <path d="M72 92 L130 126 L188 92" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <line x1="72" y1="164" x2="108" y2="135" stroke="#7c3aed" strokeWidth="1.5" opacity="0.4" />
    <line x1="188" y1="164" x2="152" y2="135" stroke="#7c3aed" strokeWidth="1.5" opacity="0.4" />
    {/* OTP code boxes on envelope */}
    {[0,1,2,3,4,5].map(i => (
      <rect key={i} x={84 + i * 17} y={143} width={13} height={13} rx="3"
        fill={i < 4 ? "#7c3aed" : "#ede9fe"} opacity={i < 4 ? 0.85 : 0.5} />
    ))}
    {/* Floating verification badge */}
    <circle cx="185" cy="78" r="20" fill="rgba(255,255,255,0.9)" />
    <path d="M175 78 L182 85 L196 70" stroke="#7c3aed" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Notification ping */}
    <circle cx="185" cy="78" r="24" stroke="rgba(255,255,255,0.4)" strokeWidth="2" fill="none" />

    {/* Person */}
    <ellipse cx="57" cy="165" rx="16" ry="9" fill="rgba(255,255,255,0.12)" />
    <rect x="44" y="158" width="26" height="26" rx="9" fill="#6d28d9" />
    <circle cx="57" cy="147" r="14" fill="#fecdd3" />
    <path d="M44 143 Q57 132 70 143" fill="#1e1b4b" />
    <ellipse cx="57" cy="138" rx="13" ry="7" fill="#1e1b4b" />
    <circle cx="53" cy="148" r="1.5" fill="#374151" />
    <circle cx="61" cy="148" r="1.5" fill="#374151" />
    <path d="M53 153 Q57 156 61 153" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none" />

    <circle cx="35" cy="88" r="5" fill="rgba(255,255,255,0.2)" />
    <circle cx="22" cy="108" r="3" fill="rgba(255,255,255,0.15)" />
    <circle cx="210" cy="120" r="4" fill="rgba(255,255,255,0.2)" />
  </svg>
);

const IllustrationReset = () => (
  <svg viewBox="0 0 260 230" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ maxHeight: 220 }}>
    <ellipse cx="130" cy="115" rx="105" ry="90" fill="rgba(255,255,255,0.1)" />
    {/* Laptop */}
    <rect x="72" y="105" width="120" height="75" rx="8" fill="rgba(255,255,255,0.92)" />
    <rect x="62" y="178" width="140" height="8" rx="4" fill="rgba(255,255,255,0.5)" />
    {/* Screen */}
    <rect x="80" y="112" width="104" height="58" rx="5" fill="#f5f3ff" />
    {/* Password field */}
    <rect x="88" y="118" width="88" height="14" rx="5" fill="#ede9fe" />
    {[0,1,2,3,4,5].map(i => (
      <circle key={i} cx={97 + i*12} cy={125} r="3.5" fill="#7c3aed" opacity="0.7" />
    ))}
    {/* Confirm field */}
    <rect x="88" y="138" width="88" height="14" rx="5" fill="#ede9fe" />
    {[0,1,2,3].map(i => (
      <circle key={i} cx={97 + i*12} cy={145} r="3.5" fill="#7c3aed" opacity="0.4" />
    ))}
    {/* Submit button */}
    <rect x="104" y="158" width="56" height="12" rx="5" fill="#7c3aed" opacity="0.85" />
    {/* Key icon floating */}
    <circle cx="192" cy="88" r="18" fill="rgba(255,255,255,0.9)" />
    <circle cx="186" cy="88" r="7" fill="none" stroke="#7c3aed" strokeWidth="2.5" />
    <rect x="192" y="86" width="16" height="5" rx="2" fill="#7c3aed" />
    <rect x="202" y="91" width="4" height="5" rx="2" fill="#7c3aed" />
    <rect x="207" y="91" width="3" height="4" rx="1.5" fill="#7c3aed" />

    {/* Person */}
    <ellipse cx="52" cy="165" rx="16" ry="9" fill="rgba(255,255,255,0.12)" />
    <rect x="39" y="158" width="26" height="26" rx="9" fill="#6d28d9" />
    <circle cx="52" cy="147" r="14" fill="#fecdd3" />
    <path d="M39 143 Q52 132 65 143" fill="#1e1b4b" />
    <ellipse cx="52" cy="138" rx="13" ry="7" fill="#1e1b4b" />
    <circle cx="48" cy="148" r="1.5" fill="#374151" />
    <circle cx="56" cy="148" r="1.5" fill="#374151" />
    <path d="M49 153 Q52 156 56 153" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none" />

    <circle cx="212" cy="130" r="5" fill="rgba(255,255,255,0.25)" />
    <circle cx="30" cy="95" r="4" fill="rgba(255,255,255,0.2)" />
    <circle cx="22" cy="115" r="3" fill="rgba(255,255,255,0.15)" />
  </svg>
);

const IllustrationSuccess = () => (
  <svg viewBox="0 0 260 230" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" style={{ maxHeight: 220 }}>
    <ellipse cx="130" cy="115" rx="105" ry="90" fill="rgba(255,255,255,0.1)" />
    {/* Outer glow ring */}
    <circle cx="130" cy="108" r="62" stroke="rgba(255,255,255,0.25)" strokeWidth="2" fill="none" />
    <circle cx="130" cy="108" r="50" fill="rgba(255,255,255,0.18)" />
    <circle cx="130" cy="108" r="38" fill="rgba(255,255,255,0.9)" />
    {/* Big checkmark */}
    <path d="M114 108 L126 120 L150 93" stroke="#10b981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    {/* Celebration sparkles */}
    <circle cx="78" cy="68" r="5" fill="rgba(255,255,255,0.7)" />
    <circle cx="64" cy="88" r="3" fill="rgba(255,255,255,0.5)" />
    <circle cx="182" cy="66" r="5" fill="rgba(255,255,255,0.7)" />
    <circle cx="196" cy="84" r="3" fill="rgba(255,255,255,0.5)" />
    <circle cx="88" cy="162" r="4" fill="rgba(255,255,255,0.45)" />
    <circle cx="172" cy="158" r="4" fill="rgba(255,255,255,0.45)" />
    <text x="75" y="78" fontSize="14" fill="rgba(255,255,255,0.85)">✦</text>
    <text x="185" y="73" fontSize="11" fill="rgba(255,255,255,0.7)">✦</text>
    <text x="185" y="158" fontSize="13" fill="rgba(255,255,255,0.6)">✦</text>
    <text x="62" y="158" fontSize="10" fill="rgba(255,255,255,0.5)">✦</text>
    <text x="112" y="172" fontSize="10" fill="rgba(255,255,255,0.4)">✦</text>
    {/* Person celebrating */}
    <ellipse cx="52" cy="168" rx="15" ry="8" fill="rgba(255,255,255,0.12)" />
    <rect x="40" y="160" width="24" height="24" rx="8" fill="#059669" />
    <circle cx="52" cy="149" r="13" fill="#fecdd3" />
    <path d="M40 145 Q52 135 64 145" fill="#1e1b4b" />
    <ellipse cx="52" cy="140" rx="12" ry="7" fill="#1e1b4b" />
    {/* Raised arms */}
    <path d="M40 163 Q28 150 24 140" stroke="#fecdd3" strokeWidth="7" strokeLinecap="round" fill="none" />
    <path d="M64 163 Q76 150 80 140" stroke="#fecdd3" strokeWidth="7" strokeLinecap="round" fill="none" />
    <circle cx="48" cy="150" r="1.5" fill="#374151" />
    <circle cx="56" cy="150" r="1.5" fill="#374151" />
    <path d="M48 155 Q52 158 56 155" stroke="#374151" strokeWidth="1.2" strokeLinecap="round" fill="none" />
  </svg>
);

const ILLUSTRATIONS = [IllustrationForgot, IllustrationVerify, IllustrationReset, IllustrationSuccess];

const STEP_META = [
  { title: "Forgot Password?",  panelLabel: "Reset your account password" },
  { title: "Verification",      panelLabel: "Check your email for a code"  },
  { title: "Reset Password",    panelLabel: "Create a strong new password" },
  { title: "All Done! 🎉",      panelLabel: "Your password is updated"     },
];

const LEFT_GRADIENTS = [
  "linear-gradient(145deg, #5b21b6 0%, #7c3aed 60%, #8b5cf6 100%)",
  "linear-gradient(145deg, #4c1d95 0%, #6d28d9 60%, #7c3aed 100%)",
  "linear-gradient(145deg, #4338ca 0%, #6d28d9 60%, #7c3aed 100%)",
  "linear-gradient(145deg, #065f46 0%, #059669 60%, #10b981 100%)",
];

/* ─── Password strength ──────────────────────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "#e2e8f0" };
  let s = 0;
  if (pwd.length >= 8)           s++;
  if (pwd.length >= 12)          s++;
  if (/[A-Z]/.test(pwd))         s++;
  if (/[0-9]/.test(pwd))         s++;
  if (/[^A-Za-z0-9]/.test(pwd))  s++;
  if (s <= 1) return { score: s, label: "Weak",   color: "#ef4444" };
  if (s <= 2) return { score: s, label: "Fair",   color: "#f59e0b" };
  if (s <= 3) return { score: s, label: "Good",   color: "#3b82f6" };
  return       { score: s, label: "Strong", color: "#10b981" };
}

/* ─── OTP input component ────────────────────────────────────────── */
function OtpInput({ value, onChange }) {
  const refs = useRef([]);

  const set = (idx, ch) => {
    if (ch && !/^\d$/.test(ch)) return;
    const arr = Array.from({ length: 6 }, (_, i) => value[i] || "");
    arr[idx] = ch;
    onChange(arr.join(""));
    if (ch && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKeyDown = (idx, e) => {
    if (e.key === "Backspace") {
      if (value[idx]) {
        const arr = Array.from({ length: 6 }, (_, i) => value[i] || "");
        arr[idx] = "";
        onChange(arr.join(""));
      } else if (idx > 0) {
        const arr = Array.from({ length: 6 }, (_, i) => value[i] || "");
        arr[idx - 1] = "";
        onChange(arr.join(""));
        refs.current[idx - 1]?.focus();
      }
    }
    if (e.key === "ArrowLeft"  && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === "ArrowRight" && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onPaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) { onChange(pasted); refs.current[Math.min(pasted.length, 5)]?.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={el => (refs.current[i] = el)}
          className="fp-otp"
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={e => set(i, e.target.value)}
          onKeyDown={e => onKeyDown(i, e)}
          onPaste={onPaste}
          autoFocus={i === 0}
          style={{
            width: 50, height: 58,
            textAlign: "center",
            fontSize: 24, fontWeight: 700,
            border: `2.5px solid ${value[i] ? "#7c3aed" : "#ddd5fe"}`,
            borderRadius: 12,
            outline: "none",
            background: value[i] ? "#f5f3ff" : "#faf5ff",
            color: "#3b0764",
            transition: "all 0.18s",
            cursor: "text",
            boxSizing: "border-box",
            fontFamily: "inherit",
            letterSpacing: 0,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Eye icon ───────────────────────────────────────────────────── */
const EyeOn  = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="#94a3b8"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>;
const EyeOff = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="#94a3b8"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46A11.804 11.804 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>;

/* ═══════════════════════════════════════════════════════════════════ */
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step,            setStep]            = useState(1);
  const [email,           setEmail]           = useState("");
  const [otp,             setOtp]             = useState("");
  const [debugOtp,        setDebugOtp]        = useState("");
  const [resetToken,      setResetToken]      = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd,         setShowPwd]         = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [resendTimer,     setResendTimer]     = useState(0);
  const timerRef = useRef(null);

  const strength = getStrength(password);
  const IllustrationComp = ILLUSTRATIONS[step - 1];
  const meta = STEP_META[step - 1];

  /* resend countdown */
  useEffect(() => {
    if (resendTimer > 0) {
      timerRef.current = setTimeout(() => setResendTimer(t => t - 1), 1000);
    }
    return () => clearTimeout(timerRef.current);
  }, [resendTimer]);

  /* ── Step 1: send OTP ── */
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/send-otp", { email });
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      } else {
        setDebugOtp("");
      }
      setStep(2); setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send code. Please try again.");
    } finally { setLoading(false); }
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (otp.replace(/\s/g,"").length < 6) { setError("Please enter the complete 6-digit code."); return; }
    setError(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/verify-otp", { email, otp: otp.trim() });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid or expired code. Please try again.");
    } finally { setLoading(false); }
  };

  /* ── Resend OTP ── */
  const handleResend = async () => {
    setError(""); setOtp(""); setLoading(true);
    try {
      const { data } = await api.post("/auth/send-otp", { email });
      if (data.debugOtp) {
        setDebugOtp(data.debugOtp);
      } else {
        setDebugOtp("");
      }
      setResendTimer(60);
    } catch (err) {
      setError("Failed to resend code. Please try again.");
    } finally { setLoading(false); }
  };

  /* ── Step 3: reset password ── */
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setError(""); setLoading(true);
    try {
      await api.post("/auth/reset-password", { token: resetToken, newPassword: password });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. The link may have expired.");
    } finally { setLoading(false); }
  };

  const goBack = () => { setError(""); setStep(s => s - 1); };

  /* ─── Render ─────────────────────────────────────────────────── */
  return (
    <>
      <style>{STYLES}</style>
      <div style={st.root}>

        {/* TOP BAR */}
        <header style={st.topBar}>
          <button style={st.logo} onClick={() => navigate("/")} title="Home">
            <span style={st.logoM}>M</span>eetNova
          </button>
          <button style={st.topBackBtn} onClick={() => navigate("/login")}>
            ← Back to Login
          </button>
        </header>

        {/* MAIN */}
        <main style={st.main}>
          <div style={st.card}>

            {/* ── LEFT PANEL ── */}
            <div style={{ ...st.leftPanel, background: LEFT_GRADIENTS[step - 1] }}>
              {/* Decorative blobs */}
              <div style={st.blob1} />
              <div style={st.blob2} />

              {/* Progress dots */}
              <div style={st.dots}>
                {[1,2,3,4].map(s => (
                  <div key={s} style={{
                    ...st.dot,
                    width:      s === step ? 28 : 8,
                    background: s < step
                      ? "rgba(255,255,255,0.9)"
                      : s === step
                        ? "#fff"
                        : "rgba(255,255,255,0.3)",
                    boxShadow: s === step ? "0 0 0 3px rgba(255,255,255,0.3)" : "none",
                  }} />
                ))}
              </div>

              {/* Illustration */}
              <div style={st.illustWrap}>
                <IllustrationComp />
              </div>

              {/* Bottom text */}
              <div style={st.panelBottom}>
                <p style={st.panelStep}>Step {step} of 4</p>
                <p style={st.panelLabel}>{meta.panelLabel}</p>
              </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div style={st.rightPanel}>
              <div className="fp-step-anim" key={step} style={st.formBox}>

                {/* ══ STEP 1: Email ══ */}
                {step === 1 && (
                  <>
                    <div style={st.iconBadge}>🔐</div>
                    <h1 style={st.title}>{meta.title}</h1>
                    <p style={st.subtitle}>Enter the email address associated with your account to get a code.</p>

                    {error && <div style={st.errorBox}>{error}</div>}

                    <form onSubmit={handleSendOtp} style={st.form}>
                      <label style={st.label}>Email address</label>
                      <input
                        className="fp-input"
                        type="email" required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Enter email address"
                        style={st.input}
                        autoFocus
                      />
                      <button type="submit" disabled={loading} className="fp-btn" style={st.primaryBtn}>
                        {loading
                          ? <><span style={st.spinner} /> Sending...</>
                          : "Send Code →"}
                      </button>
                    </form>

                    <p style={st.footer}>
                      Remember your password?{" "}
                      <button className="fp-link" style={st.linkBtn} onClick={() => navigate("/login")}>
                        Back to login
                      </button>
                    </p>
                  </>
                )}

                {/* ══ STEP 2: OTP ══ */}
                {step === 2 && (
                  <>
                    <div style={st.iconBadge}>📧</div>
                    <h1 style={st.title}>{meta.title}</h1>
                    <p style={st.subtitle}>
                      Enter the 6-digit code received on{" "}
                      <strong style={{ color: "#7c3aed" }}>{email}</strong>
                    </p>

                    {error && <div style={st.errorBox}>{error}</div>}

                    <form onSubmit={handleVerifyOtp} style={st.form}>
                      <OtpInput value={otp} onChange={setOtp} />
                      <button type="submit" disabled={loading} className="fp-btn"
                        style={{ ...st.primaryBtn, marginTop: 28 }}>
                        {loading
                          ? <><span style={st.spinner} /> Verifying...</>
                          : "Verify Code →"}
                      </button>
                    </form>

                    {debugOtp && (
                      <div style={{
                        marginTop: 20,
                        padding: "14px 18px",
                        background: "#faf5ff",
                        border: "2px dashed #d8b4fe",
                        borderRadius: 14,
                        textAlign: "center",
                        boxShadow: "0 4px 12px rgba(124,58,237,0.06)",
                      }}>
                        <p style={{ margin: "0 0 6px", fontSize: 13, color: "#6b21a8", fontWeight: 700 }}>
                          🧪 Development OTP Mode
                        </p>
                        <p style={{ margin: "0 0 10px", fontSize: 12, color: "#7c3aed", lineHeight: 1.4 }}>
                          SMTP is unconfigured (using placeholders). Use this code to test:
                        </p>
                        <button
                          type="button"
                          onClick={() => setOtp(debugOtp)}
                          style={{
                            background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                            color: "#fff",
                            border: "none",
                            borderRadius: 8,
                            padding: "8px 16px",
                            fontSize: 14,
                            fontWeight: 700,
                            cursor: "pointer",
                            boxShadow: "0 4px 12px rgba(124,58,237,0.25)",
                            transition: "transform 0.15s, opacity 0.2s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.opacity = "0.9"}
                          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                        >
                          Auto-fill: {debugOtp}
                        </button>
                        <p style={{ margin: "10px 0 0", fontSize: 11, color: "#9333ea", lineHeight: 1.4 }}>
                          To use real emails, edit your <code style={{ background: "#f3e8ff", padding: "2px 4px", borderRadius: 4, fontFamily: "monospace" }}>server/.env</code> credentials.
                        </p>
                      </div>
                    )}

                    <p style={st.footer}>
                      Didn't receive code?{" "}
                      {resendTimer > 0
                        ? <span style={{ color: "#94a3b8", fontWeight: 600 }}>
                            Resend in 0:{String(resendTimer).padStart(2, "0")}
                          </span>
                        : <button className="fp-link" style={st.linkBtn}
                            onClick={handleResend} disabled={loading}>
                            Resend now
                          </button>
                      }
                    </p>
                    <p style={{ ...st.footer, marginTop: 8 }}>
                      <button className="fp-link" style={st.linkBtn}
                        onClick={goBack}>
                        ← Change email address
                      </button>
                    </p>
                  </>
                )}

                {/* ══ STEP 3: New Password ══ */}
                {step === 3 && (
                  <>
                    <div style={st.iconBadge}>🔑</div>
                    <h1 style={st.title}>{meta.title}</h1>
                    <p style={st.subtitle}>Enter the new password for your account.</p>

                    {error && <div style={st.errorBox}>{error}</div>}

                    <form onSubmit={handleResetPassword} style={st.form}>
                      {/* New Password */}
                      <div>
                        <label style={st.label}>New Password</label>
                        <div style={st.pwdRow}>
                          <input
                            className="fp-input"
                            type={showPwd ? "text" : "password"}
                            required
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder="New Password"
                            style={{ ...st.input, paddingRight: 44 }}
                            autoFocus
                          />
                          <button type="button" style={st.eyeBtn} onClick={() => setShowPwd(p => !p)}>
                            {showPwd ? <EyeOff /> : <EyeOn />}
                          </button>
                        </div>

                        {/* Strength meter */}
                        {password && (
                          <div style={{ marginTop: 8 }}>
                            <div style={st.strengthTrack}>
                              {[1,2,3,4].map(i => (
                                <div key={i} style={{
                                  ...st.strengthSeg,
                                  background: i <= Math.ceil(strength.score * 4 / 5)
                                    ? strength.color : "#e2e8f0",
                                  transition: "background 0.3s",
                                }} />
                              ))}
                            </div>
                            <span style={{ fontSize: 11, color: strength.color, fontWeight: 700 }}>
                              {strength.label}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label style={st.label}>Confirm New Password</label>
                        <div style={st.pwdRow}>
                          <input
                            className="fp-input"
                            type={showConfirm ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            placeholder="Confirm New Password"
                            style={{
                              ...st.input,
                              paddingRight: 44,
                              borderColor: confirmPassword && confirmPassword !== password
                                ? "#ef4444" : undefined,
                            }}
                          />
                          <button type="button" style={st.eyeBtn} onClick={() => setShowConfirm(p => !p)}>
                            {showConfirm ? <EyeOff /> : <EyeOn />}
                          </button>
                        </div>
                        {confirmPassword && confirmPassword !== password && (
                          <p style={{ fontSize: 11, color: "#ef4444", marginTop: 4, fontWeight: 500 }}>
                            Passwords do not match
                          </p>
                        )}
                      </div>

                      <button type="submit" disabled={loading} className="fp-btn" style={st.primaryBtn}>
                        {loading
                          ? <><span style={st.spinner} /> Resetting...</>
                          : "Submit →"}
                      </button>
                    </form>
                  </>
                )}

                {/* ══ STEP 4: Success ══ */}
                {step === 4 && (
                  <div style={{ textAlign: "center" }}>
                    <div className="fp-success-icon" style={st.successCircle}>
                      <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
                        <path d="M12 24 L21 33 L36 16" stroke="white" strokeWidth="4.5"
                          strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h1 style={{ ...st.title, color: "#059669", marginTop: 20 }}>{meta.title}</h1>
                    <p style={st.subtitle}>
                      Your password has been successfully reset. You can now log in with your new password.
                    </p>

                    <div style={st.successDetails}>
                      <span style={{ fontSize: 13, color: "#059669", fontWeight: 600 }}>
                        ✓ Password updated successfully
                      </span>
                    </div>

                    <button
                      className="fp-btn"
                      style={{ ...st.primaryBtn, background: "linear-gradient(135deg, #059669, #10b981)", marginTop: 32 }}
                      onClick={() => navigate("/login")}
                    >
                      Continue to Login →
                    </button>

                    <p style={{ ...st.footer, marginTop: 20 }}>
                      You will be redirected automatically in a few seconds.
                    </p>
                  </div>
                )}

              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}

/* ─── Styles ─────────────────────────────────────────────────────── */
const st = {
  root: {
    minHeight: "100vh",
    background: "linear-gradient(145deg, #f5f3ff 0%, #ede9fe 40%, #e0f2fe 100%)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Inter','Segoe UI',sans-serif",
  },

  /* Top bar */
  topBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 32px",
    background: "rgba(255,255,255,0.72)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    borderBottom: "1px solid rgba(255,255,255,0.55)",
    position: "sticky", top: 0, zIndex: 50,
  },
  logo: {
    fontSize: 22, fontWeight: 900, color: "#1a6ff4",
    letterSpacing: "-0.5px", background: "none", border: "none",
    cursor: "pointer", fontFamily: "inherit", padding: 0,
  },
  logoM: { color: "#7c3aed" },
  topBackBtn: {
    background: "none", border: "none", cursor: "pointer",
    color: "#7c3aed", fontWeight: 600, fontSize: 13,
    fontFamily: "inherit", padding: "6px 12px",
    borderRadius: 8,
    transition: "background 0.15s",
  },

  /* Main */
  main: {
    flex: 1, display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "28px 16px",
  },

  /* Card */
  card: {
    display: "flex", width: "100%", maxWidth: 900,
    minHeight: 540,
    borderRadius: 28,
    overflow: "hidden",
    boxShadow: "0 30px 70px rgba(109,40,217,0.18), 0 8px 24px rgba(0,0,0,0.08)",
  },

  /* Left panel */
  leftPanel: {
    width: 340, minWidth: 300,
    display: "flex", flexDirection: "column",
    padding: "36px 32px",
    position: "relative", overflow: "hidden",
    transition: "background 0.6s ease",
  },
  blob1: {
    position: "absolute", width: 220, height: 220, borderRadius: "50%",
    background: "rgba(255,255,255,0.08)",
    top: -60, right: -60, pointerEvents: "none",
  },
  blob2: {
    position: "absolute", width: 160, height: 160, borderRadius: "50%",
    background: "rgba(255,255,255,0.06)",
    bottom: -40, left: -40, pointerEvents: "none",
  },
  dots: { display: "flex", gap: 6, alignItems: "center", position: "relative", zIndex: 1 },
  dot: {
    height: 8, borderRadius: 4,
    transition: "all 0.4s cubic-bezier(.4,0,.2,1)",
  },
  illustWrap: {
    flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
    padding: "16px 0", position: "relative", zIndex: 1,
  },
  panelBottom: { position: "relative", zIndex: 1 },
  panelStep: {
    color: "rgba(255,255,255,0.65)", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase",
    margin: "0 0 4px",
  },
  panelLabel: {
    color: "#fff", fontSize: 17, fontWeight: 800,
    margin: 0, lineHeight: 1.35,
  },

  /* Right panel */
  rightPanel: {
    flex: 1, background: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "48px 52px",
    overflowY: "auto",
  },
  formBox: { width: "100%", maxWidth: 360 },

  /* Form elements */
  iconBadge: {
    fontSize: 36, marginBottom: 16, display: "block",
    filter: "drop-shadow(0 4px 8px rgba(109,40,217,0.25))",
  },
  title: {
    fontSize: 26, fontWeight: 900, color: "#5b21b6",
    margin: "0 0 8px", letterSpacing: "-0.5px",
  },
  subtitle: {
    fontSize: 14, color: "#64748b",
    margin: "0 0 24px", lineHeight: 1.65,
  },
  errorBox: {
    background: "#fef2f2", border: "1px solid #fecaca",
    color: "#dc2626", borderRadius: 10,
    padding: "10px 14px", fontSize: 13,
    marginBottom: 18, fontWeight: 500,
  },
  form: { display: "flex", flexDirection: "column", gap: 14 },
  label: { fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 5, display: "block" },
  input: {
    width: "100%", padding: "12px 14px",
    border: "2px solid #ddd5fe",
    borderRadius: 10, fontSize: 14,
    color: "#1e293b", outline: "none",
    fontFamily: "inherit",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
    background: "#faf5ff",
  },
  primaryBtn: {
    padding: "14px 20px",
    background: "linear-gradient(135deg, #5b21b6, #7c3aed)",
    color: "#fff", border: "none", borderRadius: 10,
    fontSize: 15, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    width: "100%", letterSpacing: "0.01em",
  },
  spinner: {
    display: "inline-block", width: 15, height: 15,
    border: "2.5px solid rgba(255,255,255,0.35)",
    borderTopColor: "#fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    flexShrink: 0,
  },
  footer: {
    textAlign: "center", fontSize: 13,
    color: "#64748b", margin: "18px 0 0",
  },
  linkBtn: {
    background: "none", border: "none",
    color: "#7c3aed", fontWeight: 700,
    cursor: "pointer", fontSize: 13,
    padding: 0, fontFamily: "inherit",
    textDecoration: "underline", textUnderlineOffset: 2,
    transition: "color 0.15s",
  },

  /* Password */
  pwdRow: { position: "relative" },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%",
    transform: "translateY(-50%)",
    background: "none", border: "none",
    cursor: "pointer", padding: 0, display: "flex", alignItems: "center",
  },
  strengthTrack: { display: "flex", gap: 4, marginBottom: 4 },
  strengthSeg: { flex: 1, height: 4, borderRadius: 2 },

  /* Success */
  successCircle: {
    width: 88, height: 88, borderRadius: "50%",
    background: "linear-gradient(135deg, #059669, #10b981)",
    display: "flex", alignItems: "center", justifyContent: "center",
    margin: "0 auto",
    boxShadow: "0 12px 32px rgba(16,185,129,0.35)",
  },
  successDetails: {
    background: "#f0fdf4", border: "1px solid #bbf7d0",
    borderRadius: 10, padding: "12px 20px",
    marginTop: 20, display: "flex", alignItems: "center", justifyContent: "center",
  },
};
