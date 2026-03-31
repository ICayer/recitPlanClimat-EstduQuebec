// dataLoader.js
import { dataStore } from "./dataStore.js";

/**
 * Corrige le sens des anneaux (winding order)
 * pour respecter la convention GeoJSON :
 * - Anneau extérieur : anti-horaire
 * - Trous : horaire
 */
function fixPolygonWinding(geojson) {

  geojson.features.forEach((feature) => {
    const geom = feature.geometry;
    if (!geom) return;

    const coordinates = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];

    coordinates.forEach(polygon => {
      polygon.forEach((ring, i) => {
        // On calcule l'aire sphérique de l'anneau
        // Si c'est l'anneau extérieur (i===0) et que l'aire > 2π, il est inversé
        const area = d3.geoArea({ type: "Polygon", coordinates: [ring] });
        
        if (i === 0 && area > 2 * Math.PI) {
          ring.reverse();
        } 
        // Pour les trous (i > 0), ils doivent avoir une aire < 2π
        else if (i > 0 && area > 2 * Math.PI) {
          ring.reverse();
        }
      });
    });
  });
  return geojson;
}

function clipCoordinatesToBounds(geojson, minLon = -180, maxLon = 180, minLat = -90, maxLat = 90) {
  geojson.features.forEach(feature => {
    const geom = feature.geometry;
    if (geom.type === "MultiPolygon" || geom.type === "Polygon") {
      const polys = geom.type === "MultiPolygon" ? geom.coordinates : [geom.coordinates];
      polys.forEach(poly => {
        poly.forEach(ring => {
          for (let i = 0; i < ring.length; i++) {
            ring[i][0] = Math.max(minLon, Math.min(maxLon, ring[i][0]));  // Clip lon
            ring[i][1] = Math.max(minLat, Math.min(maxLat, ring[i][1]));  // Clip lat
          }
        });
      });
    }
  });
  return geojson;
}

export async function loadAllData() {
  try {
    const [
      geoMRC,
      jeunesCSV,
      servicesCSV,
      communauteCSV,
      territoiresPPraw
    ] = await Promise.all([
      d3.json("./public/data/20mrc_EstduQuebec_inverse3.json"),
      d3.csv("./public/data/20mrc_jeune_service_coord.csv", d => ({
        code: d.MRS_CO_MRC,
        nomMRC: d.MRS_NM_MRC,
        region: d.MRS_NM_REG,
        pctJeunes: +d.jeune_0_19 || 0,
        serviceExpertise: +d.serviceExpertise || 0,
        serviceRepresentation: +d.serviceRepresentation || 0,
        serviceReseautage: +d.serviceReseautage || 0,
        serviceDocument: +d.serviceDocument || 0,
        serviceProduction: +d.serviceProduction || 0,
        serviceFormation: +d.serviceFormation || 0,
        lon: +d.longitude,
        lat: +d.latitude
      })),
      d3.csv("./public/data/20mrc_date_services.csv", (d, i) => ({
        id: `${d.ville}-${d.MRS_NM_MRC}-${i}`,
        mrc: d.MRS_NM_MRC,
        region: d.MRS_NM_REG,
        ville: d.ville,
        date: new Date(d.dateISO8601),
        lon: +d.longitude,
        lat: +d.latitude
      })),
      d3.csv("./public/data/communauteLayer.csv", d => ({
        id: d.id,
        label: d.ville,
        typeCommunaute: d.typeCommunaute,
        region: d.region,
        lon: +d.longitude,
        lat: +d.latitude
      })),
      d3.json("./public/data/territoiresPP_Qc.json")
    ]);

    // 🔥 Correction géométrie territoires autochtones
    const territoiresPP = fixPolygonWinding(territoiresPPraw);
    //clipCoordinatesToBounds(territoiresPP, -80, -55, 45, 62);  // Bounds QC approximatifs pour ton projet Est-du-Québec

    // NETTOYAGE services
    const servicesClean = servicesCSV.filter(d =>
      d.date instanceof Date &&
      !isNaN(d.date) &&
      !isNaN(d.lon) &&
      !isNaN(d.lat)  // Ajouté pour vérifier lat aussi
    );

    const jeunesParMRC = new Map(
      jeunesCSV.map(d => [d.code, d.pctJeunes])
    );

    const serviceKeys = [
      "serviceExpertise",
      "serviceRepresentation",
      "serviceReseautage",
      "serviceDocument",
      "serviceProduction",
      "serviceFormation"
    ];

    // Totaux pour légende
    const totalsCategories = {};
    serviceKeys.forEach(key => {
      totalsCategories[key] = d3.sum(jeunesCSV, d => d[key]);
    });

    // STOCKAGE CENTRALISÉ
    Object.assign(dataStore, {
      geoMRC,
      jeunesCSV,
      jeunesParMRC,
      communauteLayer: communauteCSV,
      territoiresPP,
      services: servicesClean,
      minDate: d3.min(servicesClean, d => d.date),
      maxDate: d3.max(servicesClean, d => d.date),
      totalsCategories
    });

  } catch (error) {
    console.error("❌ Erreur loadAllData :", error);
  }
}