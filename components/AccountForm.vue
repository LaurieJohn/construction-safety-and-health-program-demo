<script setup lang="ts">
import { computed, reactive } from 'vue'
import type { AccountDraft } from '~/stores/accounts'
import { ROLE, fieldOffices, roles } from '~/data/reference'

/**
 * Add or amend a user account.
 *
 * The old form asked for a password and a re-typed password, and showed the
 * stored one back in the box. There is no authentication in this demo, so it
 * asks for neither: an account here is a name, a role and an office, which is
 * everything the rest of the system actually reads.
 */
const props = defineProps<{
    initial: AccountDraft
    /** The account being amended, so the email check can ignore itself. */
    editingId?: number
    submitLabel: string
}>()

const emit = defineEmits<{ submit: [draft: AccountDraft] }>()

const accounts = useAccountsStore()

const form = reactive<AccountDraft>({ ...props.initial })
const errors = reactive<Record<string, string>>({})

/**
 * A regional role belongs to the regional office and a field role to a field
 * office, so the office list follows the role rather than offering both.
 */
const offices = computed(() =>
    form.user_type === ROLE.focal
        ? fieldOffices.filter((office) => !office.is_regional)
        : fieldOffices.filter((office) => office.is_regional),
)

/** Keeps the office valid when the role changes under it. */
function onRoleChange(): void {
    if (!offices.value.some((office) => office.id === form.fo_id)) {
        form.fo_id = offices.value[0]?.id ?? 1
    }
}

const lastAdministrator = computed(
    () => Boolean(props.editingId) && accounts.isLastAdministrator(props.editingId!),
)

function validate(): boolean {
    Object.keys(errors).forEach((key) => delete errors[key])

    if (!form.first_name.trim()) {
        errors.first_name = 'Required.'
    }

    if (!form.last_name.trim()) {
        errors.last_name = 'Required.'
    }

    if (!form.email.trim()) {
        errors.email = 'Required.'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.email = 'That does not look like an email address.'
    } else if (accounts.emailTaken(form.email, props.editingId ?? 0)) {
        errors.email = 'Another account already uses this address.'
    }

    // Locking out the last administrator leaves an account list nobody can
    // reach, which the demo could only recover from with a reload.
    if (lastAdministrator.value && (form.status === 0 || form.user_type !== ROLE.administrator)) {
        errors.user_type = 'This is the last active administrator. Appoint another one first.'
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
            <h2 class="form-section__title">Person</h2>
            <p class="form-section__hint">Who the account belongs to.</p>

            <div class="form-grid">
                <div class="field col-6">
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

                <div class="field col-6">
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
                    <label class="label" for="phone">Phone number</label>
                    <input id="phone" v-model="form.phone" class="input" type="text" autocomplete="off" />
                </div>
            </div>
        </div>

        <div class="form-section">
            <h2 class="form-section__title">Access</h2>
            <p class="form-section__hint">
                The role decides what the account can reach: who files, who reviews, who approves.
            </p>

            <div class="form-grid">
                <div class="field col-6">
                    <label class="label" for="role">Role</label>
                    <select
                        id="role"
                        v-model.number="form.user_type"
                        class="select"
                        :class="{ 'is-invalid': errors.user_type }"
                        @change="onRoleChange"
                    >
                        <option v-for="role in roles" :key="role.id" :value="role.id">
                            {{ role.name }}
                        </option>
                    </select>
                    <span v-if="errors.user_type" class="error">{{ errors.user_type }}</span>
                    <span v-else class="hint">
                        {{ roles.find((role) => role.id === form.user_type)?.description }}
                    </span>
                </div>

                <div class="field col-6">
                    <label class="label" for="office">Office</label>
                    <select id="office" v-model.number="form.fo_id" class="select">
                        <option v-for="office in offices" :key="office.id" :value="office.id">
                            {{ office.name }}
                        </option>
                    </select>
                    <span class="hint">
                        {{
                            form.user_type === ROLE.focal
                                ? 'A field office sees only its own filings.'
                                : 'A regional account sees every office’s filings.'
                        }}
                    </span>
                </div>

                <div class="field col-12">
                    <label class="checkbox-line">
                        <input v-model="form.status" type="checkbox" :true-value="1" :false-value="0" />
                        <span>
                            <span class="font-medium">This account may sign in.</span>
                            <span class="text-muted d-block text-xs">
                                A deactivated account keeps its records but is no longer offered in
                                the account switcher.
                            </span>
                        </span>
                    </label>
                </div>
            </div>
        </div>

        <div class="card__footer">
            <NuxtLink to="/settings/accounts" class="btn btn--secondary">Cancel</NuxtLink>

            <button type="submit" class="btn btn--primary">
                <AppIcon name="check" :size="15" />
                {{ submitLabel }}
            </button>
        </div>
    </form>
</template>

<style scoped>
.d-block {
    display: block;
}
</style>
