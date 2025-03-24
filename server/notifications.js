import webPush from 'web-push'
import { loadWebPushSubscriptions } from './notification/webpush.js'

/**
 * Sends notifications to all web push subscriptions associated with a user
 * @param {string} user - The ID of the user to send notifications to
 * @param {Object} options - Notification options
 * @returns {Promise<void>} A promise that resolves when all notifications are processed
 * @throws {Error} If there's an error loading subscriptions from the database
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Notification/Notification#options|MDN Notification Options}
 */
export async function sendNotification(user, options) {
  try {
    const subscriptions = await loadWebPushSubscriptions(user)

    // notifiche a tutte le subscriptions dell'utente a batch di 5 alla volta
    const BATCH_SIZE = 5
    for (let i = 0; i < subscriptions.length; i += BATCH_SIZE) {
      const batch = subscriptions.slice(i, i + BATCH_SIZE)

      await Promise.allSettled(
        batch.map(async (s) => {
          const subscription = { endpoint: s.endpoint, keys: s.keys }
          try {
            await webPush.sendNotification(subscription, JSON.stringify({ options }))
          } catch (error) {
            console.error(`ERROR for ${subscription.endpoint}:`, error.message)
            // TODO: decidere se eliminare la subscription
            // await s.deleteOne()
          }
        })
      )
    }
  } catch (error) {
    console.error('Error in sendNotification:', error)
    throw error
  }
}
