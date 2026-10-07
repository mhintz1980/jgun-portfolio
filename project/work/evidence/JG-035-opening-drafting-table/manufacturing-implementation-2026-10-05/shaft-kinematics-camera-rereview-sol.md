**FIX-FIRST** — all three original findings are resolved, but the startup fix introduced a camera-follow coupling regression.

1. **RESOLVED — machining startup C1.** At 2.0 s, measured left/right derivatives are **0 / 9.9995×10⁻⁹** using h=0.0001 s. Across rate boundaries, maximum derivative asymmetry is **0.005552** and central-rate error **0.000216**, below the 0.02 tolerance.

2. **RESOLVED — materials camera settles before readability.** Across **15.0–22.6 s**, both layouts have **zero** measured position, target, up-vector, and FOV change. Desktop FOV remains **7.2°**, narrow **9.5°**.

3. **RESOLVED — final card overlap.** The original probe now projects to **743.64 px**, outside the desktop **806.4–1324.8 px** card band. Sweeping the revised journal’s full circumference gives desktop maximum NDC x **0.091674 < 0.12** and narrow minimum y **−0.218061 > −0.3**.

Requested regression checks pass numerically:

- Slow window: **7.2–9.6 s**, rate **0.22**; peak at **8.4 s**, edge **10.3749 mm**. Strict full-backoff hold: **0.8363 s**.
- All ten spaces complete by **12.9465 s**.
- At the 7.2 s handoff, position second difference is **2.78×10⁻⁷ m**; follow rate **1.30×10⁻⁷ rad/s**.
- Dense recap framing stays within NDC **0.819602 desktop / 0.754863 narrow**, below **0.84**.

**Remaining blocker:** [kinematics.ts:317](/C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/inspection/shaft/kinematics.ts:317) retains linear startup follow despite eased machining. At **2.5 s**, actual follow rate is **0.392699 rad/s**, versus documented `FOLLOW_GAIN × followWeight × machiningRate` **0.196350 rad/s**. By 3 s, the discrepancy accumulates to **11.25°**. Update the follow integral and test its derivative against that law.

Vitest failed before tests ran because esbuild encountered sandbox directory-access errors. Measurements ran in memory; no files edited.

