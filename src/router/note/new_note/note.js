import { SERVER_URL } from '@/const';

export async function saveNoteMongo(filename, data) {
  const response = await fetch(SERVER_URL+'/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: filename,
      data: data
    })
  })

  if (response.ok) {
    console.log('Note saved successfully')
  } else {
    console.error('Failed to save note')
  }
} 

export function deletedNoteMongo(filename, data) {}

export async function getNotes(){
  const response = await fetch(SERVER_URL+'/find', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    return response.json()
  } else {
    console.error('ERROR: getNotes')
  }
}