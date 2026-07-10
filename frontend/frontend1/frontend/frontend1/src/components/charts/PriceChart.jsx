import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";

const T = {
  red:      "rgba(212,80,64,0.75)",
  red2:     "rgba(212,80,64,0.25)",
  green:    "rgba(122,182,72,0.65)",
  amber:    "rgba(212,168,67,0.70)",
  gridLine: "rgba(46,61,30,0.5)",
  tick:     "#6a7a58",
  mono:     "'IBM Plex Mono', monospace",
};

/**
 * PriceChart — Supply-demand gap bar chart
 *
 * Two display modes controlled by `mode` prop:
 *
 *   "gap"    (default) — single bar series showing monthly deficit/surplus values.
 *            Bars are automatically coloured: red = deficit, green = surplus.
 *
 *   "grouped" — side-by-side bars for supply gap vs surplus (as originally
 *            designed in the dashboard mock).
 *
 * Props:
 *   labels   {string[]}          — x-axis labels
 *   gap      {number[]}          — deficit values (positive = shortage)
 *   surplus  {number[]}          — surplus values (only used in "grouped" mode)
 *   mode     {"gap"|"grouped"}   — chart mode (default "gap")
 *   height   {number}            — canvas height px (default 220)
 *   showLegend {boolean}         — (default true)
 *   unit     {string}            — tooltip unit (default "1000 MT")
 *
 * Usage — auto-colour single bar:
 *   <PriceChart
 *     labels={["Jan","Feb","Mar","Apr","May","Jun"]}
 *     gap={[40, 35, 70, 20, 60, 60]}
 *   />
 *
 * Usage — grouped bars:
 *   <PriceChart
 *     mode="grouped"
 *     labels={["Jan","Feb","Mar","Apr","May","Jun"]}
 *     gap={[40, 35, 70, 20, 60, 60]}
 *     surplus={[0, 0, 0, 0, 0, 0]}
 *   />
 */
export default function PriceChart({
  labels     = ["Jan","Feb","Mar","Apr","May","Jun"],
  gap        = [40, 35, 70, 20, 60, 60],
  surplus    = [0, 0, 0, 0, 0, 0],
  mode       = "gap",
  height     = 220,
  showLegend = true,
  unit       = "1000 MT",
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    chartRef.current?.destroy();

    // ── Auto-colour bars: red for deficit, green for surplus ──────────────
    const autoColors = gap.map((v) => (v > 0 ? T.red : T.green));
    const autoHover  = gap.map((v) => (v > 0 ? T.red2 : "rgba(122,182,72,0.30)"));

    const datasets =
      mode === "grouped"
        ? [
            {
              label:           "Supply Gap",
              data:            gap,
              backgroundColor: T.red,
              borderRadius:    5,
              borderSkipped:   false,
            },
            {
              label:           "Surplus",
              data:            surplus,
              backgroundColor: T.green,
              borderRadius:    5,
              borderSkipped:   false,
            },
          ]
        : [
            {
              label:                    "Monthly Gap",
              data:                     gap,
              backgroundColor:          autoColors,
              hoverBackgroundColor:     autoHover,
              borderRadius:             5,
              borderSkipped:            false,
            },
          ];

    chartRef.current = new Chart(canvasRef.current, {
      type: "bar",
      data: { labels, datasets },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        interaction:         { intersect: false, mode: "index" },
        plugins: {
          legend: {
            display: showLegend && mode === "grouped",
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
              label: (ctx) => {
                const val = ctx.parsed.y;
                const sign = val > 0 ? "▼ Deficit" : "▲ Surplus";
                return ` ${sign}: ${Math.abs(val)} ${unit}`;
              },
            },
          },
          // Reference line at 0 (break-even)
          annotation: undefined,
        },
        scales: {
          x: {
            grid:   { color: "rgba(46,61,30,0.5)" },
            ticks:  { color: T.tick, font: { size: 10, family: T.mono } },
            border: { display: false },
            stacked: mode === "grouped",
          },
          y: {
            grid:   { color: "rgba(46,61,30,0.5)" },
            ticks:  {
              color: T.tick,
              font:  { size: 10, family: T.mono },
              callback: (v) => `${v} ${unit}`,
            },
            border: { display: false },
            stacked: false,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [labels, gap, surplus, mode, showLegend, unit]);

  // ── Inline legend for gap mode (red = deficit, green = surplus) ──────────
  const GapLegend = () => (
    <div style={{ display:"flex", gap:14, fontFamily:T.mono, fontSize:10, color:"#6a7a58", marginBottom:8 }}>
      <span><span style={{ color:"#d45040" }}>■</span> Deficit</span>
      <span><span style={{ color:"#7ab648" }}>■</span> Surplus</span>
    </div>
  );

  return (
    <div style={{ width:"100%", height: mode === "gap" ? height + 24 : height, display:"flex", flexDirection:"column" }}>
      {mode === "gap" && showLegend && <GapLegend />}
      <div style={{ position:"relative", flex:1 }}>
        <canvas ref={canvasRef} style={{ width:"100%", height:"100%" }} />
      </div>
    </div>
  );
}
