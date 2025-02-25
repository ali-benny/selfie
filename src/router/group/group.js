// Group Structure:
// - name
// - owner
// - description
// - members

import { API_URL } from '~/const'

export async function getGroups(userId) {
  try {
    const res = await fetch(`${API_URL}/${userId}/groups`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("Error fetching groups:", error);
    return []
  }
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