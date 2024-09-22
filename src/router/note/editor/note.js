import { SERVER_URL } from '@/const'
// TODO: non so dove, ma le note sono identificate in base al titolo e non all'id -> questo crea problemi quando cambio titolo ad una nota [ne genera una nuova]
/**
 * Using mongodb API to save note actual status
 *
 * @export
 * @param {*} id note
 * @param {*} filename note title
 * @param {*} data note contents
 */
export async function saveNoteMongo(id, filename, data) {
  const response = await fetch(SERVER_URL + '/save', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id: id,
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
