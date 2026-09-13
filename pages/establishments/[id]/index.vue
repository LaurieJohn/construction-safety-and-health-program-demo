<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ESTAB_STATUS, cshpTypeName, estabStatuses, fieldOfficeName } from '~/data/reference'

/**
 * An establishment's profile, and the programmes filed against it.
 *
 * The old system spread this over three screens — profile, projects and the
 * programme list. They are one page here because they are one question: who is
 * this contractor, and what have they filed.
 */
const route = useRoute()
const auth = useAuthStore()
const establishments = useEstablishmentsStore()
const cshp = useCshpStore()
const modal = useCshpModal()

const id = computed(() => Number(route.params.id))
const establishment = computed(() => establishments.find(id.value))

useHead({ title: () => `${establishment.value?.business_name ?? 'Establishment'} — CSHP Demo` })

const programmes = computed(() => cshp.byEstablishment(id.value))

const status = computed(() =>
    estabStatuses.find((entry) => entry.id === establishment.value?.status),
)

/** Same dead link as the certificates on the register: nothing is behind it. */
function openPermit(): void {
    notAvailableInDemo(
        'Business permit',
        `Opening the permit filed by ${establishment.value?.business_name} needs the document store, which this front-end demo does not carry. The uploaded documents are shown in the screenshots on the case study.`,
    )
}

async function confirmRegister(): Promise<void> {
    if (!establishment.value) {
        return
    }

    const { confirmed } = await modal.confirm({
        title: 'Mark as registered?',
        text: `${establishment.value.business_name} will be treated as registered under Rule 1020, and comprehensive programmes may then be filed against it.`,
        confirmText: 'Mark registered',
    })

    if (confirmed) {
        establishments.markRegistered(id.value)
        toast('Establishment registered.')
    }
}
</script>

<template>
    <div v-if="!establishment" class="card">
        <EmptyState
            title="No such establishment"
            text="This registration is not on the register — it may have been deleted, or it belongs to another field office."
            icon="alert-circle"
        >
            <NuxtLink to="/establishments" class="btn btn--primary">
                <AppIcon name="arrow-left" :size="15" />
                Back to establishments
            </NuxtLink>
        </EmptyState>
    </div>

    <div v-else>
        <PageHeader
            :title="establishment.business_name"
            :lead="establishments.address(establishment)"
            :trail="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Establishments', to: '/establishments' },
                { label: establishment.control_no },
            ]"
        >
            <template #actions>
                <button
                    v-if="auth.canReview && establishment.status === ESTAB_STATUS.forReview"
                    type="button"
                    class="btn btn--secondary"
                    @click="confirmRegister"
                >
                    <AppIcon name="check" :size="15" />
                    Mark registered
                </button>

                <NuxtLink
                    v-if="auth.canFile"
                    :to="`/establishments/${establishment.id}/edit`"
                    class="btn btn--primary"
                >
                    <AppIcon name="pencil" :size="15" />
                    Amend
                </NuxtLink>
            </template>
        </PageHeader>

        <div class="stack">
            <div class="grid grid-4">
                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Control No.</span>
                        <span class="stat__icon"><AppIcon name="file-text" :size="17" /></span>
                    </div>
                    <p class="stat__value mono mb-0" style="font-size: 1.125rem">
                        {{ establishment.control_no }}
                    </p>
                    <p class="stat__hint mb-0">Filed {{ longDate(establishment.date_filed) }}</p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Employees</span>
                        <span class="stat__icon stat__icon--blue"><AppIcon name="users" :size="17" /></span>
                    </div>
                    <p class="stat__value mb-0">
                        {{ count(establishments.totalEmployees(establishment)) }}
                    </p>
                    <p class="stat__hint mb-0">
                        {{ count(establishments.totalMale(establishment)) }} male &middot;
                        {{ count(establishments.totalFemale(establishment)) }} female
                    </p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Programmes filed</span>
                        <span class="stat__icon stat__icon--violet">
                            <AppIcon name="clipboard" :size="17" />
                        </span>
                    </div>
                    <p class="stat__value mb-0">{{ programmes.length }}</p>
                    <p class="stat__hint mb-0">
                        {{ programmes.filter((entry) => entry.status === 3).length }} approved
                    </p>
                </div>

                <div class="stat">
                    <div class="stat__head">
                        <span class="stat__label">Status</span>
                        <span
                            class="stat__icon"
                            :class="
                                establishment.status === ESTAB_STATUS.registered
                                    ? 'stat__icon--green'
                                    : 'stat__icon--amber'
                            "
                        >
                            <AppIcon name="shield-check" :size="17" />
                        </span>
                    </div>
                    <p class="stat__value mb-0" style="font-size: 1.25rem">
                        <span class="badge" :class="`badge--${status?.tone}`">{{ status?.name }}</span>
                    </p>
                    <p class="stat__hint mb-0">{{ fieldOfficeName(establishment.fo_id) }}</p>
                </div>
            </div>

            <div class="grid grid-2">
                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Establishment</h2>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Registered name</th>
                                        <td>{{ establishment.registered_name || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Employer ID number</th>
                                        <td class="mono">{{ establishment.ein || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">TIN</th>
                                        <td class="mono">{{ establishment.tin }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Nature of business</th>
                                        <td>{{ establishment.main_economy_activity }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Industry code</th>
                                        <td class="mono">{{ establishment.psic_code || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Major products or services</th>
                                        <td>{{ establishment.major_products || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Legal organisation</th>
                                        <td>{{ establishment.legal_organisation }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Economic organisation</th>
                                        <td>{{ establishment.economic_organisation }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Contact</h2>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Manager / owner</th>
                                        <td>{{ establishment.name_of_manager }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Email</th>
                                        <td>{{ establishment.email }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Telephone</th>
                                        <td>{{ establishment.telephone_no || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Fax</th>
                                        <td>{{ establishment.fax_no || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Certified by</th>
                                        <td>
                                            {{ establishment.certified_by }}
                                            <span
                                                v-if="establishment.certified_position"
                                                class="text-muted text-xs d-block"
                                            >
                                                {{ establishment.certified_position }}
                                            </span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Certifier's contact</th>
                                        <td>{{ establishment.certified_contact || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Business permit</th>
                                        <td>
                                            <button
                                                v-if="establishment.permit_attachment"
                                                type="button"
                                                class="link-button"
                                                @click="openPermit"
                                            >
                                                Open the document
                                            </button>
                                            <span v-else>&mdash;</span>
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
                        <h2 class="card__title">Workforce</h2>
                    </div>

                    <div class="card__body card__body--flush">
                        <div class="table-wrap">
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th style="text-align: right">Filipino</th>
                                        <th style="text-align: right">Resident alien</th>
                                        <th style="text-align: right">Non-resident</th>
                                        <th style="text-align: right">Total</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    <tr>
                                        <th scope="row">Male</th>
                                        <td style="text-align: right">
                                            {{ count(establishment.male_filipino) }}
                                        </td>
                                        <td style="text-align: right">
                                            {{ count(establishment.male_r_alien) }}
                                        </td>
                                        <td style="text-align: right">
                                            {{ count(establishment.male_nr_alien) }}
                                        </td>
                                        <td class="font-semibold" style="text-align: right">
                                            {{ count(establishments.totalMale(establishment)) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Female</th>
                                        <td style="text-align: right">
                                            {{ count(establishment.female_filipino) }}
                                        </td>
                                        <td style="text-align: right">
                                            {{ count(establishment.female_r_alien) }}
                                        </td>
                                        <td style="text-align: right">
                                            {{ count(establishment.female_nr_alien) }}
                                        </td>
                                        <td class="font-semibold" style="text-align: right">
                                            {{ count(establishments.totalFemale(establishment)) }}
                                        </td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Total</th>
                                        <td colspan="3"></td>
                                        <td class="font-semibold" style="text-align: right">
                                            {{ count(establishments.totalEmployees(establishment)) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div class="card__body">
                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Labour union</th>
                                        <td>{{ establishment.labor_union || 'None declared' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Union registration</th>
                                        <td class="mono">{{ establishment.blr_reg_no || '—' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Subcontractors</th>
                                        <td>
                                            {{ count(establishment.subcontractors) }} engaging
                                            {{ count(establishment.subcontracted_employees) }}
                                            {{ plural('worker', establishment.subcontracted_employees) }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>

                <section class="card">
                    <div class="card__header">
                        <h2 class="card__title">Technical and financial</h2>
                    </div>

                    <div class="card__body">
                        <p class="label mb-2">Machinery and equipment declared</p>

                        <div v-if="establishment.technical_information.length" class="choice-group mb-3">
                            <span
                                v-for="item in establishment.technical_information"
                                :key="item"
                                class="badge badge--slate"
                            >
                                {{ item }}
                            </span>
                        </div>

                        <p v-else class="text-muted mb-3">None declared.</p>

                        <div class="table-wrap">
                            <table class="detail-list">
                                <tbody>
                                    <tr>
                                        <th scope="row">Chemicals handled</th>
                                        <td>{{ establishment.chemicals_handled || 'None declared' }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Current capitalisation</th>
                                        <td>{{ peso(establishment.current_capitalisation) }}</td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Total assets</th>
                                        <td>{{ peso(establishment.total_assets) }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            <section class="card">
                <div class="card__header">
                    <div>
                        <h2 class="card__title">Programmes filed by this establishment</h2>
                        <p class="card__subtitle">
                            Comprehensive programmes are filed against a registered establishment.
                        </p>
                    </div>

                    <NuxtLink
                        v-if="auth.canFile && establishment.status === ESTAB_STATUS.registered"
                        :to="`/cshp/comprehensive/create?establishment=${establishment.id}`"
                        class="btn btn--primary btn--sm"
                    >
                        <AppIcon name="plus" :size="14" />
                        File a programme
                    </NuxtLink>
                </div>

                <div v-if="programmes.length" class="table-wrap">
                    <table class="table">
                        <thead>
                            <tr>
                                <th>Control No.</th>
                                <th>Project</th>
                                <th class="hide-sm">Type</th>
                                <th style="text-align: right">Project cost</th>
                                <th class="hide-sm" style="text-align: right">Workers</th>
                                <th>Status</th>
                                <th style="text-align: right">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="entry in programmes" :key="entry.id">
                                <td class="mono font-semibold">{{ entry.control_no }}</td>
                                <td class="font-medium">{{ entry.project_name }}</td>
                                <td class="hide-sm text-muted">{{ cshpTypeName(entry.cshp_type) }}</td>
                                <td class="nowrap" style="text-align: right">
                                    {{ peso(entry.project_cost) }}
                                </td>
                                <td class="hide-sm" style="text-align: right">
                                    {{ count(entry.no_workers) }}
                                </td>
                                <td>
                                    <StatusBadge
                                        :status="entry.status"
                                        :denied-status="entry.denied_status"
                                    />
                                </td>
                                <td>
                                    <div class="table__actions">
                                        <NuxtLink
                                            :to="`/cshp/${entry.id}`"
                                            class="btn btn--secondary btn--icon"
                                            title="Open the programme"
                                        >
                                            <AppIcon name="eye" :size="14" />
                                        </NuxtLink>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <EmptyState
                    v-else
                    title="No programmes yet"
                    text="Nothing has been filed against this establishment."
                    icon="clipboard"
                />
            </section>
        </div>
    </div>
</template>

<style scoped>
.d-block {
    display: block;
}

@media (max-width: 760px) {
    .hide-sm {
        display: none;
    }
}
</style>
