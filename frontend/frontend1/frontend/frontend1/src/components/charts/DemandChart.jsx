import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const T = {
  blue:     "#4a90c4",
  blue2:    "rgba(74,144,196,0.12)",
  green:    "#7ab648",
  muted:    "rgba(106,122,88,0.5)",
  gridLine: "rgba(46,61,30,0.5)",
  tick:     "#6a7a58",
  mono:     "'IBM Plex Mono', monospace",
};

const BASE_SCALES = {
  x: {
    grid:   { color: T.gridLine },
    ticks:  { color: T.tick, font: { size: 10, family: T.mono } },
    border: { display: false },
  },
  y: {
    grid:   { color: T.gridLine },
    ticks:  { color: T.tick, font: { size: 10, family: T.mono } },
    border: { display: false },
  },
};

/**
 * DemandChart — LSTM 6-month demand forecast line chart
 *
 * Props:
 *   labels    {string[]} — x-axis labels e.g. ["Jan","Feb","Mar","Apr","May","Jun"]
 *   demand    {number[]} — LSTM demand forecast values (1000 MT)
 *   supply    {number[]} — actual/projected supply values
 *   baseline  {number[]} — historical baseline reference line
 *   height    {number}   — canvas height px (default 220)
 *   showLegend{boolean}  — (default true)
 *   unit      {string}   — tooltip unit label (default "1000 MT")
 *
 * Usage:
 *   <DemandChart
 *     labels={["Jan","Feb","Mar","Apr","May","Jun"]}
 *     demand={[420, 445, 510, 490, 560, 580]}
 *     supply={[380, 410, 440, 470, 500, 520]}
 *     baseline={[400, 400, 420, 420, 440, 440]}
 *   />
 */
export default function DemandChart({
  labels   = ["Jan","Feb","Mar","Apr","May","Jun"],
  demand   = [420, 445, 510, 490, 560, 580],
  supply   = [380, 410, 440, 470, 500, 520],
  baseline = [400, 400, 420, 420, 440, 440],
  height   = 220,
  showLegend = true,
  unit     = "1000 MT",
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          // ── Demand forecast (LSTM output) ──────────────────────────────
          {
            label:                "Demand Forecast",
            data:                 demand,
            borderColor:          T.blue,
            backgroundColor:      T.blue2,
            fill:                 true,
            tension:              0.4,
            borderWidth:          2,
            pointRadius:          3,
            pointHoverRadius:     5,
            pointBackgroundColor: T.blue,
          },
          // ── Supply line ───────────────────────────────────────────────
          {
            label:                "Supply",
            data:                 supply,
            borderColor:          T.green,
            backgroundColor:      "transparent",
            fill:                 false,
            tension:              0.4,
            borderWidth:          2,
            pointRadius:          3,
            pointHoverRadius:     5,
            pointBackgroundColor: T.green,
          },
          // ── Baseline reference (dashed) ───────────────────────────────
          {
            label:       "Baseline",
            data:        baseline,
            borderColor: T.muted,
            borderDash:  [3, 3],
            borderWidth: 1,
            fill:        false,
            tension:     0,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction:         { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: showLegend,
            labels: {
              color:    "#a8b898",
              font:     { size: 11, family: T.mono },
              boxWidth: 12,
              padding:  14,
            },
          },
          tooltip: {
            backgroundColor: "#1c2413",
            borderColor:     "#2e3d1e",
            borderWidth:     1,
            titleColor:      "#e8f0d8",
            bodyColor:       "#a8b898",
            cornerRadius:    8,
            padding:         10,
            callbacks: {
              label: (ctx) =>
                ` ${ctx.dataset.label}: ${ctx.parsed.y} ${unit}`,
            },
          },
        },
        scales: BASE_SCALES,
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, demand, supply, baseline, showLegend, unit]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
