/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

declare let self: ServiceWorkerGlobalScope

// Injetado pelo vite-plugin-pwa (injectManifest) no build: precache do app shell.
precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Fotos de execução dos exercícios (jsDelivr — ver src/lib/catalog/media.ts): cache-first,
// 30 dias — uso offline no treino (RF20). 873 exercícios × 2 fotos: maxEntries generoso
// pra caber o catálogo inteiro sem expirar entradas em uso.
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.hostname === 'cdn.jsdelivr.net',
  new CacheFirst({
    cacheName: 'exercise-media',
    plugins: [new ExpirationPlugin({ maxEntries: 2000, maxAgeSeconds: 30 * 24 * 60 * 60 })],
  }),
)

// Avatares e demais imagens remotas: stale-while-revalidate.
registerRoute(
  ({ request, url }) => request.destination === 'image' && url.hostname !== 'cdn.jsdelivr.net',
  new StaleWhileRevalidate({ cacheName: 'images' }),
)

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// ---- Web Push (RF15/RF16): refeições e lembretes de treino agendados pelo backend ----
interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
}

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return
  let payload: PushPayload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'Treinei', body: event.data.text() }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      tag: payload.tag ?? 'treinei-generic',
      data: { url: payload.url ?? '/' },
    }),
  )
})

// Deep-link: clique na notificação abre (ou foca) a aba correta do app.
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close()
  const targetUrl = (event.notification.data as { url?: string } | undefined)?.url ?? '/'

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      const existing = allClients.find((c) => c.url.includes(self.location.origin))
      if (existing) {
        await existing.focus()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(existing as WindowClient).navigate?.(targetUrl)
        return
      }
      await self.clients.openWindow(targetUrl)
    })(),
  )
})

// Safari/Chrome podem invalidar a subscription silenciosamente — re-inscrever e
// deixar a próxima sincronização do app enviar a nova subscription ao backend.
interface PushSubscriptionChangeEvent extends ExtendableEvent {
  oldSubscription?: PushSubscription
  newSubscription?: PushSubscription
}

self.addEventListener('pushsubscriptionchange', ((event: PushSubscriptionChangeEvent) => {
  event.waitUntil(
    (async () => {
      const options = event.oldSubscription?.options ?? { userVisibleOnly: true }
      const newSub = await self.registration.pushManager.subscribe(options)
      const clients = await self.clients.matchAll()
      clients.forEach((c) => c.postMessage({ type: 'push-subscription-renewed', subscription: newSub.toJSON() }))
    })(),
  )
}) as EventListener)
