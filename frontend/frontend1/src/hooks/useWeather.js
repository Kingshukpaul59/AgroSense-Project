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
const MOCK_7DAY = [
  { day: "Mon", date: "Apr 14", icon: "🌤", condition: "Partly cloudy", high: 32, low: 22, rain_mm: 2,  humidity: 64, wind_kph: 12 },
  { day: "Tue", date: "Apr 15", icon: "⛅", condition: "Overcast",      high: 29, low: 21, rain_mm: 8,  humidity: 72, wind_kph: 18 },
  { day: "Wed", date: "Apr 16", icon: "🌧", condition: "Heavy rain",    high: 25, low: 20, rain_mm: 24, humidity: 88, wind_kph: 22 },
  { day: "Thu", date: "Apr 17", icon: "🌩", condition: "Thunderstorm",  high: 23, low: 19, rain_mm: 38, humidity: 92, wind_kph: 30 },
  { day: "Fri", date: "Apr 18", icon: "🌦", condition: "Light showers", high: 27, low: 20, rain_mm: 12, humidity: 78, wind_kph: 15 },
  { day: "Sat", date: "Apr 19", icon: "🌤", condition: "Partly cloudy", high: 31, low: 22, rain_mm: 1,  humidity: 60, wind_kph: 10 },
  { day: "Sun", date: "Apr 20", icon: "☀",  condition: "Sunny",         high: 34, low: 23, rain_mm: 0,  humidity: 52, wind_kph: 8  },
];

const MOCK_INDICES = {
  evapotranspiration: { value: 4.8,  unit: "mm/day", status: "high",   label: "Irrigate fields"  },
  soil_moisture:      { value: 34,   unit: "%",       status: "good",   label: "Adequate"         },
  gdd_accumulated:    { value: 1240, unit: "°C·d",    status: "normal", label: "Day 82 of season" },
  pest_risk_index:    { value: 72,   unit: "/100",    status: "high",   label: "Scout fields now" },
};

const MOCK_HISTORY = {
  labels:      ["Mar 18", "Mar 19", "Mar 20", "Mar 21", "Mar 22", "Mar 23", "Mar 24",
                "Mar 25", "Mar 26", "Mar 27", "Mar 28", "Mar 29", "Mar 30", "Apr 13"],
  temperature: [29, 31, 28, 26, 27, 30, 32, 33, 29, 28, 27, 30, 31, 32],
  rainfall:    [0,  0,  12, 8,  0,  0,  0,  0,  2,  18, 24, 0,  0,  2 ],
};

const DEV   = import.meta.env.DEV;
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

/**
 * useWeather — data hook for 7-day forecast, agro-met indices, and history
 *
 * Returns:
 *   forecast7    {Array|null}   — 7-day daily forecast array
 *                                 [{ day, date, icon, condition, high, low, rain_mm, humidity, wind_kph }]
 *   indices      {object|null}  — agro-meteorological indices object
 *                                 { evapotranspiration, soil_moisture, gdd_accumulated, pest_risk_index }
 *                                 Each: { value, unit, status, label }
 *   history      {object|null}  — historical temp & rainfall
 *                                 { labels, temperature, rainfall }
 *   loading      {boolean}
 *   error        {string|null}
 *   loadForecast {Function}     — async (district) => void
 *   loadIndices  {Function}     — async (district) => void
 *   loadHistory  {Function}     — async (district, days?) => void
 *   clearError   {Function}
 *
 * Usage:
 *   const { forecast7, indices, loadForecast, loadIndices } = useWeather();
 *
 *   useEffect(() => {
 *     loadForecast("Pune");
 *     loadIndices("Pune");
 *   }, []);
 */
export function useWeather() {
  const [forecast7, setForecast7] = useState(null);
  const [indices,   setIndices]   = useState(null);
  const [history,   setHistory]   = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  const clearError = useCallback(() => setError(null), []);

  // ── 7-day forecast ───────────────────────────────────────────────────────
  const loadForecast = useCallback(async (district = "Pune") => {
    setLoading(true);
    setError(null);
    try {
      const data = DEV
        ? (await delay(350), MOCK_7DAY)
        : await apiFetch(`/weather/forecast?district=${encodeURIComponent(district)}`);
      setForecast7(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Agro-meteorological indices ──────────────────────────────────────────
  const loadIndices = useCallback(async (district = "Pune") => {
    setError(null);
    try {
      const data = DEV
        ? (await delay(200), MOCK_INDICES)
        : await apiFetch(`/weather/indices?district=${encodeURIComponent(district)}`);
      setIndices(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  // ── Historical data ──────────────────────────────────────────────────────
  const loadHistory = useCallback(async (district = "Pune", days = 30) => {
    setError(null);
    try {
      const data = DEV
        ? (await delay(200), MOCK_HISTORY)
        : await apiFetch(`/weather/history?district=${encodeURIComponent(district)}&days=${days}`);
      setHistory(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  return {
    forecast7,
    indices,
    history,
    loading,
    error,
    loadForecast,
    loadIndices,
    loadHistory,
    clearError,
  };
}
