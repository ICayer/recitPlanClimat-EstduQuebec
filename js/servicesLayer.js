// ==================================================
// servicesLayer.js — VERSION CORRIGÉE
// ==================================================
import { gServices, projection } from "./mapInit.js";
import { scaleRegions } from "./mapColors.js";
import { dataStore } from "./dataStore.js";

export function showServices() {
  if (!gServices) return;
  gServices.style("display", null).raise(); 
}

export function hideServices() {
  if (!gServices) return;
  gServices.selectAll("circle.service").interrupt().remove();
  gServices.style("display", "none");
}

export function clearServices() {
  if (!gServices) return;
  gServices.selectAll("circle.service").interrupt().remove();
}

export function updateServices(currentDate = null, regionFilter = null) {
  const data = dataStore.services;
  if (!data || !currentDate || !gServices) return;

  // 1. On filtre les services jusqu'à LA MILLISECONDE actuelle de l'animation
  const servicesActifs = data.filter(d => d.date.getTime() <= currentDate.getTime());

  // 2. On groupe par ville pour compter les services accumulés à CET INSTANT précis
  const statsParVille = d3.rollup(
    servicesActifs,
    v => v.length,
    d => d.ville
  );

  const villesData = Array.from(
    d3.group(servicesActifs, d => d.ville),
    ([ville, instances]) => ({
      ville,
      count: statsParVille.get(ville), // Ce nombre augmente durant l'animation
      lon: instances[0].lon,
      lat: instances[0].lat,
      region: instances[0].region
    })
  );

  // 3. DATA JOIN avec clé unique par ville
  const circles = gServices.selectAll("circle.service")
    .data(villesData, d => d.ville);

  // EXIT : On retire les villes qui ne sont plus dans la plage (si on recule)
  circles.exit().remove();

  // ENTER : Une ville apparaît dès son premier service
  const enter = circles.enter()
    .append("circle")
    .attr("class", "service")
    .attr("cx", d => projection([d.lon, d.lat])[0])
    .attr("cy", d => projection([d.lon, d.lat])[1])
    .attr("r", 0) // Commence à 0
    .attr("fill", d => scaleRegions(d.region) || "#fc8e62")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("opacity", 0.9);

  // UPDATE (Appelé à chaque frame du timer/scroll)
  // On ne met pas de .transition() ici pour que l'oeil voit la croissance en temps réel
  enter.merge(circles)
    .transition()
    .duration(250) // Court pour rester réactif, mais assez pour lisser le saut
    .ease(d3.easeCubicOut) // Courbe d'accélération douce
    .attr("r", d => radiusFromCount(d.count));
     
}

function radiusFromCount(count) {
  const maxServices = 30;
  const capped = Math.min(count, maxServices);
  return 4 + (capped * 2);
}