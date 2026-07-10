import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar        from "./components/layout/Sidebar.jsx";
import TopBar         from "./components/layout/TopBar.jsx";
import Dashboard      from "./pages/Dashboard.jsx";
import YieldForecast  from "./pages/YieldForecast.jsx";
import DemandTrends   from "./pages/DemandTrends.jsx";
import Advisory       from "./pages/Advisory.jsx";
import WeatherStation from "./pages/WeatherStation.jsx";

function Shell() {
  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", background:"#0d1208" }}>
      <Sidebar />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden", minWidth:0 }}>
        <TopBar />
        <main style={{ flex:1, overflowY:"auto", padding:"22px 24px", background:"#0d1208" }}>
          <Routes>
            <Route path="/"         element={<Dashboard />} />
            <Route path="/yield"    element={<YieldForecast />} />
            <Route path="/demand"   element={<DemandTrends />} />
            <Route path="/advisory" element={<Advisory />} />
            <Route path="/weather"  element={<WeatherStation />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
