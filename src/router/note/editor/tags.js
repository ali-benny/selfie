import { SERVER_URL } from '@/const'

export async function getTags() {
  const response = await fetch(SERVER_URL + '/tags', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    return response.json()
  } else {
    console.error('ERROR: getTags')
    return []
  }
}

export async function createTag(tag) {
  const response = await fetch(SERVER_URL + '/tags', {
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