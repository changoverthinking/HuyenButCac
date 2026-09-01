/* Huyền Bút Các — Web Push handler. Không chứa secret hay dữ liệu lịch rõ. */
self.addEventListener("push", (event) => {
  event.waitUntil((async () => {
    let payload = {};
    try { payload = event.data ? event.data.json() : {}; } catch { payload = {}; }
    const data = payload.data || {};
    const eventId = payload.eventId || data.eventId || "calendar";

    // Khi app đang nhìn thấy trên màn hình, giao cho runtime local hiển thị notification
    // có tiêu đề/ghi chú đã giải mã, tránh Web Push generic ghi đè notification local.
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const visible = windows.filter((client) => client.visibilityState === "visible");
    if (visible.length > 0) {
      visible.forEach((client) => client.postMessage({ type: "hbc-calendar-push-due", eventId }));
      return;
    }

    const options = {
      body: payload.body || "Bạn có một lịch hẹn đến thời gian đã đặt. Chạm để mở chi tiết.",
      tag: payload.tag || `hbc-calendar-${eventId}`,
      renotify: false,
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
      data: { ...data, eventId, url: data.url || payload.url || "?mode=calendar" },
    };
    await self.registration.showNotification(payload.title || "⏰ Huyền Bút Các · Lịch đến hạn", options);
    try { if (self.navigator && typeof self.navigator.setAppBadge === "function") await self.navigator.setAppBadge(1); } catch { /* tùy nền tảng */ }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const relative = event.notification.data?.url || "?mode=calendar";
    const target = new URL(relative, self.registration.scope).href;
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of windows) {
      if ("focus" in client) {
        await client.focus();
        if ("navigate" in client) await client.navigate(target);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(target);
  })());
});
