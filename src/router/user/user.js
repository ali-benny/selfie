import { API_URL } from '../../../const'

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
