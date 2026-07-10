import { Link, useLocation } from "react-router-dom";

// ── Navigation config ──────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    section: "Analytics",
    items: [
      { to: "/",        label: "Dashboard",    icon: <DashboardIcon /> },
      { to: "/yield",   label: "Yield Forecast", icon: <YieldIcon /> },
      { to: "/demand",  label: "Demand Trends", icon: <TrendIcon /> },
    ],
  },
  {
    section: "Operations",
    items: [
      { to: "/advisory", label: "Advisory",       icon: <AdvisoryIcon /> },
      { to: "/weather",  label: "Weather Station", icon: <WeatherIcon /> },
    ],
  },
];

// ── Styles ─────────────────────────────────────────────────────────────────
const S = {
  aside: {
    width: 220, minWidth: 220,
    background: "#141a0d",
    borderRight: "1px solid #2e3d1e",
    display: "flex",
    flexDirection: "column",
    fontFamily: "'Outfit', sans-serif",
    height: "100vh",
    overflow: "hidden",
  },
  logoWrap: {
    padding: "18px 16px 16px",
    borderBottom: "1px solid #2e3d1e",
    flexShrink: 0,
  },
  logoMark: {
    width: 34, height: 34,
    background: "#4e7a28",
    borderRadius: 9,
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: 10,
    color: "#9fd468",
    flexShrink: 0,
  },
  logoTitle: {
    fontSize: 15, fontWeight: 600,
    color: "#e8f0d8",
    letterSpacing: "-.2px",
    lineHeight: 1.2,
  },
  logoSub: {
    fontSize: 10, color: "#6a7a58",
    fontFamily: "monospace",
    marginTop: 2,
  },
  nav: {
    flex: 1,
    padding: "10px 8px",
    display: "flex",
    flexDirection: "column",
    gap: 1,
    overflowY: "auto",
  },
  sectionLabel: {
    fontSize: 10, color: "#6a7a58",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: ".08em",
    padding: "12px 10px 5px",
    userSelect: "none",
  },
  foot: {
    padding: "14px 12px",
    borderTop: "1px solid #2e3d1e",
    flexShrink: 0,
  },
  seasonBadge: {
    background: "#1f2a14",
    border: "1px solid #3d5228",
    borderRadius: 8,
    padding: "9px 12px",
  },
  seasonLabel: {
    fontSize: 10, color: "#6a7a58",
    fontFamily: "monospace",
    textTransform: "uppercase",
    letterSpacing: ".07em",
  },
  seasonVal: {
    fontSize: 13, color: "#f0c85a",
    fontWeight: 500, marginTop: 3,
  },
  liveRow: {
    display: "flex", alignItems: "center",
    gap: 7, marginTop: 10,
    fontSize: 11, color: "#6a7a58",
    fontFamily: "monospace",
  },
};

// ── NavLink ────────────────────────────────────────────────────────────────
function NavLink({ to, label, icon }) {
  const loc    = useLocation();
  const active = loc.pathname === to;

  return (
    <Link
      to={to}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "9px 12px", borderRadius: 8,
        textDecoration: "none",
        fontSize: 13, fontWeight: active ? 500 : 400,
        color:      active ? "#9fd468" : "#a8b898",
        background: active ? "#4e7a28" : "transparent",
        border:     `1px solid ${active ? "#3d5228" : "transparent"}`,
        transition: "background .12s, color .12s, border-color .12s",
        position: "relative",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = "#1f2a14";
          e.currentTarget.style.color      = "#e8f0d8";
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color      = "#a8b898";
        }
      }}
    >
      {/* Icon */}
      <span style={{ width: 16, height: 16, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", color: active ? "#9fd468" : "#6a7a58" }}>
        {icon}
      </span>

      {/* Label */}
      <span style={{ flex: 1 }}>{label}</span>

      {/* Active pip */}
      {active && (
        <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#9fd468", flexShrink: 0 }} />
      )}
    </Link>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────
export default function Sidebar() {
  return (
    <aside style={S.aside}>
      {/* Logo */}
      <div style={S.logoWrap}>
        <div style={S.logoMark}>
          <LeafIcon />
        </div>
        <div style={S.logoTitle}>AgroIntel</div>
        <div style={S.logoSub}>v2.4 · AP Region</div>
      </div>

      {/* Navigation */}
      <nav style={S.nav}>
        {NAV_GROUPS.map(({ section, items }) => (
          <div key={section}>
            <div style={S.sectionLabel}>{section}</div>
            {items.map(item => (
              <NavLink key={item.to} {...item} />
            ))}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={S.foot}>
        {/* Season badge */}
        <div style={S.seasonBadge}>
          <div style={S.seasonLabel}>Current Season</div>
          <div style={S.seasonVal}>Kharif 2024</div>
        </div>

        {/* Live indicator */}
        <div style={S.liveRow}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: "#7ab648", display: "inline-block",
            animation: "pulse 2s ease-in-out infinite",
          }} />
          16 districts active
        </div>
      </div>
    </aside>
  );
}

// ── SVG Icons ──────────────────────────────────────────────────────────────
function LeafIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20C19 20 22 3 22 3c-1 2-8 5.25-8 5.25z"/>
    </svg>
  );
}
function DashboardIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  );
}
function YieldIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/>
    </svg>
  );
}
function TrendIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/>
    </svg>
  );
}
function AdvisoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
    </svg>
  );
}
function WeatherIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
    </svg>
  );
}
