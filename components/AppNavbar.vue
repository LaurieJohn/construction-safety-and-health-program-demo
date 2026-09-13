<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { roleName } from '~/data/reference'

/**
 * The top bar.
 *
 * The grouping is the original's, kept deliberately: Safety Officer & First
 * Aider, Establishments, CSHP and Settings, each a dropdown, with the counts
 * that sat in the old menu's badges still on the CSHP queues. What changed is
 * the surface, not where anything is.
 *
 * The account menu on the right doubles as the role switcher. There is no login
 * in the demo, and nearly every screen reads the viewer's role to decide what it
 * offers, so this is how the system is seen as each kind of user.
 */
const auth = useAuthStore()
const cshp = useCshpStore()
const accounts = useAccountsStore()
const route = useRoute()

const open = ref(false)

/** The collapsed menu closes on navigation, or it covers the page you arrived on. */
watch(
    () => route.fullPath,
    () => {
        open.value = false
    },
)

interface MenuItem {
    label: string
    to: string
    icon: string
    count?: number
    shown?: boolean
}

interface Menu {
    key: string
    label: string
    icon: string
    match: string
    items: MenuItem[]
}

const menus = computed<Menu[]>(() => [
    {
        key: 'personnel',
        label: 'Safety Officer & First Aider',
        icon: 'hard-hat',
        match: '/safety-officers',
        items: [
            {
                label: 'Register',
                to: '/safety-officers/register',
                icon: 'user-plus',
                shown: auth.canRegisterPersonnel,
            },
            { label: 'View List', to: '/safety-officers', icon: 'users' },
        ],
    },
    {
        key: 'establishments',
        label: 'Establishments',
        icon: 'building',
        match: '/establishments',
        items: [
            {
                label: 'Register (Rule 1020)',
                to: '/establishments/register',
                icon: 'plus',
                shown: auth.canFile,
            },
            { label: 'View List', to: '/establishments', icon: 'archive' },
        ],
    },
    {
        key: 'cshp',
        label: 'CSHP',
        icon: 'clipboard',
        match: '/cshp',
        items: [
            {
                label: 'Add Simple CSHP',
                to: '/cshp/simple/create',
                icon: 'plus',
                shown: auth.canFile,
            },
            {
                label: 'Add Comprehensive CSHP',
                to: '/cshp/comprehensive/create',
                icon: 'plus',
                shown: auth.canFile,
            },
            { label: 'For Review', to: '/cshp/for-review', icon: 'pencil', count: cshp.forReview.length },
            { label: 'Denied', to: '/cshp/denied', icon: 'x-circle', count: cshp.denied.length },
            {
                label: 'For Approval',
                to: '/cshp/for-approval',
                icon: 'check',
                count: cshp.forApproval.length,
            },
            { label: 'Archives', to: '/cshp/archives', icon: 'archive', count: cshp.archives.length },
        ],
    },
    {
        key: 'settings',
        label: 'Settings',
        icon: 'settings',
        match: '/settings',
        items: [
            {
                label: 'Account Management',
                to: '/settings/accounts',
                icon: 'users',
                count: accounts.accounts.length,
            },
        ],
    },
])

function visibleItems(menu: Menu): MenuItem[] {
    return menu.items.filter((item) => item.shown !== false)
}

function isActive(match: string): boolean {
    return route.path === match || route.path.startsWith(`${match}/`)
}

/**
 * Switching account always returns to the dashboard.
 *
 * Roles see different things, and some see less: a field office left standing
 * on the approval queue the previous account had open would be looking at a
 * screen it is not entitled to. The dashboard is the one page every role opens.
 */
async function signInAs(userId: number): Promise<void> {
    auth.signInAs(userId)
    open.value = false

    await navigateTo('/dashboard')
}
</script>

<template>
    <nav class="navbar">
        <div class="container navbar__inner">
            <!-- A generic mark, not a seal: this demo carries no organisation's
                 identity, and it should not look as though it does. -->
            <NuxtLink to="/dashboard" class="navbar__brand">
                <span class="navbar__mark">
                    <AppIcon name="shield-check" :size="19" />
                </span>
                <span>
                    CSHP Online
                    <span class="navbar__brand-sub">Construction Safety &amp; Health</span>
                </span>
            </NuxtLink>

            <button
                class="navbar__toggle"
                type="button"
                :aria-expanded="open"
                aria-label="Toggle the navigation"
                @click="open = !open"
            >
                <AppIcon :name="open ? 'close' : 'menu'" :size="18" />
            </button>

            <div class="navbar__menu" :class="{ 'is-open': open }">
                <AppDropdown v-for="menu in menus" :key="menu.key" wide>
                    <template #trigger="{ toggle, open: isOpen }">
                        <button
                            type="button"
                            class="navbar__link"
                            :class="{ 'is-active': isActive(menu.match) }"
                            :aria-expanded="isOpen"
                            @click="toggle"
                        >
                            <AppIcon :name="menu.icon" :size="15" />
                            <span>{{ menu.label }}</span>
                            <AppIcon class="navbar__caret" name="chevron-down" :size="13" />
                        </button>
                    </template>

                    <NuxtLink
                        v-for="item in visibleItems(menu)"
                        :key="item.to"
                        :to="item.to"
                        class="dropdown__item"
                        :class="{ 'is-active': route.path === item.to }"
                    >
                        <AppIcon class="dropdown__item-icon" :name="item.icon" :size="15" />
                        <span>{{ item.label }}</span>
                        <span v-if="item.count !== undefined" class="dropdown__count">
                            {{ item.count }}
                        </span>
                    </NuxtLink>
                </AppDropdown>

                <div class="navbar__account">
                    <AppDropdown align-right wide>
                        <template #trigger="{ toggle, open: isOpen }">
                            <button
                                type="button"
                                class="navbar__link"
                                :aria-expanded="isOpen"
                                @click="toggle"
                            >
                                <span class="avatar">{{ auth.initials }}</span>
                                <span style="text-align: left">
                                    {{ auth.name }}
                                    <span class="navbar__brand-sub">{{ auth.role }}</span>
                                </span>
                                <AppIcon class="navbar__caret" name="chevron-down" :size="13" />
                            </button>
                        </template>

                        <div class="dropdown__header">Signed in as</div>

                        <div style="padding: 0 0.625rem 0.5rem">
                            <div class="font-semibold">{{ auth.name }}</div>
                            <div class="text-xs text-muted">
                                {{ auth.role }} &middot; {{ auth.officeName }}
                            </div>
                        </div>

                        <div class="dropdown__divider"></div>

                        <div class="dropdown__header">Switch account</div>

                        <button
                            v-for="account in auth.accounts"
                            :key="account.id"
                            type="button"
                            class="dropdown__item"
                            :class="{ 'is-active': account.id === auth.userId }"
                            @click="signInAs(account.id)"
                        >
                            <AppIcon
                                class="dropdown__item-icon"
                                :name="account.id === auth.userId ? 'check-circle' : 'user'"
                                :size="15"
                            />
                            <span>
                                {{ account.first_name }} {{ account.last_name }}
                                <span class="navbar__brand-sub">
                                    {{ roleName(account.user_type) }}
                                </span>
                            </span>
                        </button>
                    </AppDropdown>
                </div>
            </div>
        </div>
    </nav>
</template>
