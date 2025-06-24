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
            <input v-model="formData.date" type="date" class="input input-bordered" required />
          </div>

          <div class="form-control">
            <label class="label cursor-pointer">
              <span class="label-text">Tutto il giorno</span>
              <input v-model="formData.allDay" type="checkbox" class="checkbox checkbox-primary" />
            </label>
          </div>
        </div>

        <!-- Orari (se non tutto il giorno) -->
        <div v-if="!formData.allDay" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Ora inizio</span>
            </label>
            <input v-model="formData.startTime" type="time" class="input input-bordered" />
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text">Ora fine</span>
            </label>
            <input v-model="formData.endTime" type="time" class="input input-bordered" />
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
        </div>

        <!-- Descrizione -->
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
        </div>

        <!-- Categoria -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Categoria</span>
          </label>
          <select v-model="formData.category" class="select select-bordered">
            <option
              v-for="category in calendarStore.eventCategories"
              :key="category.value"
              :value="category.value"
            >
              {{ category.icon }} {{ category.label }}
            </option>
          </select>
        </div>
        <!-- Invitati -->
        <div class="form-control">
          <label class="label">
            <span class="label-text">Invitati</span>
          </label>

          <!-- Avatar display for owner + invitees - only show if event exists and has invitees -->
          <div v-if="isEditing && formData.invitees.length > 0" class="mb-3">
            <AvatarMembers
              :owner-user="ownerUser"
              :member-users="inviteeUsers"
              variant="hover-expand"
              :show-online-status="true"
              :show-count="true"
              :display-limit="6"
              @remove-member="removeInvitee"
            >
              <template #share-button>
                <UserShare
                  v-model="formData.invitees"
                  :id="event?._id"
                  type="Event"
                  msg="Send Share Events Request"
                />
              </template>
            </AvatarMembers>
          </div>

          <!-- Share button for new events or events without invitees -->
          <div v-else class="flex items-center gap-3">
            <UserShare
              v-model="formData.invitees"
              :id="event?._id"
              type="Event"
              :msg="isEditing ? 'Invita Utenti' : 'Salva evento per invitare utenti'"
            />
            <span class="text-sm text-base-content/70">
              {{ isEditing ? 'Nessun invitato' : "Salva l'evento per poter invitare utenti" }}
            </span>
          </div>
        </div>

        <!-- Ricorrenza -->
        <div class="form-control">
          <label class="label cursor-pointer">
            <span class="label-text">Evento ricorrente</span>
            <input
              v-model="formData.isRecurring"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
          </label>
        </div>

        <!-- Opzioni ricorrenza -->
        <div v-if="formData.isRecurring" class="card bg-base-200">
          <div class="card-body p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Frequenza</span>
                </label>
                <select v-model="formData.recurrence.frequency" class="select select-bordered">
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
            </div>
            <!-- Giorni settimana (per ricorrenza settimanale) -->
            <div v-if="formData.recurrence.frequency === 'weekly'" class="form-control">
              <label class="label">
                <span class="label-text">Giorni della settimana</span>
              </label>
              <div class="flex flex-wrap gap-2">
                <label v-for="(day, index) in weekdays" :key="index" class="label cursor-pointer">
                  <input
                    v-model="formData.recurrence.daysOfWeek"
                    type="checkbox"
                    :value="index + 1"
                    class="checkbox checkbox-primary checkbox-sm"
                  />
                  <span class="label-text ml-2">{{ day }}</span>
                </label>
              </div>
            </div>
            <!-- Fine ricorrenza -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Termina</span>
                </label>
                <select v-model="formData.recurrence.endType" class="select select-bordered">
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
        </div>
        <!-- Azioni -->
        <div class="modal-action">
          <button type="button" @click="closeModal" class="btn btn-ghost">Annulla</button>

          <button
            v-if="isEditing"
            type="button"
            @click="openDeleteConfirmModal"
            class="btn btn-error"
            :disabled="isLoading"
          >
            <Icon icon="fluent:delete-24-filled" />
            Elimina
          </button>

          <button type="submit" class="btn btn-primary" :disabled="isLoading || !isFormValid">
            <Icon v-if="isLoading" icon="fluent:spinner-ios-20-filled" class="animate-spin" />
            <Icon v-else icon="fluent:save-24-filled" />
            {{ isLoading ? 'Salvando...' : isEditing ? 'Salva Modifiche' : 'Crea Evento' }}
          </button>
        </div>
      </form>
    </div>
    <!-- Modal Conferma Eliminazione -->
    <dialog id="delete_confirm_modal" class="modal">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Conferma eliminazione evento</h3>

        <!-- Info evento -->
        <div class="bg-base-200 rounded-lg p-4 mb-4">
          <div class="flex items-center gap-2 mb-2">
            <Icon icon="fluent:calendar-24-filled" class="text-primary" />
            <h4 class="font-semibold">{{ formData.title }}</h4>
          </div>

          <div class="space-y-2 text-sm">
            <!-- Data -->
            <div class="flex items-center gap-2">
              <Icon icon="fluent:calendar-day-24-regular" class="w-4 h-4 text-base-content/60" />
              <span>{{ formatEventDate() }}</span>
            </div>

            <!-- Orario (se non tutto il giorno) -->
            <div
              v-if="!formData.allDay && (formData.startTime || formData.endTime)"
              class="flex items-center gap-2"
            >
              <Icon icon="fluent:clock-24-regular" class="w-4 h-4 text-base-content/60" />
              <span>{{ formatEventTime() }}</span>
            </div>

            <!-- Categoria -->
            <div v-if="formData.category" class="flex items-center gap-2">
              <Icon icon="fluent:tag-24-regular" class="w-4 h-4 text-base-content/60" />
              <span>{{ getCategoryLabel() }}</span>
            </div>

            <!-- Luogo -->
            <div v-if="formData.location" class="flex items-center gap-2">
              <Icon icon="fluent:location-24-regular" class="w-4 h-4 text-base-content/60" />
              <span>{{ formData.location }}</span>
            </div>
            <!-- Invitati -->
            <div v-if="formData.invitees.length > 0" class="flex items-center gap-2">
              <Icon icon="fluent:people-24-regular" class="w-4 h-4 text-base-content/60" />
              <span
                >{{ formData.invitees.length }} invitat{{
                  formData.invitees.length === 1 ? 'o' : 'i'
                }}</span
              >
            </div>
          </div>
        </div>

        <div class="alert alert-warning">
          <Icon icon="fluent:warning-24-filled" />
          <span>Questa azione non può essere annullata.</span>
        </div>

        <div class="modal-action">
          <form method="dialog">
            <button class="btn btn-ghost btn-sm mr-2">Annulla</button>
            <button class="btn btn-error btn-sm" @click="confirmDeleteEvent" :disabled="isLoading">
              <Icon v-if="isLoading" icon="fluent:spinner-ios-20-filled" class="animate-spin" />
              <Icon v-else icon="fluent:delete-24-regular" />
              {{ isLoading ? 'Eliminando...' : 'Sì, elimina evento' }}
            </button>
          </form>
        </div>
      </div>
    </dialog>
  </div>
</template>

<script>
// TODO: refactor using Option API
import { ref, computed, watch, nextTick, toRef } from 'vue'
import { Icon } from '@iconify/vue'
import { useCalendarStore } from '@/stores/calendar'
import { useUserStore } from '@/stores/account'
import { today } from '@/stores/timeMachine'
import UserShare from '@/components/UserShare.vue'
import AvatarMembers from '@/components/AvatarMembers.vue'
import { getUsersByIds } from '@/router/user/user'

export default {
  name: 'EventModal',
  components: {
    Icon,
    UserShare,
    AvatarMembers
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
  emits: ['close', 'save', 'delete'],
  setup(props, { emit }) {
    const calendarStore = useCalendarStore()
    const userStore = useUserStore()

    // User management
    const users = ref({})
    // Load users function
    const loadUsers = async (userIds) => {
      if (!userIds || userIds.length === 0) return

      try {
        const userData = await getUsersByIds(userIds)
        // getUsersByIds returns an object map, merge it with existing users
        Object.assign(users.value, userData)
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }
    const isLoading = ref(false)

    const weekdays = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'] // Dati form
    const defaultFormData = () => ({
      title: '',
      date: '',
      allDay: false,
      startTime: '',
      endTime: '',
      duration: 60,
      description: '',
      location: '',
      category: 'other', // Default category
      invitees: [], // Changed from attendees to invitees (array of user IDs)
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

    const formData = ref(defaultFormData()) // Computed
    const isEditing = computed(() => !!props.event)
    const isFormValid = computed(() => {
      return formData.value.title.trim() && formData.value.date
    })
    // User computed properties
    const ownerUser = computed(() => {
      const ownerId = props.event?.createdBy || userStore.loggedUser._id
      return users.value[ownerId] || userStore.loggedUser
    })

    const inviteeUsers = computed(() => {
      return formData.value.invitees.map((id) => users.value[id]).filter(Boolean)
    }) // Inizializzazione form
    const initializeForm = async () => {
      // Reset loading state quando si apre un nuovo evento
      isLoading.value = false

      if (props.event) {
        // Modifica evento esistente
        const event = props.event

        // Gestione date dal backend
        let eventDate,
          startTime = '',
          endTime = ''

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
          date: eventDate || event.date || event.dueDate || event.startDate || '',
          allDay: event.allDay || false,
          startTime: startTime || event.startTime || '',
          endTime: endTime || event.endTime || '',
          duration: event.duration || 60,
          description: event.description || '',
          location: event.location || '',
          category: event.category || 'other', // Include category from event
          invitees: [...(event.invitees || [])], // Use invitees (array of user IDs)
          isRecurring: !!event.isRecurring, // TODO: check !! in js
          recurrence: {
            frequency: event.recurrenceRule?.frequency || 'weekly',
            interval: event.recurrenceRule?.interval || 1,
            daysOfWeek: [...(event.recurrenceRule?.daysOfWeek || [])],
            endType:
              event.recurrenceRule?.endType === 'count'
                ? 'after'
                : event.recurrenceRule?.endType === 'date'
                  ? 'on'
                  : 'never',
            count: event.recurrenceRule?.endCount || 10,
            until: event.recurrenceRule?.endDate
              ? new Date(event.recurrenceRule.endDate).toISOString().split('T')[0]
              : ''
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
        }
        if (props.initialData?.startTime) {
          formData.value.startTime = props.initialData.startTime
        } // Data di default oggi se non specificata (solo per nuovi eventi)
        if (!formData.value.date) {
          formData.value.date = new Date().toISOString().split('T')[0]
        }
      }
      // Load users after form initialization
      const ownerId = props.event?.createdBy || userStore.loggedUser._id
      const userIdsToLoad = []

      // Add owner if different from logged user and not already in users
      if (ownerId && ownerId !== userStore.loggedUser._id && !users.value[ownerId]) {
        userIdsToLoad.push(ownerId)
      }

      // Add invitees
      if (formData.value.invitees && formData.value.invitees.length > 0) {
        userIdsToLoad.push(...formData.value.invitees)
      }
      // Load all users at once
      if (userIdsToLoad.length > 0) {
        await loadUsers(userIdsToLoad)
      }
    }

    // Azioni
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
        } else {
          // Evento con orari specifici
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
          }
          if (formData.value.endTime) {
            const [endHours, endMinutes] = formData.value.endTime.split(':')
            endDate = new Date(baseDate)
            endDate.setHours(parseInt(endHours), parseInt(endMinutes), 0, 0)
          } else if (formData.value.duration) {
            // Calcola endDate usando la durata
            endDate = new Date(startDate.getTime() + parseInt(formData.value.duration) * 60000)
            // Impostiamo anche endTime esplicitamente come stringa
            const endHours = endDate.getHours().toString().padStart(2, '0')
            const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
            formData.value.endTime = `${endHours}:${endMinutes}`
          } else {
            // Default: 1 ora dopo l'inizio
            endDate = new Date(startDate.getTime() + 60 * 60000)
            // Impostiamo anche endTime esplicitamente come stringa
            const endHours = endDate.getHours().toString().padStart(2, '0')
            const endMinutes = endDate.getMinutes().toString().padStart(2, '0')
            formData.value.endTime = `${endHours}:${endMinutes}`
          }
        }
        const eventData = {
          title: formData.value.title.trim(),
          description: formData.value.description.trim(),
          location: formData.value.location.trim(),
          category: formData.value.category, // Include category in save data
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          startTime: formData.value.allDay ? null : formData.value.startTime,
          endTime: formData.value.allDay ? null : formData.value.endTime,
          allDay: formData.value.allDay,
          invitees: formData.value.invitees // Use invitees instead of attendees
        }

        // Aggiungi ricorrenza se attiva
        if (formData.value.isRecurring) {
          eventData.isRecurring = true
          eventData.recurrenceRule = {
            frequency: formData.value.recurrence.frequency,
            interval: parseInt(formData.value.recurrence.interval)
          }

          // Giorni settimana per ricorrenza settimanale
          if (
            formData.value.recurrence.frequency === 'weekly' &&
            formData.value.recurrence.daysOfWeek.length > 0
          ) {
            eventData.recurrenceRule.daysOfWeek = formData.value.recurrence.daysOfWeek
          }

          // Fine ricorrenza
          if (formData.value.recurrence.endType === 'after') {
            eventData.recurrenceRule.endType = 'count'
            eventData.recurrenceRule.endCount = parseInt(formData.value.recurrence.count)
          } else if (formData.value.recurrence.endType === 'on') {
            eventData.recurrenceRule.endType = 'date'
            eventData.recurrenceRule.endDate = new Date(
              formData.value.recurrence.until
            ).toISOString()
          } else {
            eventData.recurrenceRule.endType = 'never'
          }
        }

        if (isEditing.value) {
          // Aggiorna evento esistente
          await calendarStore.updateExistingEvent(props.event._id, eventData)
        } else {
          // Crea nuovo evento
          await calendarStore.createNewEvent(eventData)
        }

        // Aspetta che Vue aggiorni la reattività prima di chiudere il modal
        await nextTick()

        // Piccolo ritardo aggiuntivo per assicurarsi che tutti i computed si aggiornino
        setTimeout(() => {
          emit('save', eventData)
          closeModal()
        }, 100)
      } catch (error) {
        console.error('Errore salvando evento:', error)
        // TODO: Mostra messaggio errore all'utente
      } finally {
        isLoading.value = false
      }
    }

    const openDeleteConfirmModal = () => {
      const modal = document.getElementById('delete_confirm_modal')
      if (modal) {
        modal.showModal()
      }
    }

    const confirmDeleteEvent = async () => {
      if (!isEditing.value || isLoading.value) return

      isLoading.value = true

      try {
        await calendarStore.deleteExistingEvent(props.event._id)
        emit('delete', props.event)

        // Chiudi il modal di conferma
        const modal = document.getElementById('delete_confirm_modal')
        if (modal) {
          modal.close()
        }

        closeModal()
      } catch (error) {
        console.error('Errore eliminando evento:', error)
        // TODO: Mostra messaggio errore all'utente      } finally {
        isLoading.value = false
      }
    }

    const deleteEvent = async () => {
      // Funzione mantenuta per retrocompatibilità, ma non più utilizzata
      // L'eliminazione avviene ora tramite confirmDeleteEvent
      console.warn('deleteEvent chiamata - utilizzare openDeleteConfirmModal invece')
    }

    // Funzioni di formattazione per il modal di conferma
    const formatEventDate = () => {
      if (!formData.value.date) return ''
      const date = new Date(formData.value.date)
      return date.toLocaleDateString('it-IT', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    const formatEventTime = () => {
      if (formData.value.allDay) return 'Tutto il giorno'
      const start = formData.value.startTime || '09:00'
      const end = formData.value.endTime || '10:00'

      return `${start} - ${end}`
    }

    const getCategoryLabel = () => {
      const category = calendarStore.eventCategories.find(
        (cat) => cat.value === formData.value.category
      )
      return category ? `${category.icon} ${category.label}` : formData.value.category
    } // Remove invitee function for drag&drop
    const removeInvitee = async (user) => {
      if (!user || !user._id) return

      try {
        // Remove from local form data
        const index = formData.value.invitees.indexOf(user._id)
        if (index > -1) {
          formData.value.invitees.splice(index, 1)
        }

        // If editing an existing event, update the backend immediately
        if (isEditing.value && props.event?._id) {
          await calendarStore.updateExistingEvent(props.event._id, {
            invitees: formData.value.invitees
          })

          // Show success notification
          push.success(`${user.name} ${user.surname} rimosso dall'evento`)
        }

        console.log(`Removed ${user.name} ${user.surname} from event invitees`)
      } catch (error) {
        console.error('Error removing invitee:', error)
        // Revert the change if there was an error
        if (!formData.value.invitees.includes(user._id)) {
          formData.value.invitees.push(user._id)
        }
        push.error("Errore durante la rimozione dell'utente")
      }
    }

    // Watchers
    watch(
      () => props.isVisible,
      (newValue) => {
        if (newValue) {
          nextTick(async () => {
            await initializeForm()
          })
        }
      }
    )

    // Watch for invitees changes to load user data
    watch(
      () => formData.value.invitees,
      async (newInvitees) => {
        if (newInvitees && newInvitees.length > 0) {
          await loadUsers(newInvitees)
        }
      },
      { immediate: true }
    )
    watch(
      () => props.event,
      (newValue) => {
        if (props.isVisible) {
          nextTick(async () => {
            await initializeForm()
          })
        }
      },
      { deep: true }
    )

    watch(
      () => props.initialData,
      (newValue) => {
        if (props.isVisible && newValue) {
          nextTick(async () => {
            await initializeForm()
          })
        }
      },
      { deep: true }
    )
    return {
      // Store
      calendarStore,
      userStore,
      // Props (exposed for template)
      event: toRef(props, 'event'),
      isVisible: toRef(props, 'isVisible'),
      initialData: toRef(props, 'initialData'),
      // Data
      formData,
      isLoading,
      weekdays,
      users,
      // Computed
      isEditing,
      isFormValid,
      ownerUser,
      inviteeUsers, // Actions
      closeModal,
      saveEvent,
      openDeleteConfirmModal,
      confirmDeleteEvent,
      deleteEvent,
      removeInvitee,
      // Formatting functions for delete modal
      formatEventDate,
      formatEventTime,
      getCategoryLabel
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
