import webPush from 'web-push'
import { loadWebPushSubscriptions } from './webpush.js'

/**
 * @param {any} user
 * @param {any} options
 * @throws
 */
export function sendNotification(user, options) {
  loadWebPushSubscriptions(user)
    .then(async (subscriptions) => {
      await Promise.all(
        subscriptions.map(async (s) => {
          const subscription = { endpoint: s.endpoint, keys: s.keys }
          try {
            console.log(options)
            await webPush.sendNotification(
              subscription,
              JSON.stringify({ options: { ...options } })
            )
          } catch (error) {
            console.error(`ERROR for ${subscription.endpoint}: `, error.message)
            // TODO: elimino subscription che causa errore ??
            // await s.deleteOne()
          }
        })
      )
    })
    .catch((e) => {
      throw e
    })
}
