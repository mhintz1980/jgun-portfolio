/**
 * JG-035 owner words (title block, revisions, margin notes). Zero imports on purpose: the DOM copy
 * (AuthorshipNotes) reads these without pulling Three.js into a page's entry chunk.
 */

export const OWNER_TITLE = { name: 'MARK HINTZ', role: 'Digital Systems Architect' } as const

/** Revisions A/B/C in the owner's listed order. No dates, initials or approvals are implied. */
export const OWNER_CAREER = [
  { rev: 'A', organization: 'Myers-Seth Pumps', scope: 'Product Design / R&D / 3D Product Visualizer' },
  { rev: 'B', organization: 'Special Tool Solutions', scope: 'Lead Mechanical Designer / Product Development / 3D Product Visualization / Data Management' },
  { rev: 'C', organization: 'Black Creek Precision', scope: 'Lead Mechanical Design / Product Development / Reverse Engineering / Materials and Processes' },
] as const

/** Suggested extra title-block fields (confirmed project facts only; no dates, certifications or contacts). */
export const OWNER_EXTRA_FIELDS = [
  ['DRAWN BY', 'M. HINTZ'],
  ['DISCIPLINE', 'PRODUCT DESIGN & DIGITAL SYSTEMS'],
  ['METHODS', 'CAD / VISUALIZATION / PROCESS DEVELOPMENT'],
  ['PORTFOLIO', 'ENGINEERING PROJECTS'],
] as const

/** The words on the paper. Letter-for-letter the owner's request; the DOM/static copy reads these arrays. */
export const OWNER_NOTES = {
  input: {
    lead: ['Failure point.', 'Alternate materials??'],
    alloys: ['4140', '4340', 'C300'],
    decision: ['change manufacturing method...', 'ROTARY HOBB IN LATHE!'],
  },
  output: ['Run FEA. Material?', 'Try C300 - Heat treat', 'to 52 to 54 HRC.'],
} as const

/** Plain reading of each note (static/DOM equivalent, transcript). */
export const OWNER_NOTE_TEXT = {
  input: 'Failure point. Alternate materials?? 4140, 4340 and C300 are each crossed off in red. Then: change manufacturing method... ROTARY HOBB IN LATHE! (circled)',
  output: 'Run FEA. Material? Try C300 - Heat treat to 52 to 54 HRC.',
} as const

