import { useState } from "react";

const CFG = {
  urgent: { label: "URGENT", border: "#d45040", bg: "rgba(212,80,64,.13)",  color: "#f07060" },
  medium: { label: "MEDIUM", border: "#d4a843", bg: "rgba(212,168,67,.13)", color: "#f0c85a" },
  low:    { label: "INFO",   border: "#3aaa88", bg: "rgba(58,170,136,.13)", color: "#5ac8a8" },
};

export default function AdvisoryCard({ id, urgency = "medium", title, body, meta, district, onAcknowledge, onDismiss }) {
  const [acked, setAcked] = useState(false);
  const [gone, setGone]   = useState(false);
  const c = CFG[urgency];
  if (gone) return null;

  return (
    <div style={{
      background: "#1c2413", borderRadius: 10, padding: 14,
      borderLeft: `3px solid ${c.border}`,
      display: "flex", flexDirection: "column", gap: 8,
      fontFamily: "'Outfit', sans-serif",
      animation: "fadeUp .35s ease both",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 500, background: c.bg, color: c.color }}>{c.label}</span>
        {district && <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6a7a58" }}>{district}</span>}
        <button onClick={() => { setGone(true); onDismiss?.(id); }} style={{ marginLeft: "auto", background: "none", border: "none", color: "#6a7a58", cursor: "pointer", fontSize: 11, padding: "2px 4px", borderRadius: 4 }}>✕</button>
      </div>
      <h3 style={{ fontSize: 13, fontWeight: 500, color: "#e8f0d8", lineHeight: 1.3 }}>{title}</h3>
      <p style={{ fontSize: 12, color: "#a8b898", lineHeight: 1.55 }}>{body}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 2 }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, color: "#6a7a58", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta}</span>
        {!acked
          ? <button onClick={() => { setAcked(true); onAcknowledge?.(id); }} style={{ fontFamily: "monospace", fontSize: 10, color: "#9fd468", background: "rgba(122,182,72,.1)", border: "1px solid #4e7a28", borderRadius: 5, padding: "3px 10px", cursor: "pointer", whiteSpace: "nowrap" }}>Acknowledge</button>
          : <span style={{ fontFamily: "monospace", fontSize: 10, color: "#9fd468" }}>✓ Acknowledged</span>
        }
      </div>
    </div>
  );
}
