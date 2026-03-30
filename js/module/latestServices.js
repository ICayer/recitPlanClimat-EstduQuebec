// ==================================================
// latestServices.js
// Module narratif : dernière date disponible
// ==================================================

import { state } from "../state.js";
import { dataStore } from "../dataStore.js";
import { updateServices, clearServices } from "../servicesLayer.js";

export const latestServices = {

  init() {

    const services = dataStore.services;

    const maxDate = d3.max(services, d => d.date);

    state.dateCourante = maxDate;

    updateServices(maxDate, state.regionActive || null);
  },

  destroy() {

    clearServices();
    state.dateCourante = null;
  }
};