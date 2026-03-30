// mrcLayer.js

import { gMap, projection } from "./mapInit.js";
import { dataStore } from "./dataStore.js";

let pathGenerator;

export function initMRCLayer(width, height) {

  let geojson = dataStore.geoMRC;

  // 🔁 Correction QGIS (une seule fois ici)
  geojson.features.forEach(f => {
    if (f.geometry.type === "Polygon") {
      f.geometry.coordinates.forEach(r => r.reverse());
    } else if (f.geometry.type === "MultiPolygon") {
      f.geometry.coordinates.forEach(p =>
        p.forEach(r => r.reverse())
      );
    }
  });

  // Fit projection
  const padding = 20;

  projection.fitExtent(
    [[padding, padding], [width - padding, height - padding]],
    geojson
  );

  pathGenerator = d3.geoPath().projection(projection);

  gMap.selectAll("path")
    .data(geojson.features)
    .join("path")
    .attr("d", pathGenerator)
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.3)
    .attr("class", "mrc-path");
}

export function showMRCs() {
  gMap.selectAll(".mrc-path").style("display", "block");
}

export function hideMRCs() {
  gMap.selectAll(".mrc-path").style("display", "none");
}
