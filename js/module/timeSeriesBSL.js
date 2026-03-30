import { state } from "../state.js";
import { dataStore } from "../dataStore.js";
import { updateServices, clearServices, showServices } from "../servicesLayer.js";
import { initTimeSlider, removeTimeSlider, updateTimeSlider } from "../timeSlider.js";

let animationTimer = null;

export const timeSeriesBSL = {
  init() {
    state.regionActive = "Bas-Saint-Laurent";
    const services = dataStore.services;
    if (!services || services.length === 0) return;

    const minDate = d3.min(services, d => d.date);
    const maxDate = d3.max(services, d => d.date);

    showServices();
    
    // 1. Initialiser le slider au début
    initTimeSlider(minDate, maxDate, (date) => {
      // Si l'utilisateur touche au slider, on arrête l'animation automatique
      if (animationTimer) animationTimer.stop();
      state.dateCourante = date;
      updateServices(date, null);
    });

    // 2. Lancer l'animation automatique
    state.dateCourante = minDate;
    this.animate(minDate, maxDate);
  },

  animate(start, end) {
    const duration = 5000; // 5 secondes pour faire toute la période
    const interpolator = d3.interpolateDate(start, end);

    if (animationTimer) animationTimer.stop();

    animationTimer = d3.timer((elapsed) => {
      const t = Math.min(1, elapsed / duration);
      const currentDate = interpolator(t);

      state.dateCourante = currentDate;
      
      // Mettre à jour les cercles
      updateServices(currentDate, null);
      
      // Mettre à jour la position visuelle du slider (le petit bouton qui bouge)
      if (typeof updateTimeSlider === "function") {
        updateTimeSlider(currentDate);
      }

      if (t === 1) animationTimer.stop();
    });
  },

  destroy() {
    if (animationTimer) animationTimer.stop();
    removeTimeSlider();
    clearServices();
    state.dateCourante = null;
  }
};