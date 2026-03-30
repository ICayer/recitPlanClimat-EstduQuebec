import { state } from "./state.js";
import { gRoot, projection, svg } from "./mapInit.js";
import { dataStore } from "./dataStore.js";  // ← Ajoute cet import
import { drawOSM } from "./mapOSM.js";

export function appliquerZoom() {
  if (!dataStore.geoMRC) return;  // ← Sécurité si dataStore est vide

if (!state.zoom) {
    return; // rien à faire
  }

  let features = dataStore.geoMRC.features;  // ← Correction ici (utilise dataStore au lieu de initMRCLayer)

  if (state.zoom !== "global") {
    features = features.filter(
      d => d.properties.MRS_NM_REG === state.regionActive
    );
  }

  const bounds = d3.geoBounds({
    type: "FeatureCollection",
    features
  });

  const [[x0, y0], [x1, y1]] = bounds;

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;

  let scale = 1;
  if (state.zoom === "approche") scale = 2;
  if (state.zoom === "focus") scale = 3;

  const projectedCenter = projection([cx, cy]);

  const transform = d3.zoomIdentity
    .translate(
      width / 2 - scale * projectedCenter[0],
      height / 2 - scale * projectedCenter[1]
    )
    .scale(scale);

  // =====================
  // TRANSFORMATION VISUELLE
  // =====================
  gRoot.transition()
    .duration(900)
    .attr("transform", transform);

  // =====================
  // SYNCHRO FOND DE CARTE
  // =====================
  drawOSM(width, height, transform);
}