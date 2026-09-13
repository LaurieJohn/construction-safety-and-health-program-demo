import { defineStore } from 'pinia'
import { establishments, type Establishment } from '~/data/demo'
import { ESTAB_STATUS } from '~/data/reference'
import { now } from '~/composables/useFormat'
import { useAuthStore } from './auth'

/** The fields the registration form writes. */
export type EstablishmentDraft = Omit<Establishment, 'id' | 'control_no' | 'created_at'>

/**
 * The registered establishments.
 *
 * This is the one-time registration a contractor makes before it can file a
 * comprehensive programme; a simple programme for a single project is filed
 * without one.
 */
export const useEstablishmentsStore = defineStore('establishments', {
    state: () => ({
        establishments: establishments.map((entry) => ({ ...entry })) as Establishment[],
    }),

    getters: {
        /** A field office sees its own registrations; the region sees all. */
        visible(state): Establishment[] {
            const auth = useAuthStore()

            if (auth.isRegional) {
                return state.establishments
            }

            return state.establishments.filter((entry) => entry.fo_id === auth.user.fo_id)
        },

        find(state) {
            return (id: number): Establishment | undefined =>
                state.establishments.find((entry) => entry.id === id)
        },

        /** Those a comprehensive programme may be filed against. */
        registered(): Establishment[] {
            return this.visible.filter(
                (entry: Establishment) => entry.status === ESTAB_STATUS.registered,
            )
        },

        forReview(): Establishment[] {
            return this.visible.filter(
                (entry: Establishment) => entry.status === ESTAB_STATUS.forReview,
            )
        },

        /** The head count the form derives rather than asks for. */
        totalEmployees() {
            return (entry: Establishment): number =>
                entry.male_filipino +
                entry.male_r_alien +
                entry.male_nr_alien +
                entry.female_filipino +
                entry.female_r_alien +
                entry.female_nr_alien
        },

        totalMale() {
            return (entry: Establishment): number =>
                entry.male_filipino + entry.male_r_alien + entry.male_nr_alien
        },

        totalFemale() {
            return (entry: Establishment): number =>
                entry.female_filipino + entry.female_r_alien + entry.female_nr_alien
        },

        /** `14 Mariposa Street, Bagong Silang, Northgate City, Northgate 8000` */
        address() {
            return (entry: Establishment): string =>
                [entry.street, entry.barangay, entry.municipality, `${entry.province} ${entry.zip_code}`]
                    .map((part) => part.trim())
                    .filter(Boolean)
                    .join(', ')
        },
    },

    actions: {
        create(draft: EstablishmentDraft): Establishment {
            const id = this.nextId()

            const entry: Establishment = {
                ...draft,
                id,
                control_no: this.nextControlNo(id),
                created_at: now(),
            }

            this.establishments.push(entry)

            return entry
        },

        update(id: number, draft: EstablishmentDraft): void {
            const index = this.establishments.findIndex((entry) => entry.id === id)

            if (index === -1) {
                return
            }

            this.establishments[index] = { ...this.establishments[index], ...draft }
        },

        /** The reviewer's one decision here: the registration stands. */
        markRegistered(id: number): void {
            const entry = this.establishments.find((candidate) => candidate.id === id)

            if (entry) {
                entry.status = ESTAB_STATUS.registered
            }
        },

        remove(id: number): void {
            const index = this.establishments.findIndex((entry) => entry.id === id)

            if (index !== -1) {
                this.establishments.splice(index, 1)
            }
        },

        nextId(): number {
            return this.establishments.reduce((highest, entry) => Math.max(highest, entry.id), 0) + 1
        },

        /** `EST-2026-0009`, continuing the series the seed data starts. */
        nextControlNo(id: number): string {
            return `EST-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`
        },
    },
})
