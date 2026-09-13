<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { EstablishmentDraft } from '~/stores/establishments'
import {
    ESTAB_STATUS,
    economicOrganisations,
    fieldOffices,
    legalOrganisations,
    provinces,
} from '~/data/reference'

/**
 * The Rule 1020 registration form.
 *
 * The original ran to eighty-odd fields in one flat column of Bootstrap 3 rows,
 * with the head count spread over a grid of twenty boxes. The same information
 * is asked for here, grouped into the sections a person filling it in actually
 * thinks in, and the totals are worked out rather than typed — they were
 * read-only inputs kept in step by an onkeyup handler before.
 */
const props = defineProps<{
    initial: EstablishmentDraft
    submitLabel: string
}>()

const emit = defineEmits<{ submit: [draft: EstablishmentDraft] }>()

const auth = useAuthStore()

const form = reactive<EstablishmentDraft>({
    ...props.initial,
    technical_information: [...props.initial.technical_information],
})

const disclaimer = ref(false)
const errors = reactive<Record<string, string>>({})

const offices = computed(() => fieldOffices.filter((office) => !office.is_regional))

/** The machinery and transport declarations, as one list of checkboxes. */
const equipment = [
    'Circular Saw',
    'Pressure Vessel',
    'Machine Drill Press',
    'Boiler',
    'Internal Combustion Engine',
    'Engine Diesel',
    'Gasoline',
    'Power Trucks',
    'Forklift',
    'Hand Trucks',
    'Cranes',
    'Conveyors',
]

const totalMale = computed(
    () => form.male_filipino + form.male_r_alien + form.male_nr_alien,
)

const totalFemale = computed(
    () => form.female_filipino + form.female_r_alien + form.female_nr_alien,
)

const grandTotal = computed(() => totalMale.value + totalFemale.value)

function validate(): boolean {
    Object.keys(errors).forEach((key) => delete errors[key])

    if (!form.business_name.trim()) {
        errors.business_name = 'Required.'
    }

    if (!form.street.trim()) {
        errors.street = 'Required.'
    }

    if (!form.municipality.trim()) {
        errors.municipality = 'Required.'
    }

    if (!form.tin.trim()) {
        errors.tin = 'Required.'
    }

    if (!form.email.trim()) {
        errors.email = 'Required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'That does not look like an email address.'
    }

    if (!form.name_of_manager.trim()) {
        errors.name_of_manager = 'Required.'
    }

    if (!form.main_economy_activity.trim()) {
        errors.main_economy_activity = 'Required.'
    }

    if (grandTotal.value === 0) {
        errors.employees = 'An establishment with no employees cannot be registered.'
    }

    if (!form.certified_by.trim()) {
        errors.certified_by = 'Required.'
    }

    if (!disclaimer.value) {
        errors.disclaimer = 'Please certify the entry before saving.'
    }

    return Object.keys(errors).length === 0
}

function onSubmit(): void {
    if (!validate()) {
        return
    }

    emit('submit', { ...form, technical_information: [...form.technical_information] })
}
</script>

<template>
    <form class="card" novalidate @submit.prevent="onSubmit">
        <div class="form-section">
            <h2 class="form-section__title">Identification</h2>
            <p class="form-section__hint">
                How the establishment is named and numbered on the register.
            </p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="business-name">
                        Name of establishment<span class="label__required">*</span>
                    </label>
                    <input
                        id="business-name"
                        v-model="form.business_name"
                        class="input"
                        :class="{ 'is-invalid': errors.business_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.business_name" class="error">{{ errors.business_name }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="registered-name">Registered name</label>
                    <input
                        id="registered-name"
                        v-model="form.registered_name"
                        class="input"
                        type="text"
                        placeholder="If different from the trading name"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="ein">Employer identification number</label>
                    <input id="ein" v-model="form.ein" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-4">
                    <label class="label" for="tin">
                        TIN<span class="label__required">*</span>
                    </label>
                    <input
                        id="tin"
                        v-model="form.tin"
                        class="input"
                        :class="{ 'is-invalid': errors.tin }"
                        type="text"
                        placeholder="000-000-000-000"
                        autocomplete="off"
                    />
                    <span v-if="errors.tin" class="error">{{ errors.tin }}</span>
                </div>

                <div v-if="auth.isRegional" class="field col-4">
                    <label class="label" for="fo">Field office</label>
                    <select id="fo" v-model.number="form.fo_id" class="select">
                        <option v-for="office in offices" :key="office.id" :value="office.id">
                            {{ office.name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Address</h2>
            <p class="form-section__hint">Where the establishment actually operates.</p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="street">
                        Street / Purok / Sitio<span class="label__required">*</span>
                    </label>
                    <input
                        id="street"
                        v-model="form.street"
                        class="input"
                        :class="{ 'is-invalid': errors.street }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.street" class="error">{{ errors.street }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="barangay">Barangay</label>
                    <input
                        id="barangay"
                        v-model="form.barangay"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="municipality">
                        Municipality / City<span class="label__required">*</span>
                    </label>
                    <input
                        id="municipality"
                        v-model="form.municipality"
                        class="input"
                        :class="{ 'is-invalid': errors.municipality }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.municipality" class="error">{{ errors.municipality }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="province">Province</label>
                    <select id="province" v-model="form.province" class="select">
                        <option value="">Select a province</option>
                        <option v-for="name in provinces" :key="name" :value="name">
                            {{ name }}
                        </option>
                    </select>
                </div>

                <div class="field col-4">
                    <label class="label" for="zip">Zip code</label>
                    <input id="zip" v-model="form.zip_code" class="input" type="text" autocomplete="off" />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Contact</h2>
            <p class="form-section__hint">Who answers for the establishment day to day.</p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="manager">
                        Name of manager / owner<span class="label__required">*</span>
                    </label>
                    <input
                        id="manager"
                        v-model="form.name_of_manager"
                        class="input"
                        :class="{ 'is-invalid': errors.name_of_manager }"
                        type="text"
                        placeholder="Last Name, First Name M.I."
                        autocomplete="off"
                    />
                    <span v-if="errors.name_of_manager" class="error">
                        {{ errors.name_of_manager }}
                    </span>
                </div>

                <div class="field col-6">
                    <label class="label" for="email">
                        Email address<span class="label__required">*</span>
                    </label>
                    <input
                        id="email"
                        v-model="form.email"
                        class="input"
                        :class="{ 'is-invalid': errors.email }"
                        type="email"
                        autocomplete="off"
                    />
                    <span v-if="errors.email" class="error">{{ errors.email }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="tel">Telephone number</label>
                    <input id="tel" v-model="form.telephone_no" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-6">
                    <label class="label" for="fax">Fax number</label>
                    <input id="fax" v-model="form.fax_no" class="input" type="text" autocomplete="off" />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Business</h2>
            <p class="form-section__hint">
                The nature of the business and what it produces &mdash; for example, Construction
                &mdash; Building, or Manufacturing &mdash; Structural Steel.
            </p>

            <div class="form-grid">
                <div class="field col-8">
                    <label class="label" for="activity">
                        Main economic activity<span class="label__required">*</span>
                    </label>
                    <input
                        id="activity"
                        v-model="form.main_economy_activity"
                        class="input"
                        :class="{ 'is-invalid': errors.main_economy_activity }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.main_economy_activity" class="error">
                        {{ errors.main_economy_activity }}
                    </span>
                </div>

                <div class="field col-4">
                    <label class="label" for="psic">Industry code</label>
                    <input id="psic" v-model="form.psic_code" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-12">
                    <label class="label" for="products">Major products, goods or services</label>
                    <input
                        id="products"
                        v-model="form.major_products"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="legal">Legal organisation</label>
                    <select id="legal" v-model="form.legal_organisation" class="select">
                        <option v-for="name in legalOrganisations" :key="name" :value="name">
                            {{ name }}
                        </option>
                    </select>
                </div>

                <div class="field col-6">
                    <label class="label" for="economic">Economic organisation</label>
                    <select id="economic" v-model="form.economic_organisation" class="select">
                        <option v-for="name in economicOrganisations" :key="name" :value="name">
                            {{ name }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Employees</h2>
            <p class="form-section__hint">
                Head count by sex and residency. The totals are worked out from what you enter.
            </p>

            <div class="table-wrap">
                <table class="table" style="font-size: 0.8438rem">
                    <thead>
                        <tr>
                            <th style="width: 14%"></th>
                            <th>Filipino</th>
                            <th>Resident alien</th>
                            <th>Non-resident alien</th>
                            <th style="text-align: right">Total</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr>
                            <th scope="row">Male</th>
                            <td>
                                <input
                                    v-model.number="form.male_filipino"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Male Filipino"
                                />
                            </td>
                            <td>
                                <input
                                    v-model.number="form.male_r_alien"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Male resident alien"
                                />
                            </td>
                            <td>
                                <input
                                    v-model.number="form.male_nr_alien"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Male non-resident alien"
                                />
                            </td>
                            <td class="font-semibold" style="text-align: right">
                                {{ count(totalMale) }}
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">Female</th>
                            <td>
                                <input
                                    v-model.number="form.female_filipino"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Female Filipino"
                                />
                            </td>
                            <td>
                                <input
                                    v-model.number="form.female_r_alien"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Female resident alien"
                                />
                            </td>
                            <td>
                                <input
                                    v-model.number="form.female_nr_alien"
                                    class="input"
                                    type="number"
                                    min="0"
                                    aria-label="Female non-resident alien"
                                />
                            </td>
                            <td class="font-semibold" style="text-align: right">
                                {{ count(totalFemale) }}
                            </td>
                        </tr>

                        <tr>
                            <th scope="row">Grand total</th>
                            <td class="text-muted">
                                {{ count(form.male_filipino + form.female_filipino) }}
                            </td>
                            <td class="text-muted">
                                {{ count(form.male_r_alien + form.female_r_alien) }}
                            </td>
                            <td class="text-muted">
                                {{ count(form.male_nr_alien + form.female_nr_alien) }}
                            </td>
                            <td class="font-semibold" style="text-align: right">
                                {{ count(grandTotal) }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p v-if="errors.employees" class="error mt-2 mb-0">{{ errors.employees }}</p>

            <div class="form-grid mt-3">
                <div class="field col-6">
                    <label class="label" for="union">Labour union, if any</label>
                    <input
                        id="union"
                        v-model="form.labor_union"
                        class="input"
                        type="text"
                        placeholder="Name and address"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="blr">Union registration number</label>
                    <input id="blr" v-model="form.blr_reg_no" class="input" type="text" autocomplete="off" />
                </div>

                <div class="field col-6">
                    <label class="label" for="subcontractors">Number of subcontractors</label>
                    <input
                        id="subcontractors"
                        v-model.number="form.subcontractors"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>

                <div class="field col-6">
                    <label class="label" for="subcontracted">Subcontracted employees</label>
                    <input
                        id="subcontracted"
                        v-model.number="form.subcontracted_employees"
                        class="input"
                        type="number"
                        min="0"
                    />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Technical information</h2>
            <p class="form-section__hint">
                The machinery and transport equipment in use, and anything hazardous handled on
                site.
            </p>

            <div class="choice-grid">
                <label v-for="item in equipment" :key="item" class="choice">
                    <input v-model="form.technical_information" type="checkbox" :value="item" />
                    {{ item }}
                </label>
            </div>

            <div class="form-grid mt-3">
                <div class="field col-12">
                    <label class="label" for="chemicals">Chemicals or substances handled</label>
                    <input
                        id="chemicals"
                        v-model="form.chemicals_handled"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Financial and supporting documents</h2>

            <div class="form-grid">
                <div class="field col-4">
                    <label class="label" for="capitalisation">Current capitalisation</label>
                    <input
                        id="capitalisation"
                        v-model.number="form.current_capitalisation"
                        class="input"
                        type="number"
                        min="0"
                    />
                    <span class="hint">{{ peso(form.current_capitalisation) }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="assets">Total assets</label>
                    <input
                        id="assets"
                        v-model.number="form.total_assets"
                        class="input"
                        type="number"
                        min="0"
                    />
                    <span class="hint">{{ peso(form.total_assets) }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="permit">Business permit / registration</label>
                    <input
                        id="permit"
                        v-model="form.permit_attachment"
                        class="input"
                        type="url"
                        placeholder="https://…"
                        autocomplete="off"
                    />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Certification</h2>
            <p class="form-section__hint">Who is accountable for what this form says.</p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="certified-by">
                        Certified by<span class="label__required">*</span>
                    </label>
                    <input
                        id="certified-by"
                        v-model="form.certified_by"
                        class="input"
                        :class="{ 'is-invalid': errors.certified_by }"
                        type="text"
                        placeholder="Last Name, First Name M.I."
                        autocomplete="off"
                    />
                    <span v-if="errors.certified_by" class="error">{{ errors.certified_by }}</span>
                </div>

                <div class="field col-6">
                    <label class="label" for="position">Position</label>
                    <input
                        id="position"
                        v-model="form.certified_position"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="certified-contact">Phone / mobile</label>
                    <input
                        id="certified-contact"
                        v-model="form.certified_contact"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="certified-email">Email</label>
                    <input
                        id="certified-email"
                        v-model="form.certified_email"
                        class="input"
                        type="email"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="date-filed">Date filed</label>
                    <input id="date-filed" v-model="form.date_filed" class="input" type="date" />
                </div>

                <div class="field col-6">
                    <label class="label" for="status">Registration status</label>
                    <select id="status" v-model.number="form.status" class="select">
                        <option :value="ESTAB_STATUS.forReview">For Review</option>
                        <option :value="ESTAB_STATUS.registered">Registered</option>
                    </select>
                    <span class="hint">A new filing normally arrives For Review.</span>
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
            <NuxtLink to="/establishments" class="btn btn--secondary">Cancel</NuxtLink>

            <button type="submit" class="btn btn--primary">
                <AppIcon name="check" :size="15" />
                {{ submitLabel }}
            </button>
        </div>
    </form>
</template>
