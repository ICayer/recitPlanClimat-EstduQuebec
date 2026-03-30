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

let paths;
let jeunesParMRC;

// =====================
// PROJECTION
// =====================
const projection = d3.geoMercator();

// =====================
// CHARGEMENT ET RÉPARATION
// =====================
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
  // 1. RÉPARATION DU SENS DES POLYGONES
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
    geojson
  );

  const pathGenerator = d3.geoPath().projection(projection);

  // =====================
  // 3. LOOKUP TABLE (CSV → Map)
  // =====================

    jeunesParMRC = new Map(
    csvData.map(d => [d.code, d.pctJeunes])
  );

  // =====================
  // 4. ÉCHELLE DE COULEUR
  // =====================

  const valeurs = Array.from(jeunesParMRC.values());

  const colorScale = d3.scaleSequential()
    .domain(d3.extent(valeurs)) // [min, max]
    .interpolator(d3.interpolateBlues);

    // =====================
// LÉGENDE CHOROPLETH
// =====================

const legendWidth = 250;
const legendHeight = 12;

const legendMargin = {
  top: 20,
  right: 20,
  bottom: 40,
  left: 20
};

// Groupe légende
const legend = svg.append("g")
  .attr(
    "transform",
    `translate(${width - legendWidth - legendMargin.right}, 
               ${height - legendMargin.bottom})`
  );

// =====================
// DÉFINITION DU GRADIENT
// =====================

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

// =====================
// RECTANGLE DE LÉGENDE
// =====================

legend.append("rect")
  .attr("width", legendWidth)
  .attr("height", legendHeight)
  .style("fill", "url(#legend-gradient)")
  .style("stroke", "#ccc");

// =====================
// AXE DE LÉGENDE
// =====================

const [minVal, maxVal] = colorScale.domain();

// Ticks manuels (inclut explicitement le max)
const ticks = d3.ticks(minVal, maxVal, 10);
if (ticks[ticks.length - 1] !== maxVal) {
  ticks.push(maxVal);
}

const legendScale = d3.scaleLinear()
  .domain([minVal, maxVal])
  .range([0, legendWidth]);

const legendAxis = d3.axisBottom(legendScale)
  .tickValues(ticks)
  .tickFormat(d => `${d}`);

legend.append("g")
  .attr("transform", `translate(0, ${legendHeight})`)
  .call(legendAxis);


// =====================
// TITRE DE LÉGENDE
// =====================

legend.append("text")
  .attr("x", 0)
  .attr("y", -8)
  .attr("font-size", "12px")
  .attr("font-weight", "600")
  .text("Jeunes de 0 à 19 ans (%)");


  // =====================
// 5. DESSIN CHOROPLETH
// =====================

 paths = g.selectAll("path")
  .data(geojson.features)
  .join("path")
  .attr("d", pathGenerator)
  .attr("fill", d => {
    const code = d.properties.MRS_CO_MRC;
    const valeur = jeunesParMRC.get(code);
    return valeur != null ? colorScale(valeur) : "#eee";
  })
  .attr("stroke", "#ffffff")
  .attr("stroke-width", 0.6)
  .style("cursor", "pointer")
  .on("mouseover", function () {
    d3.select(this)
      .attr("stroke-width", 1.5)
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
    return `${d.properties.MRS_NM_MRC}\nJeunes 0–19 ans : ${valeur ?? "ND"} %`;
  });


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
    const seuilJeunes = 20;

    console.log("STEP ENTER", step);

    // --- Fond SVG ---
    if (step === 0) svg.style("background", "#ffffff");
    if (step === 1) svg.style("background", "#f5faff");
    if (step === 2) svg.style("background", "#eef4ff");
    if (step === 3) svg.style("background", "#e8f0ff");

    // --- Carte ---
    if (step === 0) paths.attr("opacity", 1);
    if (step === 1) {
  paths
    .attr("opacity", d => {
      const code = d.properties.MRS_CO_MRC;
      const valeur = jeunesParMRC.get(code);
      return valeur >= seuilJeunes ? 1 : 0.2;
    })
    .attr("stroke-width", d => {
      const code = d.properties.MRS_CO_MRC;
      const valeur = jeunesParMRC.get(code);
      return valeur >= seuilJeunes ? 1.5 : 0.5;
    });
}
    if (step === 2) paths.attr("opacity", 0.75);
    if (step === 3) paths.attr("opacity", 1);
  });
