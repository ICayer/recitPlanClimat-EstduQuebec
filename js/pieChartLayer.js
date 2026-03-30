import { gRoot, projection } from "./mapInit.js";
import { dataStore } from "./dataStore.js";
import { colorServices} from "./mapColors.js";

let gPieLayer;

export function initPieLayer() {
  if (gPieLayer) return;
  gPieLayer = gRoot.append("g").attr("class", "pie-layer");
}

const serviceKeys = Object.keys(colorServices);

function radiusFromTotal(total) {
  const maxServices = 30;
  const capped = Math.min(total, maxServices);
  // On augmente un peu la taille pour que ce soit visible
  return 8 + (capped * 2); 
}

export function showPieCharts() {
  if (!gPieLayer || !projection) return;
  
  const data = dataStore.jeunesCSV; 
  if (!data) return;

  const pieGenerator = d3.pie()
    .value(d => d.value)
    .sort(null);

  const arcGenerator = d3.arc().innerRadius(0);

  // 1. Préparation et filtrage des données
  const cleanPieData = data.map(d => {
    // On calcule le total pour cette MRC précise
    const total = d3.sum(serviceKeys, k => +d[k] || 0);
    return {
      ...d,
      total: total,
      lon: parseFloat(d.lon),
      lat: parseFloat(d.lat)
    };
  }).filter(d => d.total > 0 && !isNaN(d.lon));

  // 2. JOIN des groupes (un <g> par MRC)
  const pies = gPieLayer
    .selectAll("g.pie")
    .data(cleanPieData, d => d.nomMRC)
    .join(
      enter => enter.append("g")
        .attr("class", "pie")
        .attr("opacity", 0)
        .call(g => g.transition().duration(600).attr("opacity", 1)),
      update => update,
      exit => exit.remove()
    )
    .attr("transform", d => {
      const coords = projection([d.lon, d.lat]);
      return `translate(${coords[0]},${coords[1]})`;
    });

  // 3. Dessin des secteurs à l'intérieur de chaque groupe
  pies.each(function(d) {
    const r = radiusFromTotal(d.total);

    // Transformation de la ligne (Rimouski) en tableau pour le camembert
    const arcData = serviceKeys.map(key => ({
      key: key,
      value: +d[key] || 0
    }));

    const arcs = pieGenerator(arcData);

    d3.select(this)
      .selectAll("path")
      .data(arcs)
      .join("path")
      .attr("class", "pie-slice")
      .attr("data-key", p => p.data.key)
      .attr("fill", p => colorServices[p.data.key])
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 0.5)
      .attr("d", arcGenerator.outerRadius(r));
        });
}

export function hidePieCharts() {
  if (!gPieLayer) return;

  // On sélectionne tous les groupes de camemberts
  gPieLayer.selectAll("g.pie")
    .transition()
    .duration(500) // Durée de la sortie (0.5 seconde)
    .ease(d3.easeBackIn) // Effet d'élan vers l'intérieur avant de disparaître
    .attr("opacity", 0)
    .attr("transform", function(d) {
      // On récupère la position actuelle pour les faire rétrécir vers leur propre centre
      const coords = projection([d.lon, d.lat]);
      return `translate(${coords[0]},${coords[1]}) scale(0.1)`;
    })
    .remove(); // Le remove() n'est exécuté qu'à la fin de la transition
}