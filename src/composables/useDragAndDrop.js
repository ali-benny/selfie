import { ref, computed } from 'vue'

/**
 * Composable per gestire drag & drop degli eventi del calendario
 */
export function useCalendarDragDrop(calendarStore) {
  const isDragging = ref(false)
  const draggedEvent = ref(null)
  const draggedEventData = ref(null)
  const dropZoneDate = ref(null)
  // Stato per visual feedback
  const dragOffset = ref({ x: 0, y: 0 })
  const dragPosition = ref({ x: 0, y: 0 })
  const dragGhost = ref(null)
  /**
   * Crea elemento ghost per visual feedback
   */
  const createDragGhost = (originalElement, eventData, mouseEvent) => {
    // Rimuovi ghost precedente se esiste
    removeDragGhost()

    // Crea clone dell'elemento
    const ghost = originalElement.cloneNode(true)
    ghost.id = 'drag-ghost'
    ghost.style.position = 'fixed'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    ghost.style.opacity = '0.8'
    ghost.style.transform = 'scale(1.05)'
    ghost.style.boxShadow = '0 8px 16px rgba(0,0,0,0.3)'

    // Posiziona immediatamente alla posizione corretta del mouse
    ghost.style.left = `${dragPosition.value.x}px`
    ghost.style.top = `${dragPosition.value.y}px`

    document.body.appendChild(ghost)
    dragGhost.value = ghost
  }

  /**
   * Rimuove elemento ghost
   */
  const removeDragGhost = () => {
    if (dragGhost.value) {
      document.body.removeChild(dragGhost.value)
      dragGhost.value = null
    }
  } /**
   * Inizia il drag di un evento
   */
  const startDrag = (event, eventData, mouseEvent) => {
    isDragging.value = true
    draggedEvent.value = event
    draggedEventData.value = eventData

    // Calcola offset del mouse rispetto all'elemento
    const rect = event.getBoundingClientRect()
    dragOffset.value = {
      x: mouseEvent.clientX - rect.left,
      y: mouseEvent.clientY - rect.top
    }

    // Calcola posizione iniziale
    dragPosition.value = {
      x: mouseEvent.clientX - dragOffset.value.x,
      y: mouseEvent.clientY - dragOffset.value.y
    }

    // Aggiungi classi CSS per visual feedback
    event.classList.add('dragging')
    document.body.style.cursor = 'grabbing'
    document.body.classList.add('dragging-active')
    // Crea elemento ghost per visual feedback
    createDragGhost(event, eventData, mouseEvent)
  }
  /**
   * Aggiorna posizione durante il drag
   */
  const updateDragPosition = (mouseEvent) => {
    if (!isDragging.value) return

    dragPosition.value = {
      x: mouseEvent.clientX - dragOffset.value.x,
      y: mouseEvent.clientY - dragOffset.value.y
    }

    // Aggiorna posizione elemento ghost
    if (dragGhost.value) {
      dragGhost.value.style.left = `${dragPosition.value.x}px`
      dragGhost.value.style.top = `${dragPosition.value.y}px`
    }
  } /**
   * Termina il drag e gestisce il drop
   */
  const endDrag = async (dropDate = null) => {
    if (!isDragging.value || !draggedEventData.value) return

    try {
      // Estrai la data corrente dall'evento (da start property)
      const currentEventDate = draggedEventData.value.start
        ? new Date(draggedEventData.value.start).toISOString().split('T')[0]
        : draggedEventData.value.date || null
      // Se abbiamo una data di drop valida, sposta l'evento
      if (dropDate && dropDate !== currentEventDate) {
        // Calcola le nuove date mantenendo l'orario
        const originalStartDate = new Date(
          draggedEventData.value.start || draggedEventData.value.startDate
        )
        const originalEndDate = new Date(
          draggedEventData.value.end || draggedEventData.value.endDate
        ) // Parse della data target usando UTC
        const [year, month, day] = dropDate.split('-').map(Number)
        const newDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

        // Mantieni gli orari originali
        const newStartDate = new Date(newDate)
        newStartDate.setUTCHours(originalStartDate.getUTCHours(), originalStartDate.getUTCMinutes())
        const newEndDate = new Date(newDate)
        newEndDate.setUTCHours(originalEndDate.getUTCHours(), originalEndDate.getUTCMinutes())

        // Aggiorna l'evento con entrambi i formati per compatibilità
        const updatedEventData = {
          ...draggedEventData.value,
          start: newStartDate.toISOString(),
          end: newEndDate.toISOString(),
          startDate: newStartDate.toISOString(),
          endDate: newEndDate.toISOString(),
          date: newDate.toISOString().split('T')[0]
        }

        await calendarStore.updateExistingEvent(draggedEventData.value._id, updatedEventData)
        // Forza il refresh degli eventi
        await calendarStore.fetchCalendarItems()
      }
    } catch (error) {
      console.error('❌ Error moving event:', error)
    } finally {
      // Reset stato
      cleanup()
    }
  }
  /**
   * Pulizia stato drag
   */
  const cleanup = () => {
    if (draggedEvent.value) {
      draggedEvent.value.classList.remove('dragging')
    }

    // Rimuovi elemento ghost
    removeDragGhost()

    isDragging.value = false
    draggedEvent.value = null
    draggedEventData.value = null
    dropZoneDate.value = null
    dragOffset.value = { x: 0, y: 0 }
    dragPosition.value = { x: 0, y: 0 }
    document.body.style.cursor = ''
    document.body.classList.remove('dragging-active')
  }
  /**
   * Gestisce l'hover su una drop zone
   */
  const onDropZoneEnter = (date) => {
    if (isDragging.value) {
      dropZoneDate.value = date
    }
  }
  /**
   * Gestisce l'uscita da una drop zone
   */
  const onDropZoneLeave = () => {
    dropZoneDate.value = null
  }

  /**
   * Gestisce il drop effettivo
   */
  const onDrop = async (date) => {
    if (isDragging.value && date) {
      await endDrag(date)
    }
  }

  // Computed per determinare se una data è una drop zone valida
  const isValidDropZone = computed(() => (date) => {
    if (!isDragging.value || !draggedEventData.value) return false
    return date !== draggedEventData.value.date
  })

  // Computed per determinare se una data è evidenziata
  const isDropZoneHighlighted = computed(() => (date) => {
    return dropZoneDate.value === date && isDragging.value
  })

  return {
    // State
    isDragging,
    draggedEvent,
    draggedEventData,
    dropZoneDate,
    dragPosition,
    // Actions
    startDrag,
    updateDragPosition,
    endDrag,
    cleanup,
    onDropZoneEnter,
    onDropZoneLeave,
    onDrop,
    // Computed
    isValidDropZone,
    isDropZoneHighlighted
  }
}
