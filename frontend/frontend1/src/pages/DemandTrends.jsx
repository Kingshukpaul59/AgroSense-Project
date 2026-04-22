import DemandChart from "../components/charts/DemandChart.jsx";
import PriceChart  from "../components/charts/PriceChart.jsx";

const card   = { background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:14, padding:18, fontFamily:"'Outfit',sans-serif" };
const mono   = { fontFamily:"monospace" };
const cTitle = { ...mono, fontSize:11, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" };

// ── Static mock data (swap with useDemandData hook when API is ready) ──────
const MONTHS   = ["Jan","Feb","Mar","Apr","May","Jun"];
const DEMAND   = [420, 445, 510, 490, 560, 580];
const SUPPLY   = [380, 410, 440, 470, 500, 520];
const BASELINE = [400, 400, 420, 420, 440, 440];
const GAP      = [40,  35,  70,  20,  60,  60];

const COVERAGE = [
  { crop:"Paddy",     coverage:87,  supply_mt:124000, demand_mt:142500 },
  { crop:"Wheat",     coverage:95,  supply_mt:88000,  demand_mt:92600  },
  { crop:"Soybean",   coverage:62,  supply_mt:31000,  demand_mt:50000  },
  { crop:"Cotton",    coverage:78,  supply_mt:18600,  demand_mt:23800  },
  { crop:"Sugarcane", coverage:110, supply_mt:242000, demand_mt:220000 },
  { crop:"Maize",     coverage:55,  supply_mt:27500,  demand_mt:50000  },
];

function covColor(p) {
  if (p >= 100) return "#3aaa88";
  if (p >= 85)  return "#7ab648";
  if (p >= 70)  return "#d4a843";
  return "#d45040";
}

const totalDeficit = COVERAGE
  .filter(c => c.coverage < 100)
  .reduce((acc, c) => acc + (c.demand_mt - c.supply_mt), 0);

export default function DemandTrends() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:"'Outfit',sans-serif" }}>

      {/* ── Summary KPIs ─────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
        {[
          { label:"Peak Forecast Demand", value:`${Math.max(...DEMAND)}k MT`, color:"#6ab4e8" },
          { label:"Lowest Supply Month",  value:`${Math.min(...SUPPLY)}k MT`, color:"#f07060"  },
          { label:"Total Deficit (MT)",   value:totalDeficit.toLocaleString(), color:"#f0c85a" },
          { label:"Surplus Crops",        value:`${COVERAGE.filter(c=>c.coverage>100).length}/${COVERAGE.length}`, color:"#9fd468" },
        ].map(({ label, value, color }) => (
          <div key={label} className="fade-up" style={{ background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:12, padding:"14px 16px" }}>
            <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:22, color, marginTop:6, lineHeight:1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>

        {/* LSTM Demand Forecast — uses DemandChart component */}
        <div className="fade-up" style={{ ...card, animationDelay:".06s" }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
            <div>
              <div style={cTitle}>LSTM 6-Month Demand Forecast</div>
              <div style={{ ...mono, fontSize:10, color:"#6a7a58", marginTop:3 }}>Paddy · 1000 MT units</div>
            </div>
            <span style={{ ...mono, fontSize:10, color:"#6ab4e8", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>
              LSTM · RMSE 4.2%
            </span>
          </div>
          <DemandChart
            labels={MONTHS}
            demand={DEMAND}
            supply={SUPPLY}
            baseline={BASELINE}
            height={220}
            unit="1000 MT"
          />
        </div>

        {/* Supply–Demand Gap — uses PriceChart component */}
        <div className="fade-up" style={{ ...card, animationDelay:".12s" }}>
          <div style={{ ...cTitle, marginBottom:6 }}>Supply–Demand Gap · Monthly</div>
          <PriceChart
            labels={MONTHS}
            gap={GAP}
            mode="gap"
            height={220}
            unit="1000 MT"
          />
        </div>
      </div>

      {/* ── Crop coverage breakdown ──────────────────────────────────────── */}
      <div className="fade-up" style={{ ...card, animationDelay:".18s" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={cTitle}>Crop Demand Coverage — All Districts</div>
          <div style={{ display:"flex", gap:12, ...mono, fontSize:10, color:"#6a7a58" }}>
            {[["#5ac8a8","Surplus"],["#9fd468","Good"],["#f0c85a","Moderate"],["#f07060","Deficit"]].map(([c,l]) => (
              <span key={l}><span style={{ color:c }}>●</span> {l}</span>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {COVERAGE.map(({ crop, coverage, supply_mt, demand_mt }) => {
            const color = covColor(coverage);
            return (
              <div key={crop} style={{ display:"grid", gridTemplateColumns:"100px 1fr 56px 160px", alignItems:"center", gap:12 }}>
                <span style={{ ...mono, fontSize:12, color:"#a8b898" }}>{crop}</span>
                <div style={{ height:18, background:"#2e3d1e", borderRadius:4, overflow:"visible", position:"relative" }}>
                  <div style={{ width:`${Math.min(coverage,100)}%`, height:"100%", borderRadius:4, background:color, transition:"width .8s ease" }}/>
                  {coverage > 100 && (
                    <div style={{ position:"absolute", right:-4, top:4, width:4, height:10, background:"#5ac8a8", borderRadius:2 }}/>
                  )}
                </div>
                <span style={{ ...mono, fontSize:12, fontWeight:500, color, textAlign:"right" }}>{coverage}%</span>
                <span style={{ ...mono, fontSize:10, color:"#6a7a58" }}>
                  {(supply_mt/1000).toFixed(0)}k / {(demand_mt/1000).toFixed(0)}k MT
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}