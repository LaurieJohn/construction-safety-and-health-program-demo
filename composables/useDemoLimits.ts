import { useCshpModal } from './useCshpModal'

/** Where the working system is shown, since the demo cannot show it itself. */
const CASE_STUDY_URL = 'https://ljar.vercel.app/projects/cshp-online-system'

/**
 * What a control says when it would have reached something this front end does
 * not carry — an uploaded document, a generated report.
 *
 * The seed data holds plausible file URLs so the records look like real ones,
 * but nothing is behind them. Pointing a button at a link that goes nowhere
 * reads as a broken demo rather than a deliberately narrow one, so the button
 * says what is missing and points at the case study instead.
 */
export function notAvailableInDemo(title: string, text: string): void {
    useCshpModal().notice({
        title,
        text,
        link: { href: CASE_STUDY_URL, label: 'View Case Study' },
    })
}
