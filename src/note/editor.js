import EditorJS from '@editorjs/editorjs'
import Header from '@editorjs/header'
import List from '@editorjs/list'
import Paragraph from '@editorjs/paragraph'

export function initializeEditor() {
  const editor = new EditorJS({
    holder: 'editorjs',
    // inlineToolbar: ['link', 'marker', 'bold', 'italic'],
    inlineToolbar: true,
    tools: {
      header: {
        class: Header,
        levels: [1, 2, 3, 4, 5],
        defaultLevel: 3,
        shortcut: 'CMD+SHIFT+H'
      },
      list: List,
      paragraph: {
        class: Paragraph,
        inlineToolbar: true
      }
    }
  })
}
