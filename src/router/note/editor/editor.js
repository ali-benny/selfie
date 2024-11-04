import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'
import ImageTool from '@editorjs/image'
import AttachesTool from '@editorjs/attaches'
import CodeTool from '@editorjs/code'
import Table from '@editorjs/table'
import Link from '@editorjs/link'
import Checklist from '@editorjs/checklist'
import { API_URL } from '../../../../const.js'
import { MDParser, MDImporter } from 'editorjs-md-parser'

/**
 * note's title to be displayed into the editor
 */
export async function getEditNoteTitle() {
  const noteId = getEditNoteId()
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
      return noteData.name
    }
  }
  return ''
}

export function getEditNoteId() {
  const searchParams = new URLSearchParams(window.location.search)
  return searchParams?.get('edit')
}

/**
 * Searching on mongodb note data by note ID from the searchParams object
 *
 * @return {EditorJS.data} | {}
 */
export async function getEditNoteData() {
  const noteId = getEditNoteId()
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
    autofocus: true,
    theme: 'dark',
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
      checklist: {
        class: Checklist,
        inlineToolbar: true
      },
      paragraph: {
        class: Paragraph,
        inlineToolbar: true
      },
      image: {
        class: ImageTool,
        config: {
          endpoints: {
            byFile: API_URL + '/upload'
          },
          uploader: {
            async uploadByFile(file) {
              try {
                console.log('Iniziando upload del file:', file.name)

                const response = await fetch(API_URL + '/upload', {
                  method: 'POST',
                  body: file,
                  headers: {
                    'Content-Type': file.type
                  }
                })

                const result = await response.json()
                console.log('Risposta ricevuta:', result)

                if (!result.success) {
                  throw new Error(result.message || 'Upload fallito')
                }

                return {
                  success: 1,
                  file: {
                    url: result.file.url
                  }
                }
              } catch (error) {
                console.error('Errore durante upload:', error)
                return {
                  success: 0,
                  message: error.message
                }
              }
            }
          }
        }
      },
      attaches: {
        class: AttachesTool,
        config: {
          endpoint: API_URL + '/upload'
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
          endpoint: API_URL + '/fetchUrl'
        }
      },
      markdownParser: {
        class: MDParser,
        config: {
          filename: 'test',
          timestamp: true,
          callback: (blocksData) => {
            console.log('Callback MDParser', blocksData)
          }
        }
      },
      markdownImporter: {
        class: MDImporter,
        config: {
          append: true,
          extensions: ['md', 'txt'],
          callback: (blocksData) => {
            console.log('Callback MDImporter', blocksData)
          }
        }
      }
    }
  })
  return editor
}
