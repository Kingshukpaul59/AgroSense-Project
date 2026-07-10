import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

// ── Theme tokens (matches dashboard palette) ───────────────────────────────
const T = {
  green:    "#7ab648",
  green2:   "rgba(122,182,72,0.12)",
  amber:    "#d4a843",
  amber2:   "rgba(212,168,67,0.15)",
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

const BASE_TOOLTIP = {
  backgroundColor: "#1c2413",
  borderColor:     "#2e3d1e",
  borderWidth:     1,
  titleColor:      "#e8f0d8",
  bodyColor:       "#a8b898",
  cornerRadius:    8,
  padding:         10,
};

/**
 * YieldChart
 *
 * Props:
 *   labels       {string[]}  — x-axis labels e.g. ["2020","2021","2022","2023","2024","2025F","2026F"]
 *   actual       {number[]}  — historical yield values (use null for forecast years)
 *   forecast     {number[]}  — forecast values (use null for historical years)
 *   upper        {number[]}  — upper confidence band (optional, use null for historical)
 *   lower        {number[]}  — lower confidence band (optional, use null for historical)
 *   height       {number}    — canvas height in px (default 220)
 *   showLegend   {boolean}   — show chart legend (default true)
 *   yLabel       {string}    — y-axis label suffix shown in tooltip (default "t/ha")
 *
 * Usage:
 *   <YieldChart
 *     labels={["2020","2021","2022","2023","2024","2025F","2026F"]}
 *     actual={[2.8, 3.1, 2.6, 3.4, 3.8, null, null]}
 *     forecast={[null, null, null, null, 3.8, 4.1, 4.4]}
 *   />
 */
export default function YieldChart({
  labels    = ["2020","2021","2022","2023","2024","2025F","2026F"],
  actual    = [2.8, 3.1, 2.6, 3.4, 3.8, null, null],
  forecast  = [null, null, null, null, 3.8, 4.1, 4.4],
  upper     = null,
  lower     = null,
  height    = 220,
  showLegend= true,
  yLabel    = "t/ha",
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    const datasets = [];

    // ── Confidence band (upper) ──────────────────────────────────────────
    if (upper) {
      datasets.push({
        label:           "Upper band",
        data:            upper,
        borderColor:     "transparent",
        backgroundColor: "rgba(122,182,72,0.13)",
        fill:            "+1",          // fill down to lower band dataset
        tension:         0.4,
        pointRadius:     0,
        spanGaps:        true,
      });
    }

    // ── Actual (historical) line ─────────────────────────────────────────
    datasets.push({
      label:                "Actual",
      data:                 actual,
      borderColor:          T.green,
      backgroundColor:      T.green2,
      borderWidth:          2,
      tension:              0.4,
      fill:                 !upper,     // fill to x-axis only when no band
      pointBackgroundColor: T.green,
      pointRadius:          4,
      pointHoverRadius:     6,
      spanGaps:             false,
    });

    // ── Forecast line ─────────────────────────────────────────────────────
    datasets.push({
      label:                "Forecast",
      data:                 forecast,
      borderColor:          T.amber,
      backgroundColor:      T.amber2,
      borderDash:           [5, 4],
      borderWidth:          1.8,
      tension:              0.4,
      fill:                 false,
      pointBackgroundColor: T.amber,
      pointRadius:          3,
      pointHoverRadius:     5,
      spanGaps:             false,
    });

    // ── Confidence band (lower) ───────────────────────────────────────────
    if (lower) {
      datasets.push({
        label:           "Lower band",
        data:            lower,
        borderColor:     "transparent",
        backgroundColor: "rgba(122,182,72,0.13)",
        fill:            false,
        tension:         0.4,
        pointRadius:     0,
        spanGaps:        true,
      });
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: { labels, datasets },
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
              // hide internal band labels
              filter: (item) =>
                item.text !== "Upper band" && item.text !== "Lower band",
            },
          },
          tooltip: {
            ...BASE_TOOLTIP,
            callbacks: {
              label: (ctx) =>
                ctx.parsed.y != null
                  ? ` ${ctx.dataset.label}: ${ctx.parsed.y} ${yLabel}`
                  : null,
            },
          },
        },
        scales: {
          ...BASE_SCALES,
          y: {
            ...BASE_SCALES.y,
            ticks: {
              ...BASE_SCALES.y.ticks,
              callback: (v) => `${v} ${yLabel}`,
            },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, actual, forecast, upper, lower, showLegend, yLabel]);

  return (
    <div style={{ position: "relative", width: "100%", height }}>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
