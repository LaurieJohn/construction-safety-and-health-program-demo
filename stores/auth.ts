import { defineStore } from 'pinia'
import { DEFAULT_USER_ID, type DemoUser } from '~/data/demo'
import {
    ROLE,
    fieldOffices,
    roleName,
    type FieldOffice,
    type RoleId,
} from '~/data/reference'
import { initials } from '~/composables/useFormat'
import { useAccountsStore } from './accounts'

/**
 * Who is using the demo.
 *
 * The real system took this from the session after a login. There is no login
 * here, so the account is chosen: the switcher in the top bar is how the demo
 * shows the system as each kind of user, because nearly every screen reads the
 * viewer's role to decide what it offers.
 *
 * The rules below came out of the PHP controllers — `user_type == 4` files,
 * `user_type == 3` reviews, `user_type == 2` approves — and they live here
 * rather than being re-derived in each page.
 */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        userId: DEFAULT_USER_ID,
    }),

    getters: {
        /** Only accounts that may sign in are offered in the switcher. */
        accounts(): DemoUser[] {
            return useAccountsStore().active
        },

        user(state): DemoUser {
            const accounts = useAccountsStore()

            return accounts.find(state.userId) ?? accounts.active[0] ?? accounts.accounts[0]
        },

        roleId(): RoleId {
            return this.user.user_type
        },

        role(): string {
            return roleName(this.roleId)
        },

        name(): string {
            return `${this.user.first_name} ${this.user.last_name}`
        },

        /** `Halcon, Beatriz` — the form a reviewer's name is recorded in. */
        signature(): string {
            return `${this.user.last_name}, ${this.user.first_name}`
        },

        initials(): string {
            return initials(this.user.first_name, this.user.last_name)
        },

        office(): FieldOffice | null {
            return fieldOffices.find((office) => office.id === this.user.fo_id) ?? null
        },

        officeName(): string {
            return this.office?.name ?? 'Unassigned'
        },

        /**
         * A regional account sees every office's filings; a field office sees
         * its own. This is the `fo_id` filter the PHP models applied to nearly
         * every query.
         */
        isRegional(): boolean {
            return this.office?.is_regional ?? false
        },

        isAdministrator(): boolean {
            return this.roleId === ROLE.administrator
        },

        /**
         * Field offices file establishments and programmes. So does an
         * administrator, standing in for one.
         */
        canFile(): boolean {
            return [ROLE.focal, ROLE.administrator].includes(this.roleId as 1 | 4)
        },

        /**
         * The register of Safety Officers and First Aiders is kept by the field
         * offices and by the region alike — both menus carried the Register
         * entry. Only the approving officer reads it without adding to it.
         */
        canRegisterPersonnel(): boolean {
            return this.roleId !== ROLE.approver
        },

        /** Reviewers endorse a filing, or return it for compliance. */
        canReview(): boolean {
            return [ROLE.reviewer, ROLE.administrator].includes(this.roleId as 1 | 3)
        },

        /** The approving officer signs off on what the reviewers endorsed. */
        canApprove(): boolean {
            return [ROLE.approver, ROLE.administrator].includes(this.roleId as 1 | 2)
        },

        /** Account management belongs to the administrator alone. */
        canManageAccounts(): boolean {
            return this.roleId === ROLE.administrator
        },
    },

    actions: {
        signInAs(userId: number): void {
            this.userId = userId
        },

        /**
         * Keeps the viewer valid after Account Management removes or
         * deactivates whoever is signed in — otherwise the top bar would be
         * showing an account that no longer exists.
         */
        ensureValid(): void {
            const accounts = useAccountsStore()
            const current = accounts.find(this.userId)

            if (!current || current.status === 0) {
                this.userId = accounts.active[0]?.id ?? accounts.accounts[0]?.id ?? 0
            }
        },
    },
})
