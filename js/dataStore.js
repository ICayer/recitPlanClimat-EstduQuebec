// dataStore.js
// 👉 Source centrale de vérité pour TOUTES les données du projet
// Rempli uniquement par dataLoader.js

export const dataStore = {

  // ==============================
  // GÉODONNÉES
  // ==============================

  geoMRC: null,          // GeoJSON des MRC (polygones carte)

  // ==============================
  // DONNÉES CHOROPLÈTHE
  // ==============================

  jeunesCSV: null,       // CSV complet des MRC (incluant catégories services)
  jeunesParMRC: null,    // Map code MRC → % jeunes (pour mapColors)

  // ==============================
  // DONNÉES TEMPORELLES (INDEX 5)
  // ==============================

  services: null,        // CSV services individuels (avec date, lon, lat)
  minDate: null,         // Date minimale globale (timeline)
  maxDate: null,         // Date maximale globale (timeline)

  // ==============================
  // DONNÉES PIE CHART (INDEX 7)
  // ==============================

  totalsCategories: null, // Totaux globaux par catégorie (pour légende pie)
  servicesParMRC: null,

  // ==============================
  // DONNÉES COMMUNAUTÉS
  // ==============================
  
  communauteLayer: null,

  // ==============================
  // POLYGONES PREMIERS PEUPLES
  // ==============================

  territoiresPP: null,   // ← nouveau

  // ==============================
  // FUTURES EXTENSIONS
  // ==============================

  networkData: null,      // Pour index 9 (network relations)
  autreGeoJSON: null      // Si ajout futur de couches géographiques
};