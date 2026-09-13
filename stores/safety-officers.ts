import { defineStore } from 'pinia'
import { safetyOfficers, type SafetyOfficer } from '~/data/demo'
import { SO_TYPE, soTypes, type SoTypeId } from '~/data/reference'
import { fullName, isPast, now } from '~/composables/useFormat'
import { useAuthStore } from './auth'

/** The fields the register form writes. The id and created_at are the store's. */
export type SafetyOfficerDraft = Omit<SafetyOfficer, 'id' | 'created_at'>

/**
 * The Safety Officers and First Aiders on record.
 *
 * A person is registered once and then named on as many programmes as they are
 * assigned to, which is why this is its own list rather than fields on a
 * programme.
 */
export const useSafetyOfficersStore = defineStore('safety-officers', {
    state: () => ({
        officers: safetyOfficers.map((officer) => ({ ...officer })) as SafetyOfficer[],
    }),

    getters: {
        /**
         * What the signed-in account may see: a field office sees its own
         * register, a regional account sees every office's.
         */
        visible(state): SafetyOfficer[] {
            const auth = useAuthStore()

            if (auth.isRegional) {
                return state.officers
            }

            return state.officers.filter((officer) => officer.fo_id === auth.user.fo_id)
        },

        find(state) {
            return (id: number): SafetyOfficer | undefined =>
                state.officers.find((officer) => officer.id === id)
        },

        /** `Baltazar, Anselmo R.` — the form the programme forms record. */
        displayName() {
            return (officer: SafetyOfficer): string =>
                fullName(officer.first_name, officer.last_name, officer.middle_name)
        },

        countByType() {
            return (type: SoTypeId): number =>
                this.visible.filter((officer: SafetyOfficer) => officer.type === type).length
        },

        /**
         * A first-aid card has a validity; a lapsed one is the single most
         * common reason a programme is returned, so it is counted on the
         * dashboard.
         */
        lapsed(): SafetyOfficer[] {
            return this.visible.filter(
                (officer: SafetyOfficer) => officer.valid_until !== '' && isPast(officer.valid_until),
            )
        },

        /** Everyone who may be named as a safety officer on a programme. */
        eligibleSafetyOfficers(): SafetyOfficer[] {
            return this.visible.filter((officer: SafetyOfficer) =>
                [SO_TYPE.safetyOfficer, SO_TYPE.both].includes(officer.type as 1 | 3),
            )
        },

        /** Everyone who may be named as a first aider on a programme. */
        eligibleFirstAiders(): SafetyOfficer[] {
            return this.visible.filter((officer: SafetyOfficer) =>
                [SO_TYPE.firstAider, SO_TYPE.both].includes(officer.type as 2 | 3),
            )
        },
    },

    actions: {
        /**
         * The old form refused a second record for the same person, which is
         * the one duplicate check worth keeping: the same name registered twice
         * leaves two training histories where there should be one.
         */
        exists(draft: SafetyOfficerDraft, exceptId = 0): boolean {
            const key = (officer: { first_name: string; last_name: string; middle_name: string }) =>
                `${officer.first_name} ${officer.middle_name} ${officer.last_name}`
                    .toLowerCase()
                    .replace(/\s+/g, ' ')
                    .trim()

            return this.officers.some(
                (officer) => officer.id !== exceptId && key(officer) === key(draft),
            )
        },

        create(draft: SafetyOfficerDraft): SafetyOfficer {
            const officer: SafetyOfficer = {
                ...this.normalise(draft),
                id: this.nextId(),
                created_at: now(),
            }

            this.officers.push(officer)

            return officer
        },

        update(id: number, draft: SafetyOfficerDraft): void {
            const index = this.officers.findIndex((officer) => officer.id === id)

            if (index === -1) {
                return
            }

            this.officers[index] = { ...this.officers[index], ...this.normalise(draft) }
        },

        remove(id: number): void {
            const index = this.officers.findIndex((officer) => officer.id === id)

            if (index !== -1) {
                this.officers.splice(index, 1)
            }
        },

        /**
         * A type carries its own training dates. Switching type used to leave
         * the dates of the old one behind, so a first aider could keep a BOSH
         * date nobody had entered — the form cleared them and so does this.
         */
        normalise(draft: SafetyOfficerDraft): SafetyOfficerDraft {
            const type = soTypes.find((candidate) => candidate.id === draft.type)

            return {
                ...draft,
                date_so_training: type?.needs_bosh ? draft.date_so_training : '',
                date_fa_training: type?.needs_first_aid ? draft.date_fa_training : '',
                valid_until: type?.needs_first_aid ? draft.valid_until : '',
            }
        },

        nextId(): number {
            return this.officers.reduce((highest, officer) => Math.max(highest, officer.id), 0) + 1
        },
    },
})
