<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'

/**
 * The one confirmation dialog, rendered once by the layout.
 *
 * Everything that asks before acting goes through `useCshpModal()`. The PHP
 * build had three ways of asking — `confirm()`, SweetAlert and a Bootstrap
 * modal — which is three ways of looking unlike the rest of the page.
 */
const modal = useCshpModal()

const icon = computed(() => {
    switch (modal.state.variant) {
        case 'danger':
            return 'alert-triangle'
        case 'warning':
            return 'alert-circle'
        case 'success':
            return 'check-circle'
        default:
            return 'info'
    }
})

/** Stops the page behind scrolling while a dialog is up. */
watch(
    () => modal.state.kind,
    (kind) => {
        if (import.meta.client) {
            document.body.classList.toggle('modal-open', kind !== null)
        }
    },
)

onBeforeUnmount(() => {
    if (import.meta.client) {
        document.body.classList.remove('modal-open')
    }
})
</script>

<template>
    <div>
        <Transition name="fade">
            <div v-if="modal.state.kind" class="modal-backdrop" @click="modal.dismiss()"></div>
        </Transition>

        <Transition name="pop">
            <div
                v-if="modal.state.kind"
                class="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="app-modal-title"
                @keydown.esc="modal.dismiss()"
            >
                <div class="modal__dialog" @click.stop>
                    <div class="modal__header">
                        <span class="modal__icon" :class="`modal__icon--${modal.state.variant}`">
                            <AppIcon :name="icon" :size="20" />
                        </span>

                        <h2 id="app-modal-title" class="modal__title">{{ modal.state.title }}</h2>
                    </div>

                    <div class="modal__body">
                        <p v-if="modal.state.text">{{ modal.state.text }}</p>

                        <!-- Where a notice can point somewhere: the case study,
                             for the parts a front end cannot stand in for. -->
                        <p v-if="modal.state.link" class="text-center mt-3 mb-0">
                            <a
                                :href="modal.state.link.href"
                                target="_blank"
                                rel="noopener"
                                class="font-semibold"
                            >
                                {{ modal.state.link.label }}
                            </a>
                        </p>

                        <div v-if="modal.state.promptShown" class="field mt-3">
                            <label class="label" for="app-modal-prompt">
                                {{ modal.state.promptLabel }}
                                <span v-if="modal.state.promptRequired" class="label__required">*</span>
                            </label>

                            <textarea
                                id="app-modal-prompt"
                                v-model="modal.state.promptValue"
                                class="textarea"
                                :class="{ 'is-invalid': modal.state.promptError }"
                                :placeholder="modal.state.promptPlaceholder"
                            ></textarea>

                            <span v-if="modal.state.promptError" class="error">
                                {{ modal.state.promptError }}
                            </span>
                        </div>
                    </div>

                    <div class="modal__footer">
                        <template v-if="modal.state.kind === 'confirm'">
                            <button type="button" class="btn btn--secondary" @click="modal.dismiss()">
                                {{ modal.state.cancelText }}
                            </button>

                            <button
                                type="button"
                                class="btn"
                                :class="
                                    modal.state.variant === 'danger' ? 'btn--danger' : 'btn--primary'
                                "
                                autofocus
                                @click="modal.accept()"
                            >
                                {{ modal.state.confirmText }}
                            </button>
                        </template>

                        <button
                            v-else
                            type="button"
                            class="btn btn--primary"
                            autofocus
                            @click="modal.dismiss()"
                        >
                            {{ modal.state.dismissText }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>
