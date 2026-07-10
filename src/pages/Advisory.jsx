import { useState } from "react";
import AdvisoryCard from "../components/cards/AdvisoryCard.jsx";

const mono = { fontFamily:"monospace" };

const ALL = [
  { id:1,  urgency:"urgent", district:"Nashik",      title:"Brown planthopper outbreak — Nashik",    body:"Population surge detected above economic threshold (>10 per tiller). Apply imidacloprid 17.8 SL at 0.3 ml/L immediately. Drain flooded fields first.", meta:"Crop: Paddy · Severity: High · 3 villages" },
  { id:2,  urgency:"urgent", district:"Latur",        title:"Moisture deficit stress — Latur",        body:"Soil moisture below 25% in Rabi zones. Immediate irrigation required for wheat. Risk of grain shrivelling if unaddressed within 72 hrs.", meta:"Crop: Wheat · Severity: Critical · 2.4L ha" },
  { id:3,  urgency:"urgent", district:"Pune",         title:"Unseasonal frost risk — Pune hills",     body:"Temperature forecast to drop below 4°C Thursday night. Cover sensitive nursery stock. Delay transplanting operations by 5–7 days.", meta:"Crop: Tomato/Onion nursery · Severity: High" },
  { id:4,  urgency:"urgent", district:"Aurangabad",   title:"Fusarium wilt confirmed — Aurangabad",   body:"Lab analysis confirms Fusarium oxysporum in 3 fields. Drench soil with carbendazim 50 WP. Destroy infected plants — do not compost.", meta:"Crop: Cotton · Severity: High · Quarantine" },
  { id:5,  urgency:"urgent", district:"Osmanabad",    title:"Locust movement — border alert",         body:"Swarms reported 80 km east. Pre-emptive spraying corridors activated. Farmers within 30 km register coordinates for aerial support.", meta:"Multi-crop · Severity: Critical · State alert" },
  { id:6,  urgency:"medium", district:"Satara",       title:"Nitrogen top-dress window — Satara",     body:"Paddy at tillering stage — optimal window for split N application. Apply 40 kg urea/ha in next 6–10 days. Avoid before forecast rain.", meta:"Crop: Paddy · Priority: Medium · 8,400 ha" },
  { id:7,  urgency:"medium", district:"Nashik",       title:"Powdery mildew risk — Nashik grapes",    body:"Humidity + temperature profile indicates elevated disease risk. Begin preventive sulfur dust application on alternate rows.", meta:"Crop: Grapes · Risk window: 14 days" },
  { id:8,  urgency:"medium", district:"Solapur",      title:"Harvest scheduling — Solapur",           body:"Soybean moisture content estimated at 18%. Wait 5–7 days for optimal 14% before combine harvesting to reduce field losses.", meta:"Crop: Soybean · Action: Delay harvest" },
  { id:9,  urgency:"medium", district:"Kolhapur",     title:"Drip system flush advisory",             body:"Biofilm buildup detected via flow sensors in 4 drip zones. Flush with 0.1% chlorine solution and check emitter discharge rates.", meta:"Irrigation · 6 farms · Preventive maintenance" },
  { id:10, urgency:"medium", district:"Vidarbha",     title:"Market price window — Cotton",           body:"Spot prices 18% above MSP. CACP data suggests Q1 softening. Consider forward contracts for 30–40% of expected output this week.", meta:"Market advisory · Vidarbha · Time-sensitive" },
  { id:11, urgency:"medium", district:"Marathwada",   title:"Intercrop opportunity — Rabi prep",      body:"Post-Kharif slot available in 35% of surveyed fields. Chickpea + coriander intercrop recommended based on soil profile analysis.", meta:"Planning · Marathwada zone · 18,000 ha" },
  { id:12, urgency:"low",    district:"Kolhapur",     title:"New seed variety trial — Maize",         body:"ICAR-released PEHM-2 shows 22% yield advantage in similar zones. Enrol in district demonstration trial (limited slots).", meta:"Research · Kolhapur, Sangli · Open enrolment" },
  { id:13, urgency:"low",    district:"All",          title:"Soil health card renewal reminder",      body:"2024 soil health cards available at block agriculture offices. Fertilizer recs based on new analysis now uploaded to portal.", meta:"Administrative · All districts · Free service" },
  { id:14, urgency:"low",    district:"Marathwada",   title:"FPO grain storage capacity update",      body:"Three new FPO warehouses operational with 4,800 MT combined capacity. Rental: ₹18/quintal/month. Book via agri-portal.", meta:"Infrastructure · Marathwada · Booking open" },
];

const FILTERS = ["all","urgent","medium","low"];
const FLABELS = { all:"All", urgent:"Urgent", medium:"Medium", low:"Info" };
const COUNTS  = { urgent:ALL.filter(a=>a.urgency==="urgent").length, medium:ALL.filter(a=>a.urgency==="medium").length, low:ALL.filter(a=>a.urgency==="low").length };

export default function Advisory() {
  const [filter, setFilter] = useState("all");
  const [dismissed, setDismissed] = useState(new Set());
  const [acknowledged, setAcknowledged] = useState(new Set());

  const visible = ALL.filter(a => !dismissed.has(a.id) && (filter==="all" || a.urgency===filter));

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:"'Outfit',sans-serif" }}>
      {/* KPI row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10 }}>
        {[
          { label:"Total",         value:ALL.length-dismissed.size, color:"#e8f0d8", accent:"#3d5228" },
          { label:"Urgent",        value:COUNTS.urgent,             color:"#f07060", accent:"#d45040" },
          { label:"Medium",        value:COUNTS.medium,             color:"#f0c85a", accent:"#d4a843" },
          { label:"Info",          value:COUNTS.low,                color:"#5ac8a8", accent:"#3aaa88" },
          { label:"Acknowledged",  value:acknowledged.size,         color:"#9fd468", accent:"#4e7a28" },
        ].map(({label,value,color,accent})=>(
          <div key={label} className="fade-up" style={{ background:"#1f2a14", border:"1px solid #2e3d1e", borderLeft:`3px solid ${accent}`, borderRadius:12, padding:"13px 16px" }}>
            <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:28, color, marginTop:5, lineHeight:1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:"flex", alignItems:"center", gap:14, background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:10, padding:"10px 16px" }}>
        <span style={{ ...mono, fontSize:11, color:"#6a7a58", whiteSpace:"nowrap" }}>Filter by urgency</span>
        <div style={{ display:"flex", gap:6 }}>
          {FILTERS.map(f=>(
            <button key={f} onClick={()=>setFilter(f)} style={{
              display:"flex", alignItems:"center", gap:6,
              ...mono, fontSize:11,
              color: filter===f ? "#9fd468" : "#a8b898",
              background: filter===f ? "#4e7a28" : "transparent",
              border:`1px solid ${filter===f ? "#3d5228" : "#2e3d1e"}`,
              borderRadius:6, padding:"5px 12px", cursor:"pointer", transition:"all .12s",
            }}>
              {FLABELS[f]}
              {f!=="all" && <span style={{ background:"#1c2413", borderRadius:4, padding:"0 5px", fontSize:10, color: filter===f?"#9fd468":"#6a7a58" }}>{COUNTS[f]}</span>}
            </button>
          ))}
        </div>
        <span style={{ ...mono, fontSize:10, color:"#6a7a58", marginLeft:"auto" }}>{visible.length} advisories shown</span>
      </div>

      {/* Grid */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {visible.map(adv=>(
          <AdvisoryCard key={adv.id} {...adv}
            onAcknowledge={id=>setAcknowledged(s=>new Set([...s,id]))}
            onDismiss={id=>setDismissed(s=>new Set([...s,id]))}
          />
        ))}
        {visible.length===0 && (
          <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"48px 24px", color:"#6a7a58" }}>
            <div style={{ fontSize:32, color:"#4e7a28", marginBottom:10 }}>✓</div>
            <div style={{ ...mono, fontSize:13 }}>No advisories in this category</div>
          </div>
        )}
      </div>
    </div>
  );
}
