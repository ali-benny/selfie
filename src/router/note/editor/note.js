import { SERVER_URL } from '@/const'
// TODO: non so dove, ma le note sono identificate in base al titolo e non all'id -> questo crea problemi quando cambio titolo ad una nota [ne genera una nuova]
/**
 * Using mongodb API to save note actual status
 *
 * @export
 * @param {*} id 
 * @param {*} filename === note title
 * @param {*} data note body contents
 * @param {*} tags note category tags
 */
export async function saveNoteMongo(id, filename, data, tags) {
  const response = await fetch(SERVER_URL + '/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: id,
      filename: filename,
      data: data,
      tags: tags
    })
  })

  if (response.ok) {
    console.log('Note saved successfully')
  } else {
    console.error('Failed to save note')
  }
}

export function deletedNoteMongo(filename, data) {}

/**
 * Using mongodb API to get all the notes
 *
 * @export
 */
export async function getNotes() {
  const response = await fetch(SERVER_URL + '/find', {
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

export async function getNoteTags(noteId) {
  const response = await fetch(`${SERVER_URL}/notes/${noteId}/tags`)
  if (response.ok) {
    return await response.json()
  } else {
    console.error('Failed to fetch tags')
    return []
  }
}