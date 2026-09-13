<script setup lang="ts">
import { computed } from 'vue'

/**
 * The pager, replacing CodeIgniter's pagination library.
 *
 * It shows at most seven slots, so a long list does not print forty numbers:
 * first, last, the current page and its neighbours, with a gap where pages were
 * skipped.
 */
const props = defineProps<{
    page: number
    pageCount: number
    total: number
    perPage: number
}>()

const emit = defineEmits<{ 'update:page': [value: number] }>()

const from = computed(() => (props.page - 1) * props.perPage + 1)
const to = computed(() => Math.min(props.page * props.perPage, props.total))

const slots = computed<(number | '…')[]>(() => {
    const { page, pageCount } = props

    if (pageCount <= 7) {
        return Array.from({ length: pageCount }, (_, index) => index + 1)
    }

    const around = [page - 1, page, page + 1].filter((entry) => entry > 1 && entry < pageCount)
    const pages = [1, ...around, pageCount]

    const out: (number | '…')[] = []

    pages.forEach((entry, index) => {
        if (index > 0 && entry - (pages[index - 1] as number) > 1) {
            out.push('…')
        }

        out.push(entry)
    })

    return out
})

function go(page: number): void {
    emit('update:page', Math.min(Math.max(1, page), props.pageCount))
}
</script>

<template>
    <div class="pagination no-print">
        <p class="pagination__info mb-0">
            Showing {{ count(from) }}&ndash;{{ count(to) }} of {{ count(total) }}
        </p>

        <div class="pagination__pages">
            <button
                type="button"
                class="pagination__page"
                :disabled="page === 1"
                aria-label="Previous page"
                @click="go(page - 1)"
            >
                <AppIcon name="chevron-left" :size="13" />
            </button>

            <template v-for="(slot, index) in slots" :key="`${slot}-${index}`">
                <span v-if="slot === '…'" class="text-faint" style="padding: 0 0.25rem">…</span>

                <button
                    v-else
                    type="button"
                    class="pagination__page"
                    :class="{ 'is-current': slot === page }"
                    :aria-current="slot === page ? 'page' : undefined"
                    @click="go(slot)"
                >
                    {{ slot }}
                </button>
            </template>

            <button
                type="button"
                class="pagination__page"
                :disabled="page === pageCount"
                aria-label="Next page"
                @click="go(page + 1)"
            >
                <AppIcon name="chevron-right" :size="13" />
            </button>
        </div>
    </div>
</template>
