<script setup>
import { ref, watch, onMounted } from 'vue'
import { API_URL } from '../../../const'
import { useUserStore } from '@/stores/account'
import GroupList from '@/components/group/GroupList.vue'
import UserShare from '@/components/UserShare.vue'
import { getUsersByIds } from '../user/user'
import { updateGroup, getGroupById } from './group'

const userStore = useUserStore()
const loggedUser = userStore.loggedUser
const selectedGroup = ref(null)
const realGroupMembers = ref([])
const editedGroup = ref(null)
const groups = ref([])
const users = ref({})
const new_group = ref({ name: '', description: '', owner: '' })

onMounted(() => {
  fetchGroups()
})

const fetchGroups = async () => {
  try {
    console.log('Fetching groups for user:', loggedUser._id)
    const res = await fetch(`${API_URL}/${loggedUser._id}/groups`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      throw new Error(`Error fetching groups: ${res.status}`)
    }

    // Log response for debugging
    const contentType = res.headers.get('content-type')
    console.log('API response content type:', contentType)

    if (contentType && contentType.includes('application/json')) {
      groups.value = await res.json()
      console.log('Loaded groups:', groups.value.length)
    } else {
      const text = await res.text()
      console.error('Non-JSON response:', text)
    }
  } catch (err) {
    console.error('Error in fetchGroups:', err)
  }
}

async function handleSelectGroup(group) {
  try {
    console.log('Selecting group:', group._id)

    // Fetch latest group data to ensure we have the most current version
    const freshGroup = await getGroupById(group._id)
    if (!freshGroup) {
      throw new Error(`Could not fetch group with ID ${group._id}`)
    }

    selectedGroup.value = freshGroup
    realGroupMembers.value = selectedGroup.value.members

    // Create a deep clone of the group to avoid reactivity issues
    editedGroup.value = JSON.parse(JSON.stringify(freshGroup))

    // Ensure members is an array
    const members = Array.isArray(freshGroup.members) ? freshGroup.members : []
    const allUserIds = [freshGroup.owner, ...members].filter(Boolean) // Filter out null/undefined values

    console.log('Getting users for IDs:', allUserIds)

    // Get user data for members and owner
    const usersData = await getUsersByIds(allUserIds)

    // Handle both array and object return types from getUsersByIds
    if (usersData) {
      // Reset users object
      users.value = {}

      // If usersData is an array
      if (Array.isArray(usersData)) {
        usersData.forEach((user) => {
          if (user && user._id) {
            users.value[user._id] = user
          }
        })
      }
      // If usersData is already an object (keyed by user ID)
      else if (typeof usersData === 'object') {
        users.value = usersData
      }
    }

    console.log('🔥 - handleSelectGroup - users.value:', users.value)
  } catch (error) {
    console.error('Error selecting group:', error)
    push.error(`Could not load group details: ${error.message}`)
  }
}

async function saveGroup() {
  if (!editedGroup.value) return

  console.log('🔥 - saveGroup - group:', editedGroup.value)
  try {
    const updatedGroup = await updateGroup(editedGroup.value)
    // Only update the selectedGroup after successful save
    selectedGroup.value = updatedGroup

    fetchGroups()
    // Show success message
    push.success('Group updated successfully')
  } catch (error) {
    console.error('Error saving group:', error)
    push.error('Failed to update group')
  }
}

watch(
  () => selectedGroup.value?.members,
  async (newMembers) => {
    if (selectedGroup.value && newMembers) {
      const allUserIds = [selectedGroup.value.owner, ...newMembers].filter(Boolean)
      const usersData = await getUsersByIds(allUserIds)

      // Handle both array and object return types
      if (usersData) {
        // Reset users object
        users.value = {}

        // If usersData is an array
        if (Array.isArray(usersData)) {
          usersData.forEach((user) => {
            if (user && user._id) {
              users.value[user._id] = user
            }
          })
        }
        // If usersData is already an object (keyed by user ID)
        else if (typeof usersData === 'object') {
          users.value = usersData
        }
      }
    }
  },
  { deep: true }
)

async function createGroup() {
  new_group.value.owner = loggedUser._id

  try {
    const response = await fetch(API_URL + '/group', {
      method: 'POST',
      body: JSON.stringify(new_group.value),
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      fetchGroups()
      const createdGroup = await response.json()
      groups.value = [...groups.value, createdGroup]

      // Reset the form
      new_group.value = { name: '', description: '', owner: '' }

      // Close the popper
      document.querySelector('.popper').classList.remove('active')

      push.success('Group created successfully')
      return true
    }
  } catch (error) {
    console.error('ERROR during createGroup:', error)
    push.error('Failed to create group')
    return false
  }
}

async function deleteGroup(group) {
  console.log('🔥 - deleteGroup - group:', group)
  try {
    const response = await fetch(API_URL + '/group/' + group._id, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (response.ok) {
      selectedGroup.value = null
      fetchGroups()
      return await response.json()
    } else {
      console.error('ERROR: deleteGroup - ', response)
    }
    push.success('Group deleted successfully')
  } catch (error) {
    console.error('ERROR: deleteGroup - ', error)
  }
}
</script>

<template>
  <div class="flex flex-row w-full mt-3 prose">
    <div class="flex flex-col w-full">
      <div class="flex items-baseline justify-between">
        <h2>My Groups</h2>
        <Popper arrow>
          <button class="btn btn-sm btn-secondary !btn-outline rounded-full">
            <Icon icon="mingcute:add-fill" />New Group
          </button>
          <template>
            <form
              id="create-group-form"
              @submit.prevent="createGroup"
              class="flex flex-col p-2 gap-2"
            >
              <input
                type="text"
                autofocus
                v-model="new_group.name"
                placeholder="Group Name"
                class="input input-sm"
                required
              />
              <textarea
                v-model="new_group.description"
                placeholder="Description"
                class="textarea textarea-bordered"
              ></textarea>
              <button
                class="btn btn-sm btn-block btn-primary"
                form="create-group-form"
                type="submit"
              >
                <Icon icon="mingcute:add-fill" />Add New Group
              </button>
            </form>
          </template>
        </Popper>
      </div>
      <GroupList
        :groups="groups"
        :selected-group-id="selectedGroup?._id"
        @select-group="handleSelectGroup"
      ></GroupList>
    </div>
    <div v-if="selectedGroup != null" class="divider divider-horizontal"></div>
    <Transition name="slide-fade" :duration="550">
      <div
        v-if="selectedGroup != null"
        class="flex flex-col w-full bg-surface-0 rounded-box p-5 h-min pt-0 my-[10%]"
        id="dynamic-view"
      >
        <div class="flex items-baseline justify-between">
          <h2>{{ selectedGroup.name }}</h2>
          <div>
            <button
              class="btn btn-secondary rounded-box btn-sm"
              @click="saveGroup"
              v-if="selectedGroup.owner === userStore.loggedUser._id"
              :class="{ 'btn-disabled': selectedGroup.owner !== userStore.loggedUser._id }"
            >
              <Icon icon="fluent:save-edit-20-filled" />Save
            </button>
            <button
              class="btn btn-error btn-outline rounded-box btn-sm ml-2"
              onclick="my_modal_1.showModal()"
              v-if="selectedGroup.owner === userStore.loggedUser._id"
              :class="{ 'btn-disabled': selectedGroup.owner !== userStore.loggedUser._id }"
            >
              <Icon icon="fluent:delete-24-regular" />Delete
            </button>
            <dialog id="my_modal_1" class="modal">
              <div class="modal-box">
                <h3 class="py-4">Are you sure to delete {{ selectedGroup.name }}?</h3>
                <div class="modal-action">
                  <form method="dialog">
                    <button
                      class="btn btn-error btn-outline rounded-box btn-sm"
                      @click="deleteGroup(selectedGroup)"
                    >
                      <Icon icon="fluent:delete-24-regular" /> Yes, delete it
                    </button>
                    <button class="btn btn-secondary btn-outline rounded-box btn-sm">
                      No, go back
                    </button>
                  </form>
                </div>
              </div>
            </dialog>
          </div>
        </div>
        <label class="form-control">
          <div class="label">
            <span class="label-text">Description</span>
          </div>
          <textarea
            v-if="selectedGroup.owner === userStore.loggedUser._id"
            class="textarea textarea-borderd w-full"
            v-model="editedGroup.description"
          ></textarea>
          <p v-else placeholder="Description" class="textarea">
            {{ editedGroup.description }}
          </p>
        </label>
        <!-- Actual members -->
        <div class="flex flex-row items-center justify-start m-2">
          <div class="flex flex-row items-center w-max mt-1">
            <!-- owner avatar -->
            <div class="avatar w-10 mr-2">
              <div class="w-10 ring-primary ring-offset-base-100 rounded-full ring ring-offset-2">
                <img
                  class="mt-0"
                  :src="users[selectedGroup.owner]?.image"
                  :title="
                    users[selectedGroup.owner]?.name + ' ' + users[selectedGroup.owner]?.surname
                  "
                />
              </div>
            </div>
            <!-- member avatar -->
            <div class="avatar-group w-max">
              <div v-for="reader in selectedGroup.members" :key="reader" class="avatar h-10">
                <img
                  class="mask mask-circle !bg-secondary mt-0"
                  :src="users[reader]?.image"
                  :title="users[reader]?.name + ' ' + users[reader]?.surname"
                />
              </div>
            </div>
          </div>
          <!-- Only show UserShare for owner -->
          <UserShare
            v-if="selectedGroup.owner === userStore.loggedUser._id"
            :id="selectedGroup._id"
            type="Group"
            msg="Invites"
            v-model="realGroupMembers"
          ></UserShare>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(20px);
  opacity: 0;
}
</style>
