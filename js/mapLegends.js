import { state } from "./state.js";
import {svg } from "./mapInit.js"
import { colorServices, serviceKeys, colorScale, scaleAutochtone} from "./mapColors.js";
import { dataStore } from "./dataStore.js"; 

// =====================
// PARAMÈTRES COMMUNS
// =====================
const legendMargin = {
  left: 130,
  bottom: 30
};

// Références internes (pour interactions)
let legendSelection = null;
let regionItemSelection = null;

// =====================
// API PUBLIQUE
// =====================
export function appliquerLegende() {
  // Nettoyage
  svg.selectAll(".legend").remove();

  legendSelection = null;
  regionItemSelection = null;

  if (state.legende === "choropleth") {
    creerLegendeChoropleth();
  }

  if (state.legende === "regions") {
    creerLegendeRegions();
  }

  if (state.legende === "pie") {
    creerLegendePie();
  }

  if (state.legende === "communaute") {
  creerLegendeCommunaute();
  }

  if (state.legende === "autochtone") {
  creerLegendeAutochtone();
  }
}

// =====================
// API INTERACTIONS (NOUVEAU)
// =====================

export function highlightLegend(payload) {
  if (!legendSelection) return;

  // --- Choropleth ---
  if (state.legende === "choropleth" && payload?.value != null) {
    const { value } = payload;
    const legendWidth = 260;

    const [min, max] = colorScale.domain();
    const scale = d3.scaleLinear()
      .domain([min, max])
      .range([0, legendWidth]);

    legendSelection
      .select(".legend-cursor")
      .attr("x", scale(value) - 1)
      .attr("opacity", 1);
  }

  // --- Régions ---
  if (state.legende === "regions" && payload?.label && regionItemSelection) {
    regionItemSelection
      .select("rect")
      .attr("opacity", d => d.label === payload.label ? 1 : 0.3);
  }
}

export function resetLegendHighlight() {
  if (!legendSelection) return;

  // Choropleth
  legendSelection
    .select(".legend-cursor")
    .attr("opacity", 0);

  // Régions
  if (regionItemSelection) {
    regionItemSelection
      .select("rect")
      .attr("opacity", 1);
  }
}

// =====================
// LÉGENDE CHOROPLETH
// =====================
function creerLegendeChoropleth() {
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const legendWidth = 260;
  const legendHeight = 12;

  const legend = svg.append("g")
    .attr("class", "legend legend-choropleth")
    .attr(
      "transform",
      `translate(${width - legendWidth - legendMargin.left},
                 ${height - legendMargin.bottom})`
    );

  legendSelection = legend;

  // --- Gradient ---
  const defs = svg.append("defs");

  const linearGradient = defs.append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  const stops = d3.range(0, 1.01, 0.1);

  linearGradient.selectAll("stop")
    .data(stops)
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => {
      const [min, max] = colorScale.domain();
      return colorScale(min + d * (max - min));
    });

  // --- Rectangle ---
  legend.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#legend-gradient)");

  // --- Curseur (hover sync) ---
  legend.append("rect")
    .attr("class", "legend-cursor")
    .attr("y", -2)
    .attr("width", 2)
    .attr("height", legendHeight + 4)
    .attr("fill", "#000")
    .attr("opacity", 0);

  // --- Axe ---
  const [minVal, maxVal] = colorScale.domain();

  const ticks = d3.ticks(minVal, maxVal, 5);
  if (ticks[ticks.length - 1] !== maxVal) {
    ticks.push(maxVal);
  }

  const scale = d3.scaleLinear()
    .domain([minVal, maxVal])
    .range([0, legendWidth]);

  const axis = d3.axisBottom(scale)
    .tickValues(ticks)
    .tickFormat(d => `${d}`);

  legend.append("g")
    .attr("transform", `translate(0, ${legendHeight})`)
    .call(axis);

  // --- Titre ---
  legend.append("text")
    .attr("x", 0)
    .attr("y", -8)
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .text("Jeunes de 0 à 19 ans (%)");
}

// =====================
// LÉGENDE DES RÉGIONS
// =====================
function creerLegendeRegions() {
  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const regions = [
    { label: "Bas-Saint-Laurent", color: "#8da0cb" },
    { label: "Côte-Nord", color: "#66c2a5" },
    { label: "Gaspésie–Îles-de-la-Madeleine", color: "#fc8d62" }
  ];

  const legend = svg.append("g")
    .attr("class", "legend legend-regions")
    .attr(
      "transform",
      `translate(${legendMargin.left},
                 ${height - legendMargin.bottom - regions.length * 22})`
    );

  legendSelection = legend;

  // --- Titre ---
  legend.append("text")
    .attr("x", 0)
    .attr("y", -20)
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .text("Régions administratives");

  const items = legend.selectAll(".legend-item")
    .data(regions)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 22})`);

  regionItemSelection = items;

  items.append("rect")
    .attr("width", 14)
    .attr("height", 14)
    .attr("y", -11)
    .attr("fill", d => d.color);

  items.append("text")
    .attr("x", 22)
    .attr("y", 0)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .text(d => d.label);

    
}

// =====================
// LÉGENDE PIE CHARTS
// =====================
function creerLegendePie() {

  const width = +svg.attr("width");
  const height = +svg.attr("height");
  const padding = 5;

  // =====================
  // 1️⃣ Labels courts
  // =====================

  const labelMap = {
    serviceExpertise: "Conseil",
    serviceRepresentation: "Représentation",
    serviceReseautage: "Maillage",
    serviceDocument: "Documentation",
    serviceProduction: "Production",
    serviceFormation: "Formation"
  };

  // =====================
  // 2️⃣ Totaux globaux par catégorie
  // =====================

  const rawData = dataStore.jeunesCSV;
  if (!rawData) return;

  const totals = {};

  serviceKeys.forEach(key => {
    totals[key] = d3.sum(rawData, d => +d[key] || 0);
  });

  // =====================
  // 3️⃣ Transformation en tableau + tri décroissant
  // =====================

  const categories = serviceKeys
    .map(key => ({
      key,
      label: labelMap[key],
      color: colorServices[key],
      total: totals[key]
    }))
    .sort((a, b) => d3.descending(a.total, b.total));

  // =====================
  // 4️⃣ Échelle de rayon
  // =====================

  const maxTotal = d3.max(categories, d => d.total);

  const radiusScale = d3.scaleSqrt()
    .domain([0, maxTotal])
    .range([4, 14]);  // ajuste si nécessaire

  // =====================
  // 5️⃣ Création du groupe
  // =====================

  const itemHeight = 26;
  const legendWidth = 220;
  const legendHeight = categories.length * itemHeight;

  const legend = svg.append("g")
    .attr("class", "legend legend-pie")
    .attr(
      "transform",
      `translate(${width - legendWidth - padding},
                 ${height - legendHeight - padding})`
    );

  legendSelection = legend;

  // =====================
  // 6️⃣ Items verticaux
  // =====================

  const items = legend.selectAll(".legend-item")
    .data(categories)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * itemHeight})`);

// =====================
// Layout à deux colonnes fixes
// =====================

const maxRadius = d3.max(categories, d => radiusScale(d.total));

// Position colonne cercles (centre fixe)
const circleCenterX = legendWidth - maxRadius - 5; 

// Position colonne texte (aligné à droite)
const textRightX = circleCenterX - maxRadius - 5; 
// 5px entre texte et cercle (entre bord texte et bord cercle max)

// ---------------------
// TEXTES (colonne stable)
// ---------------------
items.append("text")
  .attr("x", textRightX)
  .attr("y", 0)
  .attr("text-anchor", "end")
  .attr("dominant-baseline", "middle")
  .attr("font-size", "12px")
  .text(d => d.label);

// ---------------------
// CERCLES (centre aligné)
// ---------------------
items.append("circle")
  .attr("cx", circleCenterX)
  .attr("cy", 0)
  .attr("r", d => radiusScale(d.total))
  .attr("fill", d => d.color);


  // =====================
  // 7️⃣ Hover interaction
  // =====================

  items
    .on("mouseenter", (event, d) => {
      d3.selectAll(".pie-slice")
        .attr("opacity", function() {
          return d3.select(this).attr("data-key") === d.key ? 1 : 0.15;
        });
    })
    .on("mouseleave", () => {
      d3.selectAll(".pie-slice")
        .attr("opacity", 1);
    });
}

  // =====================
  // Légende communauté
  // =====================

function creerLegendeCommunaute() {

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const legend = svg.append("g")
    .attr("class", "legend legend-communaute")
    .attr("transform",
      `translate(${width - 180}, ${height - 70})`
    );

  legend.append("text")
    .attr("y", -15)
    .attr("font-size", "12px")
    .attr("font-weight", "600")
    .text("Types de communautés");

  // Allochtone (carré)
  legend.append("rect")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", 12)
    .attr("height", 12)
    .attr("fill", "#666");

  legend.append("text")
    .attr("x", 20)
    .attr("y", 6)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .text("Allochtone");

  // Autochtone (cercle)
  legend.append("circle")
    .attr("cx", 6)
    .attr("cy", 30)
    .attr("r", 6)
    .attr("fill", "white")
    .attr("stroke", "#666")
    .attr("stroke-width", 2);

  legend.append("text")
    .attr("x", 20)
    .attr("y", 30)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "12px")
    .text("Autochtone");
}

  // =====================
// LÉGENDE AUTOCHTONE
// =====================
export function creerLegendeAutochtone() {
  if (!dataStore.territoiresPP) return;

  // Pas besoin de width ici pour le "haut gauche", on utilise le padding direct
  const features = dataStore.territoiresPP.features;
  
  // Extraire les noms uniques
  const nations = [...new Set(features.map(d => d.properties.Name))];

  const itemHeight = 22;
  const paddingX = 15; // Un peu plus de marge pour décoller du bord
  const paddingY = 35; 

  // Suppression de l'ancienne légende si elle existe
  svg.selectAll(".legend-autochtone").remove();

  const legend = svg.append("g")
    .attr("class", "legend legend-autochtone")
    .attr("transform", `translate(${paddingX}, ${paddingY})`);

  legendSelection = legend;

  // --- Titre ---
  legend.append("text")
    .attr("x", 0)
    .attr("y", -10)
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .attr("fill", "#333")
    .text("Les territoires des Premiers Peuples au Québec");

  const items = legend.selectAll(".legend-item")
    .data(nations)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * itemHeight + 20})`)
    .style("cursor", "pointer");

  // Cercle de couleur
  items.append("circle")
    .attr("cx", 6)
    .attr("cy", 0)
    .attr("r", 7)
    .attr("fill", d => scaleAutochtone(d))
    .attr("stroke", "#444")
    .attr("stroke-width", 1.5);

  // Nom de la nation
  items.append("text")
    .attr("x", 22)
    .attr("y", 0)
    .attr("dominant-baseline", "middle")
    .attr("font-size", "13px")
    .attr("fill", "#444")
    .text(d => d);

  // --- INTERACTIVITÉ ---
  items
    .on("mouseenter", (event, name) => {
      // 1. Feedback visuel sur la légende
      items.transition().duration(200)
        .attr("opacity", d => d === name ? 1 : 0.2);

      // 2. Mise en évidence du polygone sur la carte
      // On cible les chemins par la classe "autochtone-path"
      d3.selectAll(".autochtone-path")
        .transition().duration(250)
        .attr("opacity", d => d.properties.Name === name ? 0.6 : 0.03) // On efface presque les autres
        .attr("stroke", d => d.properties.Name === name ? "#000" : "none") // Contour noir pour focus
        .attr("stroke-width", d => d.properties.Name === name ? 1.5 : 0);
    })
    .on("mouseleave", () => {
      // Reset légende
      items.transition().duration(200).attr("opacity", 1);

      // Reset carte vers l'état initial (très transparent pour voir le fond)
      d3.selectAll(".autochtone-path")
        .transition().duration(250)
        .attr("opacity", 0.1)
        .attr("stroke", "#333")
        .attr("stroke-width", 0.2);
    });
}