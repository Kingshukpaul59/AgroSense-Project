import { useState, useRef, useEffect } from "react";
import { Chart } from "chart.js/auto";
import { BASE_OPTIONS, THEME } from "../components/charts/useChart.jsx";
import YieldChart from "../components/charts/YieldChart.jsx";

const card    = { background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:14, padding:18, fontFamily:"'Outfit',sans-serif" };
const mono    = { fontFamily:"monospace" };
const label11 = { ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 };

const CROPS     = ["Paddy (Rice)","Wheat","Soybean","Cotton","Sugarcane","Maize"];
const DISTRICTS = ["Pune","Nashik","Aurangabad","Kolhapur","Latur","Satara","Solapur","Osmanabad"];
const SEASONS   = ["Kharif 2024","Rabi 2024–25","Zaid 2025"];
const IRRIGATION= ["Rainfed","Canal","Drip","Sprinkler","Borewell"];
const SOIL      = ["Black cotton","Red laterite","Alluvial","Sandy loam","Clay"];

const MOCK = {
  "Paddy (Rice)":{ Pune:3.8,Nashik:3.2,Aurangabad:2.9,Kolhapur:4.2,Latur:2.6,Satara:3.9,Solapur:3.0,Osmanabad:2.4 },
  Wheat:         { Pune:3.1,Nashik:3.5,Aurangabad:3.2,Kolhapur:2.8,Latur:3.6,Satara:3.0,Solapur:3.3,Osmanabad:3.1 },
  Soybean:       { Pune:1.8,Nashik:2.1,Aurangabad:1.6,Kolhapur:2.0,Latur:1.9,Satara:2.2,Solapur:1.7,Osmanabad:1.5 },
  Cotton:        { Pune:2.3,Nashik:2.7,Aurangabad:2.1,Kolhapur:2.0,Latur:2.5,Satara:2.4,Solapur:2.2,Osmanabad:2.0 },
  Sugarcane:     { Pune:88, Nashik:74, Aurangabad:65, Kolhapur:92, Latur:70, Satara:86, Solapur:78, Osmanabad:60 },
  Maize:         { Pune:4.1,Nashik:4.8,Aurangabad:3.9,Kolhapur:4.6,Latur:4.0,Satara:4.3,Solapur:4.2,Osmanabad:3.7 },
};
const RISK = { high:{ label:"🔴 High Risk",color:"#f07060" }, moderate:{ label:"🟡 Moderate",color:"#f0c85a" }, low:{ label:"🟢 Low Risk",color:"#9fd468" } };

const selectStyle = { width:"100%", background:"#1c2413", border:"1px solid #3d5228", borderRadius:8, padding:"8px 12px", color:"#e8f0d8", fontFamily:"'Outfit',sans-serif", fontSize:13, outline:"none" };

export default function YieldForecast() {
  const [form, setForm] = useState({ crop:CROPS[0], district:DISTRICTS[0], season:SEASONS[0], area_ha:5, irrigation:IRRIGATION[0], soil_type:SOIL[0] });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  async function run() {
    setLoading(true);
    await new Promise(r=>setTimeout(r,700));
    const yv = MOCK[form.crop]?.[form.district] ?? 3.4;
    const jitter = +(yv + (Math.random()*.3-.15)).toFixed(2);
    const res = {
      predicted_yield: jitter,
      confidence_low:  +(jitter*.88).toFixed(2),
      confidence_high: +(jitter*1.12).toFixed(2),
      confidence_pct:  Math.round(88+Math.random()*8),
      risk_level: jitter<2?"high":jitter<3.5?"moderate":"low",
      feature_importance: { rainfall:.31,temperature:.22,soil_type:.18,irrigation:.15,previous_yield:.14 },
    };
    setResult(res);
    setLoading(false);

    // Draw chart
    setTimeout(()=>{
      if (!canvasRef.current) return;
      chartRef.current?.destroy();
      const labels = ["2019","2020","2021","2022","2023","2024","2025F","2026F"];
      const base = jitter*.78;
      const hist = [0,1,2,3,4].map(i=>+(base+i*.18+(Math.random()*.2-.1)).toFixed(2));
      const fc   = [...hist, jitter,+(jitter*1.04).toFixed(2),+(jitter*1.08).toFixed(2)];
      const up   = fc.map((v,i)=>i<5?null:+(v*1.10).toFixed(2));
      const lo   = fc.map((v,i)=>i<5?null:+(v*0.90).toFixed(2));
      chartRef.current = new Chart(canvasRef.current,{
        type:"line",
        data:{ labels, datasets:[
          { label:"Upper band", data:up, borderColor:"transparent", backgroundColor:"rgba(122,182,72,.15)", fill:"+1", tension:.4, pointRadius:0 },
          { label:"Forecast",   data:fc, borderColor:THEME.green, borderWidth:2, tension:.4, fill:false, pointRadius:4, pointBackgroundColor:(ctx)=>ctx.dataIndex>=5?THEME.green:THEME.amber },
          { label:"Lower band", data:lo, borderColor:"transparent", fill:false, tension:.4, pointRadius:0 },
          { label:"Historical", data:[...hist,null,null,null], borderColor:THEME.amber, borderDash:[4,3], borderWidth:1.5, tension:.4, fill:false, pointRadius:3, pointStyle:"rect", pointBackgroundColor:THEME.amber },
        ]},
        options:{ ...BASE_OPTIONS, plugins:{ ...BASE_OPTIONS.plugins, legend:{ ...BASE_OPTIONS.plugins.legend, labels:{ ...BASE_OPTIONS.plugins.legend.labels, filter:i=>i.text!=="Upper band"&&i.text!=="Lower band" } } }, interaction:{ intersect:false, mode:"index" } },
      });
    }, 50);
  }

  useEffect(()=>()=>chartRef.current?.destroy(),[]);

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:"'Outfit',sans-serif" }}>
      {/* Form */}
      <div className="fade-up" style={card}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
          <div>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>XGBoost Yield Prediction Engine</div>
            <div style={{ fontSize:12, color:"#6a7a58", marginTop:4 }}>Enter parameters to generate district-level crop yield forecast</div>
          </div>
          <span style={{ ...mono, fontSize:10, color:"#9fd468", background:"#1c2413", border:"1px solid #4e7a28", borderRadius:6, padding:"3px 9px" }}>Accuracy: 94.2%</span>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:16 }}>
          {[
            { key:"crop",        label:"Crop Type",      opts:CROPS },
            { key:"district",    label:"District",       opts:DISTRICTS },
            { key:"season",      label:"Season",         opts:SEASONS },
            { key:"irrigation",  label:"Irrigation Type",opts:IRRIGATION },
            { key:"soil_type",   label:"Soil Type",      opts:SOIL },
          ].map(({key,label,opts})=>(
            <div key={key}>
              <label style={label11}>{label}</label>
              <select style={selectStyle} value={form[key]} onChange={e=>set(key,e.target.value)}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label style={label11}>Area (ha)</label>
            <input type="number" min="0.5" max="500" step="0.5" value={form.area_ha}
              onChange={e=>set("area_ha",+e.target.value)}
              style={selectStyle}/>
          </div>
        </div>

        <button onClick={run} disabled={loading} style={{
          background:loading?"#2e3d1e":"#4e7a28", border:"1px solid #3d5228",
          color:loading?"#6a7a58":"#9fd468", fontFamily:"'Outfit',sans-serif", fontSize:13, fontWeight:500,
          padding:"10px 22px", borderRadius:8, cursor:loading?"not-allowed":"pointer",
          transition:"all .15s",
        }}>
          {loading ? "⟳ Running model…" : "▶ Run Prediction"}
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="fade-up" style={{ background:"#1c2413", border:"1px solid #3d5228", borderRadius:14, padding:"20px 24px", display:"flex", alignItems:"center", gap:28, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:52, color:"#9fd468", lineHeight:1 }}>{result.predicted_yield}</div>
            <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em", marginTop:6 }}>Predicted Yield (t/ha)</div>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", marginTop:4 }}>{form.crop} · {form.district} · {form.season}</div>
          </div>
          <div style={{ width:1, height:70, background:"#3d5228", flexShrink:0 }}/>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", marginBottom:8 }}>
              Confidence Interval&nbsp;
              <span style={{ color:"#f0c85a" }}>{result.confidence_low}</span>
              &nbsp;–&nbsp;
              <span style={{ color:"#9fd468" }}>{result.confidence_high}</span>
              &nbsp;t/ha
            </div>
            <div style={{ height:6, background:"#2e3d1e", borderRadius:3, overflow:"hidden" }}>
              <div style={{ width:`${result.confidence_pct}%`, height:"100%", background:"#4e7a28", borderRadius:3, transition:"width 1s ease" }}/>
            </div>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", marginTop:8 }}>
              Model confidence:&nbsp;<span style={{ color:"#9fd468" }}>{result.confidence_pct}%</span>
            </div>
          </div>
          <div style={{ width:1, height:70, background:"#3d5228", flexShrink:0 }}/>
          <div style={{ textAlign:"center", minWidth:100 }}>
            <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>Risk Level</div>
            <div style={{ fontSize:15, fontWeight:500, marginTop:6, color:RISK[result.risk_level].color }}>{RISK[result.risk_level].label}</div>
          </div>
        </div>
      )}

      {/* Feature importance */}
      {result && (
        <div className="fade-up" style={card}>
          <div style={{ ...mono, fontSize:11, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em", marginBottom:14 }}>Feature Importance</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {Object.entries(result.feature_importance).sort((a,b)=>b[1]-a[1]).map(([feat,w])=>(
              <div key={feat} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <span style={{ ...mono, fontSize:11, color:"#a8b898", textTransform:"capitalize", minWidth:140 }}>{feat.replace(/_/g," ")}</span>
                <div style={{ flex:1, height:6, background:"#2e3d1e", borderRadius:3, overflow:"hidden" }}>
                  <div style={{ width:`${w*100}%`, height:"100%", background:"#4e7a28", borderRadius:3, transition:"width .8s ease" }}/>
                </div>
                <span style={{ ...mono, fontSize:11, color:"#6a7a58", minWidth:32, textAlign:"right" }}>{(w*100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forecast chart */}
      {result && (
        <div className="fade-up" style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>Historical + Confidence Band Forecast</div>
            <span style={{ ...mono, fontSize:10, color:"#a8b898", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>±10% band</span>
          </div>
          <div style={{ height:240, position:"relative" }}>
            <canvas ref={canvasRef} style={{ width:"100%", height:"100%" }}/>
          </div>
        </div>
      )}
    </div>
  );
}
