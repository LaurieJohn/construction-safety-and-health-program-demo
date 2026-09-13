<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { SafetyOfficerDraft } from '~/stores/safety-officers'

/** Amend a record on the register. */
const route = useRoute()
const officers = useSafetyOfficersStore()

const id = computed(() => Number(route.params.id))
const officer = computed(() => officers.find(id.value))

useHead({ title: 'Amend Register Entry — CSHP Demo' })

const initial = computed<SafetyOfficerDraft | null>(() => {
    if (!officer.value) {
        return null
    }

    const { id: _id, created_at: _createdAt, ...draft } = officer.value

    return draft
})

async function onSubmit(draft: SafetyOfficerDraft): Promise<void> {
    officers.update(id.value, draft)

    toast('Register entry updated.')

    await navigateTo('/safety-officers')
}
</script>

<template>
    <div>
        <PageHeader
            :title="officer ? officers.displayName(officer) : 'Register entry'"
            lead="Amend the accreditation, the training dates or the attached certificate."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Safety Officers & First Aiders', to: '/safety-officers' },
                { label: 'Amend' },
            ]"
        />

        <div v-if="!initial" class="card">
            <EmptyState
                title="No such record"
                text="This entry is not on the register — it may have been removed."
                icon="alert-circle"
            >
                <NuxtLink to="/safety-officers" class="btn btn--primary">
                    <AppIcon name="arrow-left" :size="15" />
                    Back to the register
                </NuxtLink>
            </EmptyState>
        </div>

        <SafetyOfficerForm
            v-else
            :initial="initial"
            :editing-id="id"
            submit-label="Save changes"
            @submit="onSubmit"
        />
    </div>
</template>
