<script setup lang="ts">
import { computed } from 'vue'
import type { CshpApplication } from '~/data/demo'
import type { Column } from '~/components/DataTable.vue'
import { cshpTypeName, fieldOfficeAbbreviation } from '~/data/reference'

/**
 * The programme listing, shared by all four queues.
 *
 * The old system had four near-identical view files that drifted apart — one
 * grew a Denied tab the others never got, another kept a column the rest had
 * dropped. There is one table here, and a queue decides only which rows go into
 * it and which columns it does not need.
 */
const props = withDefaults(
    defineProps<{
        rows: CshpApplication[]
        emptyTitle: string
        emptyText?: string
        /** The reviewer's remarks — worth a column on the returned queue. */
        showRemarks?: boolean
        /** Who decided, and when — worth a column once a decision exists. */
        showDecision?: boolean
        /** Off on a single-status queue, where every badge would say the same. */
        showStatus?: boolean
    }>(),
    { emptyText: '', showRemarks: false, showDecision: false, showStatus: true },
)

const auth = useAuthStore()
const actions = useCshpActions()

const columns = computed<Column[]>(() => {
    const base: Column[] = [
        { key: 'control_no', label: 'Control No.', width: '12%' },
        { key: 'project_name', label: 'Project' },
        { key: 'company_name', label: 'Contractor', secondary: true },
    ]

    if (auth.isRegional) {
        base.push({ key: 'fo_id', label: 'Office', width: '7%', secondary: true })
    }

    base.push(
        { key: 'cshp_type', label: 'Type', width: '9%', secondary: true },
        { key: 'project_cost', label: 'Project cost', align: 'right', width: '12%' },
    )

    if (props.showRemarks) {
        base.push({ key: 'remarks', label: 'Remarks', sortable: false })
    }

    if (props.showDecision) {
        base.push({ key: 'decision', label: 'Decided', width: '14%' })
    }

    if (props.showStatus) {
        base.push({ key: 'status', label: 'Status', width: '11%' })
    }

    base.push({ key: 'actions', label: 'Actions', sortable: false, align: 'right', width: '14%' })

    return base
})

function search(row: CshpApplication): string {
    return [
        row.control_no,
        row.project_name,
        row.company_name,
        row.project_owner,
        row.project_address,
        cshpTypeName(row.cshp_type),
        fieldOfficeAbbreviation(row.fo_id),
    ].join(' ')
}

function sortValue(row: CshpApplication, key: string): string | number {
    switch (key) {
        case 'cshp_type':
            return cshpTypeName(row.cshp_type)
        case 'fo_id':
            return fieldOfficeAbbreviation(row.fo_id)
        case 'decision':
            return row.date_approved || row.date_reviewed || ''
        case 'status':
            return `${row.status}${row.denied_status}`
        default:
            return (row as unknown as Record<string, string | number>)[key] ?? ''
    }
}
</script>

<template>
    <div class="card">
        <DataTable
            :rows="rows"
            :columns="columns"
            :search="search"
            :sort-value="sortValue"
            search-placeholder="Search by control number, project, contractor or owner"
            :empty-title="emptyTitle"
            :empty-text="emptyText"
            empty-icon="clipboard"
        >
            <template #cell-control_no="{ row }">
                <NuxtLink :to="`/cshp/${row.id}`" class="mono font-semibold">
                    {{ row.control_no }}
                </NuxtLink>
                <div class="text-xs text-faint">{{ shortDate(row.date_received) }}</div>
            </template>

            <template #cell-project_name="{ row }">
                <NuxtLink :to="`/cshp/${row.id}`" class="font-medium" style="color: inherit">
                    {{ row.project_name }}
                </NuxtLink>
                <div class="text-xs text-muted">{{ row.project_owner }}</div>
            </template>

            <template #cell-company_name="{ row }">
                <span class="text-muted">{{ row.company_name }}</span>
            </template>

            <template #cell-fo_id="{ row }">
                <span class="text-muted">{{ fieldOfficeAbbreviation(row.fo_id) }}</span>
            </template>

            <template #cell-cshp_type="{ row }">
                <span class="badge badge--slate">{{ cshpTypeName(row.cshp_type) }}</span>
            </template>

            <template #cell-project_cost="{ row }">
                <span class="nowrap">{{ peso(row.project_cost) }}</span>
                <div class="text-xs text-faint">
                    {{ count(row.no_workers) }} {{ plural('worker', row.no_workers) }}
                </div>
            </template>

            <template #cell-remarks="{ row }">
                <span class="text-muted text-xs">{{ row.remarks || '—' }}</span>
            </template>

            <template #cell-decision="{ row }">
                <template v-if="row.date_approved">
                    <div class="font-medium">{{ row.approved_by }}</div>
                    <div class="text-xs text-faint">{{ shortDate(row.date_approved) }}</div>
                </template>
                <template v-else-if="row.date_reviewed">
                    <div class="font-medium">{{ row.reviewed_by }}</div>
                    <div class="text-xs text-faint">{{ shortDate(row.date_reviewed) }}</div>
                </template>
                <span v-else class="text-faint">&mdash;</span>
            </template>

            <template #cell-status="{ row }">
                <StatusBadge :status="row.status" :denied-status="row.denied_status" />
            </template>

            <template #cell-actions="{ row }">
                <div class="table__actions">
                    <NuxtLink
                        :to="`/cshp/${row.id}`"
                        class="btn btn--secondary btn--icon"
                        title="Open the programme"
                    >
                        <AppIcon name="eye" :size="14" />
                    </NuxtLink>

                    <NuxtLink
                        v-if="actions.permissions(row).edit"
                        :to="`/cshp/${row.id}/edit`"
                        class="btn btn--secondary btn--icon"
                        title="Amend the programme"
                    >
                        <AppIcon name="pencil" :size="14" />
                    </NuxtLink>

                    <button
                        v-if="actions.permissions(row).endorse"
                        type="button"
                        class="btn btn--secondary btn--icon"
                        title="Endorse for approval"
                        @click="actions.endorse(row)"
                    >
                        <AppIcon name="send" :size="14" />
                    </button>

                    <button
                        v-if="actions.permissions(row).approve"
                        type="button"
                        class="btn btn--secondary btn--icon"
                        title="Approve"
                        @click="actions.approve(row)"
                    >
                        <AppIcon name="check-circle" :size="14" />
                    </button>

                    <button
                        v-if="actions.permissions(row).returnIt"
                        type="button"
                        class="btn btn--secondary btn--icon"
                        title="Return for compliance"
                        @click="actions.returnForCompliance(row)"
                    >
                        <AppIcon name="rotate-ccw" :size="14" />
                    </button>

                    <button
                        v-if="actions.permissions(row).remove"
                        type="button"
                        class="btn btn--secondary btn--icon"
                        title="Delete the programme"
                        @click="actions.remove(row)"
                    >
                        <AppIcon name="trash" :size="14" />
                    </button>
                </div>
            </template>

            <template #empty-action>
                <slot name="empty-action" />
            </template>
        </DataTable>
    </div>
</template>
