self.addEventListener('push', function (event) {
  let data = {
    title: 'Nová online rezervace',
    body: 'V aplikaci čeká nová rezervace.',
    url: '/reservations'
  }

  if (event.data) {
    try {
      data = event.data.json()
    } catch (error) {
      data.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Nová online rezervace',
      {
        body: data.body || 'V aplikaci čeká nová rezervace.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        data: {
          url: data.url || '/reservations'
        }
      }
    )
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url =
    event.notification.data && event.notification.data.url
      ? event.notification.data.url
      : '/reservations'

  event.waitUntil(
    clients.openWindow(url)
  )
})
