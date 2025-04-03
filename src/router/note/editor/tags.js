import { API_URL } from '@/const.js'

export async function getTags() {
  try {
    const response = await fetch(
      API_URL + `/user/${JSON.parse(localStorage.getItem('loggedUser'))._id}/tags`
    )
    if (!response.ok) {
      throw new Error('Errore nel recupero dei tag della nota')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error(error.message)
  }
}

export async function createTag(id, tag) {
  const response = await fetch(API_URL + '/' + id + '/tags', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ tag })
  })

  if (response.ok) {
    console.log('Tag created successfully')
  } else {
    console.error('Failed to create tag')
  }
}
