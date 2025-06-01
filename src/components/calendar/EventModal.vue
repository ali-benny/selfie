<template>
  <div v-if="isVisible" class="modal modal-open">
    <div class="modal-box max-w-2xl">
      <!-- Header Modal -->
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-base-content">
          {{ isEditing ? 'Modifica Evento' : 'Nuovo Evento' }}
        </h2>
        <button @click="closeModal" class="btn btn-sm btn-ghost btn-circle">
          <Icon icon="fluent:dismiss-24-filled" />
        </button>
      </div>

      <!-- Form Evento -->
      <form @submit.prevent="saveEvent" class="space-y-4">
        <!-- Titolo -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Titolo *</span>
          </label>
          <input
            v-model="formData.title"
            type="text"
            class="input input-bordered"
            placeholder="Inserisci il titolo dell'evento"
            required
          />
        </div>

        <!-- Data e Tutto il giorno -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Data *</span>
            </label>
            <input
              v-model="formData.date"
              type="date"
              class="input input-bordered"
              required
            />
          </div>
          
          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Tutto il giorno</span>
              <input
                v-model="formData.allDay"
                type="checkbox"
                class="checkbox checkbox-primary"
              />
            </label>
          </div>
        </div>        <!-- Orari (se non tutto il giorno) -->
        <div v-if="!formData.allDay" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Ora inizio</span>
            </label>
            <input
              v-model="formData.startTime"
              type="time"
              class="input input-bordered"
            />
          </div>
          
          <div class="form-control">
            <label class="label">
              <span class="label-text">Ora fine</span>
            </label>
            <input
              v-model="formData.endTime"
              type="time"
              class="input input-bordered"
            />
          </div>
        </div>

        <!-- Durata alternativa -->
        <div v-if="!formData.allDay && !formData.endTime" class="form-control">
          <label class="label">
            <span class="label-text">Durata (minuti)</span>
          </label>
          <input
            v-model="formData.duration"
            type="number"
            min="15"
            step="15"
            class="input input-bordered"
            placeholder="60"
          />
        </div>        <!-- Descrizione -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Descrizione</span>
          </label>
          <textarea
            v-model="formData.description"
            class="textarea textarea-bordered"
            rows="3"
            placeholder="Descrizione dell'evento (opzionale)"
          ></textarea>
        </div>

        <!-- Luogo -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Luogo</span>
          </label>
          <input
            v-model="formData.location"
            type="text"
            class="input input-bordered"
            placeholder="Dove si svolge l'evento"
          />
        </div>        <!-- Invitati -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Invitati</span>
          </label>
          <div class="join w-full">
            <input
              v-model="newAttendee"
              type="email"
              class="input input-bordered join-item flex-1"
              placeholder="Aggiungi email invitato"
              @keydown.enter.prevent="addAttendee"
            />
            <button 
              type="button" 
              @click="addAttendee"
              class="btn btn-primary join-item"
              :disabled="!newAttendee"
            >
              <Icon icon="fluent:add-24-filled" />
            </button>
          </div>
          
          <!-- Lista invitati -->
          <div v-if="formData.attendees.length > 0" class="flex flex-wrap gap-2 mt-3">
            <div 
              v-for="(attendee, index) in formData.attendees"
              :key="index"
              class="badge badge-outline gap-2"
            >
              <span>{{ attendee }}</span>
              <button 
                type="button"
                @click="removeAttendee(index)"
                class="btn btn-ghost btn-xs btn-circle"
              >
                <Icon icon="fluent:dismiss-24-filled" />
              </button>
            </div>
          </div>
        </div>        <!-- Ricorrenza -->
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Evento ricorrente</span>
            <input
              v-model="formData.isRecurring"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
          </label>
        </div>        <!-- Opzioni ricorrenza -->
        <div v-if="formData.isRecurring" class="card bg-base-200">
          <div class="card-body p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Frequenza</span>
                </label>
                <select
                  v-model="formData.recurrence.frequency"
                  class="select select-bordered"
                >
                  <option value="daily">Giornaliera</option>
                  <option value="weekly">Settimanale</option>
                  <option value="monthly">Mensile</option>
                  <option value="yearly">Annuale</option>
                </select>
              </div>
              
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Ogni</span>
                </label>
                <input
                  v-model="formData.recurrence.interval"
                  type="number"
                  min="1"
                  max="30"
                  class="input input-bordered"
                />
              </div>
            </div>          <!-- Giorni settimana (per ricorrenza settimanale) -->
          <div v-if="formData.recurrence.frequency === 'weekly'" class="form-control">
            <label class="label">
              <span class="label-text">Giorni della settimana</span>
            </label>
            <div class="flex flex-wrap gap-2">
              <label 
                v-for="(day, index) in weekdays"
                :key="index"
                class="label cursor-pointer"
              >
                <input
                  v-model="formData.recurrence.daysOfWeek"
                  type="checkbox"
                  :value="index + 1"
                  class="checkbox checkbox-primary checkbox-sm"
                />
                <span class="label-text ml-2">{{ day }}</span>
              </label>
            </div>
          </div>          <!-- Fine ricorrenza -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Termina</span>
              </label>
              <select
                v-model="formData.recurrence.endType"
                class="select select-bordered"
              >
                <option value="never">Mai</option>
                <option value="after">Dopo N occorrenze</option>
                <option value="on">In data specifica</option>
              </select>
            </div>
            
            <div v-if="formData.recurrence.endType === 'after'" class="form-control">
              <label class="label">
                <span class="label-text">Occorrenze</span>
              </label>
              <input
                v-model="formData.recurrence.count"
                type="number"
                min="1"
                max="365"
                class="input input-bordered"
              />
            </div>
            
            <div v-if="formData.recurrence.endType === 'on'" class="form-control">
              <label class="label">
                <span class="label-text">Data fine</span>
              </label>
              <input
                v-model="formData.recurrence.until"
                type="date"
                class="input input-bordered"
              />
            </div>
          </div>
          </div>
        </div>        <!-- Azioni -->
        <div class="modal-action">
          <button type="button" @click="closeModal" class="btn btn-ghost">
            Annulla
          </button>
          
          <button 
            v-if="isEditing"
            type="button"
            @click="deleteEvent"
            class="btn btn-error"
            :disabled="isLoading"
          >
            <Icon icon="fluent:delete-24-filled" />
            Elimina
          </button>
          
          <button 
            type="submit"
            class="btn btn-primary"
            :disabled="isLoading || !isFormValid"
          >
            <Icon v-if="isLoading" icon="fluent:spinner-ios-20-filled" class="animate-spin" />
            <Icon v-else icon="fluent:save-24-filled" />
            {{ isLoading ? 'Salvando...' : (isEditing ? 'Salva Modifiche' : 'Crea Evento') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import { useCalendarStore } from '@/stores/calendar'

export default {
  name: 'EventModal',
  components: {
    Icon
  },
  props: {
    isVisible: {
      type: Boolean,
      default: false
    },
    event: {
      type: Object,
      default: null
    },
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['close', 'save', 'delete'],  setup(props, { emit }) {
    const calendarStore = useCalendarStore()
    const isLoading = ref(false)
    const newAttendee = ref('')

    const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom']

    // Dati form
    const defaultFormData = () => ({
      title: '',
      date: '',
      allDay: false,
      startTime: '',
      endTime: '',
      duration: 60,
      description: '',
      location: '',
      attendees: [],
      isRecurring: false,
      recurrence: {
        frequency: 'weekly',
        interval: 1,
        daysOfWeek: [],
        endType: 'never',
        count: 10,
        until: ''
      }
    })

    const formData = ref(defaultFormData())

    // Computed
    const isEditing = computed(() => !!props.event)

    const isFormValid = computed(() => {
      return formData.value.title.trim() && formData.value.date
    })    // Inizializzazione form
    const initializeForm = () => {
      console.log('Initializing form with:', { event: props.event, initialData: props.initialData })
      
      if (props.event) {
        // Modifica evento esistente
        const event = props.event
        
        // Gestione date dal backend
        let eventDate, startTime = '', endTime = ''
        
        if (event.startDate) {
          const startDate = new Date(event.startDate)
          eventDate = startDate.toISOString().split('T')[0]
          
          if (!event.allDay) {
            startTime = startDate.toTimeString().substring(0, 5)
          }
        } else if (event.date || event.dueDate) {
          // Fallback per compatibilità
          const date = new Date(event.date || event.dueDate)
          eventDate = date.toISOString().split('T')[0]
        }
        
        if (event.endDate && !event.allDay) {
          const endDate = new Date(event.endDate)
          endTime = endDate.toTimeString().substring(0, 5)
        }
        
        formData.value = {
          title: event.title || '',
          date: eventDate || new Date().toISOString().split('T')[0],
          allDay: event.allDay || false,
          startTime: startTime || event.startTime || '',
          endTime: endTime || event.endTime || '',
          duration: event.duration || 60,
          description: event.description || '',
          location: event.location || '',
          attendees: [...(event.attendees || event.invitees || [])],
          isRecurring: !!event.isRecurring,
          recurrence: {
            frequency: event.recurrenceRule?.frequency || 'weekly',
            interval: event.recurrenceRule?.interval || 1,
            daysOfWeek: [...(event.recurrenceRule?.daysOfWeek || [])],
            endType: event.recurrenceRule?.endType === 'count' ? 'after' : 
                     event.recurrenceRule?.endType === 'date' ? 'on' : 'never',
            count: event.recurrenceRule?.endCount || 10,
            until: event.recurrenceRule?.endDate ? 
              new Date(event.recurrenceRule.endDate).toISOString().split('T')[0] : ''
          }
        }
      } else {
        // Nuovo evento
        formData.value = defaultFormData()
        
        // Applica dati iniziali se presenti
        if (props.initialData?.date) {
          if (props.initialData.date instanceof Date) {
            formData.value.date = props.initialData.date.toISOString().split('T')[0]
          } else {
            formData.value.date = new Date(props.initialData.date).toISOString().split('T')[0]
          }
          console.log('Set date from initialData:', formData.value.date)
        }
        if (props.initialData?.startTime) {
          formData.value.startTime = props.initialData.startTime
          console.log('Set startTime from initialData:', formData.value.startTime)
        }
        
        // Data di default oggi se non specificata
        if (!formData.value.date) {
          formData.value.date = new Date().toISOString().split('T')[0]
          console.log('Set default date:', formData.value.date)
        }
      }
    }

    // Gestione invitati
    const addAttendee = () => {
      const email = newAttendee.value.trim()
      if (email && !formData.value.attendees.includes(email)) {
        formData.value.attendees.push(email)
        newAttendee.value = ''
      }
    }

    const removeAttendee = (index) => {
      formData.value.attendees.splice(index, 1)
    }    // Azioni
    const closeModal = () => {
      emit('close')
    }

    const saveEvent = async () => {
      if (!isFormValid.value || isLoading.value) return

      isLoading.value = true

      try {
        // Prepara le date per il backend
        const baseDate = new Date(formData.value.date)
        let startDate, endDate

        if (formData.value.allDay) {
          // Evento tutto il giorno
          startDate = new Date(baseDate)
          startDate.setHours(0, 0, 0, 0)
          
          endDate = new Date(baseDate)
          endDate.setHours(23, 59, 59, 999)
        } else {          // Evento con orari specifici
          if (formData.value.startTime) {
            const [startHours, startMinutes] = formData.value.startTime.split(':')
            startDate = new Date(baseDate)
            startDate.setHours(parseInt(startHours), parseInt(startMinutes), 0, 0)
          } else {
            // Default: inizio giornata
            startDate = new Date(baseDate)
            startDate.setHours(9, 0, 0, 0)
            // Impostiamo anche startTime esplicitamente come stringa
            formData.value.startTime = '09:00'
          }          if (formData.value.endTime) {
            const [endHours, endMinutes] = formData.value.endTime.split(':')
            endDate = new Date(baseDate)
            endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)
          } else if (formData.value.duration) {
            // Calcola endDate usando la durata
            endDate = new Date(startDate.getTime() + (parseInt(formData.value.duration) * 60000))
            // Impostiamo anche endTime esplicitamente come stringa
            const endHours = endDate.getHours().toString().padStart(2, '0')
            const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
            formData.value.endTime = `${endHours}:${endMinutes}`
          } else {
            // Default: 1 ora dopo l'inizio
            endDate = new Date(startDate.getTime() + (60 * 60000))
            // Impostiamo anche endTime esplicitamente come stringa
            const endHours = endDate.getHours().toString().padStart(2, '0')
            const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
            formData.value.endTime = `${endHours}:${endMinutes}`
          }
        }        const eventData = {
          title: formData.value.title.trim(),
          description: formData.value.description.trim(),
          location: formData.value.location.trim(),
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: formData.value.allDay ? null : formData.value.startTime,
          endTime: formData.value.allDay ? null : formData.value.endTime,
          allDay: formData.value.allDay,
          invitees: formData.value.attendees
        }

        // Aggiungi ricorrenza se attiva
        if (formData.value.isRecurring) {
          eventData.isRecurring = true
          eventData.recurrenceRule = {
            frequency: formData.value.recurrence.frequency,
            interval: parseInt(formData.value.recurrence.interval)
          }

          // Giorni settimana per ricorrenza settimanale
          if (formData.value.recurrence.frequency === 'weekly' && 
              formData.value.recurrence.daysOfWeek.length > 0) {
            eventData.recurrenceRule.daysOfWeek = formData.value.recurrence.daysOfWeek
          }

          // Fine ricorrenza
          if (formData.value.recurrence.endType === 'after') {
            eventData.recurrenceRule.endType = 'count'
            eventData.recurrenceRule.endCount = parseInt(formData.value.recurrence.count)
          } else if (formData.value.recurrence.endType === 'on') {
            eventData.recurrenceRule.endType = 'date'
            eventData.recurrenceRule.endDate = new Date(formData.value.recurrence.until).toISOString()
          } else {
            eventData.recurrenceRule.endType = 'never'          }
        }

        if (isEditing.value) {
          // Aggiorna evento esistente
          await calendarStore.updateExistingEvent(props.event._id, eventData)
        } else {
          // Crea nuovo evento
          await calendarStore.createNewEvent(eventData)
        }

        emit('save', eventData)
        closeModal()
      } catch (error) {
        console.error('Errore salvando evento:', error)
        // TODO: Mostra messaggio errore all'utente
      } finally {
        isLoading.value = false
      }
    }

    const deleteEvent = async () => {
      if (!isEditing.value || isLoading.value) return

      if (!confirm('Sei sicuro di voler eliminare questo evento?')) {
        return
      }

      isLoading.value = true

      try {
        await calendarStore.deleteExistingEvent(props.event._id)
        emit('delete', props.event)
        closeModal()
      } catch (error) {
        console.error('Errore eliminando evento:', error)
        // TODO: Mostra messaggio errore all'utente
      } finally {
        isLoading.value = false
      }
    }    // Watchers
    watch(() => props.isVisible, (newValue) => {
      if (newValue) {
        nextTick(() => {
          initializeForm()
        })
      }
    })

    watch(() => props.event, (newValue) => {
      if (props.isVisible) {
        nextTick(() => {
          initializeForm()
        })
      }
    }, { deep: true })

    watch(() => props.initialData, (newValue) => {
      if (props.isVisible && newValue) {
        nextTick(() => {
          initializeForm()
        })
      }
    }, { deep: true })

    return {
      formData,
      isLoading,
      newAttendee,
      weekdays,
      isEditing,
      isFormValid,
      addAttendee,
      removeAttendee,
      closeModal,
      saveEvent,
      deleteEvent
    }
  }
}
</script>

<style scoped>
/* Custom styles for calendar modal specific features */
.modal-box {
  scrollbar-width: thin;
  scrollbar-color: oklch(var(--bc) / 0.2) transparent;
}

.modal-box::-webkit-scrollbar {
  width: 6px;
}

.modal-box::-webkit-scrollbar-track {
  background: transparent;
}

.modal-box::-webkit-scrollbar-thumb {
  background: oklch(var(--bc) / 0.2);
  border-radius: 3px;
}

.modal-box::-webkit-scrollbar-thumb:hover {
  background: oklch(var(--bc) / 0.3);
}
</style>
