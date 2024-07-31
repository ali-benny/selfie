<template>
  <div>
    <h1>Le tue note</h1>
    <ul class="list-group">
      <li v-for="note in notes" :key="note.id" class="list-group-item">
        <h2>{{ note.title }}</h2>
        <p>Author: {{ note.author }}</p>
        <p>Last Edit Date: {{ note.lastEditDate }}</p>
        <p>{{ note.contentPreview }}</p>
        <img
          v-if="note.attachment"
          :src="note.attachmentPreview"
          alt="Attachment Preview"
          class="img-fluid"
        />
		<button class="btn btn-ghost btn-primary">Edit</button>
      </li>
    </ul>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { getNotes } from './new_note/note';

export default {
  setup() {
    const notes = ref([]);

    onMounted(async () => {
      try {
        notes.value = await getNotes();
      } catch (error) {
        console.error('Failed to fetch notes:', error);
      }
    });

    return {
      notes
    };
  }
};
</script>
