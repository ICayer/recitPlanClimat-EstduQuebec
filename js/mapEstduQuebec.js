// mapEstduQuebec.js
// 👉 Module pour afficher un polygone unifié couvrant l'ensemble du territoire des MRC de l'Est-du-Québec
// Utilise Turf.js pour merger les géométries des MRC en une seule union (MultiPolygon ou Polygon)
// Note : Ajoutez Turf.js dans index.html via CDN :
// <script src="https://unpkg.com/@turf/turf@6/turf.min.js"></script>
// Cela permet des opérations géospatiales comme l'union sans complexité excessive.

import { gMap, projection } from "./mapInit.js";  // Accès au groupe gMap et à la projection
import { dataStore } from "./dataStore.js";      // Accès au GeoJSON des MRC

let estduQuebecPath;  // Référence au path SVG pour pouvoir le show/hide plus tard

export function initEstduQuebecLayer() {
  const geojsonData = dataStore.geoMRC;

  if (!geojsonData || !geojsonData.features.length) {
    console.error("❌ GeoJSON des MRC non disponible dans dataStore.");
    return;
  }

  try {
    // Merger toutes les features en une seule géométrie unifiée (union)
    // Turf.union gère les overlaps et holes si présents
    let unionGeometry = geojsonData.features[0];  // Commencer avec la première feature
    for (let i = 1; i < geojsonData.features.length; i++) {
      unionGeometry = turf.union(unionGeometry, geojsonData.features[i]);
    }

    // Inverser flippera le winding pour matcher la spec GeoJSON
    const geom = unionGeometry.geometry;  // Raccourci
    if (geom.type === "Polygon") {
    geom.coordinates.forEach(r => r.reverse());
    } else if (geom.type === "MultiPolygon") {
    geom.coordinates.forEach(p => p.forEach(r => r.reverse()));
    }

    // Créer un nouveau feature pour l'union (propriétés optionnelles)
    const unionFeature = {
      type: "Feature",
      geometry: unionGeometry.geometry,
      properties: { name: "Territoire Est-du-Québec" }  // Propriétés personnalisées si needed
    };

    // Générateur de path D3 avec la projection existante
    const pathGenerator = d3.geoPath().projection(projection);

    // Ajouter le path unifié à gMap (par-dessus basemap, en dessous d'autres couches comme gServices)
    estduQuebecPath = gMap.append("path")
      .datum(unionFeature)  // Binder le feature unifié
      .attr("d", pathGenerator)
      .attr("class", "estduquebec-union")  // Classe pour styling CSS
      .attr("fill", "#d9d027")  // Couleur par défaut (bleu, ajustable)
      .attr("stroke", "#6f7071")   // Bordure blanche fine
      .attr("stroke-width", 0.7)
      .attr("opacity", 0.6)     // Semi-transparent pour voir la basemap dessous
      .style("display", "none");  // Caché par défaut, activer via showEstduQuebec()

    console.log("✔ Polygone unifié du territoire Est-du-Québec initialisé.");
  } catch (error) {
    console.error("❌ Erreur lors de l'union des géométries :", error);
  }
}

// Fonction pour afficher le polygone unifié (appelée dans main.js ou via state/index)
export function showEstduQuebec() {
  if (estduQuebecPath) {
    estduQuebecPath.style("display", "block");
    
  }
}

// Fonction pour cacher le polygone unifié
export function hideEstduQuebec() {
  if (estduQuebecPath) {
    estduQuebecPath.style("display", "none");
  }
}

// Optionnel : Mise à jour si zoom/projection change (appelée depuis appliquerZoom si needed)
export function updateEstduQuebec() {
  if (estduQuebecPath) {
    const pathGenerator = d3.geoPath().projection(projection);
    estduQuebecPath.attr("d", pathGenerator);
  }
}