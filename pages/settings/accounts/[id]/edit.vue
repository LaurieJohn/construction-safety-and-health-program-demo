<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { AccountDraft } from '~/stores/accounts'

/** Amend a user account. */
const route = useRoute()
const auth = useAuthStore()
const accounts = useAccountsStore()

const id = computed(() => Number(route.params.id))
const account = computed(() => accounts.find(id.value))

useHead({ title: 'Amend Account — CSHP Demo' })

const initial = computed<AccountDraft | null>(() => {
    if (!account.value) {
        return null
    }

    const { id: _id, created_at: _createdAt, ...draft } = account.value

    return draft
})

async function onSubmit(draft: AccountDraft): Promise<void> {
    accounts.update(id.value, draft)

    // Amending the signed-in account can change its role or deactivate it, so
    // the top bar is re-checked before the next page reads it.
    auth.ensureValid()

    toast('Account updated.')

    await navigateTo('/settings/accounts')
}
</script>

<template>
    <div>
        <PageHeader
            :title="account ? `${account.first_name} ${account.last_name}` : 'Account'"
            lead="Amend the person, the role or the office this account belongs to."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Settings' },
                { label: 'Account Management', to: '/settings/accounts' },
                { label: 'Amend' },
            ]"
        />

        <div v-if="!auth.canManageAccounts" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                Account management belongs to the administrator. Switch to
                <strong>Marisol Ferrer</strong> in the account menu to try this form.
            </div>
        </div>

        <div v-else-if="!initial" class="card">
            <EmptyState
                title="No such account"
                text="This account is not on the list — it may have been deleted."
                icon="alert-circle"
            >
                <NuxtLink to="/settings/accounts" class="btn btn--primary">
                    <AppIcon name="arrow-left" :size="15" />
                    Back to accounts
                </NuxtLink>
            </EmptyState>
        </div>

        <AccountForm
            v-else
            :initial="initial"
            :editing-id="id"
            submit-label="Save changes"
            @submit="onSubmit"
        />
    </div>
</template>
