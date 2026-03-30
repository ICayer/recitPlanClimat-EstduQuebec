// =====================
// IMPORTS & SETUP
// =====================

// Scrollama est chargé via CDN → disponible globalement
const scroller = scrollama();

// Sélection des steps
const steps = document.querySelectorAll(".step");

// =====================
// CALLBACKS
// =====================

// Quand une step entre dans le viewport
function handleStepEnter(response) {
  const stepEl = response.element;
  const stepIndex = response.index;
  const stepId = stepEl.dataset.step;

  console.log("STEP ENTER");
  console.log("index :", stepIndex);
  console.log("data-step :", stepId);

  // Visuel temporaire (debug)
  steps.forEach((step) => step.classList.remove("is-active"));
  stepEl.classList.add("is-active");
}

// Quand une step sort du viewport
function handleStepExit(response) {
  console.log("STEP EXIT", response.index);
}

// =====================
// INITIALISATION
// =====================

function init() {
  scroller
    .setup({
      step: ".step",
      offset: 0.6, // déclenchement à 60% de la hauteur de l'écran
      debug: false
    })
    .onStepEnter(handleStepEnter)
    .onStepExit(handleStepExit);

  // Recalcule au resize
  window.addEventListener("resize", scroller.resize);
}

// Lancement
init();
