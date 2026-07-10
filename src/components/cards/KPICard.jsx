export default function KPICard({ label, value, unit, delta, deltaType = "neutral", fillPct, fillColor = "#7ab648", note, delay = 0 }) {
  const deltaColors = { up: "#9fd468", down: "#f07060", warn: "#f0c85a", neutral: "#a8b898" };

  return (
    <div className="fade-up" style={{
      background: "#1f2a14", border: "1px solid #2e3d1e", borderRadius: 14,
      padding: 16, display: "flex", flexDirection: "column", gap: 4,
      fontFamily: "'Outfit', sans-serif",
      animationDelay: `${delay * 0.07}s`,
      transition: "border-color .15s",
    }}>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a7a58", textTransform: "uppercase", letterSpacing: ".08em" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 4 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 30, color: "#e8f0d8", lineHeight: 1 }}>{value}</span>
        {unit && <span style={{ fontSize: 13, color: "#6a7a58", fontFamily: "monospace" }}>{unit}</span>}
      </div>
      {delta && <div style={{ fontFamily: "monospace", fontSize: 11, color: deltaColors[deltaType] }}>{delta}</div>}
      {note  && <div style={{ fontFamily: "monospace", fontSize: 10, color: "#6a7a58" }}>{note}</div>}
      {fillPct !== undefined && (
        <div style={{ height: 3, borderRadius: 2, background: "#2e3d1e", marginTop: 10 }}>
          <div style={{ width: `${Math.min(fillPct, 100)}%`, height: "100%", borderRadius: 2, background: fillColor, transition: "width .8s ease" }} />
        </div>
      )}
    </div>
  );
}
