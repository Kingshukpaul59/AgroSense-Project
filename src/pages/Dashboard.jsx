import KPICard    from "../components/cards/KPICard.jsx";
import YieldChart from "../components/charts/YieldChart.jsx";

// ── Shared card style ──────────────────────────────────────────────────────
const card = { background: "#1f2a14", border: "1px solid #2e3d1e", borderRadius: 14, padding: 18, fontFamily: "'Outfit', sans-serif" };
const cardTitle = { fontFamily: "monospace", fontSize: 11, color: "#6a7a58", textTransform: "uppercase", letterSpacing: ".07em" };
const cardSub   = { fontFamily: "monospace", fontSize: 10, color: "#6a7a58", marginTop: 3 };

// ── Static data ────────────────────────────────────────────────────────────
const YIELD_LABELS   = ["2020","2021","2022","2023","2024","2025F","2026F"];
const YIELD_ACTUAL   = [2.8, 3.1, 2.6, 3.4, 3.8, null, null];
const YIELD_FORECAST = [null, null, null, null, 3.8, 4.1, 4.4];

const DISTRICTS = [
  { name:"Pune",       yieldIndex:82, yield:3.8, status:"good",     lat:18.52, lng:73.86 },
  { name:"Nashik",     yieldIndex:68, yield:3.2, status:"moderate",  lat:19.99, lng:73.79 },
  { name:"Aurangabad", yieldIndex:58, yield:2.9, status:"low",       lat:19.88, lng:75.34 },
  { name:"Kolhapur",   yieldIndex:91, yield:4.2, status:"good",      lat:16.69, lng:74.23 },
  { name:"Latur",      yieldIndex:49, yield:2.6, status:"critical",  lat:18.40, lng:76.56 },
  { name:"Satara",     yieldIndex:85, yield:3.9, status:"good",      lat:17.68, lng:73.99 },
  { name:"Solapur",    yieldIndex:62, yield:3.0, status:"moderate",  lat:17.68, lng:75.90 },
  { name:"Osmanabad",  yieldIndex:44, yield:2.2, status:"critical",  lat:18.18, lng:76.04 },
];

function idxColor(i) {
  if (i >= 80) return "#9fd468";
  if (i >= 65) return "#7ab648";
  if (i >= 50) return "#4e7a28";
  if (i >= 35) return "#d4a843";
  return "#d45040";
}



// ── Mini choropleth SVG map ────────────────────────────────────────────────
const POLYS = [
  { d:"M40,30 90,20 110,60 70,75 30,55",    name:"Pune"       },
  { d:"M90,20 150,15 165,50 110,60",         name:"Nashik"     },
  { d:"M150,15 210,25 220,65 165,50",        name:"Aurangabad" },
  { d:"M210,25 260,40 250,80 220,65",        name:"Osmanabad"  },
  { d:"M30,55 70,75 80,115 35,105",          name:"Kolhapur"   },
  { d:"M70,75 110,60 130,100 100,120 80,115",name:"Satara"     },
  { d:"M110,60 165,50 175,95 130,100",       name:"Latur"      },
  { d:"M165,50 220,65 235,105 175,95",       name:"Solapur"    },
];
const LABELS = [
  { x:60,  y:50,  name:"Pune"       },
  { x:155, y:38,  name:"Nashik"     },
  { x:225, y:54,  name:"Aurangabad" },
  { x:240, y:64,  name:"Osmanabad"  },
  { x:58,  y:100, name:"Kolhapur"   },
  { x:98,  y:99,  name:"Satara"     },
  { x:148, y:88,  name:"Latur"      },
  { x:202, y:90,  name:"Solapur"    },
];

function RegionMap() {
  const byName = Object.fromEntries(DISTRICTS.map(d => [d.name, d]));
  return (
    <div style={{ position:"relative", width:"100%", height:"100%", minHeight:220 }}>
      <svg width="100%" height="100%" viewBox="0 0 290 210" style={{ display:"block" }}>
        <rect width="290" height="210" fill="#1c2413" rx="8"/>
        {POLYS.map(p => {
          const d = byName[p.name];
          return (
            <polygon key={p.name} points={p.d}
              fill={d ? idxColor(d.yieldIndex) : "#2e3d1e"}
              stroke="#0d1208" strokeWidth=".8" fillOpacity=".85" style={{ cursor:"pointer" }}>
              <title>{p.name}: {d?.yield} t/ha (Index {d?.yieldIndex})</title>
            </polygon>
          );
        })}
        {LABELS.map(l => (
          <text key={l.name} x={l.x} y={l.y} fill="#e8f0d8" fontSize="7" fontFamily="monospace" opacity=".9" textAnchor="middle">{l.name}</text>
        ))}
        {/* Legend */}
        {[["#9fd468","High"],["#d4a843","Mid"],["#d45040","Low"]].map(([col,lab],i) => (
          <g key={lab} transform={`translate(${6+i*46},192)`}>
            <rect width="8" height="8" rx="2" fill={col}/>
            <text x="12" y="7.5" fill="#a8b898" fontSize="7" fontFamily="monospace">{lab}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ── Dashboard ──────────────────────────────────────────────────────────────
export default function Dashboard() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        <KPICard delay={0} label="Avg Yield / Ha"    value="3.8" unit="t/ha"  delta="▲ 12.4% vs last season" deltaType="up"   fillPct={72} fillColor="#7ab648"/>
        <KPICard delay={1} label="Demand Coverage"   value="87"  unit="%"     delta="▼ 3.1% vs forecast"     deltaType="down" fillPct={87} fillColor="#d4a843"/>
        <KPICard delay={2} label="Districts at Risk" value="4"   unit="/16"   delta="● Drought stress detected" deltaType="down" fillPct={25} fillColor="#d45040"/>
        <KPICard delay={3} label="Advisory Actions"  value="14"               delta="5 urgent · 9 medium"     deltaType="warn" fillPct={60} fillColor="#d4a843"/>
      </div>

      {/* Chart + Map */}
      <div style={{ display:"grid", gridTemplateColumns:"3fr 2fr", gap:16 }}>
        <div className="fade-up" style={{ ...card, display:"flex", flexDirection:"column", animationDelay:".08s" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={cardTitle}>Yield Trend — Paddy (All Districts)</div>
              <div style={cardSub}>2020–2026 · tonnes / ha</div>
            </div>
            <span style={{ fontFamily:"monospace", fontSize:10, color:"#9fd468", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>XGBoost</span>
          </div>
          <YieldChart
            labels={YIELD_LABELS}
            actual={YIELD_ACTUAL}
            forecast={YIELD_FORECAST}
            height={210}
          />
        </div>

        <div className="fade-up" style={{ ...card, display:"flex", flexDirection:"column", animationDelay:".14s" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={cardTitle}>District Heat Map — Yield Index</div>
            <span style={{ fontFamily:"monospace", fontSize:10, color:"#a8b898", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>Kharif 2024</span>
          </div>
          <div style={{ flex:1, minHeight:210 }}><RegionMap /></div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:14, overflow:"hidden", animationDelay:".2s" }}>
        {[
          { label:"Top Yielding",    value:"Kolhapur", sub:"4.2 t/ha",       color:"#9fd468" },
          { label:"Lowest Yield",    value:"Latur",    sub:"2.6 t/ha",       color:"#f07060" },
          { label:"Best Growth",     value:"Nashik",   sub:"+18% YoY",       color:"#5ac8a8" },
          { label:"Season Rainfall", value:"812mm",    sub:"↑ 6% normal",    color:"#6ab4e8" },
          { label:"Active Alerts",   value:"14",       sub:"5 urgent",       color:"#f0c85a" },
          { label:"Harvest ETA",     value:"22 days",  sub:"Avg across zones",color:"#a8b898"},
        ].map(({ label, value, sub, color }, i) => (
          <div key={label} style={{ padding:"14px 16px", borderRight: i < 5 ? "1px solid #2e3d1e" : "none" }}>
            <div style={{ fontFamily:"monospace", fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:18, color, margin:"4px 0 2px", lineHeight:1 }}>{value}</div>
            <div style={{ fontFamily:"monospace", fontSize:10, color:"#6a7a58" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
