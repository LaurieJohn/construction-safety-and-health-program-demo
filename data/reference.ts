/**
 * The lookup tables.
 *
 * The original system kept these as integer columns with the meaning spread
 * across the views — `user_type == 3`, `status = 2`, `cshp_type == 1`. The ids
 * are kept because the workflow rules key off them; the meanings are named here
 * once so no page has to remember what a 2 was.
 *
 * Every office, place and person in this demo is invented.
 */

/* ── Accounts ───────────────────────────────────────────────────────────── */

/** users.user_type */
export const ROLE = {
    /** Full run of the system, including account management. */
    administrator: 1,
    /** Signs off on a programme the reviewers have endorsed. */
    approver: 2,
    /** Regional office — reviews and endorses what the field offices file. */
    reviewer: 3,
    /** Field office — files establishments, programmes and OSH personnel. */
    focal: 4,
} as const

export type RoleId = (typeof ROLE)[keyof typeof ROLE]

export interface Role {
    id: RoleId
    name: string
    description: string
}

export const roles: Role[] = [
    {
        id: ROLE.administrator,
        name: 'System Administrator',
        description: 'Every module, plus account management.',
    },
    {
        id: ROLE.approver,
        name: 'Approving Officer',
        description: 'Approves or returns endorsed programmes.',
    },
    {
        id: ROLE.reviewer,
        name: 'OSH Division Reviewer',
        description: 'Reviews filings from every field office and endorses them.',
    },
    {
        id: ROLE.focal,
        name: 'Field Office Focal Person',
        description: 'Files establishments, programmes and OSH personnel.',
    },
]

/* ── Offices ────────────────────────────────────────────────────────────── */

export interface FieldOffice {
    id: number
    name: string
    abbreviation: string
    /** The regional office oversees every field office rather than filing itself. */
    is_regional: boolean
}

export const fieldOffices: FieldOffice[] = [
    { id: 1, name: 'Regional Office', abbreviation: 'RO', is_regional: true },
    { id: 2, name: 'Northgate Field Office', abbreviation: 'NGFO', is_regional: false },
    { id: 3, name: 'Riverbend Field Office', abbreviation: 'RBFO', is_regional: false },
    { id: 4, name: 'Southport Field Office', abbreviation: 'SPFO', is_regional: false },
    { id: 5, name: 'Highland Field Office', abbreviation: 'HLFO', is_regional: false },
    { id: 6, name: 'Eastmarch Field Office', abbreviation: 'EMFO', is_regional: false },
]

/** The provinces the field offices cover, for the establishment form. */
export const provinces: string[] = [
    'Northgate',
    'Riverbend',
    'Southport',
    'Highland',
    'Eastmarch',
]

/* ── Safety Officer & First Aider ───────────────────────────────────────── */

/** safety_officers.type */
export const SO_TYPE = {
    safetyOfficer: 1,
    firstAider: 2,
    both: 3,
} as const

export type SoTypeId = (typeof SO_TYPE)[keyof typeof SO_TYPE]

export interface SoType {
    id: SoTypeId
    name: string
    short: string
    /** Which training dates the form asks for. */
    needs_bosh: boolean
    needs_first_aid: boolean
}

export const soTypes: SoType[] = [
    {
        id: SO_TYPE.safetyOfficer,
        name: 'Safety Officer',
        short: 'Safety Officer',
        needs_bosh: true,
        needs_first_aid: false,
    },
    {
        id: SO_TYPE.firstAider,
        name: 'First Aider',
        short: 'First Aider',
        needs_bosh: false,
        needs_first_aid: true,
    },
    {
        id: SO_TYPE.both,
        name: 'Both Safety Officer and First Aider',
        short: 'SO & FA',
        needs_bosh: true,
        needs_first_aid: true,
    },
]

/* ── Establishments ─────────────────────────────────────────────────────── */

/** establishments.status */
export const ESTAB_STATUS = {
    forReview: 1,
    registered: 2,
} as const

export type EstabStatusId = (typeof ESTAB_STATUS)[keyof typeof ESTAB_STATUS]

export interface EstabStatus {
    id: EstabStatusId
    name: string
    tone: BadgeTone
}

export const estabStatuses: EstabStatus[] = [
    { id: ESTAB_STATUS.forReview, name: 'For Review', tone: 'amber' },
    { id: ESTAB_STATUS.registered, name: 'Registered', tone: 'green' },
]

/** The legal organisation checkboxes on the registration form. */
export const legalOrganisations: string[] = [
    'Single Proprietorship',
    'Partnership',
    'Government Corporation',
    'Private Corporation',
]

/** The economic organisation checkboxes on the registration form. */
export const economicOrganisations: string[] = [
    'Single Establishment',
    'Branch Only',
    'Establishment and Main Office',
    'Main Office Only',
    'Ancillary Unit',
]

/* ── Construction Safety and Health Programme ───────────────────────────── */

/** cshp.cshp_type */
export const CSHP_TYPE = {
    comprehensive: 1,
    simple: 2,
} as const

export type CshpTypeId = (typeof CSHP_TYPE)[keyof typeof CSHP_TYPE]

export interface CshpType {
    id: CshpTypeId
    name: string
    short: string
    description: string
}

export const cshpTypes: CshpType[] = [
    {
        id: CSHP_TYPE.comprehensive,
        name: 'Comprehensive CSHP',
        short: 'Comprehensive',
        description:
            'For a registered establishment with a continuing programme — carries the full contractor profile, OSH personnel and heavy equipment.',
    },
    {
        id: CSHP_TYPE.simple,
        name: 'Simple CSHP',
        short: 'Simple',
        description:
            'For a single project filed on its own — the project profile and the OSH personnel assigned to it.',
    },
]

/** cshp.status — where a programme sits in the route. */
export const CSHP_STATUS = {
    forReview: 1,
    forApproval: 2,
    approved: 3,
} as const

export type CshpStatusId = (typeof CSHP_STATUS)[keyof typeof CSHP_STATUS]

/** cshp.denied_status — a return runs alongside the status, as it did before. */
export const DENIED_STATUS = {
    none: 0,
    forCompliance: 1,
    completion: 2,
} as const

export type DeniedStatusId = (typeof DENIED_STATUS)[keyof typeof DENIED_STATUS]

export type BadgeTone = 'slate' | 'amber' | 'blue' | 'green' | 'red' | 'violet'

export interface CshpStatus {
    id: CshpStatusId
    name: string
    tone: BadgeTone
}

export const cshpStatuses: CshpStatus[] = [
    { id: CSHP_STATUS.forReview, name: 'For Review', tone: 'amber' },
    { id: CSHP_STATUS.forApproval, name: 'For Approval', tone: 'blue' },
    { id: CSHP_STATUS.approved, name: 'Approved', tone: 'green' },
]

export interface DeniedStatus {
    id: DeniedStatusId
    name: string
    short: string
}

export const deniedStatuses: DeniedStatus[] = [
    { id: DENIED_STATUS.none, name: 'Not returned', short: '—' },
    { id: DENIED_STATUS.forCompliance, name: 'Returned for compliance', short: 'For Compliance' },
    { id: DENIED_STATUS.completion, name: 'Returned — project completed or withdrawn', short: 'Completion' },
]

/** cshp.project_type */
export const PROJECT_TYPE = {
    public: 1,
    private: 2,
} as const

export type ProjectTypeId = (typeof PROJECT_TYPE)[keyof typeof PROJECT_TYPE]

export const projectTypes: { id: ProjectTypeId; name: string }[] = [
    { id: PROJECT_TYPE.public, name: 'Public' },
    { id: PROJECT_TYPE.private, name: 'Private' },
]

/**
 * A project employing more than this many workers must name an occupational
 * health nurse, physician and dentist. The comprehensive form reveals that
 * section on the threshold, as the original did.
 */
export const OH_PERSONNEL_THRESHOLD = 50

/* ── Helpers ────────────────────────────────────────────────────────────── */

export function roleName(id: number): string {
    return roles.find((role) => role.id === id)?.name ?? 'Unknown'
}

export function fieldOfficeName(id: number): string {
    return fieldOffices.find((office) => office.id === id)?.name ?? 'Unassigned'
}

export function fieldOfficeAbbreviation(id: number): string {
    return fieldOffices.find((office) => office.id === id)?.abbreviation ?? '—'
}

export function soTypeName(id: number): string {
    return soTypes.find((type) => type.id === id)?.short ?? 'Unknown'
}

export function cshpTypeName(id: number): string {
    return cshpTypes.find((type) => type.id === id)?.short ?? 'Unknown'
}

export function cshpStatusName(id: number): string {
    return cshpStatuses.find((status) => status.id === id)?.name ?? 'Unknown'
}

export function cshpStatusTone(id: number): BadgeTone {
    return cshpStatuses.find((status) => status.id === id)?.tone ?? 'slate'
}

export function projectTypeName(id: number): string {
    return projectTypes.find((type) => type.id === id)?.name ?? '—'
}
