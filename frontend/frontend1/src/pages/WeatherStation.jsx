import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import WeatherCard from "../components/cards/WeatherCard.jsx";
import { BASE_OPTIONS, THEME } from "../components/charts/useChart.jsx"; 

const card   = { background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:14, padding:18, fontFamily:"'Outfit',sans-serif" };
const mono   = { fontFamily:"monospace" };
const cTitle = { ...mono, fontSize:11, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" };

const DAYS = [
  { day:"Mon", date:"Apr 14", icon:"🌤", condition:"Partly cloudy", high:32, low:22, rain_mm:2,  humidity:64, wind_kph:12 },
  { day:"Tue", date:"Apr 15", icon:"⛅", condition:"Overcast",      high:29, low:21, rain_mm:8,  humidity:72, wind_kph:18 },
  { day:"Wed", date:"Apr 16", icon:"🌧", condition:"Heavy rain",    high:25, low:20, rain_mm:24, humidity:88, wind_kph:22 },
  { day:"Thu", date:"Apr 17", icon:"🌩", condition:"Thunderstorm",  high:23, low:19, rain_mm:38, humidity:92, wind_kph:30 },
  { day:"Fri", date:"Apr 18", icon:"🌦", condition:"Light showers", high:27, low:20, rain_mm:12, humidity:78, wind_kph:15 },
  { day:"Sat", date:"Apr 19", icon:"🌤", condition:"Partly cloudy", high:31, low:22, rain_mm:1,  humidity:60, wind_kph:10 },
  { day:"Sun", date:"Apr 20", icon:"☀",  condition:"Sunny",         high:34, low:23, rain_mm:0,  humidity:52, wind_kph:8  },
];

const INDICES = [
  { label:"Evapotranspiration", value:"4.8", unit:"mm/day", status:"high",   note:"Irrigate fields",   fillPct:80, fillColor:"#d4a843" },
  { label:"Soil Moisture",      value:"34",  unit:"%",      status:"good",   note:"Adequate",          fillPct:34, fillColor:"#7ab648" },
  { label:"GDD Accumulated",    value:"1240",unit:"°C·d",   status:"normal", note:"Day 82 of season",  fillPct:55, fillColor:"#4a90c4" },
  { label:"Pest Risk Index",    value:"72",  unit:"/100",   status:"high",   note:"Scout fields now",  fillPct:72, fillColor:"#d45040" },
];
const STATUS_COLOR = { high:"#f07060", good:"#9fd468", normal:"#a8b898" };

function TempChart() {
  const ref = useRef(null); const ch = useRef(null);
  useEffect(()=>{
    if (!ref.current) return;
    ch.current?.destroy();
    ch.current = new Chart(ref.current,{
      type:"line",
      data:{ labels:DAYS.map(d=>d.day), datasets:[
        { label:"High °C", data:DAYS.map(d=>d.high), borderColor:"#d45040", backgroundColor:"rgba(212,80,64,0.10)", fill:true, tension:.4, borderWidth:2, pointRadius:4, pointBackgroundColor:"#d45040" },
        { label:"Low °C",  data:DAYS.map(d=>d.low),  borderColor:"#4a90c4", backgroundColor:"rgba(74,144,196,0.10)", fill:true, tension:.4, borderWidth:2, pointRadius:4, pointBackgroundColor:"#4a90c4" },
      ]},
      options:{ ...BASE_OPTIONS, interaction:{ intersect:false, mode:"index" } },
    });
    return ()=>ch.current?.destroy();
  },[]);
  return <canvas ref={ref} style={{ width:"100%", height:"100%" }}/>;
}

function RainChart() {
  const ref = useRef(null); const ch = useRef(null);
  useEffect(()=>{
    if (!ref.current) return;
    ch.current?.destroy();
    ch.current = new Chart(ref.current,{
      type:"bar",
      data:{ labels:DAYS.map(d=>d.day), datasets:[{
        label:"Rainfall (mm)",
        data:DAYS.map(d=>d.rain_mm),
        backgroundColor:DAYS.map(d=>d.rain_mm>=20?"rgba(212,80,64,.7)":d.rain_mm>=5?"rgba(74,144,196,.7)":"rgba(74,144,196,.35)"),
        borderRadius:5,
      }]},
      options:BASE_OPTIONS,
    });
    return ()=>ch.current?.destroy();
  },[]);
  return <canvas ref={ref} style={{ width:"100%", height:"100%" }}/>;
}

export default function WeatherStation() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:16, fontFamily:"'Outfit',sans-serif" }}>
      {/* 7-day strip */}
      <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:10 }}>
        {DAYS.map((d,i)=><WeatherCard key={d.day} {...d} isToday={i===0}/>)}
      </div>

      {/* Charts */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
        <div className="fade-up" style={{ ...card, animationDelay:".06s" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={cTitle}>Temperature Trend · 7-Day</div>
            <span style={{ ...mono, fontSize:10, color:"#a8b898", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>°C</span>
          </div>
          <div style={{ height:200, position:"relative" }}><TempChart /></div>
        </div>
        <div className="fade-up" style={{ ...card, animationDelay:".12s" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={cTitle}>Rainfall Forecast</div>
            <span style={{ ...mono, fontSize:10, color:"#6ab4e8", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>mm / day</span>
          </div>
          <div style={{ height:200, position:"relative" }}><RainChart /></div>
        </div>
      </div>

      {/* Agro-met indices */}
      <div className="fade-up" style={{ ...card, animationDelay:".18s" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:18 }}>
          <div style={cTitle}>Agro-Meteorological Indices</div>
          <span style={{ ...mono, fontSize:10, color:"#a8b898", background:"#1c2413", border:"1px solid #2e3d1e", borderRadius:6, padding:"3px 9px" }}>Pune district · Live</span>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14 }}>
          {INDICES.map(({ label, value, unit, status, note, fillPct, fillColor })=>(
            <div key={label} style={{ background:"#1c2413", borderRadius:10, padding:14, display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em" }}>{label}</div>
              <div style={{ display:"flex", alignItems:"baseline", gap:4 }}>
                <span style={{ fontFamily:"'DM Serif Display',serif", fontSize:26, color:"#e8f0d8", lineHeight:1 }}>{value}</span>
                <span style={{ ...mono, fontSize:12, color:"#6a7a58" }}>{unit}</span>
              </div>
              <div style={{ height:4, background:"#2e3d1e", borderRadius:2, overflow:"hidden" }}>
                <div style={{ width:`${fillPct}%`, height:"100%", background:fillColor, borderRadius:2, transition:"width .8s ease" }}/>
              </div>
              <div style={{ ...mono, fontSize:11, color:STATUS_COLOR[status]||"#6a7a58" }}>
                {status==="high"?"▲":status==="good"?"✓":"●"} {note}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Wind + humidity strip */}
      <div className="fade-up" style={{ display:"grid", gridTemplateColumns:"auto repeat(7,1fr)", background:"#1f2a14", border:"1px solid #2e3d1e", borderRadius:12, overflow:"hidden", animationDelay:".24s" }}>
        <div style={{ display:"flex", alignItems:"center", padding:"0 16px", ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase", letterSpacing:".07em", borderRight:"1px solid #2e3d1e", whiteSpace:"nowrap" }}>
          Wind & Humidity
        </div>
        {DAYS.map((d,i)=>(
          <div key={d.day} style={{ padding:"12px 8px", textAlign:"center", borderRight:i<6?"1px solid #2e3d1e":"none" }}>
            <div style={{ ...mono, fontSize:10, color:"#6a7a58", textTransform:"uppercase" }}>{d.day}</div>
            <div style={{ ...mono, fontSize:12, color:"#6ab4e8", marginTop:4 }}>{d.wind_kph} km/h</div>
            <div style={{ ...mono, fontSize:11, color:"#6a7a58", marginTop:2 }}>{d.humidity}% RH</div>
          </div>
        ))}
      </div>
    </div>
  );
}
