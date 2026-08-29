/*
 * Qatra's service worker. Its only job is notifications.
 *
 * Deliberately NOT a caching/offline worker. An offline cache that serves a
 * stale blood request is worse than no cache at all — a donor could drive to a
 * hospital for a request closed hours ago — and getting cache invalidation
 * right is a separate project with its own risks. This file receives pushes
 * and opens the app. Nothing else.
 */

self.addEventListener("install", () => {
  // Take over immediately rather than waiting for every tab to close, so a
  // donor who just enabled notifications is actually covered.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/*
 * Present so the app can be installed to a home screen, and deliberately empty.
 *
 * Chrome has long wanted a fetch handler before it will treat a site as
 * installable, and being installable is the whole point here: Web Push works
 * in an installed progressive web app on Android with no Firebase project, no
 * Play Store listing and no APK anybody has to allow from "unknown sources".
 *
 * It does not call respondWith, so every request goes to the network exactly as
 * it would without a service worker. That is the point. The note at the top of
 * this file stands — an offline cache that served a blood request closed hours
 * ago could send a donor to a hospital for nothing, and nothing here caches
 * anything.
 */
self.addEventListener("fetch", () => {
  // No respondWith: the browser handles it.
});

self.addEventListener("push", (event) => {
  /*
   * A push with no readable payload still gets a notification.
   *
   * Browsers require that a received push results in a visible notification —
   * a silent one costs the site its permission. So a malformed payload falls
   * back to a generic message rather than throwing and being counted as
   * silent.
   */
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Qatra";
  const options = {
    body: data.body || "",
    icon: data.icon || "./favicon.png",
    badge: data.badge || "./favicon.png",
    /*
     * Tagged by request, so a second push about the same one replaces the
     * first instead of stacking. A lock screen with six notifications for one
     * patient reads as spam and gets the app muted.
     */
    tag: data.tag || "qatra",
    renotify: Boolean(data.renotify),
    // Urgent requests vibrate; everything else arrives quietly.
    requireInteraction: Boolean(data.urgent),
    data: { url: data.url || "./", requestId: data.requestId || null },
  };

  /*
   * Tell any open tab as well as showing the notification.
   *
   * A donor with the app open should see the new request appear in the list
   * rather than being told about something that is not on screen. It also
   * makes the delivery observable from a test, which is otherwise impossible:
   * nothing in the page can see a notification the worker displayed.
   */
  const announce = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) {
        client.postMessage({ type: "qatra:push", title, body: options.body, requestId: options.data.requestId });
      }
    });

  event.waitUntil(Promise.all([self.registration.showNotification(title, options), announce]));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.origin + self.registration.scope).href;

  /*
   * Reuse an open tab rather than opening a second one. Someone who already
   * has Qatra open and taps a notification should land on the request, not
   * acquire a duplicate window they then have to tidy up.
   */
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.registration.scope) && "focus" in client) {
          client.postMessage({ type: "qatra:navigate", url: target, requestId: event.notification.data?.requestId });
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
