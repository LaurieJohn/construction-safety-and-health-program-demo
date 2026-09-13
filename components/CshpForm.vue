<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { CshpDraft } from '~/stores/cshp'
import type { SafetyOfficer } from '~/data/demo'
import {
    CSHP_TYPE,
    OH_PERSONNEL_THRESHOLD,
    fieldOffices,
    projectTypes,
} from '~/data/reference'

/**
 * The Construction Safety and Health Programme form.
 *
 * One component serves both kinds, because they are the same document with a
 * different amount of it:
 *
 *   Simple         a single project filed on its own — project, OSH personnel,
 *                  equipment, preparer.
 *   Comprehensive  all of that, plus the contractor it is filed under, its
 *                  registrations, and the occupational health personnel a
 *                  project over the threshold must name.
 *
 * The OSH personnel fields read from the register rather than being retyped:
 * choosing a name fills in the training dates that were recorded against it,
 * which is how a lapsed first-aid card gets noticed here instead of at review.
 */
const props = defineProps<{
    initial: CshpDraft
    submitLabel: string
    /** The remarks a reviewer left, shown above a resubmission. */
    returnedRemarks?: string
}>()

const emit = defineEmits<{ submit: [draft: CshpDraft] }>()

const auth = useAuthStore()
const officers = useSafetyOfficersStore()
const establishments = useEstablishmentsStore()

const form = reactive<CshpDraft>({ ...props.initial })
const disclaimer = ref(false)
const errors = reactive<Record<string, string>>({})

const isComprehensive = computed(() => form.cshp_type === CSHP_TYPE.comprehensive)

const offices = computed(() => fieldOffices.filter((office) => !office.is_regional))

const needsOhPersonnel = computed(
    () => isComprehensive.value && form.no_workers > OH_PERSONNEL_THRESHOLD,
)

/**
 * Filling the form from the establishment saves retyping the contractor's
 * details, and keeps them consistent with what was registered.
 */
watch(
    () => form.establishment_id,
    (establishmentId) => {
        const establishment = establishments.find(establishmentId)

        if (!establishment) {
            return
        }

        form.company_name = establishment.business_name
        form.complete_address = establishments.address(establishment)
        form.tel_no = establishment.telephone_no
        form.fax_no = establishment.fax_no
        form.email = establishment.email
        form.rule_1020_reg_no = establishment.control_no
        form.rule_1020_reg_date = establishment.date_filed
        form.fo_id = establishment.fo_id
    },
)

/** Choosing from the register carries the recorded training dates across. */
function applySafetyOfficer(officer: SafetyOfficer | undefined): void {
    if (!officer) {
        return
    }

    form.safety_officer_name = officers.displayName(officer)
    form.safety_officer_bosh_date = officer.date_so_training
}

function applyFirstAider(officer: SafetyOfficer | undefined): void {
    if (!officer) {
        return
    }

    form.first_aider_name = officers.displayName(officer)
    form.first_aider_training_date = officer.date_fa_training
    form.first_aider_validity = officer.valid_until
}

const selectedSafetyOfficer = computed({
    get: () =>
        officers.eligibleSafetyOfficers.find(
            (officer) => officers.displayName(officer) === form.safety_officer_name,
        )?.id ?? 0,
    set: (id: number) => applySafetyOfficer(officers.find(id)),
})

const selectedFirstAider = computed({
    get: () =>
        officers.eligibleFirstAiders.find(
            (officer) => officers.displayName(officer) === form.first_aider_name,
        )?.id ?? 0,
    set: (id: number) => applyFirstAider(officers.find(id)),
})

/**
 * A first-aid card that lapses before the works end is the single commonest
 * reason a programme comes back. Saying so here is cheaper than a review round
 * trip, so it is a warning on the form rather than a rule that blocks it — the
 * filer may be waiting on a renewal they will attach.
 */
const cardLapsesEarly = computed(
    () =>
        Boolean(form.first_aider_validity) &&
        Boolean(form.project_end_date) &&
        form.first_aider_validity < form.project_end_date,
)

function validate(): boolean {
    Object.keys(errors).forEach((key) => delete errors[key])

    if (isComprehensive.value && !form.establishment_id) {
        errors.establishment_id = 'A comprehensive programme is filed against a registered establishment.'
    }

    if (!form.company_name.trim()) {
        errors.company_name = 'Required.'
    }

    if (!form.complete_address.trim()) {
        errors.complete_address = 'Required.'
    }

    if (!form.project_mngr_name.trim()) {
        errors.project_mngr_name = 'Required.'
    }

    if (!form.email.trim()) {
        errors.email = 'Required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'That does not look like an email address.'
    }

    if (!form.pcab_no.trim()) {
        errors.pcab_no = 'Required.'
    }

    if (!form.project_name.trim()) {
        errors.project_name = 'Required.'
    }

    if (!form.project_address.trim()) {
        errors.project_address = 'Required.'
    }

    if (!form.project_owner.trim()) {
        errors.project_owner = 'Required.'
    }

    if (form.project_cost <= 0) {
        errors.project_cost = 'Enter the project cost.'
    }

    if (form.no_workers <= 0) {
        errors.no_workers = 'Enter the number of workers to be deployed.'
    }

    if (!form.project_start_date) {
        errors.project_start_date = 'Required.'
    }

    if (!form.project_end_date) {
        errors.project_end_date = 'Required.'
    }

    if (
        form.project_start_date &&
        form.project_end_date &&
        form.project_end_date <= form.project_start_date
    ) {
        errors.project_end_date = 'The works cannot end before they start.'
    }

    if (!form.safety_officer_name.trim()) {
        errors.safety_officer_name = 'Every project names a safety officer.'
    }

    if (!form.first_aider_name.trim()) {
        errors.first_aider_name = 'Every project names a first aider.'
    }

    if (needsOhPersonnel.value && !form.oh_nurse_name.trim()) {
        errors.oh_nurse_name = `A project over ${OH_PERSONNEL_THRESHOLD} workers must name an occupational health nurse.`
    }

    if (!form.prepared_by.trim()) {
        errors.prepared_by = 'Required.'
    }

    if (!disclaimer.value) {
        errors.disclaimer = 'Please certify the programme before filing it.'
    }

    return Object.keys(errors).length === 0
}

function onSubmit(): void {
    if (!validate()) {
        return
    }

    emit('submit', { ...form })
}
</script>

<template>
    <form class="card" novalidate @submit.prevent="onSubmit">
        <div v-if="returnedRemarks" class="form-section" style="background: var(--red-50)">
            <h2 class="form-section__title" style="color: var(--red-700)">Returned for compliance</h2>
            <p class="mb-0" style="color: var(--red-700)">{{ returnedRemarks }}</p>
            <p class="text-xs mt-2 mb-0" style="color: var(--red-700)">
                Saving this programme answers the return and puts it back in the review queue.
            </p>
        </div>

        <div v-if="isComprehensive" class="form-section">
            <h2 class="form-section__title">Establishment</h2>
            <p class="form-section__hint">
                A comprehensive programme is filed against an establishment already registered under
                Rule 1020. Choosing one fills in the contractor's details below.
            </p>

            <div class="form-grid">
                <div class="field col-8">
                    <label class="label" for="establishment">
                        Registered establishment<span class="label__required">*</span>
                    </label>
                    <select
                        id="establishment"
                        v-model.number="form.establishment_id"
                        class="select"
                        :class="{ 'is-invalid': errors.establishment_id }"
                    >
                        <option :value="0">Select an establishment</option>
                        <option
                            v-for="entry in establishments.registered"
                            :key="entry.id"
                            :value="entry.id"
                        >
                            {{ entry.business_name }} — {{ entry.control_no }}
                        </option>
                    </select>
                    <span v-if="errors.establishment_id" class="error">
                        {{ errors.establishment_id }}
                    </span>
                    <span v-else-if="!establishments.registered.length" class="hint">
                        No registered establishments yet. Register one first, or file a simple
                        programme instead.
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="date-received">Date received</label>
                    <input id="date-received" v-model="form.date_received" class="input" type="date" />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Contractor</h2>
            <p class="form-section__hint">The main or general contractor responsible for the works.</p>

            <div class="form-grid">
                <div class="field col-8">
                    <label class="label" for="company-name">
                        Company name<span class="label__required">*</span>
                    </label>
                    <input
                        id="company-name"
                        v-model="form.company_name"
                        class="input"
                        :class="{ 'is-invalid': errors.company_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.company_name" class="error">{{ errors.company_name }}</span>
                </div>

                <div v-if="!isComprehensive" class="field col-4">
                    <label class="label" for="simple-date-received">Date received</label>
                    <input
                        id="simple-date-received"
                        v-model="form.date_received"
                        class="input"
                        type="date"
                    />
                </div>

                <div v-else-if="auth.isRegional" class="field col-4">
                    <label class="label" for="fo">Field office</label>
                    <select id="fo" v-model.number="form.fo_id" class="select">
                        <option v-for="office in offices" :key="office.id" :value="office.id">
                            {{ office.name }}
                        </option>
                    </select>
                </div>

                <div class="field col-12">
                    <label class="label" for="complete-address">
                        Complete address<span class="label__required">*</span>
                    </label>
                    <input
                        id="complete-address"
                        v-model="form.complete_address"
                        class="input"
                        :class="{ 'is-invalid': errors.complete_address }"
                        type="text"
                        placeholder="No./Block/St., Barangay, City/Municipality, Province, Zip Code"
                        autocomplete="off"
                    />
                    <span v-if="errors.complete_address" class="error">
                        {{ errors.complete_address }}
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="project-manager">
                        Project manager / contact person<span class="label__required">*</span>
                    </label>
                    <input
                        id="project-manager"
                        v-model="form.project_mngr_name"
                        class="input"
                        :class="{ 'is-invalid': errors.project_mngr_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.project_mngr_name" class="error">
                        {{ errors.project_mngr_name }}
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="contractor-email">
                        Email<span class="label__required">*</span>
                    </label>
                    <input
                        id="contractor-email"
                        v-model="form.email"
                        class="input"
                        :class="{ 'is-invalid': errors.email }"
                        type="email"
                        autocomplete="off"
                    />
                    <span v-if="errors.email" class="error">{{ errors.email }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="project-type">Project type</label>
                    <div class="choice-group">
                        <label v-for="type in projectTypes" :key="type.id" class="choice">
                            <input
                                v-model.number="form.project_type"
                                type="radio"
                                name="project-type"
                                :value="type.id"
                            />
                            {{ type.name }}
                        </label>
                    </div>
                </div>

                <div class="field col-3">
                    <label class="label" for="tel">Telephone</label>
                    <input id="tel" v-model="form.tel_no" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-3">
                    <label class="label" for="fax">Fax</label>
                    <input id="fax" v-model="form.fax_no" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-3">
                    <label class="label" for="pcab">
                        Contractor licence no.<span class="label__required">*</span>
                    </label>
                    <input
                        id="pcab"
                        v-model="form.pcab_no"
                        class="input"
                        :class="{ 'is-invalid': errors.pcab_no }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.pcab_no" class="error">{{ errors.pcab_no }}</span>
                </div>

                <div class="field col-3">
                    <label class="label" for="pcab-validity">Licence valid until</label>
                    <input
                        id="pcab-validity"
                        v-model="form.pcab_validity"
                        class="input"
                        type="date"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="workers-total">Total employed</label>
                    <input
                        id="workers-total"
                        v-model.number="form.contractor_workers"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="workers-male">Male</label>
                    <input
                        id="workers-male"
                        v-model.number="form.contractor_male"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="workers-female">Female</label>
                    <input
                        id="workers-female"
                        v-model.number="form.contractor_female"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>
            </div>
        </div>

        <div v-if="isComprehensive" class="form-section">
            <h2 class="form-section__title">Registrations</h2>
            <p class="form-section__hint">
                The contractor's standing registrations. The Rule 1020 entry comes from the
                establishment selected above.
            </p>

            <div class="form-grid">
                <div class="field col-3">
                    <label class="label" for="do18-no">Contracting registration no.</label>
                    <input
                        id="do18-no"
                        v-model="form.do_18_reg_no"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                    <span class="hint">Renewed yearly.</span>
                </div>

                <div class="field col-3">
                    <label class="label" for="do18-date">Registration date</label>
                    <input id="do18-date" v-model="form.do_18_reg_date" class="input" type="date" />
                </div>

                <div class="field col-3">
                    <label class="label" for="rule1020-no">Rule 1020 registration no.</label>
                    <input
                        id="rule1020-no"
                        v-model="form.rule_1020_reg_no"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                    <span class="hint">One-time registration.</span>
                </div>

                <div class="field col-3">
                    <label class="label" for="rule1020-date">Registration date</label>
                    <input
                        id="rule1020-date"
                        v-model="form.rule_1020_reg_date"
                        class="input"
                        type="date"
                    />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Project</h2>
            <p class="form-section__hint">What is being built, where, for whom and for how long.</p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="project-name">
                        Name of project<span class="label__required">*</span>
                    </label>
                    <input
                        id="project-name"
                        v-model="form.project_name"
                        class="input"
                        :class="{ 'is-invalid': errors.project_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.project_name" class="error">{{ errors.project_name }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="project-address">
                        Complete project address<span class="label__required">*</span>
                    </label>
                    <input
                        id="project-address"
                        v-model="form.project_address"
                        class="input"
                        :class="{ 'is-invalid': errors.project_address }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.project_address" class="error">
                        {{ errors.project_address }}
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="project-owner">
                        Name of project owner<span class="label__required">*</span>
                    </label>
                    <input
                        id="project-owner"
                        v-model="form.project_owner"
                        class="input"
                        :class="{ 'is-invalid': errors.project_owner }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.project_owner" class="error">{{ errors.project_owner }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="owner-email">Owner's email</label>
                    <input
                        id="owner-email"
                        v-model="form.owner_email"
                        class="input"
                        type="email"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="owner-tel">Owner's telephone</label>
                    <input
                        id="owner-tel"
                        v-model="form.owner_tel_no"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="project-cost">
                        Project cost<span class="label__required">*</span>
                    </label>
                    <input
                        id="project-cost"
                        v-model.number="form.project_cost"
                        class="input"
                        :class="{ 'is-invalid': errors.project_cost }"
                        type="number"
                        min="0"
                    />
                    <span v-if="errors.project_cost" class="error">{{ errors.project_cost }}</span>
                    <span v-else class="hint">{{ peso(form.project_cost) }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="no-workers">
                        Workers to be deployed<span class="label__required">*</span>
                    </label>
                    <input
                        id="no-workers"
                        v-model.number="form.no_workers"
                        class="input"
                        :class="{ 'is-invalid': errors.no_workers }"
                        type="number"
                        min="0"
                    />
                    <span v-if="errors.no_workers" class="error">{{ errors.no_workers }}</span>
                    <span v-else-if="isComprehensive" class="hint">
                        Over {{ OH_PERSONNEL_THRESHOLD }} and the project must name health personnel.
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="calendar-days">Duration (calendar days)</label>
                    <input
                        id="calendar-days"
                        v-model.number="form.calendar_days"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="start-date">
                        Start of works<span class="label__required">*</span>
                    </label>
                    <input
                        id="start-date"
                        v-model="form.project_start_date"
                        class="input"
                        :class="{ 'is-invalid': errors.project_start_date }"
                        type="date"
                    />
                    <span v-if="errors.project_start_date" class="error">
                        {{ errors.project_start_date }}
                    </span>
                </div>

                <div class="field col-6">
                    <label class="label" for="end-date">
                        End of works<span class="label__required">*</span>
                    </label>
                    <input
                        id="end-date"
                        v-model="form.project_end_date"
                        class="input"
                        :class="{ 'is-invalid': errors.project_end_date }"
                        type="date"
                    />
                    <span v-if="errors.project_end_date" class="error">
                        {{ errors.project_end_date }}
                    </span>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">OSH personnel assigned to the project</h2>
            <p class="form-section__hint">
                Choose from the register and the training dates come with the name. Anyone not on the
                register can be typed in, but register them and the dates stop being retyped.
            </p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="so-pick">From the register</label>
                    <select id="so-pick" v-model.number="selectedSafetyOfficer" class="select">
                        <option :value="0">Choose a safety officer…</option>
                        <option
                            v-for="officer in officers.eligibleSafetyOfficers"
                            :key="officer.id"
                            :value="officer.id"
                        >
                            {{ officers.displayName(officer) }}
                        </option>
                    </select>
                </div>

                <div class="field col-3">
                    <label class="label" for="so-name">
                        Appointed safety officer<span class="label__required">*</span>
                    </label>
                    <input
                        id="so-name"
                        v-model="form.safety_officer_name"
                        class="input"
                        :class="{ 'is-invalid': errors.safety_officer_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.safety_officer_name" class="error">
                        {{ errors.safety_officer_name }}
                    </span>
                </div>

                <div class="field col-3">
                    <label class="label" for="so-bosh">Date of BOSH training</label>
                    <input
                        id="so-bosh"
                        v-model="form.safety_officer_bosh_date"
                        class="input"
                        type="date"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="fa-pick">From the register</label>
                    <select id="fa-pick" v-model.number="selectedFirstAider" class="select">
                        <option :value="0">Choose a first aider…</option>
                        <option
                            v-for="officer in officers.eligibleFirstAiders"
                            :key="officer.id"
                            :value="officer.id"
                        >
                            {{ officers.displayName(officer) }}
                        </option>
                    </select>
                </div>

                <div class="field col-3">
                    <label class="label" for="fa-name">
                        Appointed first aider<span class="label__required">*</span>
                    </label>
                    <input
                        id="fa-name"
                        v-model="form.first_aider_name"
                        class="input"
                        :class="{ 'is-invalid': errors.first_aider_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.first_aider_name" class="error">
                        {{ errors.first_aider_name }}
                    </span>
                </div>

                <div class="field col-3">
                    <label class="label" for="fa-training">First-aid training / validity</label>
                    <input
                        id="fa-training"
                        v-model="form.first_aider_training_date"
                        class="input mb-1"
                        type="date"
                        aria-label="First-aid training date"
                    />
                    <input
                        v-model="form.first_aider_validity"
                        class="input"
                        :class="{ 'is-invalid': cardLapsesEarly }"
                        type="date"
                        aria-label="First-aid card validity"
                    />
                </div>

                <div v-if="cardLapsesEarly" class="col-12">
                    <div class="alert alert--warning">
                        <AppIcon class="alert__icon" name="alert-triangle" :size="16" />
                        <div>
                            The first-aid card lapses on
                            {{ longDate(form.first_aider_validity) }}, before the works end on
                            {{ longDate(form.project_end_date) }}. A reviewer will return the
                            programme unless a renewed card is attached or another first aider is
                            named.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="needsOhPersonnel" class="form-section">
            <h2 class="form-section__title">Occupational health personnel</h2>
            <p class="form-section__hint">
                Required because more than {{ OH_PERSONNEL_THRESHOLD }} workers will be deployed on
                this project.
            </p>

            <div class="form-grid">
                <div class="field col-8">
                    <label class="label" for="nurse">
                        Occupational health nurse<span class="label__required">*</span>
                    </label>
                    <input
                        id="nurse"
                        v-model="form.oh_nurse_name"
                        class="input"
                        :class="{ 'is-invalid': errors.oh_nurse_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.oh_nurse_name" class="error">{{ errors.oh_nurse_name }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="nurse-date">Date of training</label>
                    <input
                        id="nurse-date"
                        v-model="form.oh_nurse_training_date"
                        class="input"
                        type="date"
                    />
                </div>

                <div class="field col-8">
                    <label class="label" for="physician">Occupational health physician</label>
                    <input
                        id="physician"
                        v-model="form.oh_physician_name"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="physician-date">Date of training</label>
                    <input
                        id="physician-date"
                        v-model="form.oh_physician_training_date"
                        class="input"
                        type="date"
                    />
                </div>

                <div class="field col-8">
                    <label class="label" for="dentist">Dentist</label>
                    <input
                        id="dentist"
                        v-model="form.oh_dentist_name"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="dentist-date">Date of training</label>
                    <input
                        id="dentist-date"
                        v-model="form.oh_dentist_training_date"
                        class="input"
                        type="date"
                    />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Heavy equipment</h2>
            <p class="form-section__hint">
                What will be used on site, and who is certified to operate it.
            </p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="equipment">Equipment to be used</label>
                    <textarea
                        id="equipment"
                        v-model="form.heavy_equipment"
                        class="textarea"
                        placeholder="Tower crane (1), concrete boom pump (2)…"
                    ></textarea>
                </div>

                <div class="field col-6">
                    <label class="label" for="operators">Certified operators</label>
                    <textarea
                        id="operators"
                        v-model="form.equipment_operators"
                        class="textarea"
                        placeholder="Last Name, First Name; Last Name, First Name…"
                    ></textarea>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Prepared by</h2>
            <p class="form-section__hint">
                The person who drew up this programme, and what qualifies them to.
            </p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="prepared-by">
                        Name<span class="label__required">*</span>
                    </label>
                    <input
                        id="prepared-by"
                        v-model="form.prepared_by"
                        class="input"
                        :class="{ 'is-invalid': errors.prepared_by }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.prepared_by" class="error">{{ errors.prepared_by }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="education">Educational background</label>
                    <input
                        id="education"
                        v-model="form.preparer_education"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="experience">Work experience in OSH</label>
                    <input
                        id="experience"
                        v-model="form.preparer_experience"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="qualification">Other qualifications</label>
                    <input
                        id="qualification"
                        v-model="form.preparer_qualification"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>
            </div>

            <label class="checkbox-line mt-3">
                <input v-model="disclaimer" type="checkbox" />
                <span>
                    I certify that the information encoded and the documents attached here are
                    complete and correct, and I understand that a knowingly false statement carries
                    liability under the applicable laws.
                </span>
            </label>

            <p v-if="errors.disclaimer" class="error mt-2 mb-0">{{ errors.disclaimer }}</p>
        </div>

        <div class="card__footer">
            <NuxtLink to="/cshp/for-review" class="btn btn--secondary">Cancel</NuxtLink>

            <button type="submit" class="btn btn--primary">
                <AppIcon name="check" :size="15" />
                {{ submitLabel }}
            </button>
        </div>
    </form>
</template>
