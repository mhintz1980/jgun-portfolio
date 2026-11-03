// Homepage copy and drawing layers. Every claim here is checked against Mark's record
// (content.test.ts pins the wording rules). Change copy here, not in the components.

export type ProjectId = 'torque-wrench' | 'quiet-machine' | 'armament' | 'renderings'

export interface CoreProject {
  id: ProjectId
  number: string
  title: string
  line: string
  tags: string
  status: string
  /** Null while the page is not built yet: the row is shown but is not a link. */
  href: string | null
  /** Text of the link under the project's image stack. */
  linkLabel: string
  reviewLine: string
  reviewQuote: string
  reviewTags: string
}

export interface StackImage {
  src: string
  width: number
  height: number
  label: string
  kind: 'render' | 'drawing' | 'photo'
}

export interface PlusItem {
  id: string
  title: string
  status: 'Used in production' | 'Working pipeline' | 'Prototype' | 'Live'
  line: string
  stack: string
}

export const HERO = {
  eyebrow: 'Jacksonville, FL',
  titleTop: 'Mechanical Designer',
  titleBottom: 'Systems Builder',
  lede: '20+ years designing precision tooling, tactical armaments, and industrial pump packages.',
  /** The rolling sentence from Mark's earlier site (his wording, 2026-11-02). */
  rollingLead: 'I engineer high-integrity systems and automated workflows that',
  rolling: [
    'convert complex CAD into shop-floor reality.',
    'eliminate friction between design and fabrication.',
    'bring half-thou precision to full-stack development.',
    'hard-code manufacturability into every assembly.',
  ],
  cue: 'Follow the thread',
  hintPointer: 'Move the cursor to inspect the drawings',
  hintTouch: 'Scroll to inspect the drawings',
} as const

export const WORK = {
  label: 'Portfolio',
  heading: 'Selected work',
  stackHint: 'Scroll or drag to peel through the stack',
} as const

export const CORE_PROJECTS: readonly CoreProject[] = [
  {
    id: 'torque-wrench',
    number: '01',
    title: 'Industrial Torque Wrench',
    line: 'A pneumatic torque wrench and its planetary gearbox, taken apart in 3D as you scroll.',
    tags: 'Planetary gearbox · GD&T · DFM',
    status: 'Live, work in progress',
    href: '/torque-wrench/',
    linkLabel: 'Open the 3D teardown',
    reviewLine: 'Mechanical design • Planetary gearboxes • Precision assemblies',
    reviewQuote: 'DFM review',
    reviewTags: 'SolidWorks · Planetary gearboxes · Precision machining · DFM',
  },
  {
    id: 'quiet-machine',
    number: '02',
    title: 'The Quiet Machine',
    line: 'A diesel pump package in a sound-attenuating enclosure: air path, heat and sound, in section.',
    tags: 'Enclosures · sheet metal · weldments',
    status: 'Live, work in progress',
    href: '/quiet-machine/',
    linkLabel: 'Open the 3D section study',
    reviewLine: 'Mechanical design • SolidWorks • DFM/DFA',
    reviewQuote: 'Pump Package Design System (Skids, Enclosures, Mounts, Lifting)',
    reviewTags: 'SolidWorks · DFM/DFA · GD&T · Sheet metal · Weldments',
  },
  {
    id: 'armament',
    number: '03',
    title: 'Armament Components & Receiver Systems',
    line: 'Rifle receivers and small-arms parts, drawn for the machine shop.',
    tags: 'Forgings · GD&T · machining',
    status: 'Under construction',
    href: '/armament/',
    linkLabel: 'Open the project page',
    reviewLine: 'Mechanical design • Receivers • Weapon-system components',
    reviewQuote: 'Receiver and component geometry resolved for fit, function, and manufacturability',
    reviewTags: 'SolidWorks · Receiver design · Fit & function · Manufacturing drawings',
  },
  {
    id: 'renderings',
    number: '04',
    title: 'Renderings & Visualizations',
    line: 'Product renders made straight from the CAD model.',
    tags: 'Rendering · materials · lighting',
    status: 'Gallery',
    href: null,
    linkLabel: '',
    reviewLine: 'PhotoView 360 • SolidWorks Visualize • Product renders',
    reviewQuote: 'Photorealistic renders',
    reviewTags: 'PhotoView 360 · SolidWorks Visualize · KeyShot · HDRI',
  },
]

/** Image stacks per project (public/home/stacks/): company names, logos, title blocks and BOMs
 * removed; AI-generated images left out. */
export const STACKS: Partial<Record<ProjectId, readonly StackImage[]>> = {
  'torque-wrench': [
    { src: "/home/stacks/torque-wrench/03.webp", width: 528, height: 1152, label: "Exploded gearbox and section", kind: "drawing" },
    { src: "/home/stacks/torque-wrench/04.webp", width: 1600, height: 1209, label: "Splined housing detail drawing", kind: "drawing" },
    { src: "/home/stacks/torque-wrench/05.webp", width: 1600, height: 1209, label: "Gear housing detail drawing", kind: "drawing" },
    { src: "/home/stacks/torque-wrench/06.webp", width: 1600, height: 1034, label: "Output drive detail drawing", kind: "drawing" },
  ],
  'armament': [
    { src: "/home/stacks/armament/01.webp", width: 871, height: 775, label: "Billet lower receiver, CAD render", kind: "render" },
    { src: "/home/stacks/armament/02.webp", width: 1600, height: 1145, label: "Lower receiver machining drawing", kind: "drawing" },
    { src: "/home/stacks/armament/03.webp", width: 1600, height: 1308, label: "Handguard, three views", kind: "render" },
    { src: "/home/stacks/armament/04.webp", width: 1600, height: 1002, label: "Accessory rail mount", kind: "render" },
    { src: "/home/stacks/armament/05.webp", width: 775, height: 638, label: "Billet upper and lower, CAD render", kind: "render" },
    { src: "/home/stacks/armament/06.webp", width: 1600, height: 1008, label: "Barrel nut detail drawing", kind: "drawing" },
  ],
  'renderings': [
    { src: "/home/stacks/renderings/02.webp", width: 1024, height: 768, label: "Hydraulic square-drive wrench", kind: "render" },
    { src: "/home/stacks/renderings/03.webp", width: 1000, height: 1000, label: "Gearbox drive, low-key lighting", kind: "render" },
    { src: "/home/stacks/renderings/04.webp", width: 1024, height: 768, label: "Angle-head tool study", kind: "render" },
    { src: "/home/stacks/renderings/05.webp", width: 800, height: 600, label: "Free-float handguard", kind: "render" },
  ],
  'quiet-machine': [
    { src: "/home/stacks/quiet-machine/01.webp", width: 1600, height: 900, label: "Cutaway: pump, drive and engine", kind: "render" },
    { src: "/home/stacks/quiet-machine/02.webp", width: 1600, height: 900, label: "Sound-attenuated enclosure, closed", kind: "render" },
    { src: "/home/stacks/quiet-machine/03.webp", width: 1600, height: 900, label: "Front cutaway, full drivetrain", kind: "render" },
    { src: "/home/stacks/quiet-machine/04.webp", width: 1600, height: 900, label: "Enclosure framing and baffles", kind: "render" },
    { src: "/home/stacks/quiet-machine/05.webp", width: 1600, height: 900, label: "Engine bay and intake side", kind: "render" },
    { src: "/home/stacks/quiet-machine/06.webp", width: 1600, height: 900, label: "Skid base, under-floor detail", kind: "render" },
  ],
}

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
// Drift halved 2026-11-02: Mark prefers the subtler parallax of his earlier site.
export const DRAWING_LAYERS: readonly DrawingLayer[] = [
  { id: 'gearbox-housing', project: 'torque-wrench', src: '/home/drawings/gearbox-housing.webp', width: 1440, height: 750, primary: true, cx: 0.7, cy: 0.3, w: 0.5, wPhone: 1.15, dx: 30, dy: -70, ds: 0.025 },
  { id: 'gearbox-sections', project: 'torque-wrench', src: '/home/drawings/gearbox-sections.webp', width: 1440, height: 810, primary: false, cx: 0.22, cy: 0.78, w: 0.42, wPhone: 1, dx: -45, dy: 55, ds: -0.02 },
  { id: 'pump-assembly', project: 'quiet-machine', src: '/home/drawings/pump-assembly.webp', width: 680, height: 500, primary: true, cx: 0.26, cy: 0.36, w: 0.4, wPhone: 1.05, dx: -35, dy: -45, ds: 0.03 },
  { id: 'pump-door', project: 'quiet-machine', src: '/home/drawings/pump-door.webp', width: 1600, height: 616, primary: false, cx: 0.72, cy: 0.86, w: 0.52, wPhone: 1.1, dx: 40, dy: 35, ds: -0.015 },
  { id: 'armament-receiver', project: 'armament', src: '/home/drawings/armament-receiver.webp', width: 1600, height: 694, primary: true, cx: 0.55, cy: 0.62, w: 0.6, wPhone: 1.3, dx: 20, dy: -30, ds: 0.02 },
  { id: 'armament-sections', project: 'armament', src: '/home/drawings/armament-sections.webp', width: 1600, height: 473, primary: false, cx: 0.4, cy: 0.1, w: 0.5, wPhone: 1.1, dx: -25, dy: 75, ds: -0.025 },
]
