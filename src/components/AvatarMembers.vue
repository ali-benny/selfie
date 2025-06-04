<template>
  <div class="flex flex-row items-center justify-start relative">
    <!-- Trash bin for drag&drop removal (only visible during drag) -->
    <div
      v-if="isDraggingMember"
      class="trash-bin fixed z-50 inset-x-1/2 bottom-20 w-16 h-16 !bg-error text-base-300 flex justify-center items-center rounded-full shadow-lg shadow-error/50 transform -translate-x-1/2 transition-all duration-300"
      @dragover.prevent
      @drop="handleDrop"
      @dragenter.prevent
    >
      <Icon icon="fluent:delete-12-filled" class="text-3xl" />
    </div>

    <div class="flex flex-row items-center w-max">
      <!-- Owner avatar with primary ring -->
      <div v-if="ownerUser" class="avatar w-10 mr-2">
        <div class="w-10 ring-primary ring-offset-base-100 rounded-full ring ring-offset-2 relative">
          <img
            class="mt-0 mask mask-circle"
            :src="ownerUser.image"
            :title="ownerUser.name + ' ' + ownerUser.surname"
            :alt="ownerUser.name + ' ' + ownerUser.surname"
          />
          <!-- Online status for owner -->
          <span
            v-if="showOnlineStatus && ownerUser.logged"
            class="absolute top-0 right-0 w-3 h-3 !bg-success rounded-full border-2 border-base-100 transform translate-x-1 -translate-y-1"
          ></span>
        </div>
      </div>

      <!-- Members avatars -->
      <div 
        v-if="displayedMemberUsers && displayedMemberUsers.length > 0" 
        class="avatar-group w-max"
        :class="groupClasses"
      >
        <div 
          v-for="member in displayedMemberUsers" 
          :key="member._id || member.id" 
          class="avatar h-10 relative"
          :class="[memberClasses, isDraggingMember && draggedMember?._id === member._id ? 'opacity-50 scale-95' : '']"
          :draggable="canRemoveMembers"
          @dragstart="handleDragStart(member, $event)"
          @dragend="handleDragEnd"
        >
          <img
            class="mask mask-circle !bg-secondary mt-0"
            :src="member.image"
            :title="member.name + ' ' + member.surname"
            :alt="member.name + ' ' + member.surname"
          />
          <!-- Online status for members -->
          <span
            v-if="showOnlineStatus && member.logged"
            class="absolute top-0 right-0 w-3 h-3 !bg-success rounded-full border-2 border-base-100 transform translate-x-1 -translate-y-1"
          ></span>
        </div>
      </div>

      <!-- Add member count badge if there are many members -->
      <div 
        v-if="showCount && totalMemberCount > displayLimit"
        class="avatar h-10 ml-1"
      >
        <div class="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center text-xs font-medium text-base-content">
          +{{ totalMemberCount - displayLimit }}
        </div>
      </div>
    </div>

    <!-- Optional share button slot -->
    <slot name="share-button"></slot>
  </div>
</template>

<script setup>
import { computed, defineProps, defineEmits, ref } from 'vue'
import { useUserStore } from '@/stores/account'
import { Icon } from '@iconify/vue'

const userStore = useUserStore()

const props = defineProps({
  // Owner user object
  ownerUser: {
    type: Object,
    default: null
  },
  // Array of member user objects  
  memberUsers: {
    type: Array,
    default: () => []
  },
  // Show online status indicators
  showOnlineStatus: {
    type: Boolean,
    default: true
  },
  // Show member count badge
  showCount: {
    type: Boolean,
    default: true
  },
  // Maximum number of member avatars to display before showing count
  displayLimit: {
    type: Number,
    default: 5
  },
  // Variant for different display styles
  variant: {
    type: String,
    default: 'default', // 'default', 'compact', 'hover-expand'
    validator: (value) => ['default', 'compact', 'hover-expand'].includes(value)
  },
  // Size variant
  size: {
    type: String,
    default: 'medium', // 'small', 'medium', 'large'
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  }
})

const emit = defineEmits(['remove-member'])

// Drag & Drop state
const isDraggingMember = ref(false)
const draggedMember = ref(null)

// Check if current user can remove members (only owner can remove)
const canRemoveMembers = computed(() => {
  return props.ownerUser && userStore.loggedUser._id === props.ownerUser._id
})

// Filter member users to display limit
const displayedMemberUsers = computed(() => {
  return props.memberUsers.slice(0, props.displayLimit)
})

// Total member count for badge display
const totalMemberCount = computed(() => {
  return props.memberUsers.length
})

// Dynamic classes based on variant
const groupClasses = computed(() => {
  const classes = []
  
  if (props.variant === 'hover-expand') {
    classes.push('-space-x-4', 'hover:-space-x-0', 'transition', 'hover:-translate-x-1', 'ease-in-out', 'duration-300')
  }
  
  return classes.join(' ')
})

const memberClasses = computed(() => {
  const classes = []
  
  if (props.variant === 'hover-expand') {
    classes.push('hover:cursor-pointer', 'transition', 'ease-in-out', 'hover:scale-125', 'duration-300')
  }
  
  // Size classes
  if (props.size === 'small') {
    classes.push('h-8', 'w-8')
  } else if (props.size === 'large') {
    classes.push('h-12', 'w-12')
  }
  
  // Add drag cursor if can remove members
  if (canRemoveMembers.value) {
    classes.push('cursor-grab', 'active:cursor-grabbing')
  }
  
  return classes.join(' ')
})

// Drag & Drop handlers
const handleDragStart = (member, event) => {
  if (!canRemoveMembers.value) {
    event.preventDefault()
    return
  }
  
  draggedMember.value = member
  isDraggingMember.value = true
  
  // Set drag data
  event.dataTransfer.setData('text/plain', member._id)
  event.dataTransfer.effectAllowed = 'move'
  
  // Add some visual feedback
  event.target.classList.add('opacity-50')
}

const handleDragEnd = (event) => {
  isDraggingMember.value = false
  draggedMember.value = null
  
  // Remove visual feedback
  event.target.classList.remove('opacity-50')
}

const handleDrop = (event) => {
  event.preventDefault()
  
  if (draggedMember.value) {
    // Emit event to parent component to handle removal
    emit('remove-member', draggedMember.value)
    
    // Reset drag state
    isDraggingMember.value = false
    draggedMember.value = null
  }
}
</script>

<style scoped>
/* Avatar group spacing */
.avatar-group .avatar:not(:first-child) {
  margin-left: -0.5rem;
}

.avatar-group.hover\:-space-x-0:hover .avatar:not(:first-child) {
  margin-left: 0;
}

/* Drag & Drop visual feedback */
.avatar[draggable="true"]:hover {
  transform: scale(1.05);
  transition: transform 0.2s ease;
}

.avatar[draggable="true"]:active {
  transform: scale(0.95);
}

/* Trash bin animation */
.trash-bin {
  animation: bounceIn 0.3s ease-out;
}

@keyframes bounceIn {
  0% {
    transform: translate(-50%, 20px) scale(0.3);
    opacity: 0;
  }
  50% {
    transform: translate(-50%, -10px) scale(1.05);
  }
  70% {
    transform: translate(-50%, 0px) scale(0.9);
  }
  100% {
    transform: translate(-50%, 0px) scale(1);
    opacity: 1;
  }
}

/* Drag hover effect on trash bin */
.trash-bin:hover {
  transform: translate(-50%, 0px) scale(1.1);
  background-color: oklch(var(--er) / 0.9);
  transition: all 0.2s ease;
}
</style>
