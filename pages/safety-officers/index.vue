<script setup lang="ts">
import { computed } from 'vue'
import type { SafetyOfficer } from '~/data/demo'
import type { Column } from '~/components/DataTable.vue'
import { SO_TYPE, fieldOfficeAbbreviation, soTypeName } from '~/data/reference'

/**
 * The register of Safety Officers and First Aiders.
 *
 * A field office sees its own; a regional account sees every office's, with the
 * office named in a column that only appears for them.
 */
useHead({ title: 'Safety Officers & First Aiders — CSHP Demo' })

const auth = useAuthStore()
const officers = useSafetyOfficersStore()
const modal = useCshpModal()

const columns = computed<Column[]>(() => {
    const base: Column[] = [
        { key: 'name', label: 'Full name', width: '24%' },
        { key: 'type', label: 'Type', width: '12%' },
        { key: 'training', label: 'Training', secondary: true },
        { key: 'valid_until', label: 'Valid until', width: '13%' },
        { key: 'id_no', label: 'ID No.', secondary: true },
    ]

    if (auth.isRegional) {
        base.splice(2, 0, { key: 'fo_id', label: 'Office', width: '9%', secondary: true })
    }

    base.push({ key: 'actions', label: 'Actions', sortable: false, align: 'right', width: '11%' })

    return base
})

const rows = computed(() => officers.visible)

function search(row: SafetyOfficer): string {
    return [
        row.first_name,
        row.middle_name,
        row.last_name,
        row.id_no,
        soTypeName(row.type),
        fieldOfficeAbbreviation(row.fo_id),
    ].join(' ')
}

function sortValue(row: SafetyOfficer, key: string): string | number {
    switch (key) {
        case 'name':
            return `${row.last_name} ${row.first_name}`
        case 'type':
            return soTypeName(row.type)
        case 'fo_id':
            return fieldOfficeAbbreviation(row.fo_id)
        case 'training':
            return row.date_so_training || row.date_fa_training || ''
        default:
            return (row as unknown as Record<string, string | number>)[key] ?? ''
    }
}

/** A lapsed first-aid card is worth saying out loud, not leaving to a date. */
function isLapsed(row: SafetyOfficer): boolean {
    return row.valid_until !== '' && isPast(row.valid_until)
}

async function confirmRemove(row: SafetyOfficer): Promise<void> {
    const { confirmed } = await modal.confirm({
        title: 'Remove from the register?',
        text: `${officers.displayName(row)} will no longer be available to name on a programme. This cannot be undone.`,
        confirmText: 'Remove',
        variant: 'danger',
    })

    if (confirmed) {
        officers.remove(row.id)
        toast('Removed from the register.')
    }
}
</script>

<template>
    <div>
        <PageHeader
            title="Safety Officers & First Aiders"
            :lead="
                auth.isRegional
                    ? 'Everyone on the register across all field offices.'
                    : `Everyone on the ${auth.officeName} register.`
            "
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Safety Officers & First Aiders' }]"
        >
            <template #actions>
                <NuxtLink
                    v-if="auth.canRegisterPersonnel"
                    to="/safety-officers/register"
                    class="btn btn--primary"
                >
                    <AppIcon name="user-plus" :size="15" />
                    Register
                </NuxtLink>
            </template>
        </PageHeader>

        <div v-if="officers.lapsed.length" class="alert alert--warning mb-3">
            <AppIcon class="alert__icon" name="alert-triangle" :size="16" />
            <div>
                {{ officers.lapsed.length }}
                {{ plural('first-aid card', officers.lapsed.length) }}
                on this register {{ officers.lapsed.length === 1 ? 'has' : 'have' }} lapsed. A
                programme naming a lapsed card will be returned for compliance.
            </div>
        </div>

        <div class="card">
            <DataTable
                :rows="rows"
                :columns="columns"
                :search="search"
                :sort-value="sortValue"
                search-placeholder="Search by name, ID number or type"
                empty-title="Nobody on the register yet"
                empty-text="Register the safety officers and first aiders your office keeps on file."
                empty-icon="hard-hat"
            >
                <template #empty-action>
                    <NuxtLink
                        v-if="auth.canRegisterPersonnel"
                        to="/safety-officers/register"
                        class="btn btn--primary"
                    >
                        <AppIcon name="user-plus" :size="15" />
                        Register the first one
                    </NuxtLink>
                </template>

                <template #cell-name="{ row }">
                    <span class="font-semibold">{{ officers.displayName(row) }}</span>
                </template>

                <template #cell-type="{ row }">
                    <span
                        class="badge"
                        :class="row.type === SO_TYPE.both ? 'badge--violet' : 'badge--slate'"
                    >
                        {{ soTypeName(row.type) }}
                    </span>
                </template>

                <template #cell-fo_id="{ row }">
                    <span class="text-muted">{{ fieldOfficeAbbreviation(row.fo_id) }}</span>
                </template>

                <template #cell-training="{ row }">
                    <span class="text-muted text-xs">
                        <template v-if="row.date_so_training">
                            BOSH {{ shortDate(row.date_so_training) }}
                        </template>
                        <template v-if="row.date_so_training && row.date_fa_training">
                            &middot;
                        </template>
                        <template v-if="row.date_fa_training">
                            First aid {{ shortDate(row.date_fa_training) }}
                        </template>
                    </span>
                </template>

                <template #cell-valid_until="{ row }">
                    <span v-if="!row.valid_until" class="text-faint">&mdash;</span>
                    <span v-else-if="isLapsed(row)" class="badge badge--red">
                        {{ shortDate(row.valid_until) }}
                    </span>
                    <span v-else class="nowrap">{{ shortDate(row.valid_until) }}</span>
                </template>

                <template #cell-id_no="{ row }">
                    <span class="mono text-muted nowrap">{{ row.id_no || '—' }}</span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="table__actions">
                        <a
                            v-if="row.cert_file"
                            :href="row.cert_file"
                            class="btn btn--secondary btn--icon"
                            target="_blank"
                            rel="noopener"
                            title="Open the certificate"
                        >
                            <AppIcon name="file-text" :size="14" />
                        </a>

                        <NuxtLink
                            v-if="auth.canRegisterPersonnel"
                            :to="`/safety-officers/${row.id}/edit`"
                            class="btn btn--secondary btn--icon"
                            title="Amend this record"
                        >
                            <AppIcon name="pencil" :size="14" />
                        </NuxtLink>

                        <button
                            v-if="auth.canRegisterPersonnel"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            title="Remove from the register"
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
