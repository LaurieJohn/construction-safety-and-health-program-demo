<script setup lang="ts">
import { computed } from 'vue'

/**
 * The icon set.
 *
 * The original pulled Glyphicons and Font Awesome off a CDN. These are drawn
 * inline instead: one stroked 24×24 grid, no web font, no network request, and
 * they inherit `currentColor` so an icon is always the colour of the text it
 * sits beside.
 *
 *   <AppIcon name="plus" :size="14" />
 */
const props = withDefaults(
    defineProps<{
        name: string
        size?: number
        /** Stroke weight. The default suits body text; headings take more. */
        width?: number
    }>(),
    { size: 16, width: 2 },
)

/** Each entry is the path data for a 24×24 stroked icon. */
const paths: Record<string, string[]> = {
    // Navigation and chrome
    'chevron-down': ['m6 9 6 6 6-6'],
    'chevron-right': ['m9 18 6-6-6-6'],
    'chevron-left': ['m15 18-6-6 6-6'],
    'chevron-up': ['m18 15-6-6-6 6'],
    'arrow-left': ['M19 12H5', 'm12 19-7-7 7-7'],
    'arrow-right': ['M5 12h14', 'm12 5 7 7-7 7'],
    menu: ['M4 6h16', 'M4 12h16', 'M4 18h16'],
    close: ['M18 6 6 18', 'm6 6 12 12'],
    search: ['M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'm21 21-4.3-4.3'],
    'sort-asc': ['m7 15 5-6 5 6'],
    'sort-desc': ['m7 9 5 6 5-6'],
    sort: ['m7 9 5-5 5 5', 'm7 15 5 5 5-5'],

    // Modules
    shield: [
        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
    ],
    'shield-check': [
        'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
        'm9 12 2 2 4-4',
    ],
    building: [
        'M3 21h18',
        'M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16',
        'M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2',
    ],
    'hard-hat': [
        'M2 18h20',
        'M4 18v-3a8 8 0 0 1 16 0v3',
        'M10 10V4.5A1.5 1.5 0 0 1 11.5 3h1A1.5 1.5 0 0 1 14 4.5V10',
    ],
    users: [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
        'M22 21v-2a4 4 0 0 0-3-3.87',
        'M16 3.13a4 4 0 0 1 0 7.75',
    ],
    user: ['M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2', 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z'],
    'user-plus': [
        'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
        'M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
        'M19 8v6M22 11h-6',
    ],
    'file-text': [
        'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z',
        'M14 2v6h6',
        'M9 13h6M9 17h6',
    ],
    clipboard: [
        'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2',
        'M9 2h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z',
    ],
    settings: [
        'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
        'M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.88 1.7 1.7 0 0 0-1.56-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.88.34H9a1.7 1.7 0 0 0 1-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.88V9a1.7 1.7 0 0 0 1.56 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z',
    ],
    grid: ['M3 3h7v7H3z', 'M14 3h7v7h-7z', 'M14 14h7v7h-7z', 'M3 14h7v7H3z'],

    // Actions
    plus: ['M12 5v14', 'M5 12h14'],
    pencil: [
        'M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
    ],
    trash: ['M3 6h18', 'M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2', 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6', 'M10 11v6M14 11v6'],
    eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z', 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z'],
    check: ['m5 13 4 4L19 7'],
    'check-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm8 12 3 3 5-6'],
    'x-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'm15 9-6 6M9 9l6 6'],
    'alert-circle': ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 8v5', 'M12 16h.01'],
    'alert-triangle': [
        'M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
        'M12 9v4',
        'M12 17h.01',
    ],
    info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 16v-4', 'M12 8h.01'],
    send: ['m22 2-7 20-4-9-9-4Z', 'M22 2 11 13'],
    link: [
        'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7',
        'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
    ],
    download: ['M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4', 'm7 10 5 5 5-5', 'M12 15V3'],
    printer: [
        'M6 9V2h12v7',
        'M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2',
        'M6 14h12v8H6z',
    ],
    'rotate-ccw': ['M3 12a9 9 0 1 0 3-6.7L3 8', 'M3 3v5h5'],
    inbox: [
        'M22 12h-6l-2 3h-4l-2-3H2',
        'M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z',
    ],
    archive: ['M21 8v13H3V8', 'M1 3h22v5H1z', 'M10 12h4'],
    calendar: [
        'M8 2v4M16 2v4',
        'M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z',
        'M3 10h18',
    ],
    clock: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z', 'M12 6v6l4 2'],
    'trending-up': ['m22 7-8.5 8.5-5-5L2 17', 'M16 7h6v6'],
    'log-out': ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'm16 17 5-5-5-5', 'M21 12H9'],
    'switch-account': [
        'M16 3h5v5',
        'M21 3 13 11',
        'M8 21H3v-5',
        'M3 21 11 13',
    ],
}

const path = computed(() => paths[props.name] ?? paths.info)
</script>

<template>
    <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        :stroke-width="width"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        focusable="false"
        style="flex: none"
    >
        <path v-for="(d, index) in path" :key="index" :d="d" />
    </svg>
</template>
