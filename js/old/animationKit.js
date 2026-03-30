//Animation des cercles avec une transition à mettre dans main.js
if (index === 5) {
  initServicesLayer();

  const data = getServicesData();
  if (data.length === 0) return;

  // Toutes les dates uniques triées
  const datesUniques = [...new Set(data.map(d => d.date.getTime()))]
    .sort((a, b) => a - b)
    .map(t => new Date(t));

  let i = 0;
  state.dateCourante = datesUniques[0];

  updateServices(state.dateCourante);

  // Animation automatique (toutes les 1.5s par ex.)
  const interval = setInterval(() => {
    i++;
    if (i < datesUniques.length) {
      state.dateCourante = datesUniques[i];
      updateServices(state.dateCourante);
    } else {
      clearInterval(interval);
    }
  }, 1500);

  // Option : arrêter quand on quitte l'étape
  // (à ajouter dans onStepExit si tu veux)
}