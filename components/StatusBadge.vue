<script setup lang="ts">
import { computed } from 'vue'
import {
    CSHP_STATUS,
    DENIED_STATUS,
    cshpStatusName,
    cshpStatusTone,
    deniedStatuses,
    type BadgeTone,
} from '~/data/reference'

/**
 * Where a programme stands, in one badge.
 *
 * A return runs alongside the status rather than replacing it, so a returned
 * programme reads as returned even though its status column still says For
 * Review — which is exactly the thing the old listing left the reader to work
 * out from a red table row.
 */
const props = withDefaults(
    defineProps<{
        status: number
        deniedStatus?: number
    }>(),
    { deniedStatus: DENIED_STATUS.none },
)

const returned = computed(() => props.deniedStatus !== DENIED_STATUS.none)

const label = computed(() => {
    if (!returned.value) {
        return cshpStatusName(props.status)
    }

    return deniedStatuses.find((entry) => entry.id === props.deniedStatus)?.short ?? 'Returned'
})

const tone = computed<BadgeTone>(() => {
    if (returned.value) {
        return props.deniedStatus === DENIED_STATUS.completion ? 'slate' : 'red'
    }

    return cshpStatusTone(props.status)
})

const icon = computed(() => {
    if (returned.value) {
        return props.deniedStatus === DENIED_STATUS.completion ? 'archive' : 'x-circle'
    }

    switch (props.status) {
        case CSHP_STATUS.approved:
            return 'check-circle'
        case CSHP_STATUS.forApproval:
            return 'send'
        default:
            return 'clock'
    }
})
</script>

<template>
    <span class="badge badge--plain" :class="`badge--${tone}`">
        <AppIcon :name="icon" :size="12" />
        {{ label }}
    </span>
</template>
