import { gCommunaute, projection } from "./mapInit.js";
import { dataStore } from "./dataStore.js";
import { scaleRegionsContraste } from "./mapColors.js";

let tooltip = null;

export function initCommunautes() {

  if (!dataStore.communauteLayer) return;

  if (!tooltip) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip-communaute")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "white")
      .style("padding", "6px 8px")
      .style("border", "1px solid #ccc")
      .style("font-size", "12px")
      .style("opacity", 0);
  }

  const nodes = gCommunaute
    .selectAll(".communaute")
    .data(dataStore.communauteLayer, d => d.id)
    .join("g")
    .attr("class", "communaute")
    .attr("transform", d => {
      const [x, y] = projection([d.lon, d.lat]);
      return `translate(${x}, ${y})`;
    });

  nodes
    .filter(d => d.typeCommunaute === "allochtone")
    .append("rect")
    .attr("x", -5)
    .attr("y", -5)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => scaleRegionsContraste(d.region));

  nodes
    .filter(d => d.typeCommunaute === "autochtone")
    .append("circle")
    .attr("r", 5)
    .attr("fill", "white")
    .attr("stroke-width", 2)
    .attr("stroke", d => scaleRegionsContraste(d.region));

  nodes
    .on("mouseenter", (event, d) => {
      tooltip
        .style("opacity", 1)
        .html(d.label);
    })
    .on("mousemove", event => {
      tooltip
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 20) + "px");
    })
    .on("mouseleave", () => {
      tooltip.style("opacity", 0);
    });

  gCommunaute.style("opacity", 0);
}

export function showCommunaute() {
  gCommunaute
    .transition()
    .duration(500)
    .style("opacity", 1);
}

export function hideCommunaute() {
  gCommunaute
    .transition()
    .duration(500)
    .style("opacity", 0);
}
