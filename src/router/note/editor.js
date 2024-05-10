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

export function initializeEditor() {
  const editor = new EditorJS({
    holder: 'editorjs',
    // inlineToolbar: ['link', 'marker', 'bold', 'italic'],
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
}
