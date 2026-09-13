import { defineStore } from 'pinia'
import { users, type DemoUser } from '~/data/demo'
import { ROLE, type RoleId } from '~/data/reference'
import { now } from '~/composables/useFormat'

/** The fields Account Management writes. The id and created_at are the store's. */
export type AccountDraft = Omit<DemoUser, 'id' | 'created_at'>

/**
 * The user accounts.
 *
 * This is what Settings → Account Management edits, and it is also where the
 * role switcher in the top bar gets its list — deactivate an account here and
 * it stops being offered there, the way disabling a login would.
 *
 * The store copies the seed data on creation and mutates its own copy, so the
 * demo behaves like the real thing for a session and starts clean on reload.
 */
export const useAccountsStore = defineStore('accounts', {
    state: () => ({
        accounts: users.map((account) => ({ ...account })) as DemoUser[],
    }),

    getters: {
        /** Sorted the way the old manage-users table was: by surname. */
        sorted(state): DemoUser[] {
            return [...state.accounts].sort((a, b) => a.last_name.localeCompare(b.last_name))
        },

        active(state): DemoUser[] {
            return state.accounts.filter((account) => account.status === 1)
        },

        find(state) {
            return (id: number): DemoUser | undefined =>
                state.accounts.find((account) => account.id === id)
        },

        /** Whether an email is already spoken for, ignoring the account editing it. */
        emailTaken(state) {
            return (email: string, exceptId = 0): boolean =>
                state.accounts.some(
                    (account) =>
                        account.id !== exceptId &&
                        account.email.toLowerCase() === email.trim().toLowerCase(),
                )
        },

        countByRole(state) {
            return (roleId: RoleId): number =>
                state.accounts.filter((account) => account.user_type === roleId).length
        },
    },

    actions: {
        create(draft: AccountDraft): DemoUser {
            const account: DemoUser = {
                ...draft,
                id: this.nextId(),
                created_at: now(),
            }

            this.accounts.push(account)

            return account
        },

        update(id: number, draft: AccountDraft): void {
            const index = this.accounts.findIndex((account) => account.id === id)

            if (index === -1) {
                return
            }

            this.accounts[index] = { ...this.accounts[index], ...draft }
        },

        /** The old table's stop/tick control: deny or restore a sign-in. */
        toggleStatus(id: number): void {
            const account = this.accounts.find((candidate) => candidate.id === id)

            if (account) {
                account.status = account.status === 1 ? 0 : 1
            }
        },

        remove(id: number): void {
            const index = this.accounts.findIndex((account) => account.id === id)

            if (index !== -1) {
                this.accounts.splice(index, 1)
            }
        },

        /**
         * The last administrator cannot be removed or deactivated: an account
         * list nobody can reach is a dead end the demo would not recover from
         * without a reload.
         */
        isLastAdministrator(id: number): boolean {
            const administrators = this.accounts.filter(
                (account) => account.user_type === ROLE.administrator && account.status === 1,
            )

            return administrators.length === 1 && administrators[0].id === id
        },

        nextId(): number {
            return this.accounts.reduce((highest, account) => Math.max(highest, account.id), 0) + 1
        },
    },
})
