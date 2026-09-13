<script setup lang="ts">
import { computed } from 'vue'
import type { Establishment } from '~/data/demo'
import type { Column } from '~/components/DataTable.vue'
import { ESTAB_STATUS, estabStatuses, fieldOfficeAbbreviation } from '~/data/reference'

/**
 * The register of establishments.
 *
 * This is the Rule 1020 registration a contractor makes once; a comprehensive
 * programme is filed against one of these, and a simple programme is filed
 * without one.
 */
useHead({ title: 'Establishments — CSHP Demo' })

const auth = useAuthStore()
const establishments = useEstablishmentsStore()
const cshp = useCshpStore()
const modal = useCshpModal()

const columns = computed<Column[]>(() => {
    const base: Column[] = [
        { key: 'business_name', label: 'Establishment', width: '26%' },
        { key: 'address', label: 'Location', width: '15%', secondary: true },
        { key: 'main_economy_activity', label: 'Nature of business', secondary: true },
        { key: 'employees', label: 'Employees', align: 'right', width: '10%' },
        { key: 'programmes', label: 'CSHP', align: 'right', width: '7%', secondary: true },
        { key: 'status', label: 'Status', width: '11%' },
    ]

    if (auth.isRegional) {
        base.splice(1, 0, { key: 'fo_id', label: 'Office', width: '8%', secondary: true })
    }

    base.push({ key: 'actions', label: 'Actions', sortable: false, align: 'right', width: '12%' })

    return base
})

const rows = computed(() => establishments.visible)

function search(row: Establishment): string {
    return [
        row.business_name,
        row.registered_name,
        row.control_no,
        row.municipality,
        row.province,
        row.main_economy_activity,
        fieldOfficeAbbreviation(row.fo_id),
    ].join(' ')
}

function sortValue(row: Establishment, key: string): string | number {
    switch (key) {
        case 'address':
            return `${row.province} ${row.municipality}`
        case 'employees':
            return establishments.totalEmployees(row)
        case 'programmes':
            return cshp.byEstablishment(row.id).length
        case 'fo_id':
            return fieldOfficeAbbreviation(row.fo_id)
        case 'status':
            return row.status
        default:
            return (row as unknown as Record<string, string | number>)[key] ?? ''
    }
}

function statusOf(row: Establishment) {
    return estabStatuses.find((entry) => entry.id === row.status)
}

async function confirmRegister(row: Establishment): Promise<void> {
    const { confirmed } = await modal.confirm({
        title: 'Mark as registered?',
        text: `${row.business_name} will be treated as registered under Rule 1020, and comprehensive programmes may then be filed against it.`,
        confirmText: 'Mark registered',
    })

    if (confirmed) {
        establishments.markRegistered(row.id)
        toast(`${row.business_name} is now registered.`)
    }
}

async function confirmRemove(row: Establishment): Promise<void> {
    const programmes = cshp.byEstablishment(row.id).length

    const { confirmed } = await modal.confirm({
        title: 'Delete this establishment?',
        text: programmes
            ? `${row.business_name} has ${programmes} ${plural('programme', programmes)} filed against it. Deleting the establishment leaves those programmes without one. This cannot be undone.`
            : `${row.business_name} will be removed from the register. This cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
    })

    if (confirmed) {
        establishments.remove(row.id)
        toast('Establishment deleted.')
    }
}
</script>

<template>
    <div>
        <PageHeader
            title="Establishments"
            :lead="
                auth.isRegional
                    ? 'Every establishment registered under Rule 1020, across all field offices.'
                    : `Establishments registered with the ${auth.officeName}.`
            "
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Establishments' }]"
        >
            <template #actions>
                <NuxtLink v-if="auth.canFile" to="/establishments/register" class="btn btn--primary">
                    <AppIcon name="plus" :size="15" />
                    Register (Rule 1020)
                </NuxtLink>
            </template>
        </PageHeader>

        <div class="card">
            <DataTable
                :rows="rows"
                :columns="columns"
                :search="search"
                :sort-value="sortValue"
                search-placeholder="Search by name, control number, location or business"
                empty-title="No establishments registered"
                empty-text="Register an establishment before filing a comprehensive programme against it."
                empty-icon="building"
            >
                <template #empty-action>
                    <NuxtLink v-if="auth.canFile" to="/establishments/register" class="btn btn--primary">
                        <AppIcon name="plus" :size="15" />
                        Register the first one
                    </NuxtLink>
                </template>

                <template #cell-business_name="{ row }">
                    <NuxtLink :to="`/establishments/${row.id}`" class="font-semibold">
                        {{ row.business_name }}
                    </NuxtLink>
                    <div class="mono text-xs text-faint">{{ row.control_no }}</div>
                </template>

                <template #cell-fo_id="{ row }">
                    <span class="text-muted">{{ fieldOfficeAbbreviation(row.fo_id) }}</span>
                </template>

                <template #cell-address="{ row }">
                    <span class="text-muted">{{ row.municipality }}, {{ row.province }}</span>
                </template>

                <template #cell-main_economy_activity="{ row }">
                    <span class="text-muted">{{ row.main_economy_activity }}</span>
                </template>

                <template #cell-employees="{ row }">
                    <span class="font-medium">{{ count(establishments.totalEmployees(row)) }}</span>
                </template>

                <template #cell-programmes="{ row }">
                    <span class="text-muted">{{ cshp.byEstablishment(row.id).length }}</span>
                </template>

                <template #cell-status="{ row }">
                    <span class="badge" :class="`badge--${statusOf(row)?.tone}`">
                        {{ statusOf(row)?.name }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="table__actions">
                        <NuxtLink
                            :to="`/establishments/${row.id}`"
                            class="btn btn--secondary btn--icon"
                            title="Open the profile"
                        >
                            <AppIcon name="eye" :size="14" />
                        </NuxtLink>

                        <button
                            v-if="auth.canReview && row.status === ESTAB_STATUS.forReview"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            title="Mark as registered"
                            @click="confirmRegister(row)"
                        >
                            <AppIcon name="check" :size="14" />
                        </button>

                        <NuxtLink
                            v-if="auth.canFile"
                            :to="`/establishments/${row.id}/edit`"
                            class="btn btn--secondary btn--icon"
                            title="Amend the registration"
                        >
                            <AppIcon name="pencil" :size="14" />
                        </NuxtLink>

                        <button
                            v-if="auth.canFile"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            title="Delete the registration"
                            @click="confirmRemove(row)"
                        >
                            <AppIcon name="trash" :size="14" />
                        </button>
                    </div>
                </template>
            </DataTable>
        </div>
    </div>
</template>
