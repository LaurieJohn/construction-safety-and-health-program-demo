<script setup lang="ts">
import { computed } from 'vue'

/**
 * The archive — `status = 3`.
 *
 * Everything approved and on file, with what it covers: the value of the works
 * and the workers under a programme.
 */
useHead({ title: 'CSHP Archives — CSHP Demo' })

const cshp = useCshpStore()

const latest = computed(() =>
    [...cshp.archives].sort((a, b) => b.date_approved.localeCompare(a.date_approved))[0],
)
</script>

<template>
    <div>
        <PageHeader
            title="CSHP Archives"
            lead="Every approved programme on file."
            :trail="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'CSHP' }, { label: 'Archives' }]"
        />

        <div v-if="cshp.archives.length" class="grid grid-3 mb-4">
            <div class="stat">
                <div class="stat__head">
                    <span class="stat__label">Approved programmes</span>
                    <span class="stat__icon stat__icon--green">
                        <AppIcon name="check-circle" :size="17" />
                    </span>
                </div>
                <p class="stat__value mb-0">{{ cshp.archives.length }}</p>
                <p class="stat__hint mb-0">
                    Most recent {{ longDate(latest?.date_approved) }}
                </p>
            </div>

            <div class="stat">
                <div class="stat__head">
                    <span class="stat__label">Project value covered</span>
                    <span class="stat__icon stat__icon--blue">
                        <AppIcon name="trending-up" :size="17" />
                    </span>
                </div>
                <p class="stat__value mb-0">{{ compactPeso(cshp.approvedValue) }}</p>
                <p class="stat__hint mb-0">{{ peso(cshp.approvedValue) }}</p>
            </div>

            <div class="stat">
                <div class="stat__head">
                    <span class="stat__label">Workers covered</span>
                    <span class="stat__icon stat__icon--violet">
                        <AppIcon name="users" :size="17" />
                    </span>
                </div>
                <p class="stat__value mb-0">{{ count(cshp.approvedWorkers) }}</p>
                <p class="stat__hint mb-0">Across every approved project</p>
            </div>
        </div>

        <CshpTable
            :rows="cshp.archives"
            show-decision
            :show-status="false"
            empty-title="The archive is empty"
            empty-text="Nothing has been approved yet."
        />
    </div>
</template>
