<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref, watch } from 'vue'

/**
 * The listing table.
 *
 * The original loaded DataTables from a CDN on top of a table the server had
 * already rendered in full, then hid the page behind a two-second spinner while
 * it did. This is the same three things — search, sort, pages — done against
 * the rows in memory, with no network request and nothing to wait for.
 *
 * Cells are slots named for their column key, so a page decides how its own
 * data reads:
 *
 *   <DataTable :rows="rows" :columns="columns" :search="(row) => row.name">
 *     <template #cell-status="{ row }">…</template>
 *   </DataTable>
 */
export interface Column {
    key: string
    label: string
    /** Off for a column of buttons, or one holding a badge. */
    sortable?: boolean
    align?: 'left' | 'right' | 'center'
    width?: string
    /** Hidden below 760px, for the columns a phone has no room for. */
    secondary?: boolean
}

const props = withDefaults(
    defineProps<{
        rows: T[]
        columns: Column[]
        /** The text a row is searched on. */
        search?: (row: T) => string
        /** The value a column sorts on, when it is not `row[key]`. */
        sortValue?: (row: T, key: string) => string | number
        perPage?: number
        searchPlaceholder?: string
        emptyTitle?: string
        emptyText?: string
        emptyIcon?: string
        /** Row numbers, as every one of the old listings printed. */
        numbered?: boolean
    }>(),
    {
        perPage: 10,
        searchPlaceholder: 'Search',
        emptyTitle: 'Nothing here yet',
        emptyText: '',
        emptyIcon: 'inbox',
        numbered: true,
    },
)

const term = ref('')
const sortKey = ref('')
const sortAsc = ref(true)
const page = ref(1)

const filtered = computed<T[]>(() => {
    const needle = term.value.trim().toLowerCase()

    if (!needle || !props.search) {
        return props.rows
    }

    return props.rows.filter((row) => props.search!(row).toLowerCase().includes(needle))
})

const sorted = computed<T[]>(() => {
    if (!sortKey.value) {
        return filtered.value
    }

    const read = (row: T): string | number =>
        props.sortValue ? props.sortValue(row, sortKey.value) : (row[sortKey.value] ?? '')

    return [...filtered.value].sort((a, b) => {
        const left = read(a)
        const right = read(b)

        const order =
            typeof left === 'number' && typeof right === 'number'
                ? left - right
                : String(left).localeCompare(String(right), undefined, { numeric: true })

        return sortAsc.value ? order : -order
    })
})

const pageCount = computed(() => Math.max(1, Math.ceil(sorted.value.length / props.perPage)))

const paged = computed<T[]>(() => {
    const start = (page.value - 1) * props.perPage

    return sorted.value.slice(start, start + props.perPage)
})

/** Searching, or deleting the last row on the last page, can strand the page. */
watch([filtered, pageCount], () => {
    if (page.value > pageCount.value) {
        page.value = pageCount.value
    }
})

watch(term, () => {
    page.value = 1
})

function toggleSort(column: Column): void {
    if (column.sortable === false) {
        return
    }

    if (sortKey.value === column.key) {
        sortAsc.value = !sortAsc.value

        return
    }

    sortKey.value = column.key
    sortAsc.value = true
}

function sortIcon(column: Column): string {
    if (sortKey.value !== column.key) {
        return 'sort'
    }

    return sortAsc.value ? 'sort-asc' : 'sort-desc'
}

/** The row's number in the whole set, not in the page. */
function rowNumber(index: number): number {
    return (page.value - 1) * props.perPage + index + 1
}
</script>

<template>
    <div>
        <div v-if="search || $slots.toolbar" class="toolbar">
            <div v-if="search" class="toolbar__search">
                <AppIcon class="toolbar__search-icon" name="search" :size="15" />
                <input
                    v-model="term"
                    class="input"
                    type="search"
                    :placeholder="searchPlaceholder"
                    :aria-label="searchPlaceholder"
                />
            </div>

            <div class="toolbar__spacer"></div>

            <slot name="toolbar" />
        </div>

        <div v-if="paged.length" class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th v-if="numbered" class="table__num">#</th>

                        <th
                            v-for="column in columns"
                            :key="column.key"
                            :style="{
                                width: column.width,
                                textAlign: column.align ?? 'left',
                            }"
                            :class="{ 'is-secondary': column.secondary }"
                        >
                            <button
                                v-if="column.sortable !== false"
                                type="button"
                                class="table__sort"
                                :class="{ 'is-sorted': sortKey === column.key }"
                                @click="toggleSort(column)"
                            >
                                {{ column.label }}
                                <AppIcon
                                    class="table__sort-icon"
                                    :name="sortIcon(column)"
                                    :size="12"
                                />
                            </button>

                            <span v-else>{{ column.label }}</span>
                        </th>
                    </tr>
                </thead>

                <tbody>
                    <tr v-for="(row, index) in paged" :key="row.id ?? index">
                        <td v-if="numbered" class="table__num">{{ rowNumber(index) }}</td>

                        <td
                            v-for="column in columns"
                            :key="column.key"
                            :style="{ textAlign: column.align ?? 'left' }"
                            :class="{ 'is-secondary': column.secondary }"
                        >
                            <slot :name="`cell-${column.key}`" :row="row" :index="index">
                                {{ row[column.key] }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <EmptyState
            v-else
            :title="term ? 'No matches' : emptyTitle"
            :text="term ? `Nothing matches “${term}”.` : emptyText"
            :icon="term ? 'search' : emptyIcon"
        >
            <slot v-if="!term" name="empty-action" />
        </EmptyState>

        <AppPagination
            v-if="sorted.length > perPage"
            v-model:page="page"
            :page-count="pageCount"
            :total="sorted.length"
            :per-page="perPage"
        />
    </div>
</template>

<style scoped>
/* A phone has no room for the supporting columns; the row still identifies
   itself by its first two and its actions. */
@media (max-width: 760px) {
    .is-secondary {
        display: none;
    }
}
</style>
