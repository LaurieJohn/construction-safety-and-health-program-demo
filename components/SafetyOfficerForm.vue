<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import type { SafetyOfficerDraft } from '~/stores/safety-officers'
import { SO_TYPE, fieldOffices, soTypes } from '~/data/reference'

/**
 * Register or amend a Safety Officer / First Aider.
 *
 * The type decides which training dates the form asks for, exactly as the old
 * `disp_div()` did — the difference is that the fields it is not asking for are
 * not merely hidden, they are cleared, so a first aider cannot keep a BOSH date
 * nobody entered. The clearing itself lives in the store.
 */
const props = defineProps<{
    initial: SafetyOfficerDraft
    /** The record being amended, so the duplicate check can ignore itself. */
    editingId?: number
    submitLabel: string
}>()

const emit = defineEmits<{ submit: [draft: SafetyOfficerDraft] }>()

const auth = useAuthStore()
const officers = useSafetyOfficersStore()

const form = reactive<SafetyOfficerDraft>({ ...props.initial })
const disclaimer = ref(Boolean(props.editingId))
const errors = reactive<Record<string, string>>({})

const selectedType = computed(() => soTypes.find((type) => type.id === form.type))

const offices = computed(() => fieldOffices.filter((office) => !office.is_regional))

function validate(): boolean {
    Object.keys(errors).forEach((key) => delete errors[key])

    if (!form.first_name.trim()) {
        errors.first_name = 'Required.'
    }

    if (!form.last_name.trim()) {
        errors.last_name = 'Required.'
    }

    if (selectedType.value?.needs_bosh && !form.date_so_training) {
        errors.date_so_training = 'A safety officer needs a BOSH training date.'
    }

    if (selectedType.value?.needs_first_aid) {
        if (!form.date_fa_training) {
            errors.date_fa_training = 'A first aider needs a training date.'
        }

        if (!form.valid_until) {
            errors.valid_until = 'A first-aid card has a validity date.'
        }
    }

    if (
        form.date_fa_training &&
        form.valid_until &&
        form.valid_until <= form.date_fa_training
    ) {
        errors.valid_until = 'The card cannot lapse before it was issued.'
    }

    if (!form.cert_file.trim()) {
        errors.cert_file = 'Attach the certificate or ID.'
    }

    if (!disclaimer.value) {
        errors.disclaimer = 'Please certify the entry before saving.'
    }

    // The old form refused a second record for the same person: two training
    // histories where there should be one.
    if (officers.exists(form, props.editingId ?? 0)) {
        errors.first_name = 'This person is already on the register.'
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
        <div class="form-section">
            <h2 class="form-section__title">Type</h2>
            <p class="form-section__hint">
                What the person is accredited as. It decides which training dates this form asks
                for.
            </p>

            <div class="choice-group">
                <label v-for="type in soTypes" :key="type.id" class="choice">
                    <input v-model="form.type" type="radio" name="so-type" :value="type.id" />
                    {{ type.name }}
                </label>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Name</h2>
            <p class="form-section__hint">As it appears on the certificate.</p>

            <div class="form-grid">
                <div class="field col-4">
                    <label class="label" for="first-name">
                        First name<span class="label__required">*</span>
                    </label>
                    <input
                        id="first-name"
                        v-model="form.first_name"
                        class="input"
                        :class="{ 'is-invalid': errors.first_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.first_name" class="error">{{ errors.first_name }}</span>
                </div>

                <div class="field col-4">
                    <label class="label" for="middle-name">Middle name</label>
                    <input
                        id="middle-name"
                        v-model="form.middle_name"
                        class="input"
                        type="text"
                        autocomplete="off"
                    />
                </div>

                <div class="field col-4">
                    <label class="label" for="last-name">
                        Last name<span class="label__required">*</span>
                    </label>
                    <input
                        id="last-name"
                        v-model="form.last_name"
                        class="input"
                        :class="{ 'is-invalid': errors.last_name }"
                        type="text"
                        autocomplete="off"
                    />
                    <span v-if="errors.last_name" class="error">{{ errors.last_name }}</span>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Training</h2>
            <p class="form-section__hint">
                {{
                    selectedType?.id === SO_TYPE.both
                        ? 'Both accreditations carry their own dates.'
                        : 'Only the dates the selected type calls for.'
                }}
            </p>

            <div class="form-grid">
                <div v-if="selectedType?.needs_bosh" class="field col-4">
                    <label class="label" for="bosh-date">
                        Date of BOSH training<span class="label__required">*</span>
                    </label>
                    <input
                        id="bosh-date"
                        v-model="form.date_so_training"
                        class="input"
                        :class="{ 'is-invalid': errors.date_so_training }"
                        type="date"
                    />
                    <span v-if="errors.date_so_training" class="error">
                        {{ errors.date_so_training }}
                    </span>
                </div>

                <div v-if="selectedType?.needs_first_aid" class="field col-4">
                    <label class="label" for="fa-date">
                        Date of first-aid training<span class="label__required">*</span>
                    </label>
                    <input
                        id="fa-date"
                        v-model="form.date_fa_training"
                        class="input"
                        :class="{ 'is-invalid': errors.date_fa_training }"
                        type="date"
                    />
                    <span v-if="errors.date_fa_training" class="error">
                        {{ errors.date_fa_training }}
                    </span>
                </div>

                <div v-if="selectedType?.needs_first_aid" class="field col-4">
                    <label class="label" for="valid-until">
                        Card valid until<span class="label__required">*</span>
                    </label>
                    <input
                        id="valid-until"
                        v-model="form.valid_until"
                        class="input"
                        :class="{ 'is-invalid': errors.valid_until }"
                        type="date"
                    />
                    <span v-if="errors.valid_until" class="error">{{ errors.valid_until }}</span>
                    <span v-else class="hint">A lapsed card is the commonest reason a programme is returned.</span>
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Record</h2>
            <p class="form-section__hint">The identifier and the supporting document.</p>

            <div class="form-grid">
                <div class="field col-4">
                    <label class="label" for="id-no">ID number</label>
                    <input
                        id="id-no"
                        v-model="form.id_no"
                        class="input"
                        type="text"
                        placeholder="Optional"
                        autocomplete="off"
                    />
                </div>

                <div v-if="auth.isRegional" class="field col-4">
                    <label class="label" for="fo">Field office</label>
                    <select id="fo" v-model.number="form.fo_id" class="select">
                        <option v-for="office in offices" :key="office.id" :value="office.id">
                            {{ office.name }}
                        </option>
                    </select>
                    <span class="hint">Which office keeps this record.</span>
                </div>

                <div class="field" :class="auth.isRegional ? 'col-4' : 'col-8'">
                    <label class="label" for="cert-file">
                        Certificate / ID file<span class="label__required">*</span>
                    </label>
                    <input
                        id="cert-file"
                        v-model="form.cert_file"
                        class="input"
                        :class="{ 'is-invalid': errors.cert_file }"
                        type="url"
                        placeholder="https://…"
                        autocomplete="off"
                    />
                    <span v-if="errors.cert_file" class="error">{{ errors.cert_file }}</span>
                    <span v-else class="hint">A link to the scanned certificate.</span>
                </div>

                <div class="field col-12">
                    <label class="label" for="notes">Notes</label>
                    <textarea
                        id="notes"
                        v-model="form.notes"
                        class="textarea"
                        placeholder="Anything the reviewer should know."
                    ></textarea>
                </div>
            </div>
        </div>

        <div class="form-section">
            <label class="checkbox-line">
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
            <slot name="secondary" />

            <NuxtLink to="/safety-officers" class="btn btn--secondary">Cancel</NuxtLink>

            <button type="submit" class="btn btn--primary">
                <AppIcon name="check" :size="15" />
                {{ submitLabel }}
            </button>
        </div>
    </form>
</template>
