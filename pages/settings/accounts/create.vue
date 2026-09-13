<script setup lang="ts">
import { ROLE, fieldOffices } from '~/data/reference'
import type { AccountDraft } from '~/stores/accounts'

/** Add a user account. */
useHead({ title: 'Add Account — CSHP Demo' })

const auth = useAuthStore()
const accounts = useAccountsStore()

const initial: AccountDraft = {
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    user_type: ROLE.focal,
    fo_id: fieldOffices.find((office) => !office.is_regional)?.id ?? 2,
    status: 1,
}

async function onSubmit(draft: AccountDraft): Promise<void> {
    const created = accounts.create(draft)

    toast(`${created.first_name} ${created.last_name} added.`)

    await navigateTo('/settings/accounts')
}
</script>

<template>
    <div>
        <PageHeader
            title="Add Account"
            lead="A new account appears in the list, and in the account switcher in the top bar."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Settings' },
                { label: 'Account Management', to: '/settings/accounts' },
                { label: 'Add' },
            ]"
        />

        <div v-if="!auth.canManageAccounts" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                Account management belongs to the administrator. Switch to
                <strong>Marisol Ferrer</strong> in the account menu to try this form.
            </div>
        </div>

        <AccountForm v-else :initial="initial" submit-label="Add account" @submit="onSubmit" />
    </div>
</template>
