import { useState, useCallback } from "react";

// ── API base (set VITE_API_URL in .env) ───────────────────────────────────
const API = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api/v1";

async function apiFetch(path, opts = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// ── Mock data (used in development when API is unavailable) ───────────────
const MOCK_YIELD_TABLE = {
  "Paddy (Rice)": { Pune: 3.8, Nashik: 3.2, Aurangabad: 2.9, Kolhapur: 4.2, Latur: 2.6, Satara: 3.9, Solapur: 3.0, Osmanabad: 2.4 },
  Wheat:          { Pune: 3.1, Nashik: 3.5, Aurangabad: 3.2, Kolhapur: 2.8, Latur: 3.6, Satara: 3.0, Solapur: 3.3, Osmanabad: 3.1 },
  Soybean:        { Pune: 1.8, Nashik: 2.1, Aurangabad: 1.6, Kolhapur: 2.0, Latur: 1.9, Satara: 2.2, Solapur: 1.7, Osmanabad: 1.5 },
  Cotton:         { Pune: 2.3, Nashik: 2.7, Aurangabad: 2.1, Kolhapur: 2.0, Latur: 2.5, Satara: 2.4, Solapur: 2.2, Osmanabad: 2.0 },
  Sugarcane:      { Pune: 88,  Nashik: 74,  Aurangabad: 65,  Kolhapur: 92,  Latur: 70,  Satara: 86,  Solapur: 78,  Osmanabad: 60  },
  Maize:          { Pune: 4.1, Nashik: 4.8, Aurangabad: 3.9, Kolhapur: 4.6, Latur: 4.0, Satara: 4.3, Solapur: 4.2, Osmanabad: 3.7 },
};

const MOCK_HISTORY = {
  labels:          ["2019", "2020", "2021", "2022", "2023", "2024"],
  actual:          [2.4, 2.8, 2.6, 3.1, 3.4, 3.8],
  forecastLabels:  ["2019", "2020", "2021", "2022", "2023", "2024", "2025F", "2026F"],
  forecast:        [null,  null,  null,  null,  null,  3.8,   4.1,    4.4  ],
  upper:           [null,  null,  null,  null,  null,  4.2,   4.6,    4.9  ],
  lower:           [null,  null,  null,  null,  null,  3.4,   3.6,    3.9  ],
};

const MOCK_HEATMAP = [
  { district: "Pune",        yieldIndex: 82, yield: 3.8, status: "good"     },
  { district: "Nashik",      yieldIndex: 68, yield: 3.2, status: "moderate" },
  { district: "Aurangabad",  yieldIndex: 58, yield: 2.9, status: "low"      },
  { district: "Kolhapur",    yieldIndex: 91, yield: 4.2, status: "good"     },
  { district: "Latur",       yieldIndex: 49, yield: 2.6, status: "critical" },
  { district: "Satara",      yieldIndex: 85, yield: 3.9, status: "good"     },
  { district: "Solapur",     yieldIndex: 62, yield: 3.0, status: "moderate" },
  { district: "Osmanabad",   yieldIndex: 44, yield: 2.2, status: "critical" },
];

function mockPredict({ crop, district }) {
  const base    = MOCK_YIELD_TABLE[crop]?.[district] ?? 3.4;
  const jitter  = +(base + (Math.random() * 0.4 - 0.2)).toFixed(2);
  return {
    predicted_yield:   jitter,
    confidence_low:    +(jitter * 0.88).toFixed(2),
    confidence_high:   +(jitter * 1.12).toFixed(2),
    confidence_pct:    Math.round(88 + Math.random() * 8),
    risk_level:        jitter < 2 ? "high" : jitter < 3.5 ? "moderate" : "low",
    feature_importance: {
      rainfall:       0.31,
      temperature:    0.22,
      soil_type:      0.18,
      irrigation:     0.15,
      previous_yield: 0.14,
    },
  };
}

const DEV = import.meta.env.DEV;
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────────────────────

/**
 * useYieldData — data hook for yield forecast, history, and heatmap
 *
 * Returns:
 *   prediction  {object|null}  — latest prediction result
 *   history     {object|null}  — historical trend data
 *   heatmap     {Array|null}   — district-level yield index array
 *   loading     {boolean}
 *   error       {string|null}
 *   predict     {Function}     — async ({ crop, district, season, area_ha, irrigation, soil_type }) => result
 *   loadHistory {Function}     — async (district, crop) => void
 *   loadHeatmap {Function}     — async (season) => void
 *   clearError  {Function}     — resets error state
 *
 * Usage:
 *   const { prediction, loading, error, predict, loadHeatmap } = useYieldData();
 *
 *   // Run prediction
 *   const result = await predict({ crop: "Paddy (Rice)", district: "Pune", season: "Kharif 2024" });
 *
 *   // Load heatmap on mount
 *   useEffect(() => { loadHeatmap("Kharif 2024"); }, [loadHeatmap]);
 */
export function useYieldData() {
  const [prediction, setPrediction] = useState(null);
  const [history,    setHistory]    = useState(null);
  const [heatmap,    setHeatmap]    = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState(null);

  const clearError = useCallback(() => setError(null), []);

  // ── XGBoost prediction ───────────────────────────────────────────────────
  const predict = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      let result;
      if (DEV) {
        await delay(700); // simulate network
        result = mockPredict(params);
      } else {
        result = await apiFetch("/yield/predict", {
          method: "POST",
          body: JSON.stringify(params),
        });
      }
      setPrediction(result);
      return result;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Historical trend ─────────────────────────────────────────────────────
  const loadHistory = useCallback(async (district, crop) => {
    setLoading(true);
    setError(null);
    try {
      const data = DEV
        ? (await delay(300), MOCK_HISTORY)
        : await apiFetch(`/yield/history?district=${encodeURIComponent(district)}&crop=${encodeURIComponent(crop)}`);
      setHistory(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── District heatmap ─────────────────────────────────────────────────────
  const loadHeatmap = useCallback(async (season) => {
    setError(null);
    try {
      const data = DEV
        ? (await delay(200), MOCK_HEATMAP)
        : await apiFetch(`/yield/heatmap?season=${encodeURIComponent(season)}`);
      setHeatmap(data);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  return {
    prediction,
    history,
    heatmap,
    loading,
    error,
    predict,
    loadHistory,
    loadHeatmap,
    clearError,
  };
}
