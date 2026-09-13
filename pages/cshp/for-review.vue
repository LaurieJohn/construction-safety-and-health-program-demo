<script setup lang="ts">
/**
 * The review queue — `status = 1 AND denied_status = 0`.
 *
 * Everything filed and not yet decided on. A returned programme leaves this
 * list for the Denied one until the filing office answers the remarks.
 */
useHead({ title: 'CSHP For Review — CSHP Demo' })

const auth = useAuthStore()
const cshp = useCshpStore()
</script>

<template>
    <div>
        <PageHeader
            title="CSHP For Review"
            :lead="
                auth.canReview
                    ? 'Programmes waiting on your review. Endorse one for approval, or return it with the remarks the filing office has to answer.'
                    : 'Programmes your office has filed and that are waiting on a reviewer.'
            "
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'CSHP' }, { label: 'For Review' }]"
        >
            <template #actions>
                <NuxtLink v-if="auth.canFile" to="/cshp/simple/create" class="btn btn--secondary">
                    <AppIcon name="plus" :size="15" />
                    Simple
                </NuxtLink>

                <NuxtLink v-if="auth.canFile" to="/cshp/comprehensive/create" class="btn btn--primary">
                    <AppIcon name="plus" :size="15" />
                    Comprehensive
                </NuxtLink>
            </template>
        </PageHeader>

        <CshpTable
            :rows="cshp.forReview"
            :show-status="false"
            empty-title="The review queue is clear"
            empty-text="Nothing is waiting to be reviewed."
        >
            <template #empty-action>
                <NuxtLink v-if="auth.canFile" to="/cshp/simple/create" class="btn btn--primary">
                    <AppIcon name="plus" :size="15" />
                    File a programme
                </NuxtLink>
            </template>
        </CshpTable>
    </div>
</template>
