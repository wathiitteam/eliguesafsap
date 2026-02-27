self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Quartier FC", body: event.data.text() };
  }

  const title = payload.title || "Quartier FC";
  const options = {
    body: payload.body || "Nouvelle notification.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clientsArr) => {
      const hadWindow =
        clientsArr.find((client) => client.url.includes(url)) ?? null;
      if (hadWindow) {
        hadWindow.focus();
      } else {
        self.clients.openWindow(url);
      }
    })
  );
});

