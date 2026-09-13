<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { EstablishmentDraft } from '~/stores/establishments'

/** Amend a Rule 1020 registration. */
const route = useRoute()
const establishments = useEstablishmentsStore()

const id = computed(() => Number(route.params.id))
const establishment = computed(() => establishments.find(id.value))

useHead({ title: 'Amend Establishment — CSHP Demo' })

const initial = computed<EstablishmentDraft | null>(() => {
    if (!establishment.value) {
        return null
    }

    const {
        id: _id,
        control_no: _controlNo,
        created_at: _createdAt,
        ...draft
    } = establishment.value

    return draft
})

async function onSubmit(draft: EstablishmentDraft): Promise<void> {
    establishments.update(id.value, draft)

    toast('Registration updated.')

    await navigateTo(`/establishments/${id.value}`)
}
</script>

<template>
    <div>
        <PageHeader
            :title="establishment?.business_name ?? 'Establishment'"
            lead="Amend the registration on file."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Establishments', to: '/establishments' },
                { label: 'Amend' },
            ]"
        />

        <div v-if="!initial" class="card">
            <EmptyState
                title="No such establishment"
                text="This registration is not on the register — it may have been deleted."
                icon="alert-circle"
            >
                <NuxtLink to="/establishments" class="btn btn--primary">
                    <AppIcon name="arrow-left" :size="15" />
                    Back to establishments
                </NuxtLink>
            </EmptyState>
        </div>

        <EstablishmentForm v-else :initial="initial" submit-label="Save changes" @submit="onSubmit" />
    </div>
</template>
