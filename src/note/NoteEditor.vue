<template>
	<div id="editorjs" class="bg-body-tertiary p-4 rounded-4"</div>
</template>

<script>
import { initializeEditor } from './editor.js';

export default {
	mounted() {
		initializeEditor();
	}
}
</script>