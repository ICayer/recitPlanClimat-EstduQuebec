// ==================================================
// modulesRegistry.js
// Registre central des modules narratifs
// ==================================================

import { timeSeriesBSL } from "./module/timeSeriesBSL.js";
import { latestServices } from "./module/latestServices.js";

// --------------------------------------------------
// Registry
// --------------------------------------------------

export const modulesRegistry = {
  timeSeriesBSL,
  latestServices
};