<script setup lang="ts">
import {
    ESTAB_STATUS,
    economicOrganisations,
    fieldOffices,
    legalOrganisations,
} from '~/data/reference'
import type { EstablishmentDraft } from '~/stores/establishments'

/** Register an establishment under Rule 1020. */
useHead({ title: 'Register Establishment — CSHP Demo' })

const auth = useAuthStore()
const establishments = useEstablishmentsStore()

const defaultOffice = auth.isRegional
    ? (fieldOffices.find((office) => !office.is_regional)?.id ?? 2)
    : auth.user.fo_id

const initial: EstablishmentDraft = {
    ein: '',
    business_name: '',
    registered_name: '',
    street: '',
    barangay: '',
    municipality: '',
    province: '',
    zip_code: '',
    tin: '',
    telephone_no: '',
    fax_no: '',
    email: '',
    name_of_manager: '',
    main_economy_activity: '',
    psic_code: '',
    major_products: '',
    legal_organisation: legalOrganisations[3],
    economic_organisation: economicOrganisations[0],
    male_filipino: 0,
    male_r_alien: 0,
    male_nr_alien: 0,
    female_filipino: 0,
    female_r_alien: 0,
    female_nr_alien: 0,
    labor_union: '',
    blr_reg_no: '',
    subcontractors: 0,
    subcontracted_employees: 0,
    technical_information: [],
    chemicals_handled: '',
    current_capitalisation: 0,
    total_assets: 0,
    permit_attachment: '',
    certified_by: '',
    certified_position: '',
    certified_contact: '',
    certified_email: '',
    date_filed: today(),
    fo_id: defaultOffice,
    status: ESTAB_STATUS.forReview,
}

async function onSubmit(draft: EstablishmentDraft): Promise<void> {
    const created = establishments.create(draft)

    toast(`${created.business_name} registered as ${created.control_no}.`)

    await navigateTo(`/establishments/${created.id}`)
}
</script>

<template>
    <div>
        <PageHeader
            title="Register Establishment"
            lead="The one-time Rule 1020 registration. A comprehensive programme is filed against a registered establishment."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Establishments', to: '/establishments' },
                { label: 'Register' },
            ]"
        />

        <div v-if="!auth.canFile" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                Registrations are filed by the field offices. The {{ auth.role }} account reads them
                and decides on them. Switch to a field office or the administrator to try this form.
            </div>
        </div>

        <EstablishmentForm
            v-else
            :initial="initial"
            submit-label="Register establishment"
            @submit="onSubmit"
        />
    </div>
</template>
