// Every word the film puts on screen. Wording is taken from the site's checked copy
// (src/home/content.ts, the RL300 beat captions) and kept inside the owner's rules:
// copy.test.ts scans this file with the homepage's banned list plus the showreel's hard rules.

export const OPENING = {
  name: 'MARK HINTZ',
  place: 'Jacksonville, FL',
  site: 'studiomark.dev',
  reel: 'Showreel · 2026',
  titleTop: 'Mechanical Designer',
  titleBottom: 'Systems Builder',
  rollingLead: 'I engineer high-integrity systems and automated workflows that',
  rolling: 'convert complex CAD into shop-floor reality.',
} as const

export const WRENCH = {
  number: '01',
  eyebrow: 'Project 01',
  title: 'Industrial Torque Wrench',
  line: 'A pneumatic torque wrench and its planetary gearbox.',
  phaseLinework: 'CAD linework',
  phaseSolid: 'Photoreal PBR',
  shift: 'Two-speed shift',
  explode: 'Five planetary stages · rear extraction · one axis',
  callouts: ['Output spindle', 'Planetary stages', 'Thrust bearing', 'Two-speed clutch', 'Handle assembly'],
  tags: 'Planetary gearbox · Precision assemblies · DFM',
} as const

export const MACHINE = {
  number: '02',
  eyebrow: 'Project 02',
  title: 'The Quiet Machine',
  line: 'A diesel pump package in a sound-attenuating enclosure.',
  beats: [
    { title: 'The object', caption: 'A sealed shell. A complex machine. One considered envelope.' },
    { title: 'The incision', caption: 'A section edge reveals shell, insulation, equipment and the wall that carries them.' },
    { title: 'The main intake', caption: 'One continuous path from louvre to plenum, with a direction you can read.' },
    { title: 'Two feeds, one exit', caption: 'Both supplies warm through the equipment region and join a single shared discharge.' },
    { title: 'Control the noise', caption: 'Absorptive structure for the air path, isolation for the machine.' },
  ],
  concept: 'Lower intake · design concept',
  tags: 'Enclosures · Sheet metal · Weldments',
} as const

export const ARMAMENT = {
  number: '03',
  eyebrow: 'Project 03',
  title: 'Armament Components & Receiver Systems',
  line: 'AR-15-pattern receivers and small-arms parts, drawn for the machine shop.',
  /** Required on every on-screen image the manifest tags "representative" (owner rule). */
  representativeLabel: 'Representative model — similar to the part I designed',
  tags: 'Receivers · Fit & function · Manufacturability',
} as const

export const CLOSE = {
  name: 'MARK HINTZ',
  titleTop: 'Mechanical Designer',
  titleBottom: 'Systems Builder',
  lede: '20+ years designing precision tooling, tactical armaments, and industrial pump packages.',
  recap: ['Torque wrench', 'Quiet machine', 'Armament'],
  cta: 'Follow the line',
  site: 'studiomark.dev',
} as const

export const LOGO = {
  /** Text baked into the approved bumper's pixels (src/logo.ts), recorded so the copy scan covers it. */
  burnedIn: ['STUDIOMARK', 'PRECISION CAD × CREATIVE COMPUTING', 'STUDIOMARK.DEV', 'PRECISION CAD × REAL-TIME 3D ENGINEERING'],
} as const
