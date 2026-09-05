if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("./sw.js", { updateViaCache: "none" })
    .then(async (registration) => {
      await registration.update();
      if (registration.waiting) registration.waiting.postMessage({ type: "SKIP_WAITING" });
    })
    .catch(() => {});
}
