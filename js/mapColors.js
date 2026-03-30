// 👉 UNE fonction couleur (basée sur gMap, pas sur paths)

import { state } from "./state.js";
import { gMap } from "./mapInit.js";  // Garde ça, mais supprime jeunesParMRC de l'import
import { dataStore } from "./dataStore.js";  // Nouveau : Pour jeunesParMRC (Map % jeunes)
import { highlightLegend, resetLegendHighlight } from "./mapLegends.js";

export let colorScale;

const regions = [
  "Bas-Saint-Laurent",
  "Côte-Nord",
  "Gaspésie–Îles-de-la-Madeleine",
];

const scaleRegions = d3.scaleOrdinal()
  .domain(regions)
  .range(["#8da0cb80", "#66c2a587", "#fc8e6285"]);

const scaleRegionsContraste = d3.scaleOrdinal()
  .domain(regions)
  .range(["#1f78b4", "#33a02c", "#e31a1c"]);

export function appliquerCouleurs() {
  if (!gMap) return;

  // On sélectionne tous les paths SAUF celui qui a la classe 'estduquebec-union'
  const paths = gMap.selectAll("path:not(.estduquebec-union)");
  

  paths
    .transition()
    .duration(700)
    .attr("fill", d => {
      const region = d.properties.MRS_NM_REG;

      if (state.couleur === "choropleth") {
        const v = dataStore.jeunesParMRC.get(d.properties.MRS_CO_MRC);  // ← Utilise dataStore au lieu de jeunesParMRC importé
        return v != null ? colorScale(v) : "#eee";
      }

      if (state.couleur === "regions") {
        return scaleRegions(region);
      }

      if (state.couleur === "regionsContraste") {
        return scaleRegionsContraste(region);
      }

      if (state.couleur === "focus") {
        return region === state.regionActive
          ? scaleRegions(region)
          : "#e0e0e0";
      }

      return "#ccc";
    });

  // 👉 interactions carte ↔ légende
  paths
    .on("click", (event, d) => {
      state.selectedMRC = d.properties.MRS_CO_MRC;

      highlightLegend({
        value: dataStore.jeunesParMRC.get(d.properties.MRS_CO_MRC),  // ← Utilise dataStore
        label: d.properties.MRS_NM_REG
      });
    })
    .on("mouseover", (event, d) => {
      highlightLegend({
        value: dataStore.jeunesParMRC.get(d.properties.MRS_CO_MRC),  // ← Utilise dataStore
        label: d.properties.MRS_NM_REG
      });
    })
    .on("mouseout", () => {
      resetLegendHighlight();
    });
}

export function initColorScale() {
  const values = [...dataStore.jeunesParMRC.values()];

  colorScale = d3.scaleSequential()
    .domain(d3.extent(values))
    .interpolator(d3.interpolateBlues);
}

export { scaleRegions, scaleRegionsContraste };

//Les couleurs relatives aux 6 catégories de services
export const colorServices = {
  serviceExpertise: "#810f7c",
  serviceRepresentation: "#8856a7",
  serviceReseautage: "#8c96c6",
  serviceDocument: "#9ebcda",
  serviceProduction: "#bfd3e6",
  serviceFormation: "#edf8fb"
};

export const serviceKeys = Object.keys(colorServices);

//Les couleurs relatives aux 11 Premiers Peuples au Québec
export const scaleAutochtone = d3.scaleOrdinal()
  .range(['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9','#bc80bd','#ccebc5'])
;