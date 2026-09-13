<script setup lang="ts">
/**
 * The title block every page opens with — the `<h2 class="dashboard_title">`
 * the old template printed, with room for a trail above it and the page's
 * actions beside it.
 */
defineProps<{
    title: string
    lead?: string
    /** `[{ label, to }]`, the last entry being the page itself (no `to`). */
    trail?: { label: string; to?: string }[]
}>()
</script>

<template>
    <header class="page-header">
        <div>
            <nav v-if="trail?.length" class="breadcrumb" aria-label="Breadcrumb">
                <template v-for="(crumb, index) in trail" :key="crumb.label">
                    <AppIcon v-if="index > 0" name="chevron-right" :size="12" />
                    <NuxtLink v-if="crumb.to" :to="crumb.to">{{ crumb.label }}</NuxtLink>
                    <span v-else>{{ crumb.label }}</span>
                </template>
            </nav>

            <h1 class="page-header__title">{{ title }}</h1>
            <p v-if="lead" class="page-header__lead">{{ lead }}</p>
        </div>

        <div v-if="$slots.actions" class="page-header__actions no-print">
            <slot name="actions" />
        </div>
    </header>
</template>
