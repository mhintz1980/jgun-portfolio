/**
 * JG-035 shaft tooling leaf: frozen illustrative tool constants.
 *
 * Every value here is copied from the certified G0 clearance-v4 report
 * (camera/clearance-v4/report.json, schema jgun-g0-clearance/v4-meridian).
 * tools.test.ts asserts each constant equals the report value, so the report is the
 * source of truth: change the report first, then mirror it here in the same commit.
 *
 * These are illustrative tools compatible with the accepted geometry; no production
 * tooling specification is claimed.
 */

/** Repo-relative path to the certified report. Test-only consumer; never read at runtime. */
export const CLEARANCE_REPORT_PATH =
  'project/work/evidence/JG-035-opening-drafting-table/manufacturing-implementation-2026-10-05/camera/clearance-v4/report.json'

// ---- shaper: disc cutter on the legacy grooved blank (report.shaper) ----
export const SHAPER_TEETH = 20
export const SHAPER_CENTRE_DISTANCE_MM = 15.5
/** Signed ratio work/cutter; negative is the external-mesh sense (theta_c = -0.5 * theta_w). */
export const SHAPER_SIGNED_RATIO = -2
/** Cutter crest radius; the near edge runs at work root + 5 um stock. */
export const SHAPER_TIP_RADIUS_MM = 11.2032
export const SHAPER_THICKNESS_MM = 1.2
export const SHAPER_STROKE_CENTRE_Y_MIN_MM = 2.17
export const SHAPER_STROKE_CENTRE_Y_MAX_MM = 9.7749
export const SHAPER_OVERTRAVEL_MM = 0.5
export const SHAPER_BACKOFF_MM = 2.0
export const SHAPER_HUB_RADIUS_MM = 8.0
export const SHAPER_HUB_LENGTH_MM = 6.0
export const SHAPER_CLAMP_RADIUS_MM = 9.0
export const SHAPER_CLAMP_LENGTH_MM = 3.0
export const SHAPER_ARBOR_RADIUS_MM = 7.0
export const SHAPER_ARBOR_LENGTH_MM = 12.0

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
