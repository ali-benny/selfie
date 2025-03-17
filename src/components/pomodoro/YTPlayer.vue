<template>
  <Popper arrow>
    <slot name="trigger"></slot>
    <template #content>
      <div class="w-72 sm:w-80 flex flex-col gap-1 text-sm p-2">
        <label class="form-control w-full max-w-xs">
          <div class="label">
            <span class="label-text">URL Youtube</span>
          </div>
          <input
            type="text"
            placeholder="Paste YouTube URL here"
            class="input input-md input-bordered w-full max-w-xs text-xs px-2"
            v-model="videoURL"
          />
        </label>

        <youtube-iframe
          class="max-w-full h-auto"
          v-if="videoId"
          :video-id="videoId"
          :player-vars="{ autoplay: false }"
        />
      </div>
    </template>
  </Popper>
</template>
<script setup>
import { useSessionStorage } from '@vueuse/core'
import Popper from 'vue3-popper'
import { YoutubeIframe } from '@vue-youtube/component'
import { computed } from 'vue'
import getVideoId from 'get-video-id'

const videoId = useSessionStorage('pomdoro.youtubeVideoId', null)
const videoURL = computed({
  get() {
    return videoId.value ? 'https://youtube.com/watch?v=' + videoId.value : null
  },
  set(value) {
    videoId.value = getVideoId(value).id
  }
})
</script>
