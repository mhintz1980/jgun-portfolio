/**
 * JG-035 shaft tooling leaf: illustrative tool constants.
 *
 * Hob constants and CLEARANCE_V4_SHAPER are copied from the certified G0 clearance-v4 report
 * (camera/clearance-v4/report.json, schema jgun-g0-clearance/v4-meridian); tools.test.ts asserts
 * each against the report, so the report stays the source of truth for those.
 * The live SHAPER_* constants (60 teeth, centre 35 mm, ratio -6, mount) are the owner-directed
 * illustrative derived prototype described by SHAPER_PROTOTYPE; they are intentionally NOT the
 * certified shaper, and shaperPrototype.test.ts checks their internal consistency instead.
 *
 * No production tooling specification or manufacturing acceptance is claimed.
 */

/** Repo-relative path to the certified report. Test-only consumer; never read at runtime. */
export const CLEARANCE_REPORT_PATH =
  'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/clearance-v4/report.json'

/**
 * Historical certified shaper (report.shaper, clearance-v4): 20 teeth, centre 15.5 mm, ratio -2.
 * Frozen verbatim so tools.test.ts keeps checking the certified report. The live SHAPER_* exports
 * below are the 60-tooth owner-directed prototype and are NOT these values.
 */
export const CLEARANCE_V4_SHAPER = Object.freeze({
  teeth: 20,
  centreDistanceMm: 15.5,
  signedRatio: -2,
  tipRadiusMm: 11.2032,
  thicknessMm: 1.2,
  strokeCentreYMm: Object.freeze([2.17, 9.7749] as const),
  overtravelMm: 0.5,
  backoffMm: 2.0,
  hubRadiusLengthMm: Object.freeze([8.0, 6.0] as const),
  clampNutRadiusLengthMm: Object.freeze([9.0, 3.0] as const),
  arborRadiusLengthMm: Object.freeze([7.0, 12.0] as const),
})

// ---- shaper: 60-tooth illustrative derived prototype (owner direction 2026-10-28) ----
/**
 * Provenance for the live shaper constants. Illustrative authoring proposal derived from the
 * certified work profile; not the certified clearance-v4 tool, not reference-measured from the
 * owner's sketch, and no manufacturing acceptance is claimed.
 */
export const SHAPER_PROTOTYPE = Object.freeze({
  status: 'illustrative-derived-prototype',
  basis: 'owner directed 60 teeth with consistent module, pitch radius, centre distance, generating ratio and clearance (docs/torque-wrench-rebuild/65)',
  certifiedReport: 'clearance-v4 (20 teeth); retained unchanged as CLEARANCE_V4_SHAPER',
  mount: 'sketch spindle adapter, locating shoulder, pilot arbor, clamping flange, threaded stud and retaining nut (owner selected; visual review open)',
  mountDimensions: 'authoring proposals; no dimension measured from the reference image',
  ownerGeometryApproved: false,
  manufacturingAcceptance: false,
})
/** Normal module (mm); the work profile is a 10-tooth shaft so pitch radius = module * teeth / 2. */
export const SHAPER_MODULE_MM = 1
export const SHAPER_WORK_TEETH = 10
export const SHAPER_TEETH = 60
/** Signed ratio work/cutter = -(cutter teeth / work teeth); negative is the external-mesh sense. */
export const SHAPER_SIGNED_RATIO = -SHAPER_TEETH / SHAPER_WORK_TEETH
export const SHAPER_WORK_PITCH_RADIUS_MM = (SHAPER_MODULE_MM * SHAPER_WORK_TEETH) / 2
export const SHAPER_PITCH_RADIUS_MM = (SHAPER_MODULE_MM * SHAPER_TEETH) / 2
/** Centre distance = sum of pitch radii (5 + 30); equivalently pitch radius * (1 + |ratio|). */
export const SHAPER_CENTRE_DISTANCE_MM = SHAPER_WORK_PITCH_RADIUS_MM + SHAPER_PITCH_RADIUS_MM
/** Work root radius (measured face root) and the 5 um stock left on it. */
export const SHAPER_WORK_ROOT_RADIUS_MM = 4.2918
export const SHAPER_WORK_TIP_RADIUS_MM = 6.0834
export const SHAPER_STOCK_MM = 0.005
export const SHAPER_ROOT_CLEARANCE_MM = 0.15
/** Cutter crest radius = centre distance - work root - stock = 30.7032; near edge runs at work root + 5 um. */
export const SHAPER_TIP_RADIUS_MM = 30.7032
/** Cutter valley limit = centre distance - work tip - clearance = 28.7666. */
export const SHAPER_ROOT_LIMIT_MM = 28.7666
export const SHAPER_BORE_RADIUS_MM = 9.0
/** Owner photo proportions: 8 mm body / 61.4 mm diameter (~13%); visual proposal. */
export const SHAPER_THICKNESS_MM = 8
/** Preserve the installed rake-face trajectory while thickening behind it.
 * The root remains the original stroke datum; it is no longer the body centre. */
export const SHAPER_LEADING_FACE_Y_MM = CLEARANCE_V4_SHAPER.thicknessMm / 2
export const SHAPER_BODY_REAR_Y_MM = SHAPER_LEADING_FACE_Y_MM - SHAPER_THICKNESS_MM
export const SHAPER_STROKE_CENTRE_Y_MIN_MM = 2.17
export const SHAPER_STROKE_CENTRE_Y_MAX_MM = 9.7749
export const SHAPER_OVERTRAVEL_MM = 0.5
export const SHAPER_BACKOFF_MM = 2.0

// ---- shaper mount, tool axis +Y = cutting face; authoring proposals (mm) ----
/** Behind the disc (-Y): locating shoulder (mesh 'shaper-hub'), adapter flange, then taper. */
export const SHAPER_SHOULDER_RADIUS_MM = 13.0
export const SHAPER_SHOULDER_LENGTH_MM = 2.0
export const SHAPER_ADAPTER_FLANGE_RADIUS_MM = 15.0
export const SHAPER_ADAPTER_FLANGE_LENGTH_MM = 4.0
export const SHAPER_TAPER_RADIUS_NEAR_MM = 11.0
export const SHAPER_TAPER_RADIUS_FAR_MM = 7.5
export const SHAPER_TAPER_LENGTH_MM = 15.0
/** Owner requested 4–5 inches longer; add a straight 4.5-inch spindle-side shank. */
export const SHAPER_ARBOR_EXTENSION_MM = 4.5 * 25.4
/** Pilot arbor fills the bore through the disc thickness (mesh 'shaper-arbor'). */
export const SHAPER_PILOT_RADIUS_MM = SHAPER_BORE_RADIUS_MM
/** In front of the disc (+Y): clamping flange (mesh 'shaper-clamp-nut'), threaded stud, retaining nut. */
export const SHAPER_CLAMP_FLANGE_RADIUS_MM = 14.0
export const SHAPER_CLAMP_FLANGE_LENGTH_MM = 3.0
export const SHAPER_STUD_ROOT_RADIUS_MM = 5.0
export const SHAPER_THREAD_CREST_RADIUS_MM = 6.0
export const SHAPER_THREAD_PITCH_MM = 1.75
export const SHAPER_NUT_ACROSS_FLATS_MM = 18.0
export const SHAPER_NUT_LENGTH_MM = 6.0
/** Stud length beyond the nut face, showing about two thread turns. */
export const SHAPER_STUD_PROTRUSION_MM = 3.5
/** Largest tool-axis radius of the whole mount; the shaft sits SHAPER_CENTRE_DISTANCE_MM away. */
export const SHAPER_MOUNT_MAX_RADIUS_MM = SHAPER_ADAPTER_FLANGE_RADIUS_MM

// ---- hob: single-start hob on the revised smooth blank (report.hob) ----
export const HOB_RADIUS_MM = 5.87
export const HOB_NORMAL_MODULE_MM = 1.0
export const HOB_STARTS = 1
export const HOB_LEAD_ANGLE_DEG = 5.5587
export const HOB_LENGTH_MM = 16.0
/** Axial stop position of the fitted envelope (report.hob.stop_yc_mm). */
export const HOB_STOP_YC_MM = 9.5249
export const HOB_INFEED_YC_MM = -4.195
export const HOB_RETRACT_MM = 2.5
export const HOB_COLLAR_RADIUS_MM = HOB_RADIUS_MM + 1
export const HOB_COLLAR_WIDTH_MM = 3.0
export const HOB_ARBOR_RADIUS_MM = HOB_RADIUS_MM - 1.5
export const HOB_ARBOR_LENGTH_MM = 12.0
/** Centre distance at full depth = work root + hob radius (report.hob.centre_distance_mm 10.1618). */
export const HOB_CENTRE_DISTANCE_AT_DEPTH_MM = 4.2918 + HOB_RADIUS_MM
/** Illustrative thread depth: body root radius meets the spec'd arbor radius R - 1.5. */
export const HOB_THREAD_DEPTH_MM = HOB_RADIUS_MM - HOB_ARBOR_RADIUS_MM
/** Single-start lead = pi * m / cos(lead angle). */
export const HOB_LEAD_MM = (Math.PI * HOB_NORMAL_MODULE_MM) / Math.cos((HOB_LEAD_ANGLE_DEG * Math.PI) / 180)
