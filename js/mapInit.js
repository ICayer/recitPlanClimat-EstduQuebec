// mapInit.js
import { dataStore } from "./dataStore.js";

export let svg;
export let gRoot, gBasemap, gMap, gServices, gCommunaute, gAutochtone;
export let projection;

export function initMap() {
  const container = document.getElementById("vis");
  const width = container.clientWidth;
  const height = container.clientHeight;

  svg = d3.select("#vis")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  // Structure DOM ordonnée pour la superposition des calques
  gBasemap = svg.append("g").attr("class", "basemap");
  gRoot = svg.append("g").attr("class", "root-layer");
  
  gMap = gRoot.append("g").attr("class", "mrc-layer");
  gAutochtone = gRoot.append("g").attr("class", "autochtone-layer");
  gCommunaute = gRoot.append("g").attr("class", "communaute-layer");
  gServices = gRoot.append("g").attr("class", "services-layer");

  // Initialisation de la projection Mercator
  projection = d3.geoMercator()
    .clipExtent([[0, 0], [width, height]]); // Coupe au bord exact du SVG

  /**
   * CONFIGURATION DU CLIPPING (DÉCOUPAGE)
   * On élargit les limites géographiques pour éviter les lignes droites vides.
   * On descend la limite Sud à 35° (au lieu de 45°) pour couvrir tout l'écran.
   */
  const clipAnti = d3.geoClipAntimeridian();
  const clipRect = d3.geoClipRectangle(-85, 35, -50, 65); 
  projection.postclip(d => clipRect(clipAnti(d)));

  /**
   * AJUSTEMENT DU ZOOM ET CENTRAGE
   * On utilise [[0, 0], [width, height]] au lieu de [[20, 20], ...]
   * pour que la carte colle parfaitement aux bords du container.
   */
  
  if (dataStore.geoMRC && dataStore.geoMRC.features) {
    projection.fitExtent([[0, 0], [width, height]], { 
        type: "FeatureCollection", 
        features: dataStore.geoMRC.features 
    });

    // FORCE : On décale la projection de 50 pixels vers le bas 
    // pour faire sortir les MRC du cadre et laisser les polygones autochtones remplir le bas.
    const translate = projection.translate();
    projection.translate([translate[0], translate[1] + 50]); 
}

  return { width, height };
}