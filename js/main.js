// ==================================================
// MAIN.JS — MOTEUR GÉNÉRIQUE STABLE
// ==================================================

import { state } from "./state.js";
import { loadAllData } from "./dataLoader.js";

import { initMap } from "./mapInit.js";
import { appliquerZoom } from "./mapZoom.js";
import { appliquerCouleurs, initColorScale } from "./mapColors.js";
import { appliquerLegende } from "./mapLegends.js";

import { initMRCLayer, showMRCs, hideMRCs } from "./mrcLayer.js";
import { initEstduQuebecLayer, showEstduQuebec, hideEstduQuebec } from "./mapEstduQuebec.js";
import { initPieLayer, showPieCharts, hidePieCharts } from "./pieChartLayer.js";
import { initCommunautes, showCommunaute, hideCommunaute } from "./communauteLayer.js";
import { initPPgeoJSON, showPPgeoJSON, hidePPgeoJSON } from "./autochtoneLayer.js";

import {showServices, hideServices } from "./servicesLayer.js";
import { modulesRegistry } from "./modulesRegistry.js";

// ==================================================

let stepConfig = {};
let activeModule = null;

// ==================================================

async function init() {

  await loadAllData();

  stepConfig = await d3.json("public/data/steps.json");

  const { width, height } = initMap();

  initMRCLayer(width, height);
  initEstduQuebecLayer();
  initPieLayer();
  initCommunautes();
  initPPgeoJSON();

  initColorScale();
  initScroll();
}

init();

// ==================================================
// LAYER REGISTRY
// ==================================================

const layers = {
  estduquebec: { show: showEstduQuebec, hide: hideEstduQuebec },
  mrc: { show: showMRCs, hide: hideMRCs },
  autochtone: { show: showPPgeoJSON, hide: hidePPgeoJSON },
  pie: { show: showPieCharts, hide: hidePieCharts },
  communaute: { show: showCommunaute, hide: hideCommunaute },
  services: { show: showServices, hide: hideServices }
};

function activateLayers(active = []) {
  Object.entries(layers).forEach(([key, layer]) => {
    active.includes(key) ? layer.show() : layer.hide();
  });
}

// ==================================================
// RESET GLOBAL
// ==================================================

function resetGlobal() {

  // Stop ancien module
  if (activeModule && activeModule.destroy) {
    activeModule.destroy();
  }

  activeModule = null;

  state.zoom = null;
  state.couleur = null;
  state.legende = null;
  state.regionActive = null;
}

// ==================================================
// RENDER
// ==================================================

function render() {

  if (state.zoom) appliquerZoom();
  if (state.couleur) appliquerCouleurs();
  if (state.legende) appliquerLegende();
}

// ==================================================
// SCROLL
// ==================================================

function initScroll() {

  const scroller = scrollama();

  scroller
    .setup({
      step: ".step",
      offset: 0.6
    })
    .onStepEnter(({ element }) => {

      const stepName = element.dataset.step;
      const config = stepConfig[stepName];
      if (!config) return;

      resetGlobal();

      // Update state
      state.zoom = config.zoom || null;
      state.couleur = config.couleur || null;
      state.legende = config.legende || null;
      state.regionActive = config.regionActive || null;

      // Activate layers
      activateLayers(config.layers || []);
      render();
      // Activate module
      if (config.module && modulesRegistry[config.module]) {
        activeModule = modulesRegistry[config.module];
        activeModule.init();

        
      }
      
    });
}