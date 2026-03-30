// autochtoneLayer.js

import { dataStore } from "./dataStore.js";
import { gAutochtone, projection } from "./mapInit.js";
import { scaleAutochtone } from "./mapColors.js";
import { state } from "./state.js";

let pathGenerator;

export function initPPgeoJSON() {

  if (!dataStore.territoiresPP) {
    console.warn("⚠️ territoiresPP non chargé dans dataStore");
    return;
  }

  const features = dataStore.territoiresPP.features;

  features.forEach((f, i) => {
    const bounds = d3.geoBounds(f);
    const width = Math.abs(bounds[1][0] - bounds[0][0]);
    const height = Math.abs(bounds[1][1] - bounds[0][1]);
    
  });

  // 🔍 Vérification des géométries
  const types = [...new Set(features.map(f => f.geometry.type))];

  // 🔍 Vérification des nations
  const nations = [...new Set(features.map(d => d.properties.Name))];

  // 🔍 Vérifier si un polygone couvre une énorme surface
  features.forEach((f, i) => {
    const bounds = d3.geoBounds(f);
    const width = Math.abs(bounds[1][0] - bounds[0][0]);
    const height = Math.abs(bounds[1][1] - bounds[0][1]);

    if (width > 20 || height > 20) {
      console.log("⚠️ Polygone très large détecté :", {
        index: i,
        name: f.properties.Name,
        width,
        height
      });
    }
  });

  pathGenerator = d3.geoPath().projection(projection);

  // 🎨 Domain des couleurs
  scaleAutochtone.domain(nations);

  // 🎨 DRAW
  gAutochtone
    .selectAll("path")
    .data(features)
    .join("path")
    .attr("class", "autochtone-path") // <--- CETTE LIGNE EST LA CLÉ
    .attr("d", (d, i) => {
      if (!d.geometry) {
        console.warn("⚠️ Feature sans géométrie :", d);
      }
      return pathGenerator(d);
    })
    .attr("fill", d => {
      const color = scaleAutochtone(d.properties.Name);

      if (!color) {
        console.warn("⚠️ Couleur non trouvée pour :", d.properties.Name);
      }
      return color;
    })
    .attr("stroke", "#333")
    .attr("stroke-width", 0.2)
    .attr("opacity", 0.3)  // Pour voir overlaps sans masquer OSM
    //.style("pointer-events", d => d3.geoBounds(d)[1][0] - d3.geoBounds(d)[0][0] > 100 ? "none" : "auto")  // Ignore events sur larges   
    .on("mouseenter", (event, d) => {

      state.hoveredPPTerritory = d.properties.Name;

      d3.select(event.currentTarget)
        .attr("stroke-width", 2)
        .attr("opacity", 0.3);
    })
    .on("mouseleave", (event) => {
      state.hoveredPPTerritory = null;

      d3.select(event.currentTarget)
        .attr("stroke-width", 0.5)
        .attr("opacity", 0.3);
    });
}

export function showPPgeoJSON() {
  if (!gAutochtone) {
    console.warn("⚠️ gAutochtone non défini");
    return;
  }

  gAutochtone
    .transition()
    .duration(500)
    .style("opacity", 1);
}

export function hidePPgeoJSON() {
  if (!gAutochtone) return;

  gAutochtone
    .transition()
    .duration(500)
    .style("opacity", 0);
}