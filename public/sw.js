// LabMate360 Service Worker for Push Notifications
self.addEventListener('push', (event) => {
    let data = { title: 'LabMate360', body: 'You have a new notification' };

    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: data.icon || '/labmate-icon.png',
        badge: data.badge || '/labmate-badge.png',
        vibrate: [100, 50, 100],
        data: {
            url: data.url || '/',
            timestamp: data.timestamp
        },
        actions: [
            { action: 'open', title: 'View' },
            { action: 'dismiss', title: 'Dismiss' }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    const url = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // Focus existing window if available
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(url);
                    return client.focus();
                }
            }
            // Open new window
            return clients.openWindow(url);
        })
    );
});
