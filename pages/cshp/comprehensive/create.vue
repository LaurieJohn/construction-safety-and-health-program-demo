<script setup lang="ts">
import { useRoute } from 'vue-router'
import { CSHP_TYPE } from '~/data/reference'
import type { CshpDraft } from '~/stores/cshp'

/**
 * File a comprehensive programme against a registered establishment.
 *
 * An establishment's profile links here with `?establishment=`, so filing from
 * a contractor's page arrives with that contractor already chosen.
 */
useHead({ title: 'Add Comprehensive CSHP — CSHP Demo' })

const route = useRoute()
const auth = useAuthStore()
const cshp = useCshpStore()
const establishments = useEstablishmentsStore()

const preselected = Number(route.query.establishment ?? 0)

const initial: CshpDraft = cshp.blank(
    CSHP_TYPE.comprehensive,
    establishments.find(preselected) ? preselected : 0,
)

async function onSubmit(draft: CshpDraft): Promise<void> {
    const created = cshp.create(draft)

    toast(`Filed as ${created.control_no}. It is now in the review queue.`)

    await navigateTo(`/cshp/${created.id}`)
}
</script>

<template>
    <div>
        <PageHeader
            title="Add Comprehensive CSHP"
            lead="For a registered establishment with a continuing programme — the contractor's profile, its registrations, and the full complement of OSH personnel."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'CSHP', to: '/cshp/for-review' },
                { label: 'Add Comprehensive' },
            ]"
        />

        <div v-if="!auth.canFile" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                Programmes are filed by the field offices. The {{ auth.role }} account reviews and
                decides on them. Switch to a field office or the administrator to try this form.
            </div>
        </div>

        <div v-else-if="!establishments.registered.length" class="card">
            <EmptyState
                title="No registered establishments"
                text="A comprehensive programme is filed against an establishment registered under Rule 1020. Register one first, or file a simple programme for a single project."
                icon="building"
            >
                <div class="page-header__actions" style="justify-content: center">
                    <NuxtLink to="/establishments/register" class="btn btn--primary">
                        <AppIcon name="plus" :size="15" />
                        Register an establishment
                    </NuxtLink>

                    <NuxtLink to="/cshp/simple/create" class="btn btn--secondary">
                        File a simple CSHP instead
                    </NuxtLink>
                </div>
            </EmptyState>
        </div>

        <CshpForm v-else :initial="initial" submit-label="File programme" @submit="onSubmit" />
    </div>
</template>
