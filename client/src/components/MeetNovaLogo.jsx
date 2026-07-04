/**
 * MeetNovaLogo — Reusable branded logo component
 * Matches: [MEET] vivid blue pill badge + "Nova" bold text
 *
 * Props:
 *  size:    "sm" | "md" | "lg"
 *  variant: "dark"    → Nova text is bright/white (for dark backgrounds)
 *           "light"   → Nova text is dark/navy (for white/light backgrounds)
 *           "dynamic" → Nova text adapts automatically using CSS theme variables (for dashboard)
 */
export default function MeetNovaLogo({ size = "md", variant = "dynamic", linkTo = "/" }) {
  const sizes = {
    sm: { fontSize: "10px", padding: "3px 8px", radius: "6px", novaSize: "14px", gap: "6px" },
    md: { fontSize: "12px", padding: "4px 11px", radius: "7px", novaSize: "18px", gap: "7px" },
    lg: { fontSize: "14px", padding: "5px 14px", radius: "8px", novaSize: "23px", gap: "9px" },
  };

  const s = sizes[size] || sizes.md;

  // Resolve color based on variant
  let colorStyle = {};
  if (variant === "dark") {
    colorStyle = { color: "#f8fafc" }; // Crisp white-blue for dark mode backgrounds
  } else if (variant === "light") {
    colorStyle = { color: "#1e293b" }; // High contrast dark slate for light mode backgrounds
  } else {
    // Dynamic: automatically adapts based on MERN theme system CSS variables
    colorStyle = { color: "var(--text-primary, #0f172a)" };
  }

  return (
    <a
      href={linkTo}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: s.gap,
        textDecoration: "none",
        cursor: "pointer",
        verticalAlign: "middle",
      }}
    >
      {/* ── [MEET] Badge ── */}
      <span
        style={{
          fontSize: s.fontSize,
          padding: s.padding,
          borderRadius: s.radius,
          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
          color: "#ffffff",
          fontWeight: "800",
          letterSpacing: "0.05em",
          fontFamily: "Inter, system-ui, sans-serif",
          lineHeight: "1",
          userSelect: "none",
          boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)",
          display: "inline-block",
        }}
      >
        MEET
      </span>

      {/* ── Nova Text ── */}
      <span
        style={{
          ...colorStyle,
          fontSize: s.novaSize,
          fontWeight: "750",
          letterSpacing: "-0.02em",
          fontFamily: "Inter, system-ui, sans-serif",
          userSelect: "none",
          lineHeight: "1.1",
        }}
      >
        Nova
      </span>
    </a>
  );
}
