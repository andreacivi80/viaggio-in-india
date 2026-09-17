export const CAMERA_UNAVAILABLE_MESSAGE =
  "Fotocamera non disponibile o autorizzazione negata. Puoi scegliere una foto da Galleria foto.";

export function cameraSelectionFeedback(files) {
  return Array.from(files || []).length ? "" : CAMERA_UNAVAILABLE_MESSAGE;
}
