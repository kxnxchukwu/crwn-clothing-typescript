import { useEffect } from "react";
import { toast } from "sonner";
import { useRegisterSW } from "virtual:pwa-register/react";

// How often an open tab asks the server for a new deploy.
export const UPDATE_CHECK_MS = 60 * 60 * 1000;

// The service worker serves the shop from a cache, so after a deploy an open
// tab keeps running the old version. This registers the worker, checks for
// new deploys (hourly, and whenever the tab comes back into view), and offers
// a refresh instead of reloading on its own.
export default function UpdatePrompt(): null {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      const check = () => {
        if (!navigator.onLine) return;
        registration.update().catch(() => {
          // Offline or the server hiccupped; the next check will retry.
        });
      };
      setInterval(check, UPDATE_CHECK_MS);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
    },
  });

  useEffect(() => {
    if (!needRefresh) return;
    const id = toast("A new version of the shop is available.", {
      duration: Infinity,
      action: {
        label: "Refresh",
        // Activates the new worker, then reloads the page.
        onClick: () => updateServiceWorker(true),
      },
    });
    return () => {
      toast.dismiss(id);
    };
  }, [needRefresh, updateServiceWorker]);

  return null;
}
