import { defineStore } from 'pinia'
import { cshpApplications, type CshpApplication } from '~/data/demo'
import {
    CSHP_STATUS,
    CSHP_TYPE,
    DENIED_STATUS,
    OH_PERSONNEL_THRESHOLD,
    type CshpTypeId,
} from '~/data/reference'
import { now, today } from '~/composables/useFormat'
import { useAuthStore } from './auth'

/** The fields a programme form writes. The rest belong to the workflow. */
export type CshpDraft = Omit<
    CshpApplication,
    | 'id'
    | 'control_no'
    | 'created_at'
    | 'status'
    | 'denied_status'
    | 'remarks'
    | 'reviewed_by'
    | 'date_reviewed'
    | 'approved_by'
    | 'date_approved'
>

/**
 * The Construction Safety and Health Programmes.
 *
 * The route, taken from the PHP models, is three states with a return running
 * alongside them:
 *
 *   For Review ──endorse──▶ For Approval ──approve──▶ Approved
 *       ▲   │                     │
 *       │   └──return──┐          └──return──┐
 *       └──────────────┴─────────────────────┘
 *
 * A return does not move the programme back a stage — it sets `denied_status`
 * while the programme stays For Review, which is why the Denied listing and the
 * For Review listing both read `status = 1` and differ only on that column.
 * Editing a returned programme clears the return, the way saving the old form
 * did.
 */
export const useCshpStore = defineStore('cshp', {
    state: () => ({
        applications: cshpApplications.map((entry) => ({ ...entry })) as CshpApplication[],
    }),

    getters: {
        /** A field office sees its own filings; a regional account sees all. */
        visible(state): CshpApplication[] {
            const auth = useAuthStore()

            if (auth.isRegional) {
                return state.applications
            }

            return state.applications.filter((entry) => entry.fo_id === auth.user.fo_id)
        },

        find(state) {
            return (id: number): CshpApplication | undefined =>
                state.applications.find((entry) => entry.id === id)
        },

        /** `status = 1 AND denied_status = 0` — waiting on a reviewer. */
        forReview(): CshpApplication[] {
            return this.visible.filter(
                (entry: CshpApplication) =>
                    entry.status === CSHP_STATUS.forReview &&
                    entry.denied_status === DENIED_STATUS.none,
            )
        },

        /** `status = 1 AND denied_status > 0` — returned, waiting on the filer. */
        denied(): CshpApplication[] {
            return this.visible.filter(
                (entry: CshpApplication) =>
                    entry.status === CSHP_STATUS.forReview &&
                    entry.denied_status !== DENIED_STATUS.none,
            )
        },

        /** `status = 2` — endorsed, waiting on the approving officer. */
        forApproval(): CshpApplication[] {
            return this.visible.filter(
                (entry: CshpApplication) => entry.status === CSHP_STATUS.forApproval,
            )
        },

        /** `status = 3` — approved and on file. */
        archives(): CshpApplication[] {
            return this.visible.filter(
                (entry: CshpApplication) => entry.status === CSHP_STATUS.approved,
            )
        },

        byEstablishment() {
            return (establishmentId: number): CshpApplication[] =>
                this.visible.filter(
                    (entry: CshpApplication) => entry.establishment_id === establishmentId,
                )
        },

        /**
         * Details, personnel and attachments are locked once a programme leaves
         * review — an endorsed or approved programme is a document someone has
         * already signed off on.
         */
        isEditable() {
            return (entry: CshpApplication): boolean => entry.status === CSHP_STATUS.forReview
        },

        /** A returned programme is the filer's to answer. */
        isReturned() {
            return (entry: CshpApplication): boolean => entry.denied_status !== DENIED_STATUS.none
        },

        /**
         * A project over the threshold must name an occupational health nurse,
         * physician and dentist. The comprehensive form reveals that section on
         * the same number.
         */
        needsOhPersonnel() {
            return (entry: Pick<CshpApplication, 'no_workers'>): boolean =>
                entry.no_workers > OH_PERSONNEL_THRESHOLD
        },

        /** The total value of everything approved, for the dashboard. */
        approvedValue(): number {
            return this.archives.reduce(
                (total: number, entry: CshpApplication) => total + entry.project_cost,
                0,
            )
        },

        /** Workers covered by approved programmes. */
        approvedWorkers(): number {
            return this.archives.reduce(
                (total: number, entry: CshpApplication) => total + entry.no_workers,
                0,
            )
        },
    },

    actions: {
        create(draft: CshpDraft): CshpApplication {
            const id = this.nextId()

            const entry: CshpApplication = {
                ...draft,
                id,
                control_no: this.nextControlNo(id),
                status: CSHP_STATUS.forReview,
                denied_status: DENIED_STATUS.none,
                remarks: '',
                reviewed_by: '',
                date_reviewed: '',
                approved_by: '',
                date_approved: '',
                created_at: now(),
            }

            this.applications.push(entry)

            return entry
        },

        /**
         * Saving a returned programme clears the return and puts it back in the
         * review queue — answering the remarks is the resubmission.
         */
        update(id: number, draft: CshpDraft): void {
            const index = this.applications.findIndex((entry) => entry.id === id)

            if (index === -1) {
                return
            }

            const current = this.applications[index]

            this.applications[index] = {
                ...current,
                ...draft,
                denied_status: DENIED_STATUS.none,
                remarks: current.denied_status === DENIED_STATUS.none ? current.remarks : '',
            }
        },

        /** The reviewer endorses: on to the approving officer. */
        endorse(id: number, remarks = ''): void {
            const entry = this.applications.find((candidate) => candidate.id === id)

            if (!entry) {
                return
            }

            const auth = useAuthStore()

            entry.status = CSHP_STATUS.forApproval
            entry.denied_status = DENIED_STATUS.none
            entry.remarks = remarks
            entry.reviewed_by = auth.signature
            entry.date_reviewed = today()
        },

        /**
         * Return a programme to the filer. It stays at For Review with the
         * reason recorded, which is what puts it in the Denied listing.
         */
        returnForCompliance(id: number, remarks: string): void {
            const entry = this.applications.find((candidate) => candidate.id === id)

            if (!entry) {
                return
            }

            const auth = useAuthStore()

            entry.status = CSHP_STATUS.forReview
            entry.denied_status = DENIED_STATUS.forCompliance
            entry.remarks = remarks
            entry.reviewed_by = auth.signature
            entry.date_reviewed = today()
            entry.approved_by = ''
            entry.date_approved = ''
        },

        /** Close a programme whose project was completed or withdrawn. */
        closeAsCompleted(id: number, remarks: string): void {
            const entry = this.applications.find((candidate) => candidate.id === id)

            if (!entry) {
                return
            }

            const auth = useAuthStore()

            entry.status = CSHP_STATUS.forReview
            entry.denied_status = DENIED_STATUS.completion
            entry.remarks = remarks
            entry.reviewed_by = auth.signature
            entry.date_reviewed = today()
        },

        /** The approving officer signs off. */
        approve(id: number, remarks = ''): void {
            const entry = this.applications.find((candidate) => candidate.id === id)

            if (!entry) {
                return
            }

            const auth = useAuthStore()

            entry.status = CSHP_STATUS.approved
            entry.denied_status = DENIED_STATUS.none
            entry.approved_by = auth.signature
            entry.date_approved = today()

            if (remarks) {
                entry.remarks = remarks
            }
        },

        remove(id: number): void {
            const index = this.applications.findIndex((entry) => entry.id === id)

            if (index !== -1) {
                this.applications.splice(index, 1)
            }
        },

        nextId(): number {
            return this.applications.reduce((highest, entry) => Math.max(highest, entry.id), 0) + 1
        },

        /** `CSHP-2026-0013`, continuing the series the seed data starts. */
        nextControlNo(id: number): string {
            return `CSHP-${new Date().getFullYear()}-${String(id).padStart(4, '0')}`
        },

        /** A blank programme of the given kind, for the create forms. */
        blank(type: CshpTypeId, establishmentId = 0): CshpDraft {
            const auth = useAuthStore()

            return {
                cshp_type: type,
                establishment_id: type === CSHP_TYPE.comprehensive ? establishmentId : 0,
                fo_id: auth.user.fo_id,
                date_received: today(),
                company_name: '',
                complete_address: '',
                project_type: 2,
                tel_no: '',
                fax_no: '',
                project_mngr_name: '',
                email: '',
                pcab_no: '',
                pcab_validity: '',
                contractor_workers: 0,
                contractor_male: 0,
                contractor_female: 0,
                do_18_reg_date: '',
                do_18_reg_no: '',
                rule_1020_reg_date: '',
                rule_1020_reg_no: '',
                project_name: '',
                project_address: '',
                project_owner: '',
                owner_email: '',
                owner_tel_no: '',
                project_cost: 0,
                no_workers: 0,
                calendar_days: 0,
                project_start_date: '',
                project_end_date: '',
                safety_officer_name: '',
                safety_officer_bosh_date: '',
                first_aider_name: '',
                first_aider_training_date: '',
                first_aider_validity: '',
                oh_nurse_name: '',
                oh_nurse_training_date: '',
                oh_physician_name: '',
                oh_physician_training_date: '',
                oh_dentist_name: '',
                oh_dentist_training_date: '',
                heavy_equipment: '',
                equipment_operators: '',
                prepared_by: '',
                preparer_education: '',
                preparer_experience: '',
                preparer_qualification: '',
            }
        },
    },
})
