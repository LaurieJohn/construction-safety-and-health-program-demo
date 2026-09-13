import { reactive } from 'vue'

/**
 * The confirmation that something saved.
 *
 * The PHP views did this with a green alert that a timer faded out — the same
 * idea, moved off the page so a save that navigates away can still report
 * itself on the page it lands on.
 *
 *   toast('Safety officer added.')
 */

export interface Toast {
    id: number
    message: string
}

const toasts = reactive<Toast[]>([])

let nextId = 1

export function useToast() {
    return {
        toasts,

        /** Raise a message; it clears itself. */
        push(message: string, durationMs = 3200): void {
            const id = nextId++

            toasts.push({ id, message })

            setTimeout(() => {
                const index = toasts.findIndex((entry) => entry.id === id)

                if (index !== -1) {
                    toasts.splice(index, 1)
                }
            }, durationMs)
        },

        dismiss(id: number): void {
            const index = toasts.findIndex((entry) => entry.id === id)

            if (index !== -1) {
                toasts.splice(index, 1)
            }
        },
    }
}

/** The short form, since raising a message is nearly always all a page wants. */
export function toast(message: string): void {
    useToast().push(message)
}
