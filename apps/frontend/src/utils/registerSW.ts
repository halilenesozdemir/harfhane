import { registerSW } from 'virtual:pwa-register';

let deferredUpdate: (() => void) | null = null;

/** @deferred No UI listens for "sw-update-available" yet. See docs/backlog.md. */
export function hasPendingUpdate(): boolean {
  return deferredUpdate !== null;
}

/** @deferred No UI listens for "sw-update-available" yet. See docs/backlog.md. */
export function applyPendingUpdate(): void {
  deferredUpdate?.();
  deferredUpdate = null;
}

export const registerServiceWorker = (): void => {
  const updateSW = registerSW({
    onNeedRefresh() {
      deferredUpdate = () => updateSW(true);
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('sw-offline-ready'));
    },
    onRegistered(registration: ServiceWorkerRegistration | undefined) {
      if (registration) {
        setInterval(() => { registration.update(); }, 60 * 60 * 1000);
      }
    },
    onRegisterError() {
      window.dispatchEvent(new CustomEvent('sw-register-error'));
    },
  });
};

