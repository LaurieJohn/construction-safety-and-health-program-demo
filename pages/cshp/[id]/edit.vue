<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { DENIED_STATUS, cshpTypeName } from '~/data/reference'
import type { CshpDraft } from '~/stores/cshp'

/**
 * Amend a programme.
 *
 * Only while it is at the review stage: an endorsed or approved programme is
 * locked. Saving a returned one clears the return, which is what a
 * resubmission is here.
 */
const route = useRoute()
const cshp = useCshpStore()

const id = computed(() => Number(route.params.id))
const entry = computed(() => cshp.find(id.value))

useHead({ title: () => `Amend ${entry.value?.control_no ?? 'CSHP'} — CSHP Demo` })

const editable = computed(() => (entry.value ? cshp.isEditable(entry.value) : false))

const returnedRemarks = computed(() =>
    entry.value && entry.value.denied_status !== DENIED_STATUS.none ? entry.value.remarks : '',
)

const initial = computed<CshpDraft | null>(() => {
    if (!entry.value) {
        return null
    }

    const {
        id: _id,
        control_no: _controlNo,
        created_at: _createdAt,
        status: _status,
        denied_status: _deniedStatus,
        remarks: _remarks,
        reviewed_by: _reviewedBy,
        date_reviewed: _dateReviewed,
        approved_by: _approvedBy,
        date_approved: _dateApproved,
        ...draft
    } = entry.value

    return draft
})

async function onSubmit(draft: CshpDraft): Promise<void> {
    const wasReturned = Boolean(returnedRemarks.value)

    cshp.update(id.value, draft)

    toast(
        wasReturned
            ? 'Programme amended and back in the review queue.'
            : 'Programme updated.',
    )

    await navigateTo(`/cshp/${id.value}`)
}
</script>

<template>
    <div>
        <PageHeader
            :title="entry ? `Amend ${entry.control_no}` : 'Amend programme'"
            :lead="
                entry
                    ? `${cshpTypeName(entry.cshp_type)} CSHP — ${entry.project_name}`
                    : undefined
            "
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'CSHP', to: '/cshp/for-review' },
                { label: entry?.control_no ?? 'Programme', to: entry ? `/cshp/${entry.id}` : undefined },
                { label: 'Amend' },
            ]"
        />

        <div v-if="!initial || !entry" class="card">
            <EmptyState
                title="No such programme"
                text="This programme is not on file — it may have been deleted, or it belongs to another field office."
                icon="alert-circle"
            >
                <NuxtLink to="/cshp/for-review" class="btn btn--primary">
                    <AppIcon name="arrow-left" :size="15" />
                    Back to the review queue
                </NuxtLink>
            </EmptyState>
        </div>

        <div v-else-if="!editable" class="card">
            <EmptyState
                title="This programme is locked"
                :text="`${entry.control_no} has already been endorsed, so its details, personnel and attachments can no longer be changed.`"
                icon="shield"
            >
                <NuxtLink :to="`/cshp/${entry.id}`" class="btn btn--primary">
                    <AppIcon name="eye" :size="15" />
                    Open the programme
                </NuxtLink>
            </EmptyState>
        </div>

        <CshpForm
            v-else
            :initial="initial"
            :returned-remarks="returnedRemarks"
            :submit-label="returnedRemarks ? 'Save and resubmit' : 'Save changes'"
            @submit="onSubmit"
        />
    </div>
</template>
