<script setup lang="ts">
import { computed } from 'vue'
import { SO_TYPE, cshpTypeName, fieldOfficeAbbreviation } from '~/data/reference'

/**
 * The landing page.
 *
 * The old dashboard printed one line — "Good day, {first name}." — and left
 * every count in the navigation badges. The counts are the useful part, so they
 * are the page: what is waiting, what it is worth, and what has moved recently.
 */
definePageMeta({ layout: 'default' })

useHead({ title: 'Dashboard — CSHP Demo' })

const auth = useAuthStore()
const cshp = useCshpStore()
const officers = useSafetyOfficersStore()
const establishments = useEstablishmentsStore()

const greeting = computed(() => {
    const hour = new Date().getHours()

    if (hour < 12) {
        return 'Good morning'
    }

    return hour < 18 ? 'Good afternoon' : 'Good evening'
})

const queues = computed(() => [
    {
        label: 'For Review',
        value: cshp.forReview.length,
        hint: 'Waiting on a reviewer',
        icon: 'clock',
        tone: 'amber',
        to: '/cshp/for-review',
    },
    {
        label: 'For Approval',
        value: cshp.forApproval.length,
        hint: 'Endorsed, awaiting sign-off',
        icon: 'send',
        tone: 'blue',
        to: '/cshp/for-approval',
    },
    {
        label: 'Returned',
        value: cshp.denied.length,
        hint: 'Back with the filing office',
        icon: 'x-circle',
        tone: 'red',
        to: '/cshp/denied',
    },
    {
        label: 'Approved',
        value: cshp.archives.length,
        hint: 'On file',
        icon: 'check-circle',
        tone: 'green',
        to: '/cshp/archives',
    },
])

const registers = computed(() => [
    {
        label: 'Safety Officers',
        value: officers.countByType(SO_TYPE.safetyOfficer) + officers.countByType(SO_TYPE.both),
        hint: `${officers.countByType(SO_TYPE.both)} also serve as first aiders`,
        icon: 'hard-hat',
        tone: 'violet',
        to: '/safety-officers',
    },
    {
        label: 'First Aiders',
        value: officers.countByType(SO_TYPE.firstAider) + officers.countByType(SO_TYPE.both),
        hint: officers.lapsed.length
            ? `${officers.lapsed.length} ${plural('card', officers.lapsed.length)} lapsed`
            : 'All cards current',
        icon: 'users',
        tone: officers.lapsed.length ? 'red' : 'green',
        to: '/safety-officers',
    },
    {
        label: 'Establishments',
        value: establishments.visible.length,
        hint: `${establishments.forReview.length} awaiting review`,
        icon: 'building',
        tone: 'blue',
        to: '/establishments',
    },
    {
        label: 'Approved Project Value',
        value: compactPeso(cshp.approvedValue),
        hint: `${count(cshp.approvedWorkers)} workers covered`,
        icon: 'trending-up',
        tone: 'green',
        to: '/cshp/archives',
    },
])

/** The six most recent filings, newest first. */
const recent = computed(() =>
    [...cshp.visible]
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .slice(0, 6),
)

/** What the signed-in account is expected to do next. */
const callToAction = computed(() => {
    if (auth.canApprove && cshp.forApproval.length) {
        return {
            text: `${cshp.forApproval.length} ${plural('programme', cshp.forApproval.length)} endorsed and waiting on your signature.`,
            label: 'Open the approval queue',
            to: '/cshp/for-approval',
        }
    }

    if (auth.canReview && cshp.forReview.length) {
        return {
            text: `${cshp.forReview.length} ${plural('programme', cshp.forReview.length)} waiting to be reviewed.`,
            label: 'Open the review queue',
            to: '/cshp/for-review',
        }
    }

    if (auth.canFile && cshp.denied.length) {
        return {
            text: `${cshp.denied.length} ${plural('programme', cshp.denied.length)} returned to your office for compliance.`,
            label: 'See what was returned',
            to: '/cshp/denied',
        }
    }

    return null
})
</script>

<template>
    <div>
        <PageHeader
            :title="`${greeting}, ${auth.user.first_name}.`"
            :lead="
                auth.isRegional
                    ? `Signed in as ${auth.role}. You are seeing every field office's filings.`
                    : `Signed in as ${auth.role} for the ${auth.officeName}. You are seeing your own office's filings.`
            "
        >
            <template #actions>
                <NuxtLink v-if="auth.canFile" to="/cshp/simple/create" class="btn btn--secondary">
                    <AppIcon name="plus" :size="15" />
                    Simple CSHP
                </NuxtLink>

                <NuxtLink v-if="auth.canFile" to="/cshp/comprehensive/create" class="btn btn--primary">
                    <AppIcon name="plus" :size="15" />
                    Comprehensive CSHP
                </NuxtLink>
            </template>
        </PageHeader>

        <div class="stack">
            <div v-if="callToAction" class="alert alert--info">
                <AppIcon class="alert__icon" name="info" :size="16" />
                <div>
                    {{ callToAction.text }}
                    <NuxtLink :to="callToAction.to" class="font-semibold">
                        {{ callToAction.label }} &rarr;
                    </NuxtLink>
                </div>
            </div>

            <section>
                <h2 class="mb-3">Programmes in the route</h2>

                <div class="grid grid-4">
                    <NuxtLink v-for="queue in queues" :key="queue.label" :to="queue.to" class="stat">
                        <div class="stat__head">
                            <span class="stat__label">{{ queue.label }}</span>
                            <span class="stat__icon" :class="`stat__icon--${queue.tone}`">
                                <AppIcon :name="queue.icon" :size="17" />
                            </span>
                        </div>

                        <p class="stat__value mb-0">{{ queue.value }}</p>
                        <p class="stat__hint mb-0">{{ queue.hint }}</p>
                    </NuxtLink>
                </div>
            </section>

            <section>
                <h2 class="mb-3">Registers</h2>

                <div class="grid grid-4">
                    <NuxtLink
                        v-for="register in registers"
                        :key="register.label"
                        :to="register.to"
                        class="stat"
                    >
                        <div class="stat__head">
                            <span class="stat__label">{{ register.label }}</span>
                            <span class="stat__icon" :class="`stat__icon--${register.tone}`">
                                <AppIcon :name="register.icon" :size="17" />
                            </span>
                        </div>

                        <p class="stat__value mb-0">{{ register.value }}</p>
                        <p class="stat__hint mb-0">{{ register.hint }}</p>
                    </NuxtLink>
                </div>
            </section>

            <section class="card">
                <div class="card__header">
                    <div>
                        <h2 class="card__title">Recently filed</h2>
                        <p class="card__subtitle">The last programmes to arrive.</p>
                    </div>

                    <NuxtLink to="/cshp/for-review" class="btn btn--secondary btn--sm">
                        View the queue
                        <AppIcon name="arrow-right" :size="14" />
                    </NuxtLink>
                </div>

                <div v-if="recent.length" class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Control No.</th>
                                <th>Project</th>
                                <th class="hide-sm">Contractor</th>
                                <th class="hide-sm">Office</th>
                                <th class="hide-sm">Type</th>
                                <th style="text-align: right">Project Cost</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="entry in recent" :key="entry.id">
                                <td>
                                    <NuxtLink :to="`/cshp/${entry.id}`" class="mono font-semibold">
                                        {{ entry.control_no }}
                                    </NuxtLink>
                                </td>
                                <td class="font-medium">{{ entry.project_name }}</td>
                                <td class="hide-sm text-muted">{{ entry.company_name }}</td>
                                <td class="hide-sm text-muted">
                                    {{ fieldOfficeAbbreviation(entry.fo_id) }}
                                </td>
                                <td class="hide-sm text-muted">{{ cshpTypeName(entry.cshp_type) }}</td>
                                <td style="text-align: right" class="nowrap">
                                    {{ peso(entry.project_cost) }}
                                </td>
                                <td>
                                    <StatusBadge
                                        :status="entry.status"
                                        :denied-status="entry.denied_status"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <EmptyState
                    v-else
                    title="Nothing filed yet"
                    text="Programmes filed by your office will appear here."
                    icon="clipboard"
                />
            </section>
        </div>
    </div>
</template>

<style scoped>
@media (max-width: 760px) {
    .hide-sm {
        display: none;
    }
}
</style>
