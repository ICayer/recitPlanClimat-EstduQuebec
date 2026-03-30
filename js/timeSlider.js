// timeSlider.js
import { svg } from "./mapInit.js";
import { updateServices } from "./servicesLayer.js";
import { state } from "./state.js";

let gTime;
let xScale;
let handle;

// =====================
// INIT
// =====================
export function initTimeSlider(minDate, maxDate) {
  // Sécurité absolue : on nettoie tout avant
  svg.selectAll("g.time-slider").remove();

  // reset références
  gTime = null;
  xScale = null;
  handle = null;

  const width = +svg.attr("width");
  const height = +svg.attr("height");

  const margin = { left: 80, right: 80, bottom: 40 };
  const sliderY = height - margin.bottom;

  gTime = svg.append("g")
    .attr("class", "time-slider")
    .attr("transform", `translate(0, ${sliderY})`);

  // Échelle
  xScale = d3.scaleTime()
    .domain([minDate, maxDate])
    .range([margin.left, width - margin.right]);

  // ──────────────── RAIL ────────────────
  gTime.append("line")
    .attr("x1", xScale.range()[0])
    .attr("x2", xScale.range()[1])
    .attr("y1", 0)
    .attr("y2", 0)
    .attr("stroke", "#999")
    .attr("stroke-width", 2);

  // ──────────────── REPÈRES TEMPORELS CUSTOM ────────────────
  // Tu peux changer .every(6) en .every(3) ou .every(4) selon la densité voulue
  const tickInterval = d3.timeMonth.every(6);
  const ticks = tickInterval.range(minDate, maxDate);

  const tickGroup = gTime.append("g")
    .attr("class", "time-ticks");

  // Traits verticaux
  tickGroup.selectAll("line")
    .data(ticks)
    .join("line")
    .attr("x1", d => xScale(d))
    .attr("x2", d => xScale(d))
    .attr("y1", -6)
    .attr("y2", 6)
    .attr("stroke", "#666")
    .attr("stroke-width", 1);

  // Libellés
  tickGroup.selectAll("text")
    .data(ticks)
    .join("text")
    .attr("x", d => xScale(d))
    .attr("y", 22)
    .attr("text-anchor", "middle")
    .attr("fill", "#444")
    .attr("font-size", "11px")
    .text(d => d3.timeFormat("%b %Y")(d));

  // ──────────────── CURSEUR ────────────────
  handle = gTime.append("circle")
    .attr("class", "time-handle")
    .attr("r", 6)
    .attr("fill", "#0021fb")
    .attr("stroke", 0.3)
    .attr("cx", xScale(minDate))
    .attr("cy", 0);
}

// =====================
// UPDATE (piloté par scroll)
// =====================
export function updateTimeSlider(date) {
  if (!handle || !xScale) return;

  state.dateCourante = date;

  handle
    .transition()
    .duration(700)
    .ease(d3.easeCubicOut)
    .attr("cx", xScale(date));

  updateServices(date);

  // Mise en valeur de l’année courante (optionnel)
  gTime.selectAll(".time-ticks text")
    .attr("font-weight", d =>
      d3.timeYear.floor(d).getFullYear() ===
      d3.timeYear.floor(date).getFullYear()
        ? "bold"
        : "normal"
    );
}

export function removeTimeSlider() {
  if (gTime) {
    gTime.remove();
    gTime = null;
    xScale = null;
    handle = null;
  }
}