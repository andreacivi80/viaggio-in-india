if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js").catch(() => {});
  // Un aggiornamento non deve mai interrompere una pubblicazione, un commento
  // o la consultazione corrente. Il nuovo worker viene usato alla successiva
  // apertura naturale dell'app, senza ricaricare forzatamente questa pagina.
}
