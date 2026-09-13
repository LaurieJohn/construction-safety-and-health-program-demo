<script setup lang="ts">
/** The saved-confirmations, rendered once by the layout. Raise one with `toast()`. */
const { toasts, dismiss } = useToast()
</script>

<template>
    <div class="toast-stack" aria-live="polite" aria-atomic="false">
        <TransitionGroup name="toast">
            <div v-for="entry in toasts" :key="entry.id" class="toast" @click="dismiss(entry.id)">
                <AppIcon class="toast__icon" name="check-circle" :size="16" />
                <span>{{ entry.message }}</span>
            </div>
        </TransitionGroup>
    </div>
</template>
