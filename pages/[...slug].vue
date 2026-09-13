<script setup lang="ts">
/**
 * Anything that is not a route.
 *
 * With `ssr: false` there is no server to answer a 404, so the catch-all is a
 * page like any other — which also means a mistyped address lands somewhere
 * that can point back at the system rather than at an empty screen.
 */
useHead({ title: 'Page not found — CSHP Demo' })
</script>

<template>
    <div>
        <PageHeader title="Page not found" :trail="[{ label: 'Dashboard', to: '/dashboard' }]" />

        <div class="card">
            <EmptyState
                title="There is nothing at this address"
                text="The page may have been renamed, or the address mistyped."
                icon="alert-circle"
            >
                <NuxtLink to="/dashboard" class="btn btn--primary">
                    <AppIcon name="arrow-left" :size="15" />
                    Back to the dashboard
                </NuxtLink>
            </EmptyState>
        </div>
    </div>
</template>
