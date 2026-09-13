<script setup lang="ts">
import { computed } from 'vue'
import type { DemoUser } from '~/data/demo'
import type { Column } from '~/components/DataTable.vue'
import { ROLE, fieldOfficeName, roleName, roles } from '~/data/reference'

/**
 * Settings → Account Management.
 *
 * The one settings screen this demo carries. It is also where the account
 * switcher in the top bar gets its list, so deactivating an account here takes
 * it out of the switcher, and deleting the account you are signed in as moves
 * you to another one — which is what a real sign-out would do.
 */
useHead({ title: 'Account Management — CSHP Demo' })

const auth = useAuthStore()
const accounts = useAccountsStore()
const modal = useCshpModal()

const columns: Column[] = [
    { key: 'name', label: 'Name', width: '26%' },
    { key: 'email', label: 'Email', secondary: true },
    { key: 'user_type', label: 'Role', width: '18%' },
    { key: 'fo_id', label: 'Office', width: '16%', secondary: true },
    { key: 'status', label: 'Status', width: '10%' },
    { key: 'actions', label: 'Actions', sortable: false, align: 'right', width: '13%' },
]

const rows = computed(() => accounts.sorted)

const roleCounts = computed(() =>
    roles.map((role) => ({
        ...role,
        total: accounts.countByRole(role.id),
    })),
)

function search(row: DemoUser): string {
    return [
        row.first_name,
        row.last_name,
        row.email,
        roleName(row.user_type),
        fieldOfficeName(row.fo_id),
    ].join(' ')
}

function sortValue(row: DemoUser, key: string): string | number {
    switch (key) {
        case 'name':
            return `${row.last_name} ${row.first_name}`
        case 'user_type':
            return roleName(row.user_type)
        case 'fo_id':
            return fieldOfficeName(row.fo_id)
        default:
            return (row as unknown as Record<string, string | number>)[key] ?? ''
    }
}

async function toggleStatus(row: DemoUser): Promise<void> {
    if (row.status === 1 && accounts.isLastAdministrator(row.id)) {
        await modal.notice({
            title: 'This is the last administrator',
            text: 'Deactivating it would leave nobody able to manage accounts. Appoint another administrator first.',
            variant: 'warning',
        })

        return
    }

    const { confirmed } = await modal.confirm({
        title: row.status === 1 ? 'Deactivate this account?' : 'Reactivate this account?',
        text:
            row.status === 1
                ? `${row.first_name} ${row.last_name} will keep every record they filed, but the account will no longer be offered in the account switcher.`
                : `${row.first_name} ${row.last_name} will be able to sign in again.`,
        confirmText: row.status === 1 ? 'Deactivate' : 'Reactivate',
        variant: row.status === 1 ? 'danger' : 'primary',
    })

    if (!confirmed) {
        return
    }

    accounts.toggleStatus(row.id)
    auth.ensureValid()

    toast(row.status === 1 ? 'Account reactivated.' : 'Account deactivated.')
}

async function confirmRemove(row: DemoUser): Promise<void> {
    if (accounts.isLastAdministrator(row.id)) {
        await modal.notice({
            title: 'This is the last administrator',
            text: 'Deleting it would leave nobody able to manage accounts. Appoint another administrator first.',
            variant: 'warning',
        })

        return
    }

    const { confirmed } = await modal.confirm({
        title: 'Delete this account?',
        text:
            row.id === auth.userId
                ? `${row.first_name} ${row.last_name} is the account you are signed in as. Deleting it will move you to another account. This cannot be undone.`
                : `${row.first_name} ${row.last_name} will be removed. This cannot be undone.`,
        confirmText: 'Delete',
        variant: 'danger',
    })

    if (!confirmed) {
        return
    }

    accounts.remove(row.id)
    auth.ensureValid()

    toast('Account deleted.')
}

async function signInAs(row: DemoUser): Promise<void> {
    auth.signInAs(row.id)

    await navigateTo('/dashboard')
}
</script>

<template>
    <div>
        <PageHeader
            title="Account Management"
            lead="Who may use the system, and what each of them can reach. This list is also what the account switcher in the top bar offers."
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Settings' }, { label: 'Account Management' }]"
        >
            <template #actions>
                <NuxtLink
                    v-if="auth.canManageAccounts"
                    to="/settings/accounts/create"
                    class="btn btn--primary"
                >
                    <AppIcon name="user-plus" :size="15" />
                    Add account
                </NuxtLink>
            </template>
        </PageHeader>

        <div v-if="!auth.canManageAccounts" class="alert alert--info mb-3">
            <AppIcon class="alert__icon" name="info" :size="16" />
            <div>
                Account management belongs to the administrator. The {{ auth.role }} account reads
                this list without changing it &mdash; switch to
                <strong>Marisol Ferrer</strong> in the account menu to try it.
            </div>
        </div>

        <div class="grid grid-4 mb-4">
            <div v-for="role in roleCounts" :key="role.id" class="stat">
                <div class="stat__head">
                    <span class="stat__label">{{ role.name }}</span>
                    <span
                        class="stat__icon"
                        :class="role.id === ROLE.administrator ? 'stat__icon--violet' : ''"
                    >
                        <AppIcon name="user" :size="17" />
                    </span>
                </div>
                <p class="stat__value mb-0">{{ role.total }}</p>
                <p class="stat__hint mb-0">{{ role.description }}</p>
            </div>
        </div>

        <div class="card">
            <DataTable
                :rows="rows"
                :columns="columns"
                :search="search"
                :sort-value="sortValue"
                search-placeholder="Search by name, email, role or office"
                empty-title="No accounts"
                empty-text="Nobody can use the system until an account exists."
                empty-icon="users"
            >
                <template #cell-name="{ row }">
                    <div style="display: flex; align-items: center; gap: 0.625rem">
                        <span class="avatar">{{ initials(row.first_name, row.last_name) }}</span>
                        <span>
                            <span class="font-semibold">
                                {{ row.first_name }} {{ row.last_name }}
                            </span>
                            <span v-if="row.id === auth.userId" class="badge badge--blue" style="margin-left: 0.375rem">
                                You
                            </span>
                            <span class="text-xs text-faint d-block">
                                Added {{ shortDate(row.created_at) }}
                            </span>
                        </span>
                    </div>
                </template>

                <template #cell-email="{ row }">
                    <span class="text-muted">{{ row.email }}</span>
                    <span v-if="row.phone" class="text-xs text-faint d-block">{{ row.phone }}</span>
                </template>

                <template #cell-user_type="{ row }">
                    <span
                        class="badge"
                        :class="row.user_type === ROLE.administrator ? 'badge--violet' : 'badge--slate'"
                    >
                        {{ roleName(row.user_type) }}
                    </span>
                </template>

                <template #cell-fo_id="{ row }">
                    <span class="text-muted">{{ fieldOfficeName(row.fo_id) }}</span>
                </template>

                <template #cell-status="{ row }">
                    <span class="badge" :class="row.status === 1 ? 'badge--green' : 'badge--slate'">
                        {{ row.status === 1 ? 'Active' : 'Deactivated' }}
                    </span>
                </template>

                <template #cell-actions="{ row }">
                    <div class="table__actions">
                        <button
                            v-if="row.status === 1 && row.id !== auth.userId"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            title="Look around as this account"
                            @click="signInAs(row)"
                        >
                            <AppIcon name="switch-account" :size="14" />
                        </button>

                        <NuxtLink
                            v-if="auth.canManageAccounts"
                            :to="`/settings/accounts/${row.id}/edit`"
                            class="btn btn--secondary btn--icon"
                            title="Amend this account"
                        >
                            <AppIcon name="pencil" :size="14" />
                        </NuxtLink>

                        <button
                            v-if="auth.canManageAccounts"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            :title="row.status === 1 ? 'Deactivate' : 'Reactivate'"
                            @click="toggleStatus(row)"
                        >
                            <AppIcon :name="row.status === 1 ? 'x-circle' : 'check-circle'" :size="14" />
                        </button>

                        <button
                            v-if="auth.canManageAccounts"
                            type="button"
                            class="btn btn--secondary btn--icon"
                            title="Delete this account"
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

<style scoped>
.d-block {
    display: block;
}
</style>
