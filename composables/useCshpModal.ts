import { reactive } from 'vue'

/**
 * The shared confirmations.
 *
 * The PHP build reached for `confirm()` and, later, SweetAlert — two different
 * dialogs for the same job, neither of which matched the rest of the screen.
 * This is one dialog as reactive state: the markup lives in
 * components/AppModal.vue, which the layout renders once.
 *
 *   const modal = useCshpModal()
 *
 *   modal.confirm({ title, text, confirmText, variant }).then((confirmed) => …)
 *   modal.notice({ title, text })
 *
 * Anything destructive or workflow-changing goes through `confirm()`. Do not
 * reach for `window.confirm`.
 */

export type ModalVariant = 'primary' | 'danger' | 'warning' | 'success'

export interface ConfirmOptions {
    title: string
    text?: string
    confirmText?: string
    cancelText?: string
    variant?: ModalVariant
    /** A free-text box shown above the buttons — the reviewer's remarks. */
    prompt?: {
        label: string
        placeholder?: string
        required?: boolean
        value?: string
    }
}

export interface NoticeOptions {
    title: string
    text?: string
    dismissText?: string
    variant?: ModalVariant
}

interface ModalState {
    kind: 'confirm' | 'notice' | null
    title: string
    text: string
    confirmText: string
    cancelText: string
    dismissText: string
    variant: ModalVariant
    promptLabel: string
    promptPlaceholder: string
    promptRequired: boolean
    promptValue: string
    promptShown: boolean
    promptError: string
}

const state = reactive<ModalState>({
    kind: null,
    title: '',
    text: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    dismissText: 'Close',
    variant: 'primary',
    promptLabel: '',
    promptPlaceholder: '',
    promptRequired: false,
    promptValue: '',
    promptShown: false,
    promptError: '',
})

/** The outcome a caller waits on: was it confirmed, and what was typed. */
export interface ModalResult {
    confirmed: boolean
    text: string
}

/** Only one modal is ever on screen, so one pending resolver is enough. */
let resolver: ((result: ModalResult) => void) | null = null

function settle(confirmed: boolean): void {
    const resolve = resolver
    const text = state.promptValue

    resolver = null
    state.kind = null
    state.promptShown = false
    state.promptError = ''

    resolve?.({ confirmed, text })
}

export function useCshpModal() {
    return {
        state,

        /**
         * Ask before doing something. Resolves confirmed only when the confirm
         * button is pressed — dismissing any other way resolves false, so a
         * caller can always branch on one boolean.
         */
        confirm(options: ConfirmOptions): Promise<ModalResult> {
            settle(false)

            state.kind = 'confirm'
            state.title = options.title
            state.text = options.text ?? ''
            state.confirmText = options.confirmText ?? 'Confirm'
            state.cancelText = options.cancelText ?? 'Cancel'
            state.variant = options.variant ?? 'primary'
            state.promptShown = Boolean(options.prompt)
            state.promptLabel = options.prompt?.label ?? ''
            state.promptPlaceholder = options.prompt?.placeholder ?? ''
            state.promptRequired = options.prompt?.required ?? false
            state.promptValue = options.prompt?.value ?? ''
            state.promptError = ''

            return new Promise<ModalResult>((resolve) => {
                resolver = resolve
            })
        },

        /** Tell the user something they only have to acknowledge. */
        notice(options: NoticeOptions): Promise<ModalResult> {
            settle(false)

            state.kind = 'notice'
            state.title = options.title
            state.text = options.text ?? ''
            state.dismissText = options.dismissText ?? 'Close'
            state.variant = options.variant ?? 'primary'
            state.promptShown = false

            return new Promise<ModalResult>((resolve) => {
                resolver = resolve
            })
        },

        /**
         * Accept the dialog. A required prompt left empty refuses instead, so
         * a reviewer cannot return a filing without saying why.
         */
        accept(): void {
            if (state.promptShown && state.promptRequired && !state.promptValue.trim()) {
                state.promptError = 'This is required.'

                return
            }

            settle(true)
        },

        /** Close whatever is on screen, reporting the outcome to the caller. */
        dismiss(): void {
            settle(false)
        },
    }
}
