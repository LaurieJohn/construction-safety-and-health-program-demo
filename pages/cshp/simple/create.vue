<script setup lang="ts">
import { CSHP_TYPE } from '~/data/reference'
import type { CshpDraft } from '~/stores/cshp'

/** File a simple programme — a single project, filed on its own. */
useHead({ title: 'Add Simple CSHP — CSHP Demo' })

const auth = useAuthStore()
const cshp = useCshpStore()

const initial: CshpDraft = cshp.blank(CSHP_TYPE.simple)

async function onSubmit(draft: CshpDraft): Promise<void> {
    const created = cshp.create(draft)

    toast(`Filed as ${created.control_no}. It is now in the review queue.`)

    await navigateTo(`/cshp/${created.id}`)
}
</script>

<template>
    <div>
        <PageHeader
            title="Add Simple CSHP"
            lead="For a single project filed on its own — the project, the OSH personnel assigned to it, and who drew the programme up."
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'CSHP', to: '/cshp/for-review' },
                { label: 'Add Simple' },
            ]"
        />

        <div v-if="!auth.canFile" class="alert alert--warning">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                Programmes are filed by the field offices. The {{ auth.role }} account reviews and
                decides on them. Switch to a field office or the administrator to try this form.
            </div>
        </div>

        <CshpForm v-else :initial="initial" submit-label="File programme" @submit="onSubmit" />
    </div>
</template>
