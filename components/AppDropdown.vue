<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

/**
 * A dropdown.
 *
 * The original drove these with Bootstrap's JavaScript and `data-toggle`.
 * There is no jQuery here: the panel is Vue's, and it closes on an outside
 * click, on Escape, and whenever something inside it is chosen.
 *
 *   <AppDropdown>
 *     <template #trigger="{ toggle, open }">…</template>
 *     …panel contents…
 *   </AppDropdown>
 */
withDefaults(
    defineProps<{
        alignRight?: boolean
        wide?: boolean
    }>(),
    { alignRight: false, wide: false },
)

const open = ref(false)
const root = ref<HTMLElement | null>(null)

function toggle(): void {
    open.value = !open.value
}

function close(): void {
    open.value = false
}

function onDocumentPointerDown(event: MouseEvent): void {
    if (open.value && root.value && !root.value.contains(event.target as Node)) {
        close()
    }
}

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        close()
    }
}

onMounted(() => {
    document.addEventListener('mousedown', onDocumentPointerDown)
    document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onDocumentPointerDown)
    document.removeEventListener('keydown', onKeydown)
})

defineExpose({ close })
</script>

<template>
    <div ref="root" class="dropdown">
        <slot name="trigger" :toggle="toggle" :open="open" :close="close" />

        <Transition name="fade">
            <div
                v-if="open"
                class="dropdown__panel"
                :class="{
                    'dropdown__panel--right': alignRight,
                    'dropdown__panel--wide': wide,
                }"
                role="menu"
                @click="close"
            >
                <slot :close="close" />
            </div>
        </Transition>
    </div>
</template>
