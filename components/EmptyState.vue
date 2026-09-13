<script setup lang="ts">
withDefaults(
    defineProps<{
        title: string
        text?: string
        icon?: string
    }>(),
    { icon: 'inbox' },
)
</script>

<template>
    <div class="empty">
        <span class="empty__icon">
            <AppIcon :name="icon" :size="22" />
        </span>

        <p class="empty__title mb-0">{{ title }}</p>
        <p v-if="text" class="empty__text">{{ text }}</p>

        <div v-if="$slots.default" class="mt-3">
            <slot />
        </div>
    </div>
</template>
