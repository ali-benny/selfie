<script setup>
import { ref, onMounted } from 'vue'
import NoteView from '@/components/note/NoteView.vue'
import NoteTree from '@/components/note/NoteTree.vue'
import { useUserStore } from '@/stores/account'
import { getTags } from './editor/tags.js'

const userStore = useUserStore()
const viewMode = ref('list')
const order = ref('title')
const tags = ref([])
const selected = ref([])
const noteTree = ref(null)

onMounted(async () => {
  try {
    tags.value = await getTags()
  } catch (error) {
    console.error('Failed to fetch notes:', error)
  }
})

const orderBy = (criteria) => {
  order.value = criteria
}

function filterByTag(tag) {
  if (selected.value.includes(tag)) {
    selected.value = selected.value.filter((t) => t !== tag)
  } else {
    selected.value.push(tag)
  }
  console.log('🔥 - filterByTag - selected:', selected)
}

async function refreshNoteTree() {
  if (noteTree.value) {
    await noteTree.value.refreshFolders()
  }
}
</script>

<template>
  <div class="flex flex-col h-[calc(100vh-7vh)]">
    <a
      href="/editor"
      class="btn btn-accent floating-btn btn-circle !text-base-100 shadow-xl text-2xl"
      title="Add new note"
    >
      <Icon icon="fluent:note-add-24-filled" />
    </a>
    <div class="container mx-auto flex justify-between items-center px-2 md:px-5">
      <h1 class="text-2xl font-semibold">Notes</h1>
      <div class="flex justify-end items-center my-2">
        <Popper>
          <button class="btn btn-default flex justify-between rounded-box">
            Filter by Tags<Icon icon="fluent:chevron-down-12-filled" />
          </button>
          <template #content>
            <ul
              class="flex justify-evenly bg-base-100 flex-wrap rounded-box z-[1] max-w-52 p-2 shadow gap-2"
            >
              <button
                v-for="tag in tags"
                :key="tag"
                class="flex px-2 rounded-xl font-semibold bg-primary/50 hover:bg-surface-0"
                :class="selected.includes(tag) ? 'bg-secondary/50 hover:bg-secondary/70' : ''"
                @click="filterByTag(tag)"
              >
                {{ tag }}
              </button>
            </ul>
          </template>
        </Popper>
        <div class="mx-2">
          <button
            class="btn btn-default rounded-box"
            v-if="order === 'title'"
            @click="orderBy('date')"
          >
            Order by Title
          </button>
          <button
            class="btn btn-default rounded-box"
            v-else-if="order === 'date'"
            @click="orderBy('author')"
          >
            Order by Date
          </button>
          <button
            class="btn btn-default rounded-box"
            v-else-if="order === 'author'"
            @click="orderBy('title')"
          >
            Order by Author
          </button>
        </div>
        <div class="join rounded-box" aria-label="Note View Mode">
          <input
            type="radio"
            class="btn btn-sm join-item"
            id="list"
            name="options"
            value="list"
            v-model="viewMode"
            aria-label="List"
          />
          <!-- <label class="btn btn-outline btn-primary join-item" for="list">
          <Icon icon="fluent:apps-list-24-filled" />
        </label> -->
          <input
            type="radio"
            class="btn btn-sm join-item"
            id="grid"
            name="options"
            value="grid"
            v-model="viewMode"
            aria-label="Grid"
          />
          <!-- <label class="btn btn-outline btn-primary join-item" for="grid">
          <Icon icon="fluent:grid-16-filled" />
        </label> -->
        </div>
      </div>
    </div>
    <div class="flex flex-1 overflow-hidden">
      <Suspense>
        <NoteTree ref="noteTree" node="root" :initiallyOpen="['root']" ></NoteTree>
      </Suspense>
      <div class="flex flex-1 overflow-y-auto justify-center transition-all duration-300">
        <NoteView
          :order="order"
          :filter="selected"
          :viewMode="viewMode"
          :edit="true"
          :extended="true"
        ></NoteView>
      </div>
    </div>
  </div>
</template>

<style scoped>
.floating-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

#preview img {
  max-width: 100%;
  max-height: 150px;
  height: auto;
  display: block;
  margin: 0 auto;
}

#preview p {
  word-break: break-all;
}
</style>
