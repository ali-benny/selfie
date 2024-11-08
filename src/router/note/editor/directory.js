import { API_URL } from '~/const'
import { saveNoteMongo } from './note'

// Get directory structure
export async function getDirectoryStructure(userId) {
  const response = await fetch(`${API_URL}/users/${userId}/directories`)
  const directories = await response.json()
  return buildTreeStructure(directories)
}

// Create new directory
export async function createDirectory(name, parentId, author) {
  const id = name.toLowerCase().replace(/\s+/g, '-')
  const response = await fetch(`${API_URL}/directories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id,
      name,
      parentDirectory: parentId,
      author
    })
  })
  return response.json()
}

// Move note to directory
export async function moveNote(noteId, directoryId) {
  try {
    await saveNoteMongo({
      id: noteId,
      directory: directoryId
    })
    
    return true // Return success instead of checking response
  } catch (error) {
    console.error('Error moving note:', error)
    throw error
  }
}

// Build tree structure from flat directory array
function buildTreeStructure(directories) {
  const dirMap = new Map()
  const tree = []

  // Add root
  dirMap.set('root', {
    _id: 'root',
    name: 'All Notes',
    children: []
  })

  // Create map of all directories
  directories.forEach((dir) => {
    dirMap.set(dir._id, {
      ...dir,
      children: []
    })
  })

  // Build tree structure
  directories.forEach((dir) => {
    if (dir.parentDirectory) {
      const parent = dirMap.get(dir.parentDirectory)
      if (parent) {
        parent.children.push(dirMap.get(dir._id))
      }
    } else {
      dirMap.get('root').children.push(dirMap.get(dir._id))
    }
  })

  return dirMap.get('root')
}
