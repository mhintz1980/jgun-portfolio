// Configuration and state types for StudioMark 3D Logo with Rain & Puddle experience

export type CenterpieceShape =
  | 'sm-mobius'
  | 'sm-cad-hex'
  | 'sm-shared-spine'
  | 'sm-kinetic-chevron'
  | 'sm-planetary-crown'
  | 'sm-prism-monolith'
  | 'hex-gem'
  | 'sm-monogram'
  | 'torus-knot'
  | 'icosahedron'
  | 'gyroscope'

export type ThemePreset = {
  id: string
  name: string
  glowColor: string
  accentColor: string
  bgTint: string
}

export const THEME_PRESETS: readonly ThemePreset[] = [
  {
    id: 'studio-gold',
    name: 'Studio Gold',
    glowColor: '#d2c4a3',
    accentColor: '#f3e8cb',
    bgTint: '#0d0d0f',
  },
  {
    id: 'electric-cyan',
    name: 'Electric Cyan',
    glowColor: '#38e8ff',
    accentColor: '#7df3ff',
    bgTint: '#080d14',
  },
  {
    id: 'neon-crimson',
    name: 'Neon Crimson',
    glowColor: '#ff2a5f',
    accentColor: '#ff668a',
    bgTint: '#12080c',
  },
  {
    id: 'acid-emerald',
    name: 'Acid Emerald',
    glowColor: '#00f5a0',
    accentColor: '#5effbe',
    bgTint: '#07120e',
  },
  {
    id: 'cyber-violet',
    name: 'Cyber Violet',
    glowColor: '#a855f7',
    accentColor: '#c084fc',
    bgTint: '#0d0914',
  },
  {
    id: 'arctic-white',
    name: 'Arctic White',
    glowColor: '#e2e8f0',
    accentColor: '#ffffff',
    bgTint: '#0b0d11',
  },
]

export interface LogoConfig {
  // Centerpiece
  shape: CenterpieceShape
  spin: boolean
  speed: number // rotation speed

  // Glass Material
  roughness: number
  transmission: number
  thickness: number
  ior: number
  chromaticAberration: number

  // Typography
  text: string
  subtitle: string
  glowColor: string
  emissiveIntensity: number

  // Rain & Floor
  rainIntensity: 'heavy' | 'drizzle' | 'off'
  rainCount: number
  puddleReflectivity: number
  rippleStrength: number
  enableSplashes: boolean

  // Atmosphere
  autoLightning: boolean
  lightningFrequency: number // seconds between strikes
  ambientDarkness: number
  bloomIntensity: number

  // Audio
  audioEnabled: boolean
  audioVolume: number
}

export const DEFAULT_LOGO_CONFIG: LogoConfig = {
  shape: 'sm-kinetic-chevron',
  spin: true,
  speed: 0.0008,

  roughness: 0.18,
  transmission: 1.0,
  thickness: 1.25,
  ior: 1.52,
  chromaticAberration: 0.05,

  text: 'STUDIOMARK',
  subtitle: 'PRECISION CAD × CREATIVE COMPUTING',
  glowColor: '#d2c4a3',
  emissiveIntensity: 4.5,

  rainIntensity: 'heavy',
  rainCount: 1400,
  puddleReflectivity: 0.85,
  rippleStrength: 0.35,
  enableSplashes: true,

  autoLightning: true,
  lightningFrequency: 14,
  ambientDarkness: 0.8,
  bloomIntensity: 0.45,

  audioEnabled: false,
  audioVolume: 0.4,
}
