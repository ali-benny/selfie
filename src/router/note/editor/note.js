import { API_URL } from '../../../../const'
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
  const method = id == null ? 'POST' : 'PUT'
  const endpoint = id == null ? `/notes` : `/notes/${id}`

  const response = await fetch(API_URL + endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      filename: filename,
      data: data,
      tags: tags
    })
  })

  if (response.ok) {
    const responseData = await response.json()
    console.log('Note saved successfully')
    return responseData._id
  } else {
    console.error('Failed to save note')
    return id ? id : null
  }
}

/**
 * Deletes a note from MongoDB by its ID.
 *
 * @param {string} id - The ID of the note to be deleted.
 * @returns {Promise<void>} A promise that resolves when the note is deleted.
 */
export async function deleteNote(id) {
  const response = await fetch(API_URL + `/notes/${id}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    console.log('Note deleted successfully')
  } else {
    console.error('Failed to delete note')
  }
}

/**
 * Using mongodb API to get all the notes
 *
 * @export
 */
export async function getNotes() {
  const response = await fetch(API_URL + '/notes', {
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
  const response = await fetch(`${API_URL}/${noteId}/tags`)
  if (response.ok) {
    return await response.json()
  } else {
    console.error('Failed to fetch tags')
    return []
  }
}
