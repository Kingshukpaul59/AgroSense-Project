import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

export const THEME = {
  grid:    "rgba(46,61,30,0.5)",
  tick:    "#6a7a58",
  tooltip: { bg: "#1c2413", border: "#2e3d1e", title: "#e8f0d8", body: "#a8b898" },
  font:    { family: "'IBM Plex Mono', monospace", size: 10 },
  green:   "#7ab648",  green2: "rgba(122,182,72,0.12)",
  amber:   "#d4a843",  amber2: "rgba(212,168,67,0.15)",
  red:     "#d45040",  red2:   "rgba(212,80,64,0.12)",
  blue:    "#4a90c4",  blue2:  "rgba(74,144,196,0.12)",
  teal:    "#3aaa88",
};

export const BASE_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: { color: "#a8b898", font: { size: 11, family: "'IBM Plex Mono', monospace" }, boxWidth: 12, padding: 14 },
    },
    tooltip: {
      backgroundColor: "#1c2413", borderColor: "#2e3d1e", borderWidth: 1,
      titleColor: "#e8f0d8", bodyColor: "#a8b898", cornerRadius: 8, padding: 10,
    },
  },
  scales: {
    x: { grid: { color: "rgba(46,61,30,0.5)" }, ticks: { color: "#6a7a58", font: { size: 10, family: "'IBM Plex Mono', monospace" } }, border: { display: false } },
    y: { grid: { color: "rgba(46,61,30,0.5)" }, ticks: { color: "#6a7a58", font: { size: 10, family: "'IBM Plex Mono', monospace" } }, border: { display: false } },
  },
};

/**
 * useChart(config) — creates/updates a Chart.js instance on a canvas ref.
 * Returns { ref } — attach ref to <canvas ref={ref} />.
 * @param {() => object} getConfig — function returning full Chart.js config. Recreated on deps change.
 * @param {any[]} deps
 */
export function useChart(getConfig, deps = []) {
  const ref = useRef(null);
  const ch  = useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ch.current?.destroy();
    ch.current = new Chart(ref.current, getConfig());
    return () => { ch.current?.destroy(); ch.current = null; };
  }, deps); // eslint-disable-line

  return { ref };
}
