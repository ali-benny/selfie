<script setup>
import { ref } from 'vue'
import { API_URL } from '~/const.js'
import { useUserStore } from '@/stores/account.js'
import { updateGroup } from '@/router/group/group.js'
import GroupList from '@/components/group/GroupList.vue'
import UserShare from '@/components/UserShare.vue'
import ChatComponent from '@/components/ChatComponent.vue'

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

async function saveGroup(group) {
  console.log('🔥 - saveGroup - group:', group)
  const updateFields = {
    description: group.description
  }
  const updatedGroup = await updateGroup(group)
  group.value = updatedGroup
  // TODO: add toast saved!
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
    <div v-if="selectedGroup != null" class="divider divider-horizontal"></div>
    <Transition name="slide-fade" :duration="550">
      <div
        v-if="selectedGroup != null"
        class="flex flex-col w-full bg-surface-0 rounded-box p-5 h-min pt-0 my-auto"
        id="dynamic-view"
      >
        <div class="flex items-baseline justify-between">
          <h2>{{ selectedGroup.name }}</h2>
          <button class="btn btn-secondary rounded-box btn-sm" @click="saveGroup(selectedGroup)">
            <Icon icon="fluent:save-edit-20-filled" />Save
          </button>
        </div>
        <label class="form-control">
          <div class="label">
            <span class="label-text">Description</span>
          </div>
          <textarea class="textarea textarea-borderd w-full" v-model="selectedGroup.description" />
        </label>
        <UserShare :id="selectedGroup._id" type="Group" msg="Invites"></UserShare>
      </div>
    </Transition>
  </div>
  <ChatComponent></ChatComponent>
</template>
