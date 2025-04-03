import { getUsersByIds } from '@/router/user/user'
import { API_URL } from '@/const.js'

// TODO: non so dove, ma le note sono identificate in base al titolo e non all'id -> questo crea problemi quando cambio titolo ad una nota [ne genera una nuova]
/**
 * Using mongodb API to save note actual status
 *
 * @export
 * @param {*} id
 * @param {*} filename === note title
 * @param {*} data note body contents
 * @param {*} tags note category tags
 * @param {*} author note author
 * @param {*} reader id users who can read/edit the note
 */
export async function saveNoteMongo({
  id = null,
  filename,
  data,
  tags,
  author,
  readers,
  directory
} = {}) {
  const method = id == null ? 'POST' : 'PUT'
  const endpoint = id == null ? `/notes` : `/notes/${id}`

  // Creazione del body della richiesta con solo i campi definiti
  const body = { filename, data, tags, author, readers, directory }

  // Rimuovi i campi undefined
  Object.keys(body).forEach((key) => body[key] === undefined && delete body[key])

  const response = await fetch(API_URL + endpoint, {
    method: method,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
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
 * @param id author id
 *
 * @export
 */
export async function getNotes(id) {
  const response = await fetch(API_URL + `/${id}/notes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    return await response.json()
  } else {
    console.error('ERROR: getNotes')
  }
}

/**
 * Retrieves a note by its ID from the MongoDB API.
 *
 * @param {string} id - The ID of the note to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the note data
 */
export async function getNoteById(noteId) {
  let noteData = {}
  if (noteId) {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (response.ok) {
      noteData = await response.json()
      return noteData
    }
  }
  return noteData
}

/**
 * Get struct for a specific note id
 *
 * @param {*} id note id
 * @return note struct {name: String, data: Object, date: Date, author: String, readers: [String], tags: Object}
 */
export async function getNoteAuthor(id) {
  const response = await fetch(API_URL + `/notes/${id}/author`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Error - getting readers note')
  }
  const author = await response.json()
  const verbose = await fetch(`${API_URL}/users/${author}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (verbose.ok) {
    return await verbose.json()
  } else {
    console.error(`Failed to fetch user with ID: ${author}`)
  }
}

/**
 * Fetches the tags associated with a specific note.
 *
 * @param {string} noteId - The ID of the note for which to fetch tags.
 * @returns {Promise<Array>} A promise that resolves to an array of tags.
 * @throws Will log an error message and return an empty array if the fetch operation fails.
 */
export async function getNoteTags(noteId) {
  const response = await fetch(`${API_URL}/${noteId}/tags`)
  if (response.ok) {
    return await response.json()
  } else {
    console.error('Failed to fetch tags')
    return []
  }
}

/**
 * Fetches the readers of a note by its ID.
 *
 * @param {string} id - The ID of the note.
 * @returns {Promise<Array>} A promise that resolves to an array of user objects who have read the note.
 * @throws {Error} Throws an error if the fetch request fails.
 */
export async function getReaders(id) {
  const response = await fetch(API_URL + `/notes/${id}/readers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Error - getting readers note')
  }
  const note_readers = await response.json()
  return await getUsersByIds(note_readers)
}

/**
 * Fetches the readers of a note by its ID.
 *
 * @param {string} id - The ID of the note.
 * @returns {Promise<Array>} A promise that resolves to a readers Array [] with ids
 * @throws {Error} Throws an error if the fetch request fails.
 */
export async function getReadersIds(id) {
  const response = await fetch(API_URL + `/notes/${id}/readers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  if (!response.ok) {
    throw new Error('Error - getting readers note')
  }
  return await response.json()
}

/**
 * Saves a todo item to MongoDB.
 *
 * @param {Object} todo - The todo item to save.
 * @param {string} todo.text - The text of the todo item.
 * @param {boolean} todo.checked - The checked status of the todo item.
 * @param {string} todo.author - The author of the todo item.
 * @param {string} todo.reader - The reader of the todo item.
 * @param {string} todo.from - The source of the todo item.
 * @returns {Promise<void>} A promise that resolves when the todo item is saved.
 * @throws Will throw an error if the request fails.
 */
export async function saveTodoMongo(todo) {
  const response = await fetch(API_URL + '/todo', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: todo.text,
      checked: todo.checked,
      author: todo.author,
      reader: todo.reader,
      from: todo.from
    })
  })

  if (response.ok) {
    await response.json()
    console.log('Todo saved successfully')
  } else {
    console.error('Failed to save todo')
  }
}
