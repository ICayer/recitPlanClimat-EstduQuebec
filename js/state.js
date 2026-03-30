//👉 source de vérité unique

export const state = {
  couleur: "choropleth",   // choropleth | regions | regionsContraste | focus
  zoom: "global",          // global | approche | focus
  legende: "choropleth",   // choropleth | regions | pie | communaute | autochtone
  regionActive: null,     // "Bas-Saint-Laurent" | null
  hoveredMRC: null,
  selectedMRC: null,
  dateCourante: null,     //Date | null
  hoveredPPTerritory: null
};