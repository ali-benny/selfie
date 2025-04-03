<template>
  <Popper @open:popper="openHandler" arrow>
    <slot name="trigger"></slot>
    <template #content>
      <div class="w-72 sm:w-80 flex flex-col gap-1 text-sm p-2">
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">URL Youtube</span>
          </div>
          <!-- 
videoUrl Input: @input->valuto se fare debounce o no, @input.enter->aggiorno videoId senza valutare debounce
-->
          <input
            ref="videoURLInput"
            type="text"
            placeholder="Paste YouTube URL here"
            class="input input-md input-bordered w-full max-w-xs text-xs px-2"
            @input="handleVideoIdInput"
            @keyup.enter="setVideoId"
            v-model="videoURL"
          />
        </label>

        <youtube-iframe
          class="max-w-full h-auto"
          v-if="videoId && firstTimeOpen"
          :video-id="videoId"
          :player-vars="{ autoplay: false }"
        />
      </div>
    </template>
  </Popper>
</template>
<script setup>
import Popper from 'vue3-popper'
import { YoutubeIframe } from '@vue-youtube/component'
import { nextTick, ref, useTemplateRef } from 'vue'
import { useDebounceFn, useSessionStorage } from '@vueuse/core'
import getVideoId from 'get-video-id'

const firstTimeOpen = ref(false)
const videoURLInput = useTemplateRef('videoURLInput')
const videoId = useSessionStorage('pomodoro.youtubeVideoId', null)
const videoURL = ref(videoId.value ? `https://www.youtube.com/wathch?v=${videoId.value}` : '')

const setVideoId = () => {
  videoId.value = getVideoId(videoURL.value).id
}

const debouncedSetVideoID = useDebounceFn(setVideoId, 1000)

// così quando cancello il link lo fa subito
function handleVideoIdInput() {
  if (videoURL.value) debouncedSetVideoID()
  else setVideoId()
}

async function openHandler() {
  firstTimeOpen.value = true

  await nextTick()

  videoURLInput.value.focus()
}
</script>
