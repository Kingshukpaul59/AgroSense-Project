import { Link, useLocation } from "react-router-dom";

// ── Page metadata map ──────────────────────────────────────────────────────
const PAGE_META = {
  "/":         { title: "Field Intelligence Dashboard", sub: "16 districts · 24 crops · Updated 08:42 IST" },
  "/yield":    { title: "Yield Forecast",               sub: "XGBoost predictive model · District-level prediction" },
  "/demand":   { title: "Demand Trends",                sub: "LSTM 6-month forecast · Supply-demand gap analysis" },
  "/advisory": { title: "Farmer Advisories",            sub: "AI-curated district-level recommendations" },
  "/weather":  { title: "Weather Station",              sub: "7-day forecast · Agro-meteorological indices" },
};

// ── Chip component — small badge/button ───────────────────────────────────
function Chip({ children, as: Tag = "div", to, style = {} }) {
  const base = {
    display: "flex", alignItems: "center", gap: 6,
    fontFamily: "monospace", fontSize: 11, color: "#a8b898",
    background: "#1f2a14", border: "1px solid #2e3d1e",
    borderRadius: 6, padding: "5px 10px",
    textDecoration: "none", whiteSpace: "nowrap",
    flexShrink: 0,
    ...style,
  };

  if (to) {
    return <Link to={to} style={base}>{children}</Link>;
  }
  return <div style={base}>{children}</div>;
}

// ── TopBar ─────────────────────────────────────────────────────────────────
export default function TopBar() {
  const loc  = useLocation();
  const meta = PAGE_META[loc.pathname] ?? PAGE_META["/"];

  return (
    <header style={{
      height: 52, minHeight: 52,
      background: "#141a0d",
      borderBottom: "1px solid #2e3d1e",
      display: "flex", alignItems: "center",
      padding: "0 20px", gap: 12,
      fontFamily: "'Outfit', sans-serif",
      flexShrink: 0,
    }}>

      {/* Page title block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 17, fontWeight: 600, color: "#e8f0d8",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          lineHeight: 1.2,
        }}>
          {meta.title}
        </div>
        <div style={{
          fontSize: 10, color: "#6a7a58",
          fontFamily: "monospace", marginTop: 2,
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {meta.sub}
        </div>
      </div>

      {/* Weather quick-link */}
      <Chip to="/weather">
        <WeatherChipIcon />
        26°C · Patchy rain
      </Chip>

      {/* Season */}
      <Chip style={{ color: "#f0c85a", borderColor: "#3d5228" }}>
        Kharif 2024
      </Chip>

      {/* Live status */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "monospace", fontSize: 11, color: "#6a7a58", flexShrink: 0 }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "#7ab648", display: "inline-block",
        }} />
        Live
      </div>

      {/* Avatar */}
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "#4e7a28", color: "#9fd468",
        fontSize: 11, fontWeight: 600, fontFamily: "monospace",
        display: "flex", alignItems: "center", justifyContent: "center",
        border: "1px solid #3d5228", cursor: "pointer", flexShrink: 0,
        userSelect: "none",
      }}>
        AS
      </div>
    </header>
  );
}

// ── Icon ───────────────────────────────────────────────────────────────────
function WeatherChipIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="#6a7a58">
      <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/>
    </svg>
  );
}
