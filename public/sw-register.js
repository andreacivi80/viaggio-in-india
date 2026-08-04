if ("serviceWorker" in navigator) {
  addEventListener("load", () => navigator.serviceWorker.register("./sw.js"));
  // Un aggiornamento non deve mai interrompere una pubblicazione, un commento
  // o la consultazione corrente. Il nuovo worker viene usato alla successiva
  // apertura naturale dell'app, senza ricaricare forzatamente questa pagina.
}
