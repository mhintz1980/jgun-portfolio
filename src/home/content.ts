// Homepage copy and drawing layers. Every claim here is checked against Mark's record
// (content.test.ts pins the wording rules). Change copy here, not in the components.

export type ProjectId = 'torque-wrench' | 'quiet-machine' | 'armament'

export interface CoreProject {
  id: ProjectId
  number: string
  title: string
  line: string
  tags: string
  status: string
  /** Null while the page is not built yet: the row is shown but is not a link. */
  href: string | null
}

export interface PlusItem {
  id: string
  title: string
  status: 'Used in production' | 'Working pipeline' | 'Prototype' | 'Live'
  line: string
  stack: string
}

export const HERO = {
  eyebrow: 'Mark Hintz · Jacksonville, FL',
  titleTop: 'Mechanical Designer',
  titleBottom: 'Systems Builder',
  lede: '20+ years designing precision tooling and industrial pump packages.',
  cue: 'Follow the thread',
  hintPointer: 'Move the cursor to inspect the drawings',
  hintTouch: 'Scroll to inspect the drawings',
} as const

export const WORK = {
  label: 'Portfolio',
  heading: 'Selected work',
} as const

export const CORE_PROJECTS: readonly CoreProject[] = [
  {
    id: 'torque-wrench',
    number: '01',
    title: 'JGUN Pneumatic Torque Wrench',
    line: 'A pneumatic torque wrench and its planetary gearbox, taken apart in 3D as you scroll.',
    tags: 'Planetary gearbox · GD&T · DFM',
    status: 'Live, work in progress',
    href: '/torque-wrench/',
  },
  {
    id: 'quiet-machine',
    number: '02',
    title: 'The Quiet Machine',
    line: 'A diesel pump package in a sound-attenuating enclosure: air path, heat and sound, in section.',
    tags: 'Enclosures · sheet metal · weldments',
    status: 'Live, work in progress',
    href: '/quiet-machine/',
  },
  {
    id: 'armament',
    number: '03',
    title: 'Armament',
    line: 'Rifle receivers and small-arms parts, drawn for the machine shop.',
    tags: 'Forgings · GD&T · machining',
    status: 'Under construction',
    href: '/armament/',
  },
]

export const PLUS = {
  label: 'The Plus',
  heading: 'Systems Builder',
  sub: 'Tools for the work around the CAD.',
} as const

export const PLUS_ITEMS: readonly PlusItem[] = [
  {
    id: 'pumptracker',
    title: 'PumpTracker',
    status: 'Used in production',
    line: 'Replaced the whiteboard and spreadsheets and gave the shop its first KPIs. Every lead and manager used it, phones included.',
    stack: 'React · TypeScript · Supabase',
  },
  {
    id: 'studiomark',
    title: 'StudioMark',
    status: 'Working pipeline',
    line: 'Product renders and video straight from CAD, without a photo shoot.',
    stack: 'Blender · Python · cloud GPU',
  },
  {
    id: 'cad-pdm-tools',
    title: 'CAD/PDM tools',
    status: 'Prototype',
    line: 'Brings legacy DXF drawings up to current standards, and checks a release before it reaches the shop.',
    stack: 'Python · SolidWorks PDM',
  },
  {
    id: 'this-site',
    title: 'This site',
    status: 'Live',
    line: "The scroll-driven 3D pages you're on now.",
    stack: 'React · Three.js · GSAP',
  },
]

export const TESTIMONIAL = {
  quote:
    "It's rare to find a designer who understands the constraints of a 5-axis mill and the realities of the assembly line. Mark designs parts that are easy to machine and foolproof to assemble. He's run the machines, built the gearboxes, and tested the product. That experience is visible in every drawing he releases.",
  name: 'Darrin Phipps',
  role: 'President, Black Creek Precision',
} as const

export const CONTACT = {
  heading: 'Have a tangled design problem?',
  pull: 'Pull the thread',
  pulled: 'Straightened out. Let’s talk.',
  email: 'markworks.dev@gmail.com',
  linkedin: 'https://linkedin.com/in/mark-hintz-builds',
  github: 'https://github.com/mhintz1980',
} as const

export const ARMAMENT_PAGE = {
  label: 'Portfolio · 03',
  title: 'Armament',
  status: 'Under construction',
  body: 'Rifle receivers and small-arms parts, drawn for the machine shop. This page is still being built.',
  back: 'Back to the homepage',
} as const

export const FOOTER = {
  site: 'studiomark.dev',
  status: 'Work in progress',
} as const

export interface DrawingLayer {
  id: string
  project: ProjectId
  src: string
  /** Pixel size of the mask file, for its aspect ratio. */
  width: number
  height: number
  /** Shown on phones and with reduced motion (one per project). */
  primary: boolean
  /** Centre at scroll 0, as a fraction of the viewport. */
  cx: number
  cy: number
  /** Width as a fraction of the viewport width, desktop and phone. */
  w: number
  wPhone: number
  /** Drift per 1000 px of scroll, in px; opposite signs move layers apart. */
  dx: number
  dy: number
  /** Scale change per 1000 px of scroll. */
  ds: number
}

// Stand-in drawings from Mark's earlier portfolio, title blocks and parts lists cropped off.
export const DRAWING_LAYERS: readonly DrawingLayer[] = [
  { id: 'gearbox-housing', project: 'torque-wrench', src: '/home/drawings/gearbox-housing.webp', width: 1440, height: 750, primary: true, cx: 0.7, cy: 0.3, w: 0.5, wPhone: 1.15, dx: 60, dy: -140, ds: 0.05 },
  { id: 'gearbox-sections', project: 'torque-wrench', src: '/home/drawings/gearbox-sections.webp', width: 1440, height: 810, primary: false, cx: 0.22, cy: 0.78, w: 0.42, wPhone: 1, dx: -90, dy: 110, ds: -0.04 },
  { id: 'pump-assembly', project: 'quiet-machine', src: '/home/drawings/pump-assembly.webp', width: 680, height: 500, primary: true, cx: 0.26, cy: 0.36, w: 0.4, wPhone: 1.05, dx: -70, dy: -90, ds: 0.06 },
  { id: 'pump-door', project: 'quiet-machine', src: '/home/drawings/pump-door.webp', width: 1600, height: 616, primary: false, cx: 0.72, cy: 0.86, w: 0.52, wPhone: 1.1, dx: 80, dy: 70, ds: -0.03 },
  { id: 'armament-receiver', project: 'armament', src: '/home/drawings/armament-receiver.webp', width: 1600, height: 694, primary: true, cx: 0.55, cy: 0.62, w: 0.6, wPhone: 1.3, dx: 40, dy: -60, ds: 0.04 },
  { id: 'armament-sections', project: 'armament', src: '/home/drawings/armament-sections.webp', width: 1600, height: 473, primary: false, cx: 0.4, cy: 0.1, w: 0.5, wPhone: 1.1, dx: -50, dy: 150, ds: -0.05 },
]
