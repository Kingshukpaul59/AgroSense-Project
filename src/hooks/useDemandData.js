import { useState, useCallback } from "react";

// ── API base ───────────────────────────────────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch(path) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ── Mock data ──────────────────────────────────────────────────────────────
const MOCK_FORECAST = {
  labels:   ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  demand:   [420, 445, 510, 490, 560, 580],
  supply:   [380, 410, 440, 470, 500, 520],
  baseline: [400, 400, 420, 420, 440, 440],
};

const MOCK_GAP = {
  labels:  ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  gap:     [40,  35,  70,  20,  60,  60],
  surplus: [0,   0,   0,   0,   0,   0],
};

const MOCK_COVERAGE = [
  { crop: "Paddy",     coverage: 87,  supply_mt: 124000, demand_mt: 142500 },
  { crop: "Wheat",     coverage: 95,  supply_mt: 88000,  demand_mt: 92600  },
  { crop: "Soybean",   coverage: 62,  supply_mt: 31000,  demand_mt: 50000  },
  { crop: "Cotton",    coverage: 78,  supply_mt: 18600,  demand_mt: 23800  },
  { crop: "Sugarcane", coverage: 110, supply_mt: 242000, demand_mt: 220000 },
  { crop: "Maize",     coverage: 55,  supply_mt: 27500,  demand_mt: 50000  },
];

const DEV   = import.meta.env.DEV;
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

/**
 * useDemandData — data hook for LSTM demand forecasts, supply-demand gap,
 *                  and crop coverage breakdown
 *
 * Returns:
 *   forecast      {object|null}  — { labels, demand, supply, baseline }
 *   gap           {object|null}  — { labels, gap, surplus }
 *   coverage      {Array|null}   — [{ crop, coverage, supply_mt, demand_mt }]
 *   loading       {boolean}
 *   error         {string|null}
 *   loadForecast  {Function}     — async (crop, district?) => void
 *   loadGap       {Function}     — async (crop) => void
 *   loadCoverage  {Function}     — async (season) => void
 *   clearError    {Function}
 *
 * Usage:
 *   const { forecast, gap, coverage, loadForecast, loadGap, loadCoverage } = useDemandData();
 *
 *   useEffect(() => {
 *     loadForecast("Paddy (Rice)", "all");
 *     loadGap("Paddy (Rice)");
 *     loadCoverage("Kharif 2024");
 *   }, []);
 */
export function useDemandData() {
  const [forecast,  setForecast]  = useState(null);
  const [gap,       setGap]       = useState(null);
  const [coverage,  setCoverage]  = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const clearError = useCallback(() => setError(null), []);

  // ── LSTM 6-month demand forecast ─────────────────────────────────────────
  const loadForecast = useCallback(async (crop = "Paddy (Rice)", district = "all") => {
    setLoading(true);
    setError(null);
    try {
      const data = DEV
        ? (await delay(400), MOCK_FORECAST)
        : await apiFetch(`/demand/forecast?crop=${encodeURIComponent(crop)}&district=${encodeURIComponent(district)}`);
      setForecast(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Supply-demand gap ────────────────────────────────────────────────────
  const loadGap = useCallback(async (crop = "Paddy (Rice)") => {
    setError(null);
    try {
      const data = DEV
        ? (await delay(250), MOCK_GAP)
        : await apiFetch(`/demand/supply-demand?crop=${encodeURIComponent(crop)}&months=6`);
      setGap(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // ── Crop coverage breakdown ──────────────────────────────────────────────
  const loadCoverage = useCallback(async (season = "Kharif 2024") => {
    setError(null);
    try {
      const data = DEV
        ? (await delay(200), MOCK_COVERAGE)
        : await apiFetch(`/demand/coverage?season=${encodeURIComponent(season)}`);
      setCoverage(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  return {
    forecast,
    gap,
    coverage,
    loading,
    error,
    loadForecast,
    loadGap,
    loadCoverage,
    clearError,
  };
}
