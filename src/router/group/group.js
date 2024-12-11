// Group Structure:
// - name
// - owner
// - description
// - members

import { API_URL } from '~/const'

export async function getGroups(userId) {
  const res = await fetch(`${API_URL}/group/${userId}/groups`)
  return res.json()
}

export async function updateGroup(group) {
  const res = await fetch(`${API_URL}/group/${group._id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(group)
  })
  return res.json()
}