// --- SERVICE WORKER FOR ANDROID NOTIFICATION CHANNELS ---

self.addEventListener('push', function(event) {
    let data = { title: 'CityConnect Update', body: 'Nayi dukan ya order ki jankari!' };
    
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data.body = event.data.text();
        }
    }

    const options = {
        body: data.body,
        icon: 'logo.png',
        badge: 'logo.png',
        vibrate: [200, 100, 200],
        // Android settings mein alag category banane ke liye unique tags use hote hain
        tag: data.tag || 'cityconnect-alerts', 
        renotify: true,
        data: { url: self.location.origin }
    };

    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});

// Notification par click karne par app khule
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
