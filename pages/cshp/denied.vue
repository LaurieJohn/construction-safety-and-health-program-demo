<script setup lang="ts">
/**
 * The returned queue — `status = 1 AND denied_status > 0`.
 *
 * A return does not move a programme back a stage; it leaves it in review with
 * a reason recorded against it. That is why this listing and the review one
 * read the same status and differ only on the returned column — and why
 * answering the remarks is all it takes to put a programme back in the queue.
 */
useHead({ title: 'CSHP Denied — CSHP Demo' })

const auth = useAuthStore()
const cshp = useCshpStore()
</script>

<template>
    <div>
        <PageHeader
            title="CSHP Denied"
            :lead="
                auth.canFile
                    ? 'Programmes returned to your office. Amend one to answer the remarks and it goes back into the review queue.'
                    : 'Programmes returned to the filing office, with the reason each was returned.'
            "
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'CSHP' }, { label: 'Denied' }]"
        />

        <div v-if="cshp.denied.length" class="alert alert--warning mb-3">
            <AppIcon class="alert__icon" name="alert-circle" :size="16" />
            <div>
                A returned programme stays at the review stage. Saving an amended programme clears
                the return and puts it back in the queue &mdash; there is no separate resubmission.
            </div>
        </div>

        <CshpTable
            :rows="cshp.denied"
            show-remarks
            show-decision
            empty-title="Nothing has been returned"
            empty-text="No programme is currently back with a filing office."
        />
    </div>
</template>
