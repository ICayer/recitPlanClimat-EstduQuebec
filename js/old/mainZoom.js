// =====================
// DIMENSIONS
// =====================
const container = document.getElementById("vis");
const width = container.clientWidth;
const height = container.clientHeight;

// =====================
// SVG & SÉCURITÉ (ClipPath)
// =====================
const svg = d3
  .select("#vis")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

svg.append("defs")
  .append("clipPath")
  .attr("id", "map-clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

const g = svg.append("g")
  .attr("clip-path", "url(#map-clip)");

// =====================
// VARIABLES GLOBALES (partagées D3 / Scrollama)
// =====================
let paths;
let jeunesParMRC;

let geoData;   // 👈 AJOUT IMPORTANT

let etatCouleur = "choropleth"; // choropleth | regions | regionsContraste | focus
let regionActive = null;

// =====================
// ÉTAT DE ZOOM NARRATIF
// =====================
let etatZoom = "global"; // global | region

// =====================
// CATÉGORIES DE RÉGIONS
// =====================
const categoriesRegions = [
  "Bas-Saint-Laurent",
  "Côte-Nord",
  "Gaspésie–Îles-de-la-Madeleine"
];

etatVue = {
  couleur: "choropleth" | "regions" | "focus",
  zoom: "global" | "approche" | "focus",
  legende: "choropleth" | "regions"
}

// =====================
// ÉCHELLES DE COULEUR CATÉGORIELLES
// =====================
const scaleRegions = d3.scaleOrdinal()
  .domain(categoriesRegions)
  .range([
    "#8da0cb", // Bas-Saint-Laurent
    "#66c2a5", // Côte-Nord
    "#fc8d62"  // Gaspésie–Îles
  ]);

const scaleRegionsContraste = d3.scaleOrdinal()
  .domain(categoriesRegions)
  .range([
    "#1f78b4",
    "#33a02c",
    "#e31a1c"
  ]);

// =====================
// PROJECTION
// =====================
const projection = d3.geoMercator();

// =====================
// FONCTION UNIQUE — COULEURS
// =====================
function appliquerCouleurs() {
  if (!paths) return;

  paths
    .transition()
    .duration(600)
    .attr("fill", d => {
      const region = d.properties.MRS_NM_REG;

      // Mode 1 — Choroplèthe (quantitatif)
      if (etatCouleur === "choropleth") {
        const code = d.properties.MRS_CO_MRC;
        const valeur = jeunesParMRC.get(code);
        return valeur != null ? colorScale(valeur) : "#eee";
      }

      // Mode 2 — Régions (palette douce)
      if (etatCouleur === "regions") {
        return scaleRegions(region);
      }

      // Mode 3 — Régions contrastées
      if (etatCouleur === "regionsContraste") {
        return scaleRegionsContraste(region);
      }

      // Mode 4 — Focus narratif
      if (etatCouleur === "focus") {
        return region === regionActive
          ? scaleRegions(region)
          : "#e0e0e0";
      }

      return "#ccc";
    });
}

// =====================
// FONCTION UNIQUE — ZOOM
// =====================
function appliquerZoom() {
  if (!geoData) return;

  // --- Vue globale ---
  if (etatZoom === "global") {
    const padding = Math.min(width, height) * 0.03;

    projection.fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      geoData
    );
  }

  // --- Zoom régional ---
  if (etatZoom === "region" && regionActive) {
    const featuresRegion = geoData.features.filter(
      d => d.properties.MRS_NM_REG === regionActive
    );

    const featureCollection = {
      type: "FeatureCollection",
      features: featuresRegion
    };

    const padding = Math.min(width, height) * 0.12;

    projection.fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      featureCollection
    );
  }

  // --- Redessiner la carte ---
  const pathGenerator = d3.geoPath().projection(projection);

  paths
    .transition()
    .duration(900)
    .attr("d", pathGenerator);
}

// =============================================
// FONCTION UNIQUE - RENDU ATTRIBUT + PROJECTION
// =============================================

function render() {
  if (!paths || !geoData) return;

  // --- PROJECTION / ZOOM ---
  if (etatZoom === "global") {
    const padding = Math.min(width, height) * 0.03;
    projection.fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      geoData
    );
  }

  if (etatZoom === "region" && regionActive) {
    const featuresRegion = geoData.features.filter(
      d => d.properties.MRS_NM_REG === regionActive
    );

    projection.fitExtent(
      [[width * 0.1, height * 0.1], [width * 0.9, height * 0.9]],
      {
        type: "FeatureCollection",
        features: featuresRegion
      }
    );
  }

  const pathGenerator = d3.geoPath().projection(projection);

  // --- RENDU FINAL ---
  paths
    .transition()
    .duration(900)
    .attr("d", pathGenerator)
    .attr("fill", d => {
      const region = d.properties.MRS_NM_REG;
      const code = d.properties.MRS_CO_MRC;

      if (etatCouleur === "choropleth") {
        const valeur = jeunesParMRC.get(code);
        return valeur != null ? colorScale(valeur) : "#eee";
      }

      if (etatCouleur === "regions") {
        return scaleRegions(region);
      }

      if (etatCouleur === "regionsContraste") {
        return scaleRegionsContraste(region);
      }

      if (etatCouleur === "focus") {
        return region === regionActive
          ? scaleRegions(region)
          : "#e0e0e0";
      }

      return "#ccc";
    });
}


// =====================
// CHARGEMENT DES DONNÉES
// =====================
Promise.all([
  d3.json("/public/data/20mrc_EstduQuebec_inverse2.geojson"),
  d3.csv("/public/data/20mrc_jeune_service_coord.csv", d => ({
    code: d.MRS_CO_MRC,
    pctJeunes: +d.jeune_0_19
  }))
]).then(([geojson, csvData]) => {

    // =====================
    // STOCKAGE GLOBAL DU GEOJSON
    // =====================
  geoData = geojson;

  // =====================
  // 1. RÉPARATION DES POLYGONES
  // =====================
  geojson.features.forEach(feature => {
    if (feature.geometry.type === "Polygon") {
      feature.geometry.coordinates.forEach(ring => ring.reverse());
    } else if (feature.geometry.type === "MultiPolygon") {
      feature.geometry.coordinates.forEach(polygon => {
        polygon.forEach(ring => ring.reverse());
      });
    }
  });

  // =====================
  // 2. PROJECTION
  // =====================
  const padding = Math.min(width, height) * 0.03;

  projection.fitExtent(
    [[padding, padding], [width - padding, height - padding]],
    geoData
  );

  const pathGenerator = d3.geoPath().projection(projection);

  // =====================
  // 3. LOOKUP TABLE (CSV → Map)
  // =====================
  jeunesParMRC = new Map(
    csvData.map(d => [d.code, d.pctJeunes])
  );

  // =====================
  // 4. ÉCHELLE CHOROPLETH
  // =====================
  const valeurs = Array.from(jeunesParMRC.values());

  window.colorScale = d3.scaleSequential()
    .domain(d3.extent(valeurs))
    .interpolator(d3.interpolateBlues);

  // =====================
  // 5. DESSIN DE LA CARTE
  // =====================
  paths = g.selectAll("path")
    .data(geoData.features)
    .join("path")
    .attr("d", pathGenerator)
    .attr("fill", "#eee")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 0.6)
    .style("cursor", "pointer")
    .on("mouseover", function () {
      d3.select(this)
        .attr("stroke-width", 0.8)
        .attr("stroke", "#000");
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("stroke-width", 0.6)
        .attr("stroke", "#ffffff");
    });

  paths.append("title")
    .text(d => {
      const code = d.properties.MRS_CO_MRC;
      const valeur = jeunesParMRC.get(code);
      return `${d.properties.MRS_NM_MRC}
Jeunes 0–19 ans : ${valeur ?? "ND"} %`;
    });

  // =====================
  // ÉTAT INITIAL
  // =====================
  etatCouleur = "choropleth";
  appliquerCouleurs();
});

// =====================
// SCROLLAMA — INIT
// =====================
const scroller = scrollama();

scroller
  .setup({
    step: ".step",
    offset: 0.6
  })
  .onStepEnter(response => {
  const step = response.index;

  console.log("STEP ENTER", step);

  if (step === 0) {
    etatCouleur = "choropleth";
    etatZoom = "global";        // 👈 IMPORTANT
    regionActive = null;
  }

  if (step === 1) {
    etatCouleur = "regions";
    etatZoom = "global";        // 👈 IMPORTANT
    regionActive = null;
  }

  if (step === 2) {
    etatCouleur = "regionsContraste";
    etatZoom = "global";        // 👈 IMPORTANT
    regionActive = null;
  }

  if (step === 3) {
    etatCouleur = "focus";
    etatZoom = "region";        // 👈 zoom narratif
    regionActive = "Bas-Saint-Laurent";
  }

  render();
});

