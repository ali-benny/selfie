import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import ImageTool from '@editorjs/image'
import AttachesTool from '@editorjs/attaches'
import CodeTool from '@editorjs/code'
import Table from '@editorjs/table'
import Link from '@editorjs/link'
import LinkAutocomplete from '@editorjs/link-autocomplete'
import { SERVER_URL } from '@/const'

/**
 * note's title to be displayed into the editor
 */
let title = ''

export function getEditNoteTitle() {
  // console.log('GETtitle: ' + title)
  return title
}

export function getEditNoteId() {
  const searchParams = new URLSearchParams(window.location.search)
  // console.log('note ID: ' + searchParams.get('edit'))
  return searchParams?.get('edit')
}

/**
 * Searching on mongodb note data by note ID from the searchParams object
 *
 * @return {EditorJS.data} | {}
 */
async function getEditNoteData() {
  const noteId = getEditNoteId()
  let noteData = {}
  if (noteId) {
    const response = await fetch(SERVER_URL + '/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: noteId
      })
    })
    if (response.ok) {
      noteData = await response.json()
      title = noteData.name
      return noteData.data
    }
  }
  return noteData
}

/**
 * Initialize the EditorJS with all tools choosen
 *
 * @see getEditNoteData for import existed data
 *
 * @export
 */
export async function initializeEditor() {
  const edit_note = await getEditNoteData()
  const editor = new EditorJS({
    holder: 'editorjs',
    // inlineToolbar: ['link', 'marker', 'bold', 'italic'],
    data: edit_note,
    tools: {
      header: {
        class: Header,
        levels: [1, 2, 3, 4, 5],
        defaultLevel: 3,
        shortcut: 'CMD+SHIFT+H'
      },
      text: {
        class: Text,
        inlineToolbar: true
      },
      list: List,
      paragraph: {
        class: Paragraph,
        inlineToolbar: true
      },
      image: {
        class: ImageTool,
        config: {
          endpoints: {
            byFile:
              'http://localhost/phppot/javascript/create-web-text-editor-javascript/ajax-endpoint/upload.php',
            byUrl:
              'http://localhost/phppot/javascript/create-web-text-editor-javascript/ajax-endpoint/upload.php'
          }
        }
      },
      attaches: {
        class: AttachesTool,
        config: {
          endpoint:
            'http://localhost/phppot/javascript/create-web-text-editor-javascript/ajax-endpoint/upload.php'
        }
      },
      code: {
        class: CodeTool,
        shortcut: 'CMD+SHIFT+C'
      },
      table: {
        class: Table,
        inlineToolbar: true
      },
      link: {
        class: Link,
        config: {
          endpoint:
            'http://localhost/phppot/javascript/create-web-text-editor-javascript/ajax-endpoint/fetch-url-metadata.php'
        }
      },
      link: {
        class: LinkAutocomplete,
        config: {
          endpoint: '/',
          queryParam: 'search'
        }
      }
    }
  })
  return editor
}
