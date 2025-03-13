<script setup>
import { onMounted, ref, watch } from 'vue'
import { API_URL } from '~/const.js'
import { useUserStore } from '@/stores/account.js'
import { updateGroup } from '@/router/group/group.js'
import GroupList from '@/components/group/GroupList.vue'
import UserShare from '@/components/UserShare.vue'
import { getUsersByIds } from '@/router/user/user.js'

var new_group = {}
const selectedGroup = ref(null)
const loggedUser = useUserStore().loggedUser
const updateKey = ref(0)
const users = ref({})

onMounted(async () => {})

async function handleSelectGroup(group) {
  selectedGroup.value = group
  console.log('members: ' + selectedGroup.value.members)

  const allUserIds = [group.owner, ...group.members]
  users.value = await getUsersByIds(allUserIds)
  console.log('🔥 - handleSelectGroup - users.value:', users.value)
}

watch(
  () => selectedGroup.value?.members,
  async (newMembers) => {
    if (selectedGroup.value && newMembers) {
      const allUserIds = [selectedGroup.value.owner, ...newMembers]
      users.value = await getUsersByIds(allUserIds)
    }
  },
  { deep: true }
)

async function createGroup() {
  new_group.owner = loggedUser._id
  console.log('-creategroup - owner:', new_group.owner)
  const response = await fetch(API_URL + '/group', {
    method: 'POST',
    body: JSON.stringify(new_group),
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    // clean up the form
    new_group = {}
    return await response.json()
  } else {
    console.error('ERROR: createGroup')
  }
}

async function saveGroup(group) {
  console.log('🔥 - saveGroup - group:', group)
  const updateFields = {
    description: group.description
  }
  const updatedGroup = await updateGroup(group)
  group.value = updatedGroup
  // TODO: add toast saved!
}

async function deleteGroup(group) {
  console.log('🔥 - deleteGroup - group:', group)
  const response = await fetch(API_URL + '/group/' + group._id, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json'
    }
  })

  if (response.ok) {
    selectedGroup.value = null
    updateKey.value++
    return await response.json()
  } else {
    console.error('ERROR: deleteGroup - ', response)
  }
}
</script>

<template>
  <div class="flex flex-row w-full mt-3 prose">
    <div class="flex flex-col w-1/2">
      <div class="flex items-baseline justify-between">
        <h2>My Groups</h2>
        <Popper arrow>
          <button class="btn btn-sm btn-secondary btn-outline">New Group</button>
          <template #content>
              <form id="create-group-form" @submit.prevent="createGroup" class="flex flex-col p-2 gap-2">
                <input
                  type="text"
                  v-model="new_group.name"
                  placeholder="Group Name"
                  class="input input-sm"
                  required
                />
                <!-- TODO: fare descrizione che si aggiorna solo quando faccio "Salva", ora è reattivo -->
              <textarea
                  v-model="new_group.description"
                  placeholder="Description"
                  class="textarea textarea-bordered"
                ></textarea>
                <button class="btn btn-sm btn-block btn-primary" form="create-group-form">
                  <Icon icon="fluent:add-16-filled"></Icon>Add New Group
                  <!-- TODO: rendere lista reattiva all'aggiunta di un nuovo gruppo -->
              </button>
              </form>
          </template>
        </Popper>
      </div>
      <GroupList :key="updateKey" @select-group="handleSelectGroup"></GroupList>
    </div>
    <div v-if="selectedGroup != null" class="divider divider-horizontal"></div>
    <Transition name="slide-fade" :duration="550">
      <div
        v-if="selectedGroup != null"
        class="flex flex-col w-full bg-surface-0 rounded-box p-5 h-min pt-0 my-auto"
        id="dynamic-view"
      >
        <div class="flex items-baseline justify-between">
          <h2>{{ selectedGroup.name }}</h2>
          <div>
            <button class="btn btn-secondary rounded-box btn-sm" @click="saveGroup(selectedGroup)">
              <Icon icon="fluent:save-edit-20-filled" />Save
            </button>
            <button
              class="btn btn-error btn-outline rounded-box btn-sm"
              onclick="my_modal_1.showModal()"
            >
              Delete
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
                    <!-- if there is a button in form, it will close the modal -->
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
          <textarea class="textarea textarea-borderd w-full" v-model="selectedGroup.description" />
        </label>
        <!-- Actual members -->
        <div class="flex flex-row items-center justify-start m-2">
          <div class="flex flex-row items-center w-max mt-1">
            <!-- owener avatar -->
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
              <div v-for="reader in selectedGroup.members" class="avatar h-10">
                <img
                  class="mask mask-circle !bg-secondary mt-0"
                  :src="users[reader]?.image"
                  :title="users[reader]?.name + ' ' + users[reader]?.surname"
                />
              </div>
            </div>
          </div>
          <UserShare
            :id="selectedGroup._id"
            type="Group"
            msg="Invites"
            v-model="selectedGroup.members"
          ></UserShare>
        </div>
      </div>
    </Transition>
  </div>
</template>
