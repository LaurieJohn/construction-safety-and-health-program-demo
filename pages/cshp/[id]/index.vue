<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import {
    CSHP_STATUS,
    CSHP_TYPE,
    DENIED_STATUS,
    OH_PERSONNEL_THRESHOLD,
    cshpTypeName,
    fieldOfficeName,
    projectTypeName,
} from '~/data/reference'

/**
 * A programme in full, and the decisions available on it.
 *
 * The old system printed this as a form you could not submit, which made a
 * read look like an edit that had failed. Here it reads as a document, with the
 * route it has taken along the top and the decisions the signed-in account may
 * take beside the title.
 */
const route = useRoute()
const auth = useAuthStore()
const cshp = useCshpStore()
const establishments = useEstablishmentsStore()
const actions = useCshpActions()

const id = computed(() => Number(route.params.id))
const entry = computed(() => cshp.find(id.value))

useHead({ title: () => `${entry.value?.control_no ?? 'Programme'} — CSHP Demo` })

const permissions = computed(() => (entry.value ? actions.permissions(entry.value) : null))

const establishment = computed(() =>
    entry.value?.establishment_id ? establishments.find(entry.value.establishment_id) : undefined,
)

const returned = computed(() => entry.value?.denied_status !== DENIED_STATUS.none)

/** The route so far, as three stages with what happened at each. */
const stages = computed(() => {
    if (!entry.value) {
        return []
    }

    const record = entry.value

    return [
        {
            label: 'Filed',
            done: true,
            by: fieldOfficeName(record.fo_id),
            on: record.date_received,
        },
        {
            label: returned.value ? 'Returned' : 'Reviewed',
            done: Boolean(record.date_reviewed),
            by: record.reviewed_by,
            on: record.date_reviewed,
            bad: returned.value,
        },
        {
            label: 'Approved',
            done: record.status === CSHP_STATUS.approved,
            by: record.approved_by,
            on: record.date_approved,
        },
    ]
})

/** Whether the project is over the threshold that requires health personnel. */
const needsOhPersonnel = computed(() =>
    entry.value
        ? entry.value.cshp_type === CSHP_TYPE.comprehensive &&
          entry.value.no_workers > OH_PERSONNEL_THRESHOLD
        : false,
)

const cardLapsesEarly = computed(
    () =>
        Boolean(entry.value?.first_aider_validity) &&
        Boolean(entry.value?.project_end_date) &&
        entry.value!.first_aider_validity < entry.value!.project_end_date,
)

async function onRemove(): Promise<void> {
    if (entry.value && (await actions.remove(entry.value))) {
        await navigateTo('/cshp/for-review')
    }
}
</script>

<template>
    <div v-if="!entry" class="card">
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

    <div v-else>
        <PageHeader
            :title="entry.project_name"
            :lead="`${cshpTypeName(entry.cshp_type)} CSHP · ${entry.control_no} · filed by ${fieldOfficeName(entry.fo_id)}`"
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'CSHP', to: '/cshp/for-review' },
                { label: entry.control_no },
            ]"
        >
            <template #actions>
                <button
                    v-if="permissions?.endorse"
                    type="button"
                    class="btn btn--primary"
                    @click="actions.endorse(entry)"
                >
                    <AppIcon name="send" :size="15" />
                    Endorse
                </button>

                <button
                    v-if="permissions?.approve"
                    type="button"
                    class="btn btn--primary"
                    @click="actions.approve(entry)"
                >
                    <AppIcon name="check-circle" :size="15" />
                    Approve
                </button>

                <button
                    v-if="permissions?.returnIt"
                    type="button"
                    class="btn btn--secondary"
                    @click="actions.returnForCompliance(entry)"
                >
                    <AppIcon name="rotate-ccw" :size="15" />
                    Return
                </button>

                <button
                    v-if="permissions?.close"
                    type="button"
                    class="btn btn--secondary"
                    @click="actions.closeAsCompleted(entry)"
                >
                    <AppIcon name="archive" :size="15" />
                    Close
                </button>

                <NuxtLink
                    v-if="permissions?.edit"
                    :to="`/cshp/${entry.id}/edit`"
                    class="btn btn--secondary"
                >
                    <AppIcon name="pencil" :size="15" />
                    Amend
                </NuxtLink>

                <button
                    v-if="permissions?.remove"
                    type="button"
                    class="btn btn--secondary"
                    @click="onRemove"
                >
                    <AppIcon name="trash" :size="15" />
                    Delete
                </button>
            </template>
        </PageHeader>

        <div class="stack">
            <section class="card">
                <div class="card__header">
                    <div>
                        <h2 class="card__title">Where it stands</h2>
                        <p class="card__subtitle">
                            Filed {{ longDate(entry.date_received) }} &middot;
                            {{ projectTypeName(entry.project_type) }} project
                        </p>
                    </div>

                    <StatusBadge :status="entry.status" :denied-status="entry.denied_status" />
                </div>

                <div class="card__body">
                    <ol class="route">
                        <li
                            v-for="stage in stages"
                            :key="stage.label"
                            class="route__stage"
                            :class="{
                                'is-done': stage.done,
                                'is-bad': stage.done && stage.bad,
                            }"
                        >
                            <div class="route__head">
                                <span class="route__dot">
                                    <AppIcon
                                        :name="stage.done ? (stage.bad ? 'close' : 'check') : 'clock'"
                                        :size="12"
                                        :width="3"
                                    />
                                </span>

                                <span class="route__line"></span>
                            </div>

                            <div>
                                <p class="route__label mb-0">{{ stage.label }}</p>
                                <p class="route__meta mb-0">
                                    <template v-if="stage.done">
                                        {{ stage.by || '—' }}
                                        <template v-if="stage.on">
                                            &middot; {{ longDate(stage.on) }}
                                        </template>
                                    </template>
                                    <template v-else>Pending</template>
                                </p>
                            </div>
                        </li>
                    </ol>

                    <div v-if="entry.remarks" class="alert mt-4" :class="returned ? 'alert--danger' : 'alert--info'">
                        <AppIcon
                            class="alert__icon"
                            :name="returned ? 'alert-triangle' : 'info'"
                            :size="16"
                        />
                        <div>
                            <strong>{{ returned ? 'Returned' : 'Remarks' }}</strong>
                            &mdash; {{ entry.remarks }}
                        </div>
                    </div>

                    <div v-if="cardLapsesEarly" class="alert alert--warning mt-3">
                        <AppIcon class="alert__icon" name="alert-triangle" :size="16" />
                        <div>
                            The named first aider's card lapses
                            {{ longDate(entry.first_aider_validity) }}, before the works end
                            {{ longDate(entry.project_end_date) }}.
                        </div>
                    </div>
                </div>
            </section>

            <div class="grid grid-4">
                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Project cost</span>
                        <span class="stat__icon stat__icon--green">
                            <AppIcon name="trending-up" :size="17" />
                        </span>
                    </div>
                    <p class="stat__value mb-0" style="font-size: 1.375rem">
                        {{ compactPeso(entry.project_cost) }}
                    </p>
                    <p class="stat__hint mb-0">{{ peso(entry.project_cost) }}</p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Workers</span>
                        <span class="stat__icon stat__icon--blue"><AppIcon name="users" :size="17" /></span>
                    </div>
                    <p class="stat__value mb-0">{{ count(entry.no_workers) }}</p>
                    <p class="stat__hint mb-0">
                        {{ needsOhPersonnel ? 'Health personnel required' : 'Below the health-personnel threshold' }}
                    </p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Duration</span>
                        <span class="stat__icon stat__icon--violet">
                            <AppIcon name="calendar" :size="17" />
                        </span>
                    </div>
                    <p class="stat__value mb-0">{{ count(entry.calendar_days) }}</p>
                    <p class="stat__hint mb-0">calendar days</p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Implementation</span>
                        <span class="stat__icon stat__icon--amber">
                            <AppIcon name="clock" :size="17" />
                        </span>
                    </div>
                    <p class="stat__value mb-0" style="font-size: 1rem; margin-top: 0.75rem">
                        {{ shortDate(entry.project_start_date) }}
                    </p>
                    <p class="stat__hint mb-0">to {{ shortDate(entry.project_end_date) }}</p>
                </div>
            </div>

            <div class="grid grid-2">
                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Contractor</h2>

                        <NuxtLink
                            v-if="establishment"
                            :to="`/establishments/${establishment.id}`"
                            class="btn btn--secondary btn--sm"
                        >
                            <AppIcon name="building" :size="14" />
                            Establishment
                        </NuxtLink>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Company</th>
                                        <td>{{ entry.company_name }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Address</th>
                                        <td>{{ entry.complete_address }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Project manager</th>
                                        <td>{{ entry.project_mngr_name }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Email</th>
                                        <td>{{ entry.email }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Telephone / fax</th>
                                        <td>
                                            {{ entry.tel_no || '—' }}
                                            <template v-if="entry.fax_no"> / {{ entry.fax_no }}</template>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Contractor licence</th>
                                        <td>
                                            <span class="mono">{{ entry.pcab_no }}</span>
                                            <span
                                                v-if="entry.pcab_validity"
                                                class="text-xs d-block"
                                                :class="
                                                    isPast(entry.pcab_validity)
                                                        ? 'text-danger'
                                                        : 'text-muted'
                                                "
                                            >
                                                Valid until {{ longDate(entry.pcab_validity) }}
                                                <template v-if="isPast(entry.pcab_validity)">
                                                    — expired
                                                </template>
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Employed</th>
                                        <td>
                                            {{ count(entry.contractor_workers) }} total &middot;
                                            {{ count(entry.contractor_male) }} male,
                                            {{ count(entry.contractor_female) }} female
                                        </td>
                                    </tr>
                                    <tr v-if="entry.cshp_type === CSHP_TYPE.comprehensive">
                                        <th scope="row">Contracting registration</th>
                                        <td>
                                            <span class="mono">{{ entry.do_18_reg_no || '—' }}</span>
                                            <span
                                                v-if="entry.do_18_reg_date"
                                                class="text-xs text-muted d-block"
                                            >
                                                {{ longDate(entry.do_18_reg_date) }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr v-if="entry.cshp_type === CSHP_TYPE.comprehensive">
                                        <th scope="row">Rule 1020 registration</th>
                                        <td>
                                            <span class="mono">{{ entry.rule_1020_reg_no || '—' }}</span>
                                            <span
                                                v-if="entry.rule_1020_reg_date"
                                                class="text-xs text-muted d-block"
                                            >
                                                {{ longDate(entry.rule_1020_reg_date) }}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Project</h2>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Name</th>
                                        <td>{{ entry.project_name }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Address</th>
                                        <td>{{ entry.project_address }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Owner</th>
                                        <td>{{ entry.project_owner }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Owner's contact</th>
                                        <td>
                                            {{ entry.owner_email || '—' }}
                                            <span
                                                v-if="entry.owner_tel_no"
                                                class="text-xs text-muted d-block"
                                            >
                                                {{ entry.owner_tel_no }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Type</th>
                                        <td>{{ projectTypeName(entry.project_type) }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Cost</th>
                                        <td>{{ peso(entry.project_cost) }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Implementation</th>
                                        <td>
                                            {{ longDate(entry.project_start_date) }} &ndash;
                                            {{ longDate(entry.project_end_date) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Duration</th>
                                        <td>
                                            {{ count(entry.calendar_days) }}
                                            {{ plural('calendar day', entry.calendar_days) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            <div class="grid grid-2">
                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">OSH personnel</h2>
                        <p class="card__subtitle">Assigned to this project.</p>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Safety officer</th>
                                        <td>
                                            {{ entry.safety_officer_name || '—' }}
                                            <span
                                                v-if="entry.safety_officer_bosh_date"
                                                class="text-xs text-muted d-block"
                                            >
                                                BOSH {{ longDate(entry.safety_officer_bosh_date) }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">First aider</th>
                                        <td>
                                            {{ entry.first_aider_name || '—' }}
                                            <span
                                                v-if="entry.first_aider_validity"
                                                class="text-xs d-block"
                                                :class="cardLapsesEarly ? 'text-danger' : 'text-muted'"
                                            >
                                                Card valid to
                                                {{ longDate(entry.first_aider_validity) }}
                                            </span>
                                        </td>
                                    </tr>

                                    <template v-if="needsOhPersonnel">
                                        <tr>
                                            <th scope="row">OH nurse</th>
                                            <td>{{ entry.oh_nurse_name || '—' }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">OH physician</th>
                                            <td>{{ entry.oh_physician_name || '—' }}</td>
                                        </tr>
                                        <tr>
                                            <th scope="row">Dentist</th>
                                            <td>{{ entry.oh_dentist_name || '—' }}</td>
                                        </tr>
                                    </template>
                                </tbody>
                            </table>
                        </div>

                        <p v-if="!needsOhPersonnel" class="hint mt-3 mb-0">
                            Occupational health personnel are required above
                            {{ OH_PERSONNEL_THRESHOLD }} workers; this project deploys
                            {{ count(entry.no_workers) }}.
                        </p>
                    </div>
                </section>

                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Equipment and preparer</h2>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Heavy equipment</th>
                                        <td>{{ entry.heavy_equipment || 'None declared' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Certified operators</th>
                                        <td>{{ entry.equipment_operators || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Prepared by</th>
                                        <td>{{ entry.prepared_by }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Education</th>
                                        <td>{{ entry.preparer_education || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Experience in OSH</th>
                                        <td>{{ entry.preparer_experience || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Other qualifications</th>
                                        <td>{{ entry.preparer_qualification || '—' }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            <div v-if="!permissions?.edit && !permissions?.endorse && !permissions?.approve" class="alert alert--info no-print">
                <AppIcon class="alert__icon" name="info" :size="16" />
                <div>
                    The {{ auth.role }} account reads this programme without deciding on it. Use the
                    account menu in the top right to look at it as a reviewer or the approving
                    officer.
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.d-block {
    display: block;
}

/* The route the programme has taken: three stages, joined by the line the
   markers sit on. */
.route {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

/* The marker and its connector sit on their own row above the label. Running
   the line beside the text instead would put it straight through the words. */
.route__stage {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.route__head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

/* The connector runs from this marker towards the next one, so the last stage
   has none — nothing follows it. */
.route__line {
    flex: 1;
    height: 2px;
    background: var(--slate-200);
}

.route__stage:last-child .route__line {
    display: none;
}

.route__dot {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--slate-100);
    color: var(--slate-400);
    flex: none;
    z-index: 1;
}

.route__stage.is-done .route__dot {
    background: var(--green-50);
    color: var(--green-700);
}

.route__stage.is-bad .route__dot {
    background: var(--red-50);
    color: var(--red-700);
}

.route__label {
    font-size: 0.8438rem;
    font-weight: 650;
    color: var(--slate-800);
}

.route__meta {
    font-size: 0.75rem;
    color: var(--text-muted);
}

@media (max-width: 640px) {
    .route {
        grid-template-columns: minmax(0, 1fr);
    }

    /* Stacked, the stages no longer sit side by side for a line to join. */
    .route__line {
        display: none;
    }
}
</style>
