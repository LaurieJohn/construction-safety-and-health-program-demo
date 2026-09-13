<script setup lang="ts">
import { SO_TYPE, fieldOffices } from '~/data/reference'
import type { SafetyOfficerDraft } from '~/stores/safety-officers'

/** Register a Safety Officer or First Aider. */
useHead({ title: 'Register Safety Officer / First Aider — CSHP Demo' })

const auth = useAuthStore()
const officers = useSafetyOfficersStore()

/**
 * A regional account keeps no register of its own, so the form opens on the
 * first field office rather than an office that cannot hold the record.
 */
const defaultOffice = auth.isRegional
    ? (fieldOffices.find((office) => !office.is_regional)?.id ?? 2)
    : auth.user.fo_id

const initial: SafetyOfficerDraft = {
    id_no: '',
    type: SO_TYPE.safetyOfficer,
    first_name: '',
    middle_name: '',
    last_name: '',
    date_so_training: '',
    date_fa_training: '',
    valid_until: '',
    cert_file: '',
    notes: '',
    fo_id: defaultOffice,
}

async function onSubmit(draft: SafetyOfficerDraft): Promise<void> {
    const created = officers.create(draft)

    toast(`${officers.displayName(created)} added to the register.`)

    await navigateTo('/safety-officers')
}
</script>

<template>
    <div>
        <PageHeader
            title="Register Safety Officer / First Aider"
            lead="One record per person. They are then available to name on any programme your office files."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Safety Officers & First Aiders', to: '/safety-officers' },
                { label: 'Register' },
            ]"
        />

        <div v-if="!auth.canRegisterPersonnel" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                The {{ auth.role }} account reads the register but does not add to it. Switch to a
                field office or the administrator to try this form.
            </div>
        </div>

        <SafetyOfficerForm v-else :initial="initial" submit-label="Add to register" @submit="onSubmit" />
    </div>
</template>
