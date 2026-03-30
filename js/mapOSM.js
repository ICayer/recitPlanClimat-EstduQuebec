// mapOSM.js

import { gBasemap, projection } from "./mapInit.js";

const tile = d3.tile();

export function drawOSM(width, height, transform = d3.zoomIdentity) {

  const k = transform.k;

  const scale = projection.scale() * k * 2 * Math.PI;

  const translate = [
    projection.translate()[0] * k + transform.x,
    projection.translate()[1] * k + transform.y
  ];

  const tiles = tile
    .size([width, height])
    .scale(scale)
    .translate(translate)();

  gBasemap
    .selectAll("image")
    .data(
      tiles,
      d => `${d[0]}-${d[1]}-${d[2]}`
    )
    .join("image")
    .attr("xlink:href", d =>
      `https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/${d[2]}/${d[0]}/${d[1]}.png`  // ← Changement pour Positron no labels
    )
    .attr("x", d => Math.floor((d[0] + tiles.translate[0]) * tiles.scale))  // ← Math.floor pour fixer décalage
    .attr("y", d => Math.floor((d[1] + tiles.translate[1]) * tiles.scale))  // ← Math.floor pour fixer décalage
    .attr("width", Math.ceil(tiles.scale))  // ← Math.ceil pour couvrir sans gaps
    .attr("height", Math.ceil(tiles.scale))  // ← Math.ceil pour couvrir sans gaps
    .attr("opacity", 0.9);
}