// Group Structure:
// - name
// - owner
// - description
// - members

import { API_URL } from '@/const.js'

export async function getGroups(userId) {
  try {
    const res = await fetch(`${API_URL}/${userId}/groups`)
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }
    return await res.json()
  } catch (error) {
    console.error('Error fetching groups:', error)
    return []
  }
}

export async function getUsersByIds(userIds) {
  // Ensure userIds is an array and contains only valid IDs
  if (!Array.isArray(userIds) || userIds.length === 0) {
    console.warn('getUsersByIds called with invalid or empty userIds', userIds)
    return {}
  }

  const validUserIds = userIds.filter((id) => id && typeof id === 'string')
  if (validUserIds.length === 0) {
    return {}
  }

  try {
    const queryParams = new URLSearchParams()
    validUserIds.forEach((id) => queryParams.append('ids', id))

    const response = await fetch(`${API_URL}/users/byIds?${queryParams.toString()}`)

    if (!response.ok) {
      console.error('Error fetching users by IDs:', response.status)
      return {}
    }

    const data = await response.json()

    // If data is already an object keyed by ID, return it as is
    if (!Array.isArray(data) && typeof data === 'object') {
      return data
    }

    // If it's an array, convert to object keyed by ID
    if (Array.isArray(data)) {
      const usersById = {}
      data.forEach((user) => {
        if (user && user._id) {
          usersById[user._id] = user
        }
      })
      return usersById
    }

    return {}
  } catch (error) {
    console.error('Error in getUsersByIds:', error)
    return {}
  }
}

export async function updateGroup(group) {
  if (!group || !group._id) {
    throw new Error('Invalid group object provided to updateGroup')
  }

  try {
    const response = await fetch(`${API_URL}/group/${group._id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(group)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error updating group: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error in updateGroup:', error)
    throw error // Re-throw to handle in the component
  }
}

export async function getGroupById(groupId) {
  if (!groupId) {
    throw new Error('Invalid group ID')
  }

  try {
    const response = await fetch(`${API_URL}/group/${groupId}`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Error fetching group: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error in getGroupById:', error)
    throw error // Re-throw to handle in the component
  }
}
