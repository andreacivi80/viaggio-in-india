if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then((registration) => registration.update())
    .catch(() => {});
  // La nuova revisione prende il controllo senza interrompere la pagina in uso.
  // Alla successiva apertura la navigazione di rete ha priorita sulla cache offline.
}
