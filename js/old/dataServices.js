// dataServices.js
let servicesData = [];

/**
 * Chargement initial du CSV (une seule fois)
 */
export function loadServicesData() {
  return d3.csv("/public/data/20mrc_date_services.csv", (d, i) => ({
    id: `${d.ville}-${d.MRS_NM_MRC}-${i}`, // ID stable
    mrc: d.MRS_NM_MRC,
    ville: d.ville,
    region: d.MRS_NM_REG,
    date: new Date(d.date),
    lon: +d.longitude,
    lat: +d.latitude
  }))
  .then(data => {
    servicesData = data;
    console.log("✔ Services chargés :", servicesData.length);
    return servicesData;
  });
}

/**
 * Toutes les données (debug, tests, index 4)
 */
export function getServicesData() {
  return servicesData;
}

/**
 * Données filtrées jusqu'à une date donnée (animation temporelle)
 */
export function getServicesUntil(dateCourante) {
  if (!dateCourante) return [];

  return servicesData.filter(d =>
    d.date <= dateCourante
  );
}