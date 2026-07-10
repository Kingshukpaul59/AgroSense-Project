export default function WeatherCard({ day, date, icon, condition, high, low, rain_mm, humidity, isToday = false }) {
  const rainColor = rain_mm >= 20 ? "#f07060" : rain_mm >= 5 ? "#6ab4e8" : "#6a7a58";
  return (
    <div style={{
      background: isToday ? "#283318" : "#1c2413",
      border: `1px solid ${isToday ? "#4e7a28" : "#2e3d1e"}`,
      borderRadius: 10, padding: "12px 8px",
      textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
      fontFamily: "'Outfit', sans-serif",
      transition: "transform .15s, border-color .15s",
      cursor: "default",
    }}
    onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
    onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
    >
      <div style={{ fontFamily: "monospace", fontSize: 10, color: isToday ? "#9fd468" : "#6a7a58", textTransform: "uppercase", letterSpacing: ".06em" }}>{isToday ? "Today" : day}</div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6a7a58" }}>{date}</div>
      <div style={{ fontSize: 24, margin: "6px 0 4px", lineHeight: 1 }}>{icon}</div>
      <div style={{ fontSize: 10, color: "#6a7a58", lineHeight: 1.3, minHeight: 26 }}>{condition}</div>
      <div style={{ display: "flex", gap: 6, alignItems: "baseline" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: "#e8f0d8" }}>{high}°</span>
        <span style={{ fontSize: 12, color: "#6a7a58" }}>{low}°</span>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 10, color: rainColor, marginTop: 4 }}>
        {rain_mm > 0 ? `💧 ${rain_mm}mm` : "Dry"}
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 9, color: "#6a7a58" }}>{humidity}% RH</div>
    </div>
  );
}
