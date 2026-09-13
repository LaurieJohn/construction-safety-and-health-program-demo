import type { CshpApplication } from '~/data/demo'
import { CSHP_STATUS } from '~/data/reference'
import { useAuthStore } from '~/stores/auth'
import { useCshpStore } from '~/stores/cshp'
import { useCshpModal } from './useCshpModal'
import { toast } from './useToast'

/**
 * The decisions a programme can be moved by, in one place.
 *
 * The listings and the detail page offer the same four actions, and each of
 * them asks before it acts. Keeping the wording and the guards here means the
 * queue and the programme itself cannot drift apart on what "return" means or
 * on who is allowed to press it.
 */
export function useCshpActions() {
    const auth = useAuthStore()
    const cshp = useCshpStore()
    const modal = useCshpModal()

    /** What the signed-in account may do to this programme, right now. */
    function permissions(entry: CshpApplication) {
        return {
            edit: auth.canFile && cshp.isEditable(entry),
            remove: auth.canFile && cshp.isEditable(entry),
            endorse: auth.canReview && entry.status === CSHP_STATUS.forReview,
            approve: auth.canApprove && entry.status === CSHP_STATUS.forApproval,
            /** A reviewer returns from review; an approver returns from approval. */
            returnIt:
                (auth.canReview && entry.status === CSHP_STATUS.forReview) ||
                (auth.canApprove && entry.status === CSHP_STATUS.forApproval),
            close: auth.canReview && entry.status === CSHP_STATUS.forReview,
        }
    }

    async function endorse(entry: CshpApplication): Promise<boolean> {
        const { confirmed, text } = await modal.confirm({
            title: 'Endorse for approval?',
            text: `${entry.control_no} — ${entry.project_name} will move to the approving officer and can no longer be edited by the filing office.`,
            confirmText: 'Endorse',
            prompt: {
                label: 'Review remarks',
                placeholder: 'What you checked, and anything the approving officer should know.',
            },
        })

        if (!confirmed) {
            return false
        }

        cshp.endorse(entry.id, text.trim())
        toast(`${entry.control_no} endorsed for approval.`)

        return true
    }

    async function approve(entry: CshpApplication): Promise<boolean> {
        const { confirmed, text } = await modal.confirm({
            title: 'Approve this programme?',
            text: `${entry.control_no} — ${entry.project_name} will be approved and filed, and a certificate issued to the contractor.`,
            confirmText: 'Approve',
            prompt: {
                label: 'Approval remarks',
                placeholder: 'Optional.',
            },
        })

        if (!confirmed) {
            return false
        }

        cshp.approve(entry.id, text.trim())
        toast(`${entry.control_no} approved.`)

        return true
    }

    async function returnForCompliance(entry: CshpApplication): Promise<boolean> {
        const { confirmed, text } = await modal.confirm({
            title: 'Return for compliance?',
            text: `${entry.control_no} goes back to the filing office. It stays in the review stage, and answering the remarks below puts it back in the queue.`,
            confirmText: 'Return',
            variant: 'danger',
            prompt: {
                label: 'What has to be put right',
                placeholder: 'Be specific — this is all the filing office will see.',
                required: true,
            },
        })

        if (!confirmed) {
            return false
        }

        cshp.returnForCompliance(entry.id, text.trim())
        toast(`${entry.control_no} returned for compliance.`)

        return true
    }

    async function closeAsCompleted(entry: CshpApplication): Promise<boolean> {
        const { confirmed, text } = await modal.confirm({
            title: 'Close this programme?',
            text: `${entry.control_no} will be filed as closed — for a project that was completed, withdrawn or will not proceed.`,
            confirmText: 'Close programme',
            variant: 'warning',
            prompt: {
                label: 'Reason',
                placeholder: 'Why the programme is being closed.',
                required: true,
            },
        })

        if (!confirmed) {
            return false
        }

        cshp.closeAsCompleted(entry.id, text.trim())
        toast(`${entry.control_no} closed.`)

        return true
    }

    async function remove(entry: CshpApplication): Promise<boolean> {
        const { confirmed } = await modal.confirm({
            title: 'Delete this programme?',
            text: `${entry.control_no} — ${entry.project_name} will be deleted. This cannot be undone.`,
            confirmText: 'Delete',
            variant: 'danger',
        })

        if (!confirmed) {
            return false
        }

        cshp.remove(entry.id)
        toast('Programme deleted.')

        return true
    }

    return { permissions, endorse, approve, returnForCompliance, closeAsCompleted, remove }
}
