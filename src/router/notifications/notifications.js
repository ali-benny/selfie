import { API_URL } from '@/const.js'

export async function sendPomodoroAlert(user, title, message) {
  try {
    const response = await fetch(`${API_URL}/${user._id}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        isAlertOnly: true,
        kind: 'alert',
        user: user._id,
        title: title,
        message: message,
        alertKind: 'pomodoro',
        created: Date.now()
      })
    })
    if (!response.ok) throw new Error()
  } catch (err) {
    console.error(err)
  }
}

export async function sendPomodoroInvitation(user, sender, pomodoro) {
  try {
    const response = await fetch(`${API_URL}/${user._id}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'invitation',
        sender: sender._id,
        invitation: {
          kind: 'pomodoro',
          pomodoro: pomodoro
        },
        created: Date.now()
      })
    })
    if (!response.ok) throw new Error()
  } catch (err) {
    console.error(err)
  }
}

export async function sendChatMessage(recipient, sender, message) {
  try {
    const response = await fetch(`${API_URL}/${recipient._id}/notifications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind: 'chat',
        created: Date.now(),
        sender: sender._id,
        message: message
      })
    })
    if (!response.ok) throw new Error()
  } catch (err) {
    console.error(err)
  }
}
