<script setup>
import { API_URL } from '~/const.js'
import { useUserStore } from '@/stores/account.js'
import GroupList from '@/components/group/GroupList.vue'
import { ref } from 'vue'

var new_group = {}
const selectedGroup = ref(null)
const loggedUser = useUserStore().loggedUser

const handleSelectGroup = (group) => {
  selectedGroup.value = group
}

async function createGroup() {
  new_group.owner = loggedUser._id
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
</script>

<template>
  <div class="flex flex-row w-full h-full mt-3 prose">
    <div class="flex flex-col w-1/2">
      <div class="flex items-baseline justify-between">
        <h2>My Groups</h2>
        <Popper arrow>
          <button class="btn btn-sm btn-secondary btn-outline">New Group</button>
          <template #content>
            <div class="flex flex-col p-2 gap-2">
              <input
                type="text"
                v-model="new_group.name"
                placeholder="Group Name"
                class="input input-sm"
              />
              <textarea
                v-model="new_group.description"
                placeholder="Description"
                class="textarea textarea-bordered"
              ></textarea>
              <button class="btn btn-sm btn-block btn-primary" @click="createGroup">
                <Icon icon="fluent:add-16-filled"></Icon>Add New Group
              </button>
            </div>
          </template>
        </Popper>
      </div>
      <GroupList @select-group="handleSelectGroup"></GroupList>
    </div>
    <div class="divider divider-horizontal"></div>
    <div class="flex flex-col w-1/2" id="dynamic-view">
      <div v-if="selectedGroup">
        <div class="flex items-baseline justify-between">
          <h2>{{ selectedGroup.name }}</h2>
          <button class="btn btn-secondary rounded-box btn-sm"><Icon icon="fluent:save-edit-20-filled" />Save</button>
        </div>
        <textarea class="textarea textarea-borderd w-full" :value="selectedGroup.description" />
        <UserShare></UserShare>
      </div>
      <div v-else>
        <p>Seleziona un gruppo per gestirlo</p>
      </div>
    </div>
  </div>
</template>
