<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

/**
 * The notice every visitor meets on arrival.
 *
 * It says plainly what this is, so nobody mistakes a portfolio piece for a
 * system in service, and it points at the write-up behind it.
 *
 * Deliberately not dismissible by clicking away or pressing Escape: it is shown
 * once per visit and asks for one deliberate press, which is the whole reason it
 * is here rather than a banner that gets scrolled past.
 */
const open = ref(true)

/** Stops the page behind scrolling while the notice is up. */
watch(
    open,
    (isOpen) => {
        if (import.meta.client) {
            document.body.classList.toggle('demo-notice-open', isOpen)
        }
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    if (import.meta.client) {
        document.body.classList.remove('demo-notice-open')
    }
})
</script>

<template>
    <div>
        <Transition name="pop" appear>
            <div
                v-if="open"
                class="modal demo-notice"
                role="dialog"
                aria-modal="true"
                aria-labelledby="demo-notice-title"
            >
                <div class="modal__dialog">
                    <div class="modal__header">
                        <span class="modal__icon modal__icon--primary">
                            <AppIcon name="shield-check" :size="20" />
                        </span>

                        <h2 id="demo-notice-title" class="modal__title">This is a demo</h2>
                    </div>

                    <div class="demo-notice__body">
                        <p>
                            You are looking at a front-end demonstration of a
                            <strong>Construction Safety and Health Program (CSHP)</strong>
                            registration and approval system &mdash; the register of Safety Officers
                            and First Aiders, the establishments, and the programmes that move from
                            review to approval.
                        </p>

                        <p>
                            It is built with <strong>Nuxt</strong> and <strong>Vue</strong>, and it
                            runs entirely in your browser &mdash; there is no server and no database
                            behind it. The working system it is modelled on is built with
                            <strong>PHP</strong>, <strong>CodeIgniter</strong> and
                            <strong>MySQL</strong>.
                        </p>

                        <p>
                            That system also sits behind a
                            <strong>login and authentication</strong>, so a filing can only be opened
                            by the offices entitled to see it. That is stood down here on purpose
                            &mdash; the account menu in the top right takes its place, so you can
                            look around as each role.
                        </p>

                        <p class="mb-0 text-muted text-sm">
                            Every name, company, office and figure you will see here is invented, and
                            no organisation's branding appears anywhere in it. Nothing is saved:
                            reload the page and the demo starts over.
                        </p>
                    </div>

                    <div class="demo-notice__footer">
                        <div class="demo-notice__links">
                            <a
                                href="https://ljar.vercel.app/"
                                class="btn btn--secondary"
                                target="_blank"
                                rel="noopener"
                            >
                                <AppIcon name="user" :size="15" />
                                Visit my Portfolio
                            </a>

                            <a
                                href="https://ljar.vercel.app/projects/cshp-online-system"
                                class="btn btn--secondary"
                                target="_blank"
                                rel="noopener"
                            >
                                <AppIcon name="file-text" :size="15" />
                                Read the Case Study
                            </a>
                        </div>

                        <button
                            type="button"
                            class="btn btn--primary demo-notice__close"
                            autofocus
                            @click="open = false"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- No click handler: the notice closes from its own button only. -->
        <Transition name="fade" appear>
            <div v-if="open" class="modal-backdrop"></div>
        </Transition>
    </div>
</template>
