export const isOffline = () => typeof navigator !== "undefined" && !navigator.onLine;

export function clearPwaRuntimeCache() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_RUNTIME" });
}
