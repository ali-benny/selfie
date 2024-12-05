// Group Structure:
// - name
// - owner
// - description
// - members

import { API_URL } from "~/const"

export async function getGroups(userId) {
  const res = await fetch(`${API_URL}/group/${userId}/groups`)
  return res.json()
}