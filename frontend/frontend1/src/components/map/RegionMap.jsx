import { useEffect, useRef } from "react";

// ── Colour ramp: yield index 0–100 → green spectrum ────────────────────────
function indexColor(i) {
  if (i >= 80) return "#9fd468"; // high
  if (i >= 65) return "#7ab648"; // good
  if (i >= 50) return "#4e7a28"; // moderate
  if (i >= 35) return "#d4a843"; // low
  return "#d45040";               // critical
}

// ── Legend config ──────────────────────────────────────────────────────────
const LEGEND = [
  { color: "#9fd468", label: "High (80+)" },
  { color: "#7ab648", label: "Good (65–79)" },
  { color: "#4e7a28", label: "Moderate (50–64)" },
  { color: "#d4a843", label: "Low (35–49)" },
  { color: "#d45040", label: "Critical (<35)" },
];

// ── Fallback district coordinates (used when no GeoJSON is provided) ───────
const DISTRICT_COORDS = {
  Pune:        [18.52, 73.86],
  Nashik:      [19.99, 73.79],
  Aurangabad:  [19.88, 75.34],
  Kolhapur:    [16.69, 74.23],
  Latur:       [18.40, 76.56],
  Satara:      [17.68, 73.99],
  Solapur:     [17.68, 75.90],
  Osmanabad:   [18.18, 76.04],
};

/**
 * RegionMap — Leaflet choropleth map for district-level yield index
 *
 * Props:
 *   districts  {Array}    — [{ district, yieldIndex, yield, status }]
 *                           yieldIndex: 0–100, used for choropleth colour
 *   geojson    {object}   — GeoJSON FeatureCollection (optional).
 *                           Feature properties must include `district` or `NAME_2`.
 *                           When omitted, circle markers are drawn using
 *                           built-in district coordinates.
 *   onSelect   {Function} — called with district name string on click
 *   height     {number}   — map height in px (default 280)
 *   center     {[lat,lng]}— initial map centre (default [18.5, 76.5])
 *   zoom       {number}   — initial zoom level (default 6)
 *
 * Usage:
 *   <RegionMap
 *     districts={[
 *       { district: "Pune",    yieldIndex: 82, yield: 3.8, status: "good" },
 *       { district: "Latur",   yieldIndex: 49, yield: 2.6, status: "critical" },
 *     ]}
 *     onSelect={(name) => console.log(name)}
 *   />
 *
 * Note: Leaflet CSS must be available. Install with:
 *   npm install leaflet
 *   Then in main.jsx or index.css: import 'leaflet/dist/leaflet.css';
 */
export default function RegionMap({
  districts = [],
  geojson   = null,
  onSelect,
  height    = 280,
  center    = [18.5, 76.5],
  zoom      = 6,
}) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);   // Leaflet map instance
  const layerRef     = useRef(null);   // Active GeoJSON / marker layer

  // ── Initialise map once ──────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // already mounted

    let L;
    let map;

    async function init() {
      try {
        // Dynamic import — avoids SSR crash and keeps bundle lean
        const mod = await import("leaflet");
        L = mod.default ?? mod;

        map = L.map(containerRef.current, {
          center,
          zoom,
          zoomControl:       true,
          attributionControl: false,
          scrollWheelZoom:   false,
        });
        mapRef.current = map;

        // Dark tile layer (CartoDB dark)
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png",
          { subdomains: "abcd", maxZoom: 19 }
        ).addTo(map);

        // Draw data layer
        if (geojson) {
          drawGeoJsonLayer(L, map, geojson, districts);
        } else {
          drawCircleMarkers(L, map, districts);
        }
      } catch (err) {
        console.warn("[RegionMap] Leaflet not available, falling back to SVG map.", err);
      }
    }

    init();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Re-draw layer when data changes ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !districts.length) return;

    import("leaflet").then((mod) => {
      const L = mod.default ?? mod;
      if (layerRef.current) {
        layerRef.current.remove();
        layerRef.current = null;
      }
      if (geojson) {
        drawGeoJsonLayer(L, map, geojson, districts);
      } else {
        drawCircleMarkers(L, map, districts);
      }
    }).catch(() => {});
  }, [districts, geojson]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── GeoJSON choropleth ───────────────────────────────────────────────────
  function drawGeoJsonLayer(L, map, gj, data) {
    const byName = Object.fromEntries(data.map(d => [d.district, d]));

    layerRef.current = L.geoJSON(gj, {
      style(feature) {
        const name = feature.properties?.district ?? feature.properties?.NAME_2;
        const d    = byName[name];
        return {
          fillColor:   d ? indexColor(d.yieldIndex) : "#2e3d1e",
          weight:      0.5,
          color:       "#3d5228",
          fillOpacity: 0.75,
        };
      },
      onEachFeature(feature, layer) {
        const name = feature.properties?.district ?? feature.properties?.NAME_2;
        const d    = byName[name];
        if (d) {
          layer.bindTooltip(tooltipHtml(d), { sticky: true, className: "agro-tooltip" });
          layer.on("click", () => onSelect?.(name));
          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.95, weight: 1.5 }));
          layer.on("mouseout",  () => layer.setStyle({ fillOpacity: 0.75, weight: 0.5 }));
        }
      },
    }).addTo(map);
  }

  // ── Circle marker fallback ───────────────────────────────────────────────
  function drawCircleMarkers(L, map, data) {
    const group = L.layerGroup().addTo(map);
    layerRef.current = group;

    data.forEach(d => {
      const coords = DISTRICT_COORDS[d.district];
      if (!coords) return;

      const circle = L.circleMarker(coords, {
        radius:      16 + d.yieldIndex * 0.14,
        fillColor:   indexColor(d.yieldIndex),
        color:       "#3d5228",
        weight:      1,
        fillOpacity: 0.82,
      });

      circle.bindTooltip(tooltipHtml(d), { sticky: true, className: "agro-tooltip" });
      circle.on("click", () => onSelect?.(d.district));
      group.addLayer(circle);
    });
  }

  // ── Tooltip HTML ─────────────────────────────────────────────────────────
  function tooltipHtml(d) {
    return `
      <div style="font-family:monospace;font-size:11px;line-height:1.6;
                  background:#1c2413;border:1px solid #3d5228;
                  padding:7px 11px;border-radius:7px;color:#e8f0d8">
        <b style="color:#9fd468">${d.district}</b><br/>
        Yield:&nbsp;<span style="color:#e8f0d8">${d.yield} t/ha</span><br/>
        Index:&nbsp;<span style="color:${indexColor(d.yieldIndex)}">${d.yieldIndex}/100</span><br/>
        Status:&nbsp;<span style="color:#a8b898;text-transform:capitalize">${d.status}</span>
      </div>`;
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ position: "relative", width: "100%", height, borderRadius: 10, overflow: "hidden" }}>
      {/* Map canvas */}
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", background: "#1c2413" }}
      />

      {/* Legend overlay */}
      <div style={{
        position: "absolute", bottom: 10, left: 10, zIndex: 500,
        background: "rgba(13,18,8,0.88)",
        backdropFilter: "blur(4px)",
        border: "1px solid #2e3d1e",
        borderRadius: 8, padding: "9px 12px",
        display: "flex", flexDirection: "column", gap: 5,
      }}>
        {LEGEND.map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, flexShrink: 0 }} />
            <span style={{ fontFamily: "monospace", fontSize: 10, color: "#a8b898" }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Leaflet tooltip global style injection */}
      <style>{`
        .agro-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .agro-tooltip::before { display: none !important; }
        .leaflet-control-zoom a {
          background: #1f2a14 !important;
          border-color: #2e3d1e !important;
          color: #a8b898 !important;
        }
        .leaflet-control-zoom a:hover {
          background: #283318 !important;
          color: #e8f0d8 !important;
        }
      `}</style>
    </div>
  );
}
