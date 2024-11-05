import { API_URL } from '~/const'

/**
 * Fetches the list of users from the API.
 *
 * @async
 * @function getUsers
 * @returns {Promise<Object[]>} array of user objects.
 * @throws Will log an error message if the fetch request fails.
 */
export async function getUsers() {
  const response = await fetch(API_URL + '/users', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    return response.json()
  } else {
    console.error('ERROR: getUsers')
  }
}

/**
 * Creates a new user by sending a POST request to the API.
 *
 * @param {Object} userData - The data of the user to be created.
 * @param {string} userData.name - The name of the user.
 * @param {string} userData.email - The email of the user.
 * @param {string} userData.password - The password of the user.
 * @returns {Promise<Object>} The created user data.
 * @throws Will throw an error if the user creation fails.
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to create user')
      throw new Error('Failed to create user')
    }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

/**
 * Fetches a user by their ID.
 *
 * @param {string} userId - The ID of the user to fetch.
 * @returns {Promise<Object>} A promise that resolves to the user data.
 * @throws Will throw an error if the fetch operation fails.
 */
export const getUserById = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to fetch user by ID')
      throw new Error('Failed to fetch user by ID')
    }
  } catch (error) {
    console.error('Error fetching user by ID:', error)
    throw error
  }
}

/**
 * Fetches user details for the given array of user IDs.
 *
 * @param {Array<string>} userIds - An array of user IDs to fetch details for.
 * @returns {Promise<Object>} A promise that resolves to an object containing user details keyed by user ID.
 * @throws Will log an error message if fetching a user fails.
 */
export async function getUsersByIds(userIds) {
  const users = {}
  for (const userId of userIds) {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      const user = await response.json()
      users[userId] = user
    } else {
      console.error(`Failed to fetch user with ID: ${userId}`)
    }
  }
  return users
}

export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })
    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to update user')
      throw new Error('Failed to update user')
    }
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      return await response.json()
    } else {
      console.error('Failed to delete user')
      throw new Error('Failed to delete user')
    }
  } catch (error) {
    console.error('Error deleting user:', error)
    throw error
  }
}
