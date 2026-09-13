<script setup lang="ts">
/**
 * The approval queue — `status = 2`.
 *
 * Everything a reviewer has endorsed and that is waiting on the approving
 * officer's signature. The details are locked at this point: an endorsed
 * programme is a document someone has already signed off on.
 */
useHead({ title: 'CSHP For Approval — CSHP Demo' })

const auth = useAuthStore()
const cshp = useCshpStore()
</script>

<template>
    <div>
        <PageHeader
            title="CSHP For Approval"
            :lead="
                auth.canApprove
                    ? 'Endorsed programmes waiting on your signature. Approve one, or return it to the filing office.'
                    : 'Programmes endorsed by a reviewer and waiting on the approving officer.'
            "
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'CSHP' },
                { label: 'For Approval' },
            ]"
        />

        <CshpTable
            :rows="cshp.forApproval"
            show-decision
            :show-status="false"
            empty-title="Nothing awaiting approval"
            empty-text="No programme has been endorsed and left unsigned."
        />
    </div>
</template>
