import { useCshpModal } from './useCshpModal'

/** Where the working system is shown, since the demo cannot show it itself. */
const CASE_STUDY_URL = 'https://ljar.vercel.app/projects/cshp-online-system'

/**
 * The closing line every one of these notices ends on.
 *
 * It lives here rather than in each caller so the wording cannot drift, and so
 * it stays a general invitation to read the write-up — do not make it promise
 * anything specific about what the case study contains.
 */
const FOOTNOTE = 'You can read more about the system in the case study on my portfolio.'

/**
 * What a control says when it would have reached something this front end does
 * not carry — an uploaded document, a generated report.
 *
 * The seed records hold plausible file URLs so they read like real filings, but
 * nothing is behind them. Pointing a button at an address that goes nowhere
 * reads as a broken demo rather than a deliberately narrow one, so the button
 * says what is missing instead.
 *
 * Pass only the sentence naming what is missing; the footnote is added here.
 */
export function notAvailableInDemo(title: string, text: string): void {
    useCshpModal().notice({
        title,
        text: `${text} ${FOOTNOTE}`,
        link: { href: CASE_STUDY_URL, label: 'View Case Study' },
    })
}
