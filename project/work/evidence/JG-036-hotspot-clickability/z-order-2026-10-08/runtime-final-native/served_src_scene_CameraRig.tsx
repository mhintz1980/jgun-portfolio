import { createHotContext as __vite__createHotContext } from "/@vite/client";import.meta.hot = __vite__createHotContext("/src/scene/CameraRig.tsx");var _s = $RefreshSig$();
import __vite__cjsImport0_react from "/node_modules/.vite/deps/react.js?v=0ce3f7a6"; const useRef = __vite__cjsImport0_react["useRef"];
import { useFrame, useThree } from "/node_modules/.vite/deps/@react-three_fiber.js?v=c8d145e3";
import { Matrix4, PerspectiveCamera, Quaternion, Vector3 } from "/node_modules/.vite/deps/three.js?v=f13af4f6";
import { inspection, inspectionTelemetry } from "/src/state/inspectionStore.ts";
import { ease } from "/src/scene/inspection/timeline.ts";
import { renderOwnership } from "/src/scene/inspection/renderLease.ts";
import { drawingRuntime } from "/src/scene/drawing/extractionPose.ts";
import {
  DRAWING_INTRO_WINDOW,
  REDUCED_MOTION_INTRO_T,
  drawingIntroState,
  remapHeroProgress,
  smooth01
} from "/src/scene/drawing/introTimeline.ts";
import { introCameraPose } from "/src/scene/drawing/sheetCamera.ts";
import {
  CAMERA_PATH,
  EXPLODE_OFFSETS,
  LCD_ORBIT_KEYFRAMES,
  LCD_REVEAL_WINDOW,
  baseAt,
  framingBiasVec
} from "/src/data/caseStudies.ts";
import { getScrollState, telemetry } from "/src/state/scrollStore.ts";
import { getQuality } from "/src/state/qualityStore.ts";
const smoothstep = (t) => t * t * (3 - 2 * t);
const writeScrollTelemetry = () => {
  const { progress, chapter, chapterProgress, materialMode } = getScrollState();
  telemetry.scroll.progress = progress;
  telemetry.scroll.chapter = chapter;
  telemetry.scroll.chapterProgress = chapterProgress;
  telemetry.scroll.materialMode = materialMode;
};
const HOTSPOT_INSPECT_FRAMES = {
  // ---- Station 1: JGun Torque Multiplier ([0, 0, 0]) ----
  // Air motor rotor — tight 3/4 view focusing on rotor vanes & input drive
  rotor: {
    position: [0.18, 0.08, 0.12],
    target: [0, 0, -0.06],
    fov: 24
  },
  // Datum A motor housing bore — angled view into machined bore & datum surface
  "motor-housing": {
    position: [0.2, 0.09, 0.04],
    target: [0, 0, -0.12],
    fov: 24
  },
  // Datum B interface flange — side angle focusing on motor-to-gearbox joint
  flange: {
    position: [0.18, 0.07, 0.08],
    target: [0, 0, -0.03],
    fov: 22
  },
  // Gearbox outer housing P000245 — side inspection framing of ring gears & shell
  "gearbox-housing": {
    position: [0.24, 0.09, 0.14],
    target: [0, 0, 0.01],
    fov: 25
  },
  // MSP430 MCU — tight top-rear view on handle smart-tool electronics
  mcu: {
    position: [-0.07, 0.1, -0.36],
    target: [0, 0.02, -0.22],
    fov: 25
  },
  // LCD manometer screen & backlit buttons
  lcd: {
    position: [-0.05, 0.08, -0.42],
    target: [0, 0.02, -0.24],
    fov: 28
  },
  // LiPo battery cell
  lipo: {
    position: [-0.09, -0.02, -0.34],
    target: [0, -0.01, -0.2],
    fov: 25
  },
  // ---- Station 2: RL-300 / MSP Acoustic SAFE Enclosure ([28, 0, -6]) ----
  "enclosure-chassis": {
    position: [31.8, 2.4, -2.4],
    target: [28, 1.23, -6.41],
    fov: 34
  },
  "composite-panels": {
    position: [31.2, 2, -2.8],
    target: [28.66, 1.2, -5.74],
    fov: 30
  },
  "pump-housing": {
    position: [30.4, 1.8, -3.4],
    target: [28.02, 0.89, -6],
    fov: 28
  },
  "acoustic-baffles": {
    position: [25.2, 2.2, -4.2],
    target: [26.68, 1.54, -6.38],
    fov: 28
  },
  "isolation-mounts": {
    position: [29.6, 0.6, -4],
    target: [28, 0.05, -6],
    fov: 26
  },
  "duct-intake": {
    position: [29.8, 1.6, -2.8],
    target: [28, 1.11, -5.05],
    fov: 28
  },
  "duct-exhaust": {
    position: [29.6, 1.8, -9.2],
    target: [27.9, 1.23, -7.17],
    fov: 28
  },
  // ---- Station 3: M249 Receiver Platform ([56, 0, -12]) ----
  "m249-receiver": {
    position: [56 + 0.25, 0.35, -12 + 0.8],
    target: [56, 0.05, -12],
    fov: 26
  },
  "m249-trunnion": {
    position: [56 + 0.22, 0.25, -12 + 0.65],
    target: [56, 0.03, -12 + 0.15],
    fov: 22
  },
  "m249-rail": {
    position: [56 + 0.2, 0.45, -12 + 0.6],
    target: [56, 0.1, -12 - 0.08],
    fov: 22
  },
  "m249-feed-tray": {
    position: [56 + 0.22, 0.32, -12 + 0.7],
    target: [56, 0.06, -12 + 0.04],
    fov: 24
  }
};
function bellWeight(p, lo, hi, lo2, hi2) {
  const fadeIn = Math.min(Math.max((p - lo) / (hi - lo), 0), 1);
  const fadeOut = Math.min(Math.max((hi2 - p) / (hi2 - lo2), 0), 1);
  return smoothstep(Math.min(fadeIn, fadeOut));
}
const lerpN = (a, b, t) => a + (b - a) * t;
export function CameraRig() {
  _s();
  const camera = useThree((state) => state.camera);
  const currentPos = useRef(new Vector3(...CAMERA_PATH[0].position));
  const currentTarget = useRef(new Vector3(...CAMERA_PATH[0].target));
  const goalPos = useRef(new Vector3());
  const goalTarget = useRef(new Vector3());
  const scratchA = useRef(new Vector3());
  const scratchFwd = useRef(new Vector3());
  const scratchRight = useRef(new Vector3());
  const orthographic = useRef(new Matrix4());
  const introPose = useRef({
    position: new Vector3(),
    target: new Vector3(),
    up: new Vector3(0, 1, 0),
    fov: 30,
    ortho: 0,
    distance: 1
  });
  const introOrtho = useRef(0);
  const restOrbit = useRef(0);
  const inspectionCamera = useRef({
    saved: false,
    observe: false,
    position: new Vector3(),
    quaternion: new Quaternion(),
    up: new Vector3(),
    scale: new Vector3(),
    currentPos: new Vector3(),
    currentTarget: new Vector3(),
    projection: new Matrix4(),
    inverseProjection: new Matrix4(),
    macroRotation: new Quaternion(),
    matrix: new Matrix4(),
    fov: 42,
    near: 5e-3,
    far: 150,
    zoom: 1,
    aspect: 1,
    focus: 10,
    filmGauge: 35,
    filmOffset: 0,
    view: null,
    viewValue: null,
    introOrtho: 0,
    restOrbit: 0
  });
  useFrame((state, delta) => {
    const shot = inspectionCamera.current;
    if (inspection.active && !inspection.static) {
      if (!shot.saved) {
        shot.saved = true;
        shot.observe = false;
        shot.position.copy(camera.position);
        shot.quaternion.copy(camera.quaternion);
        shot.up.copy(camera.up);
        shot.scale.copy(camera.scale);
        shot.projection.copy(camera.projectionMatrix);
        shot.inverseProjection.copy(camera.projectionMatrixInverse);
        shot.currentPos.copy(currentPos.current);
        shot.currentTarget.copy(currentTarget.current);
        shot.introOrtho = introOrtho.current;
        shot.restOrbit = restOrbit.current;
        if (camera instanceof PerspectiveCamera) {
          shot.fov = camera.fov;
          shot.near = camera.near;
          shot.far = camera.far;
          shot.zoom = camera.zoom;
          shot.aspect = camera.aspect;
          shot.focus = camera.focus;
          shot.filmGauge = camera.filmGauge;
          shot.filmOffset = camera.filmOffset;
          shot.view = camera.view;
          shot.viewValue = camera.view ? { ...camera.view } : null;
        }
      }
      const runtime = inspection.runtime;
      if (!runtime?.camera.valid) return;
      const sample = runtime.camera;
      const enter = ease(inspection.entryElapsed / 1.2), blend = enter * (1 - runtime.frame.returnBlend);
      shot.matrix.lookAt(sample.position, sample.target, sample.up);
      shot.macroRotation.setFromRotationMatrix(shot.matrix);
      camera.position.lerpVectors(shot.position, sample.position, blend);
      camera.quaternion.slerpQuaternions(shot.quaternion, shot.macroRotation, blend);
      camera.up.lerpVectors(shot.up, sample.up, blend).normalize();
      if (camera instanceof PerspectiveCamera) {
        camera.fov = shot.fov + (sample.fov - shot.fov) * blend;
        camera.updateProjectionMatrix();
      }
      if (blend === 0) {
        camera.projectionMatrix.copy(shot.projection);
        camera.projectionMatrixInverse.copy(shot.inverseProjection);
      }
      camera.updateMatrixWorld();
      telemetry.camera.x = camera.position.x;
      telemetry.camera.y = camera.position.y;
      telemetry.camera.z = camera.position.z;
      telemetry.camera.fov = camera instanceof PerspectiveCamera ? camera.fov : shot.fov;
      inspectionTelemetry.cameraOwner = "CameraRig";
      const probe = inspectionTelemetry;
      probe.cameraSampleTime = runtime.frame.time;
      probe.cameraSampleStamp = state.clock.elapsedTime;
      return;
    }
    if (shot.observe) {
      shot.observe = false;
      inspectionTelemetry.restoredPoseError = camera.position.distanceTo(shot.position) + camera.quaternion.angleTo(shot.quaternion) + camera.up.distanceTo(shot.up) + camera.scale.distanceTo(shot.scale);
      let projectionError = 0;
      for (let i = 0; i < 16; i++) projectionError = Math.max(projectionError, Math.abs(camera.projectionMatrix.elements[i] - shot.projection.elements[i]), Math.abs(camera.projectionMatrixInverse.elements[i] - shot.inverseProjection.elements[i]));
      const probe = inspectionTelemetry;
      probe.restoreProjectionError = projectionError;
      probe.restoreStateError = camera instanceof PerspectiveCamera ? Math.abs(camera.fov - shot.fov) + Math.abs(camera.near - shot.near) + Math.abs(camera.far - shot.far) + Math.abs(camera.zoom - shot.zoom) + Math.abs(camera.aspect - shot.aspect) + Math.abs(camera.focus - shot.focus) + Math.abs(camera.filmGauge - shot.filmGauge) + Math.abs(camera.filmOffset - shot.filmOffset) : 0;
      probe.restoreObserved = true;
      renderOwnership.restoreObserved = true;
      return;
    }
    if (shot.saved) {
      shot.saved = false;
      shot.observe = true;
      camera.position.copy(shot.position);
      camera.quaternion.copy(shot.quaternion);
      camera.up.copy(shot.up);
      camera.scale.copy(shot.scale);
      if (camera instanceof PerspectiveCamera) {
        camera.fov = shot.fov;
        camera.near = shot.near;
        camera.far = shot.far;
        camera.zoom = shot.zoom;
        camera.aspect = shot.aspect;
        camera.focus = shot.focus;
        camera.filmGauge = shot.filmGauge;
        camera.filmOffset = shot.filmOffset;
        camera.view = shot.view;
        if (shot.view && shot.viewValue) Object.assign(shot.view, shot.viewValue);
      }
      camera.projectionMatrix.copy(shot.projection);
      camera.projectionMatrixInverse.copy(shot.inverseProjection);
      currentPos.current.copy(shot.currentPos);
      currentTarget.current.copy(shot.currentTarget);
      introOrtho.current = shot.introOrtho;
      restOrbit.current = shot.restOrbit;
      camera.updateMatrixWorld();
      return;
    }
    if (getQuality().reducedMotion && !drawingRuntime.ready) {
      const hero = CAMERA_PATH[0];
      camera.position.set(hero.position[0], hero.position[1], hero.position[2]);
      camera.lookAt(scratchA.current.set(hero.target[0], hero.target[1], hero.target[2]));
      if (camera instanceof PerspectiveCamera && camera.fov !== hero.fov) {
        camera.fov = hero.fov;
        camera.updateProjectionMatrix();
        telemetry.camera.fov = camera.fov;
      }
      telemetry.camera.x = camera.position.x;
      telemetry.camera.y = camera.position.y;
      telemetry.camera.z = camera.position.z;
      telemetry.camera.framingBias = 0;
      telemetry.camera.framingBiasY = 0;
      telemetry.camera.portraitDolly = 1;
      writeScrollTelemetry();
      return;
    }
    const { hotspotId, velocity } = getScrollState();
    const progress = getQuality().reducedMotion ? DRAWING_INTRO_WINDOW.releaseEnd * REDUCED_MOTION_INTRO_T : getScrollState().progress;
    const base = baseAt(progress);
    goalPos.current.set(base.position[0], base.position[1], base.position[2]);
    goalTarget.current.set(base.target[0], base.target[1], base.target[2]);
    let goalFov = base.fov;
    const shiftW = bellWeight(progress, remapHeroProgress(0.035), remapHeroProgress(0.055), remapHeroProgress(0.115), 0.18);
    if (shiftW > 1e-3) {
      const orbitT = smoothstep(Math.min(Math.max((progress - remapHeroProgress(0.05)) / (remapHeroProgress(0.1) - remapHeroProgress(0.05)), 0), 1));
      const grPos = [
        lerpN(0.16, 0.12, orbitT),
        lerpN(0.06, 0.05, orbitT),
        lerpN(0.16, 0.02, orbitT)
      ];
      const grTgt = [0, 0.012, 0.022];
      const grFov = 22;
      goalPos.current.x = lerpN(goalPos.current.x, grPos[0], shiftW);
      goalPos.current.y = lerpN(goalPos.current.y, grPos[1], shiftW);
      goalPos.current.z = lerpN(goalPos.current.z, grPos[2], shiftW);
      goalTarget.current.x = lerpN(goalTarget.current.x, grTgt[0], shiftW);
      goalTarget.current.y = lerpN(goalTarget.current.y, grTgt[1], shiftW);
      goalTarget.current.z = lerpN(goalTarget.current.z, grTgt[2], shiftW);
      goalFov = lerpN(goalFov, grFov, shiftW);
    }
    if (progress <= 0.525) {
      const explodeFactor = progress <= DRAWING_INTRO_WINDOW.releaseEnd ? 0 : telemetry.rig.explodeFactor;
      if (explodeFactor > 1e-3) {
        const spinProgress = Math.min(1, Math.max(0, (progress - 0.18) / 0.17));
        const heroYaw = spinProgress * Math.PI * 0.85;
        const centroidZ = -0.152 * explodeFactor;
        const centroidWorldX = centroidZ * Math.sin(heroYaw);
        const centroidWorldZ = centroidZ * Math.cos(heroYaw);
        const explodeWeight = explodeFactor * 0.7;
        goalTarget.current.x += centroidWorldX * explodeWeight;
        goalTarget.current.z += centroidWorldZ * explodeWeight;
      }
    }
    const { start, dwellStart, dwellEnd, end } = LCD_REVEAL_WINDOW;
    if (progress >= start && progress <= end) {
      const orbitStart = baseAt(start);
      const orbitReturn = baseAt(end);
      const orbit = LCD_ORBIT_KEYFRAMES;
      const midArc = start + (dwellStart - start) / 2;
      const blend = (from, to, lo, hi) => lerpN(from, to, smoothstep(Math.min(Math.max((progress - lo) / (hi - lo), 0), 1)));
      const seg = (from, to, lo, hi) => [blend(from[0], to[0], lo, hi), blend(from[1], to[1], lo, hi), blend(from[2], to[2], lo, hi)];
      let rearPos;
      let rearTarget;
      let rearFov;
      if (progress < midArc) {
        rearPos = seg(orbitStart.position, orbit.arc.position, start, midArc);
        rearTarget = seg(orbitStart.target, orbit.arc.target, start, midArc);
        rearFov = blend(orbitStart.fov, orbit.arc.fov, start, midArc);
      } else if (progress < dwellStart) {
        rearPos = seg(orbit.arc.position, orbit.dwell.position, midArc, dwellStart);
        rearTarget = seg(orbit.arc.target, orbit.dwell.target, midArc, dwellStart);
        rearFov = blend(orbit.arc.fov, orbit.dwell.fov, midArc, dwellStart);
      } else if (progress <= dwellEnd) {
        rearPos = [...orbit.dwell.position];
        rearTarget = [...orbit.dwell.target];
        rearFov = orbit.dwell.fov;
      } else {
        rearPos = seg(orbit.dwell.position, orbitReturn.position, dwellEnd, end);
        rearTarget = seg(orbit.dwell.target, orbitReturn.target, dwellEnd, end);
        rearFov = blend(orbit.dwell.fov, orbitReturn.fov, dwellEnd, end);
      }
      goalPos.current.set(rearPos[0], rearPos[1], rearPos[2]);
      goalTarget.current.set(rearTarget[0], rearTarget[1], rearTarget[2]);
      goalFov = rearFov;
    }
    if (progress >= 0.76) {
      const t4 = smoothstep(Math.min((progress - 0.76) / 0.18, 1));
      const m249Pos = [
        lerpN(56.43, 56.6, t4),
        lerpN(0.65, 0.9, t4),
        lerpN(-9.62, -8.67, t4)
      ];
      const m249Tgt = [56, 0, -12];
      const m249Fov = lerpN(35, 38, t4);
      goalPos.current.set(m249Pos[0], m249Pos[1], m249Pos[2]);
      goalTarget.current.set(m249Tgt[0], m249Tgt[1], m249Tgt[2]);
      goalFov = m249Fov;
    }
    const inLcdWindow = progress >= LCD_REVEAL_WINDOW.start && progress <= LCD_REVEAL_WINDOW.end;
    const inspectFrame = hotspotId && !(hotspotId === "lcd" && inLcdWindow) ? HOTSPOT_INSPECT_FRAMES[hotspotId] : null;
    if (inspectFrame) {
      const explode = telemetry.rig.explodeFactor;
      const isStation1Handle = hotspotId === "rotor" || hotspotId === "motor-housing" || hotspotId === "flange" || hotspotId === "mcu" || hotspotId === "lcd" || hotspotId === "lipo";
      const offsetZ = isStation1Handle ? EXPLODE_OFFSETS.handle * explode : 0;
      goalPos.current.set(
        inspectFrame.position[0],
        inspectFrame.position[1],
        inspectFrame.position[2] + offsetZ
      );
      goalTarget.current.set(
        inspectFrame.target[0],
        inspectFrame.target[1],
        inspectFrame.target[2] + offsetZ
      );
      goalFov = inspectFrame.fov;
    }
    const aspect = state.size.width / Math.max(state.size.height, 1);
    const portrait = aspect < 0.9;
    let portraitDolly = 1;
    if (portrait) {
      const w = smoothstep(Math.min(Math.max((progress - 0.5) / 0.06, 0), 1));
      const ch4 = progress >= 0.76 ? smoothstep(Math.min((progress - 0.76) / 0.24, 1)) : 0;
      portraitDolly = 1 + w * (1 + 0.8 * ch4);
      goalFov += 10 * w;
      if (portraitDolly > 1) {
        goalPos.current.sub(goalTarget.current).multiplyScalar(portraitDolly).add(goalTarget.current);
      }
    }
    telemetry.camera.portraitDolly = portraitDolly;
    const biasVec = framingBiasVec(progress);
    const att = (lo, hi) => Math.min(Math.max((progress - lo) / 0.015, 0), Math.max((hi - progress) / 0.015, 0), 1);
    const flightW = Math.max(att(0.53, 0.598), att(0.722, 0.758));
    const flightAtt = 1 - 0.75 * flightW;
    const afterIntro = smooth01((progress - DRAWING_INTRO_WINDOW.releaseEnd) / 0.03);
    const biasX = (portrait ? biasVec.x * 0.25 * flightAtt : biasVec.x * flightAtt) * afterIntro;
    const biasY = (portrait ? biasVec.y : 0) * afterIntro;
    telemetry.camera.framingBias = biasX;
    telemetry.camera.framingBiasY = biasY;
    if (biasX > 1e-4 || biasY > 1e-4) {
      scratchFwd.current.subVectors(goalTarget.current, goalPos.current);
      const dist = scratchFwd.current.length();
      if (dist > 1e-4) {
        const fovRad = goalFov * Math.PI / 180;
        if (biasX > 1e-4) {
          scratchFwd.current.multiplyScalar(1 / dist);
          scratchRight.current.set(
            scratchFwd.current.z,
            0,
            -scratchFwd.current.x
          );
          const leftLen = scratchRight.current.length();
          if (leftLen > 1e-4) {
            scratchRight.current.multiplyScalar(1 / leftLen);
            const biasMeters = biasX * dist * Math.tan(fovRad / 2) * aspect;
            goalTarget.current.addScaledVector(scratchRight.current, biasMeters);
          }
        }
        if (biasY > 1e-4) {
          const biasMetersY = biasY * dist * Math.tan(fovRad / 2);
          goalTarget.current.y -= biasMetersY;
        }
      }
    }
    const layout = drawingRuntime.layout;
    const reducedMotion = getQuality().reducedMotion;
    const intro = drawingIntroState(progress, drawingRuntime.extraction?.crossing);
    const introActive = progress <= DRAWING_INTRO_WINDOW.releaseEnd && layout !== null;
    const introBlend = introActive ? reducedMotion ? 0 : intro.perspective : 1;
    if (introActive && layout) {
      const pose = introCameraPose(layout, aspect, reducedMotion ? REDUCED_MOTION_INTRO_T : intro.t, introPose.current);
      telemetry.camera.sheetDistance = pose.distance;
      goalPos.current.lerpVectors(pose.position, goalPos.current, introBlend);
      goalTarget.current.lerpVectors(pose.target, goalTarget.current, introBlend);
      goalFov = pose.fov + (goalFov - pose.fov) * introBlend;
      introOrtho.current = pose.ortho * (1 - introBlend);
      camera.up.set(
        pose.up.x * (1 - introBlend),
        pose.up.y * (1 - introBlend) + introBlend,
        pose.up.z * (1 - introBlend)
      ).normalize();
    } else {
      introOrtho.current = 0;
      camera.up.set(0, 1, 0);
      telemetry.camera.sheetDistance = 0;
    }
    const parallax = introActive ? 0 : 1;
    goalPos.current.x += state.pointer.x * 0.03 * parallax;
    goalPos.current.y += state.pointer.y * 0.02 * parallax;
    if (Math.abs(velocity) < 1e-3 && progress > DRAWING_INTRO_WINDOW.releaseEnd && progress < 0.545) {
      restOrbit.current += delta * (0.3 * Math.PI / 180);
      goalPos.current.x += Math.sin(restOrbit.current) * 3e-3;
      goalPos.current.z += (Math.cos(restOrbit.current) - 1) * 3e-3;
    }
    const safeDelta = Math.min(delta, 0.1);
    const damp = 1 - Math.exp(-6 * safeDelta);
    currentPos.current.lerp(goalPos.current, damp);
    currentTarget.current.lerp(goalTarget.current, damp);
    camera.position.copy(currentPos.current);
    camera.lookAt(currentTarget.current);
    if (camera instanceof PerspectiveCamera) {
      camera.fov += (goalFov - camera.fov) * damp;
      camera.updateProjectionMatrix();
      const ortho = introOrtho.current;
      if (introActive && layout && ortho > 1e-4) {
        const distance = currentPos.current.distanceTo(currentTarget.current);
        const half = distance * Math.tan(camera.fov * Math.PI / 360);
        orthographic.current.makeOrthographic(
          -half * aspect,
          half * aspect,
          half,
          -half,
          camera.near,
          camera.far
        );
        for (let i = 0; i < 16; i += 1) {
          camera.projectionMatrix.elements[i] = orthographic.current.elements[i] * distance * ortho + camera.projectionMatrix.elements[i] * (1 - ortho);
        }
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      }
      telemetry.camera.fov = camera.fov;
    }
    telemetry.camera.x = camera.position.x;
    telemetry.camera.y = camera.position.y;
    telemetry.camera.z = camera.position.z;
    telemetry.camera.goal.position[0] = goalPos.current.x;
    telemetry.camera.goal.position[1] = goalPos.current.y;
    telemetry.camera.goal.position[2] = goalPos.current.z;
    telemetry.camera.goal.target[0] = goalTarget.current.x;
    telemetry.camera.goal.target[1] = goalTarget.current.y;
    telemetry.camera.goal.target[2] = goalTarget.current.z;
    telemetry.camera.goal.fov = goalFov;
    telemetry.camera.up[0] = camera.up.x;
    telemetry.camera.up[1] = camera.up.y;
    telemetry.camera.up[2] = camera.up.z;
    camera.updateMatrixWorld();
    writeScrollTelemetry();
  });
  return null;
}
_s(CameraRig, "CY8F1inNMLxNA+tvwP4bC9hKdXw=", false, function() {
  return [useThree, useFrame];
});
_c = CameraRig;
var _c;
$RefreshReg$(_c, "CameraRig");
import * as RefreshRuntime from "/@react-refresh";
const inWebWorker = typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;
if (import.meta.hot && !inWebWorker) {
  if (!window.$RefreshReg$) {
    throw new Error(
      "@vitejs/plugin-react can't detect preamble. Something is wrong."
    );
  }
  RefreshRuntime.__hmr_import(import.meta.url).then((currentExports) => {
    RefreshRuntime.registerExportsForReactRefresh("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/CameraRig.tsx", currentExports);
    import.meta.hot.accept((nextExports) => {
      if (!nextExports) return;
      const invalidateMessage = RefreshRuntime.validateRefreshBoundaryAndEnqueueUpdate("C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/CameraRig.tsx", currentExports, nextExports);
      if (invalidateMessage) import.meta.hot.invalidate(invalidateMessage);
    });
  });
}
function $RefreshReg$(type, id) {
  return RefreshRuntime.register(type, "C:/Users/Markimus/.buzz/REPOS/jgun-portfolio/src/scene/CameraRig.tsx " + id);
}
function $RefreshSig$() {
  return RefreshRuntime.createSignatureFunctionForTransform();
}

//# sourceMappingURL=data:application/json;base64,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QyxJQUFJWCxPQUFPVyxHQUFHK0M7QUFDbkM3RixjQUFVbUMsT0FBT1csR0FBRyxDQUFDLElBQUlYLE9BQU9XLEdBQUdnRDtBQUNuQzNELFdBQU93RCxrQkFBa0I7QUFDekJ2Rix5QkFBcUI7QUFBQSxFQUN2QixDQUFDO0FBRUQsU0FBTztBQUNUO0FBQUM4QixHQXBiZUQsV0FBUztBQUFBLFVBQ1J4RCxVQTRCZkQsUUFBUTtBQUFBO0FBQUEsS0E3Qk15RDtBQUFTLElBQUFtTDtBQUFBLGFBQUFBLElBQUEiLCJuYW1lcyI6WyJ1c2VSZWYiLCJ1c2VGcmFtZSIsInVzZVRocmVlIiwiTWF0cml4NCIsIlBlcnNwZWN0aXZlQ2FtZXJhIiwiUXVhdGVybmlvbiIsIlZlY3RvcjMiLCJpbnNwZWN0aW9uIiwiaW5zcGVjdGlvblRlbGVtZXRyeSIsImVhc2UiLCJyZW5kZXJPd25lcnNoaXAiLCJkcmF3aW5nUnVudGltZSIsIkRSQVdJTkdfSU5UUk9fV0lORE9XIiwiUkVEVUNFRF9NT1RJT05fSU5UUk9fVCIsImRyYXdpbmdJbnRyb1N0YXRlIiwicmVtYXBIZXJvUHJvZ3Jlc3MiLCJzbW9vdGgwMSIsImludHJvQ2FtZXJhUG9zZSIsIkNBTUVSQV9QQVRIIiwiRVhQTE9ERV9PRkZTRVRTIiwiTENEX09SQklUX0tFWUZSQU1FUyIsIkxDRF9SRVZFQUxfV0lORE9XIiwiYmFzZUF0IiwiZnJhbWluZ0JpYXNWZWMiLCJnZXRTY3JvbGxTdGF0ZSIsInRlbGVtZXRyeSIsImdldFF1YWxpdHkiLCJzbW9vdGhzdGVwIiwidCIsIndyaXRlU2Nyb2xsVGVsZW1ldHJ5IiwicHJvZ3Jlc3MiLCJjaGFwdGVyIiwiY2hhcHRlclByb2dyZXNzIiwibWF0ZXJpYWxNb2RlIiwic2Nyb2xsIiwiSE9UU1BPVF9JTlNQRUNUX0ZSQU1FUyIsInJvdG9yIiwicG9zaXRpb24iLCJ0YXJnZXQiLCJmb3YiLCJmbGFuZ2UiLCJtY3UiLCJsY2QiLCJsaXBvIiwiYmVsbFdlaWdodCIsInAiLCJsbyIsImhpIiwibG8yIiwiaGkyIiwiZmFkZUluIiwiTWF0aCIsIm1pbiIsIm1heCIsImZhZGVPdXQiLCJsZXJwTiIsImEiLCJiIiwiQ2FtZXJhUmlnIiwiX3MiLCJjYW1lcmEiLCJzdGF0ZSIsImN1cnJlbnRQb3MiLCJjdXJyZW50VGFyZ2V0IiwiZ29hbFBvcyIsImdvYWxUYXJnZXQiLCJzY3JhdGNoQSIsInNjcmF0Y2hGd2QiLCJzY3JhdGNoUmlnaHQiLCJvcnRob2dyYXBoaWMiLCJpbnRyb1Bvc2UiLCJ1cCIsIm9ydGhvIiwiZGlzdGFuY2UiLCJpbnRyb09ydGhvIiwicmVzdE9yYml0IiwiaW5zcGVjdGlvbkNhbWVyYSIsInNhdmVkIiwib2JzZXJ2ZSIsInF1YXRlcm5pb24iLCJzY2FsZSIsInByb2plY3Rpb24iLCJpbnZlcnNlUHJvamVjdGlvbiIsIm1hY3JvUm90YXRpb24iLCJtYXRyaXgiLCJuZWFyIiwiZmFyIiwiem9vbSIsImFzcGVjdCIsImZvY3VzIiwiZmlsbUdhdWdlIiwiZmlsbU9mZnNldCIsInZpZXciLCJ2aWV3VmFsdWUiLCJkZWx0YSIsInNob3QiLCJjdXJyZW50IiwiYWN0aXZlIiwic3RhdGljIiwiY29weSIsInByb2plY3Rpb25NYXRyaXgiLCJwcm9qZWN0aW9uTWF0cml4SW52ZXJzZSIsInJ1bnRpbWUiLCJ2YWxpZCIsInNhbXBsZSIsImVudGVyIiwiZW50cnlFbGFwc2VkIiwiYmxlbmQiLCJmcmFtZSIsInJldHVybkJsZW5kIiwibG9va0F0Iiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwibGVycFZlY3RvcnMiLCJzbGVycFF1YXRlcm5pb25zIiwibm9ybWFsaXplIiwidXBkYXRlUHJvamVjdGlvbk1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwieCIsInkiLCJ6IiwiY2FtZXJhT3duZXIiLCJwcm9iZSIsImNhbWVyYVNhbXBsZVRpbWUiLCJ0aW1lIiwiY2FtZXJhU2FtcGxlU3RhbXAiLCJjbG9jayIsImVsYXBzZWRUaW1lIiwicmVzdG9yZWRQb3NlRXJyb3IiLCJkaXN0YW5jZVRvIiwiYW5nbGVUbyIsInByb2plY3Rpb25FcnJvciIsImkiLCJhYnMiLCJlbGVtZW50cyIsInJlc3RvcmVQcm9qZWN0aW9uRXJyb3IiLCJyZXN0b3JlU3RhdGVFcnJvciIsInJlc3RvcmVPYnNlcnZlZCIsIk9iamVjdCIsImFzc2lnbiIsInJlZHVjZWRNb3Rpb24iLCJyZWFkeSIsImhlcm8iLCJzZXQiLCJmcmFtaW5nQmlhcyIsImZyYW1pbmdCaWFzWSIsInBvcnRyYWl0RG9sbHkiLCJob3RzcG90SWQiLCJ2ZWxvY2l0eSIsInJlbGVhc2VFbmQiLCJiYXNlIiwiZ29hbEZvdiIsInNoaWZ0VyIsIm9yYml0VCIsImdyUG9zIiwiZ3JUZ3QiLCJnckZvdiIsImV4cGxvZGVGYWN0b3IiLCJyaWciLCJzcGluUHJvZ3Jlc3MiLCJoZXJvWWF3IiwiUEkiLCJjZW50cm9pZFoiLCJjZW50cm9pZFdvcmxkWCIsInNpbiIsImNlbnRyb2lkV29ybGRaIiwiY29zIiwiZXhwbG9kZVdlaWdodCIsInN0YXJ0IiwiZHdlbGxTdGFydCIsImR3ZWxsRW5kIiwiZW5kIiwib3JiaXRTdGFydCIsIm9yYml0UmV0dXJuIiwib3JiaXQiLCJtaWRBcmMiLCJmcm9tIiwidG8iLCJzZWciLCJyZWFyUG9zIiwicmVhclRhcmdldCIsInJlYXJGb3YiLCJhcmMiLCJkd2VsbCIsInQ0IiwibTI0OVBvcyIsIm0yNDlUZ3QiLCJtMjQ5Rm92IiwiaW5MY2RXaW5kb3ciLCJpbnNwZWN0RnJhbWUiLCJleHBsb2RlIiwiaXNTdGF0aW9uMUhhbmRsZSIsIm9mZnNldFoiLCJoYW5kbGUiLCJzaXplIiwid2lkdGgiLCJoZWlnaHQiLCJwb3J0cmFpdCIsInciLCJjaDQiLCJzdWIiLCJtdWx0aXBseVNjYWxhciIsImFkZCIsImJpYXNWZWMiLCJhdHQiLCJmbGlnaHRXIiwiZmxpZ2h0QXR0IiwiYWZ0ZXJJbnRybyIsImJpYXNYIiwiYmlhc1kiLCJzdWJWZWN0b3JzIiwiZGlzdCIsImxlbmd0aCIsImZvdlJhZCIsImxlZnRMZW4iLCJiaWFzTWV0ZXJzIiwidGFuIiwiYWRkU2NhbGVkVmVjdG9yIiwiYmlhc01ldGVyc1kiLCJsYXlvdXQiLCJpbnRybyIsImV4dHJhY3Rpb24iLCJjcm9zc2luZyIsImludHJvQWN0aXZlIiwiaW50cm9CbGVuZCIsInBlcnNwZWN0aXZlIiwicG9zZSIsInNoZWV0RGlzdGFuY2UiLCJwYXJhbGxheCIsInBvaW50ZXIiLCJzYWZlRGVsdGEiLCJkYW1wIiwiZXhwIiwibGVycCIsImhhbGYiLCJtYWtlT3J0aG9ncmFwaGljIiwiaW52ZXJ0IiwiZ29hbCIsIl9jIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VzIjpbIkNhbWVyYVJpZy50c3giXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXNlUmVmIH0gZnJvbSAncmVhY3QnXG5pbXBvcnQgeyB1c2VGcmFtZSwgdXNlVGhyZWUgfSBmcm9tICdAcmVhY3QtdGhyZWUvZmliZXInXG5pbXBvcnQgeyBNYXRyaXg0LCBQZXJzcGVjdGl2ZUNhbWVyYSwgUXVhdGVybmlvbiwgVmVjdG9yMyB9IGZyb20gJ3RocmVlJ1xuaW1wb3J0IHsgaW5zcGVjdGlvbiwgaW5zcGVjdGlvblRlbGVtZXRyeSB9IGZyb20gJy4uL3N0YXRlL2luc3BlY3Rpb25TdG9yZSdcbmltcG9ydCB7IGVhc2UgfSBmcm9tICcuL2luc3BlY3Rpb24vdGltZWxpbmUnXG5pbXBvcnQgeyByZW5kZXJPd25lcnNoaXAgfSBmcm9tICcuL2luc3BlY3Rpb24vcmVuZGVyTGVhc2UnXG5pbXBvcnQgeyBkcmF3aW5nUnVudGltZSB9IGZyb20gJy4vZHJhd2luZy9leHRyYWN0aW9uUG9zZSdcbmltcG9ydCB7XG4gIERSQVdJTkdfSU5UUk9fV0lORE9XLFxuICBSRURVQ0VEX01PVElPTl9JTlRST19ULFxuICBkcmF3aW5nSW50cm9TdGF0ZSxcbiAgcmVtYXBIZXJvUHJvZ3Jlc3MsXG4gIHNtb290aDAxLFxufSBmcm9tICcuL2RyYXdpbmcvaW50cm9UaW1lbGluZSdcbmltcG9ydCB7IGludHJvQ2FtZXJhUG9zZSwgdHlwZSBTaGVldENhbWVyYVBvc2UgfSBmcm9tICcuL2RyYXdpbmcvc2hlZXRDYW1lcmEnXG5pbXBvcnQge1xuICBDQU1FUkFfUEFUSCxcbiAgRVhQTE9ERV9PRkZTRVRTLFxuICBMQ0RfT1JCSVRfS0VZRlJBTUVTLFxuICBMQ0RfUkVWRUFMX1dJTkRPVyxcbiAgYmFzZUF0LFxuICBmcmFtaW5nQmlhc1ZlYyxcbn0gZnJvbSAnLi4vZGF0YS9jYXNlU3R1ZGllcydcbmltcG9ydCB7IGdldFNjcm9sbFN0YXRlLCB0ZWxlbWV0cnkgfSBmcm9tICcuLi9zdGF0ZS9zY3JvbGxTdG9yZSdcbmltcG9ydCB7IGdldFF1YWxpdHkgfSBmcm9tICcuLi9zdGF0ZS9xdWFsaXR5U3RvcmUnXG5cbmNvbnN0IHNtb290aHN0ZXAgPSAodDogbnVtYmVyKTogbnVtYmVyID0+IHQgKiB0ICogKDMgLSAyICogdClcblxuLyoqIE1pcnJvciB0aGUgc2Nyb2xsIHN0b3JlIGludG8gdGVsZW1ldHJ5LnNjcm9sbCBlYWNoIGZyYW1lIChwcm9iZSBzdXJmYWNlKS4gKi9cbmNvbnN0IHdyaXRlU2Nyb2xsVGVsZW1ldHJ5ID0gKCk6IHZvaWQgPT4ge1xuICBjb25zdCB7IHByb2dyZXNzLCBjaGFwdGVyLCBjaGFwdGVyUHJvZ3Jlc3MsIG1hdGVyaWFsTW9kZSB9ID0gZ2V0U2Nyb2xsU3RhdGUoKVxuICB0ZWxlbWV0cnkuc2Nyb2xsLnByb2dyZXNzID0gcHJvZ3Jlc3NcbiAgdGVsZW1ldHJ5LnNjcm9sbC5jaGFwdGVyID0gY2hhcHRlclxuICB0ZWxlbWV0cnkuc2Nyb2xsLmNoYXB0ZXJQcm9ncmVzcyA9IGNoYXB0ZXJQcm9ncmVzc1xuICB0ZWxlbWV0cnkuc2Nyb2xsLm1hdGVyaWFsTW9kZSA9IG1hdGVyaWFsTW9kZVxufVxuXG4vKipcbiAqIFN1YmFzc2VtYmx5IGluc3BlY3QgY2FtZXJhIGZyYW1pbmcga2V5ZnJhbWVzIChwb3NpdGlvbiwgdGFyZ2V0LCBGT1YpLlxuICogVXNlZCB3aGVuIGEgdmlzaXRvciBjbGlja3MgYSBzcGF0aWFsIGhvdHNwb3QgdG8gaW5zcGVjdCB0aGF0IHNwZWNpZmljIHBhcnQuXG4gKi9cbmludGVyZmFjZSBJbnNwZWN0RnJhbWluZyB7XG4gIHBvc2l0aW9uOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1cbiAgdGFyZ2V0OiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl1cbiAgZm92OiBudW1iZXJcbn1cblxuY29uc3QgSE9UU1BPVF9JTlNQRUNUX0ZSQU1FUzogUmVjb3JkPHN0cmluZywgSW5zcGVjdEZyYW1pbmc+ID0ge1xuICAvLyAtLS0tIFN0YXRpb24gMTogSkd1biBUb3JxdWUgTXVsdGlwbGllciAoWzAsIDAsIDBdKSAtLS0tXG4gIC8vIEFpciBtb3RvciByb3RvciDigJQgdGlnaHQgMy80IHZpZXcgZm9jdXNpbmcgb24gcm90b3IgdmFuZXMgJiBpbnB1dCBkcml2ZVxuICByb3Rvcjoge1xuICAgIHBvc2l0aW9uOiBbMC4xOCwgMC4wOCwgMC4xMl0sXG4gICAgdGFyZ2V0OiBbMCwgMCwgLTAuMDZdLFxuICAgIGZvdjogMjQsXG4gIH0sXG4gIC8vIERhdHVtIEEgbW90b3IgaG91c2luZyBib3JlIOKAlCBhbmdsZWQgdmlldyBpbnRvIG1hY2hpbmVkIGJvcmUgJiBkYXR1bSBzdXJmYWNlXG4gICdtb3Rvci1ob3VzaW5nJzoge1xuICAgIHBvc2l0aW9uOiBbMC4yLCAwLjA5LCAwLjA0XSxcbiAgICB0YXJnZXQ6IFswLCAwLCAtMC4xMl0sXG4gICAgZm92OiAyNCxcbiAgfSxcbiAgLy8gRGF0dW0gQiBpbnRlcmZhY2UgZmxhbmdlIOKAlCBzaWRlIGFuZ2xlIGZvY3VzaW5nIG9uIG1vdG9yLXRvLWdlYXJib3ggam9pbnRcbiAgZmxhbmdlOiB7XG4gICAgcG9zaXRpb246IFswLjE4LCAwLjA3LCAwLjA4XSxcbiAgICB0YXJnZXQ6IFswLCAwLCAtMC4wM10sXG4gICAgZm92OiAyMixcbiAgfSxcbiAgLy8gR2VhcmJveCBvdXRlciBob3VzaW5nIFAwMDAyNDUg4oCUIHNpZGUgaW5zcGVjdGlvbiBmcmFtaW5nIG9mIHJpbmcgZ2VhcnMgJiBzaGVsbFxuICAnZ2VhcmJveC1ob3VzaW5nJzoge1xuICAgIHBvc2l0aW9uOiBbMC4yNCwgMC4wOSwgMC4xNF0sXG4gICAgdGFyZ2V0OiBbMCwgMCwgMC4wMV0sXG4gICAgZm92OiAyNSxcbiAgfSxcbiAgLy8gTVNQNDMwIE1DVSDigJQgdGlnaHQgdG9wLXJlYXIgdmlldyBvbiBoYW5kbGUgc21hcnQtdG9vbCBlbGVjdHJvbmljc1xuICBtY3U6IHtcbiAgICBwb3NpdGlvbjogWy0wLjA3LCAwLjEsIC0wLjM2XSxcbiAgICB0YXJnZXQ6IFswLCAwLjAyLCAtMC4yMl0sXG4gICAgZm92OiAyNSxcbiAgfSxcbiAgLy8gTENEIG1hbm9tZXRlciBzY3JlZW4gJiBiYWNrbGl0IGJ1dHRvbnNcbiAgbGNkOiB7XG4gICAgcG9zaXRpb246IFstMC4wNSwgMC4wOCwgLTAuNDJdLFxuICAgIHRhcmdldDogWzAsIDAuMDIsIC0wLjI0XSxcbiAgICBmb3Y6IDI4LFxuICB9LFxuICAvLyBMaVBvIGJhdHRlcnkgY2VsbFxuICBsaXBvOiB7XG4gICAgcG9zaXRpb246IFstMC4wOSwgLTAuMDIsIC0wLjM0XSxcbiAgICB0YXJnZXQ6IFswLCAtMC4wMSwgLTAuMl0sXG4gICAgZm92OiAyNSxcbiAgfSxcblxuICAvLyAtLS0tIFN0YXRpb24gMjogUkwtMzAwIC8gTVNQIEFjb3VzdGljIFNBRkUgRW5jbG9zdXJlIChbMjgsIDAsIC02XSkgLS0tLVxuICAnZW5jbG9zdXJlLWNoYXNzaXMnOiB7XG4gICAgcG9zaXRpb246IFszMS44LCAyLjQsIC0yLjRdLFxuICAgIHRhcmdldDogWzI4LjAsIDEuMjMsIC02LjQxXSxcbiAgICBmb3Y6IDM0LFxuICB9LFxuICAnY29tcG9zaXRlLXBhbmVscyc6IHtcbiAgICBwb3NpdGlvbjogWzMxLjIsIDIuMCwgLTIuOF0sXG4gICAgdGFyZ2V0OiBbMjguNjYsIDEuMjAsIC01Ljc0XSxcbiAgICBmb3Y6IDMwLFxuICB9LFxuICAncHVtcC1ob3VzaW5nJzoge1xuICAgIHBvc2l0aW9uOiBbMzAuNCwgMS44LCAtMy40XSxcbiAgICB0YXJnZXQ6IFsyOC4wMiwgMC44OSwgLTYuMDBdLFxuICAgIGZvdjogMjgsXG4gIH0sXG4gICdhY291c3RpYy1iYWZmbGVzJzoge1xuICAgIHBvc2l0aW9uOiBbMjUuMiwgMi4yLCAtNC4yXSxcbiAgICB0YXJnZXQ6IFsyNi42OCwgMS41NCwgLTYuMzhdLFxuICAgIGZvdjogMjgsXG4gIH0sXG4gICdpc29sYXRpb24tbW91bnRzJzoge1xuICAgIHBvc2l0aW9uOiBbMjkuNiwgMC42LCAtNC4wXSxcbiAgICB0YXJnZXQ6IFsyOC4wMCwgMC4wNSwgLTYuMDBdLFxuICAgIGZvdjogMjYsXG4gIH0sXG4gICdkdWN0LWludGFrZSc6IHtcbiAgICBwb3NpdGlvbjogWzI5LjgsIDEuNiwgLTIuOF0sXG4gICAgdGFyZ2V0OiBbMjguMDAsIDEuMTEsIC01LjA1XSxcbiAgICBmb3Y6IDI4LFxuICB9LFxuICAnZHVjdC1leGhhdXN0Jzoge1xuICAgIHBvc2l0aW9uOiBbMjkuNiwgMS44LCAtOS4yXSxcbiAgICB0YXJnZXQ6IFsyNy45MCwgMS4yMywgLTcuMTddLFxuICAgIGZvdjogMjgsXG4gIH0sXG5cbiAgLy8gLS0tLSBTdGF0aW9uIDM6IE0yNDkgUmVjZWl2ZXIgUGxhdGZvcm0gKFs1NiwgMCwgLTEyXSkgLS0tLVxuICAnbTI0OS1yZWNlaXZlcic6IHtcbiAgICBwb3NpdGlvbjogWzU2ICsgMC4yNSwgMC4zNSwgLTEyICsgMC44XSxcbiAgICB0YXJnZXQ6IFs1NiwgMC4wNSwgLTEyXSxcbiAgICBmb3Y6IDI2LFxuICB9LFxuICAnbTI0OS10cnVubmlvbic6IHtcbiAgICBwb3NpdGlvbjogWzU2ICsgMC4yMiwgMC4yNSwgLTEyICsgMC42NV0sXG4gICAgdGFyZ2V0OiBbNTYsIDAuMDMsIC0xMiArIDAuMTVdLFxuICAgIGZvdjogMjIsXG4gIH0sXG4gICdtMjQ5LXJhaWwnOiB7XG4gICAgcG9zaXRpb246IFs1NiArIDAuMiwgMC40NSwgLTEyICsgMC42XSxcbiAgICB0YXJnZXQ6IFs1NiwgMC4xLCAtMTIgLSAwLjA4XSxcbiAgICBmb3Y6IDIyLFxuICB9LFxuICAnbTI0OS1mZWVkLXRyYXknOiB7XG4gICAgcG9zaXRpb246IFs1NiArIDAuMjIsIDAuMzIsIC0xMiArIDAuN10sXG4gICAgdGFyZ2V0OiBbNTYsIDAuMDYsIC0xMiArIDAuMDRdLFxuICAgIGZvdjogMjQsXG4gIH0sXG59XG5cbi8qKiBTbW9vdGhseSByYW1wIDDihpIxIG92ZXIgW2xvLCBoaV0gYW5kIDHihpIwIG92ZXIgW2xvMiwgaGkyXS4gKi9cbmZ1bmN0aW9uIGJlbGxXZWlnaHQocDogbnVtYmVyLCBsbzogbnVtYmVyLCBoaTogbnVtYmVyLCBsbzI6IG51bWJlciwgaGkyOiBudW1iZXIpOiBudW1iZXIge1xuICBjb25zdCBmYWRlSW4gPSBNYXRoLm1pbihNYXRoLm1heCgocCAtIGxvKSAvIChoaSAtIGxvKSwgMCksIDEpXG4gIGNvbnN0IGZhZGVPdXQgPSBNYXRoLm1pbihNYXRoLm1heCgoaGkyIC0gcCkgLyAoaGkyIC0gbG8yKSwgMCksIDEpXG4gIHJldHVybiBzbW9vdGhzdGVwKE1hdGgubWluKGZhZGVJbiwgZmFkZU91dCkpXG59XG5cbi8qKiBMZXJwIGEgc2NhbGFyLiAqL1xuY29uc3QgbGVycE4gPSAoYTogbnVtYmVyLCBiOiBudW1iZXIsIHQ6IG51bWJlcik6IG51bWJlciA9PiBhICsgKGIgLSBhKSAqIHRcblxuZXhwb3J0IGZ1bmN0aW9uIENhbWVyYVJpZygpIHtcbiAgY29uc3QgY2FtZXJhID0gdXNlVGhyZWUoKHN0YXRlKSA9PiBzdGF0ZS5jYW1lcmEpXG5cbiAgY29uc3QgY3VycmVudFBvcyA9IHVzZVJlZihuZXcgVmVjdG9yMyguLi5DQU1FUkFfUEFUSFswXS5wb3NpdGlvbikpXG4gIGNvbnN0IGN1cnJlbnRUYXJnZXQgPSB1c2VSZWYobmV3IFZlY3RvcjMoLi4uQ0FNRVJBX1BBVEhbMF0udGFyZ2V0KSlcbiAgY29uc3QgZ29hbFBvcyA9IHVzZVJlZihuZXcgVmVjdG9yMygpKVxuICBjb25zdCBnb2FsVGFyZ2V0ID0gdXNlUmVmKG5ldyBWZWN0b3IzKCkpXG4gIGNvbnN0IHNjcmF0Y2hBID0gdXNlUmVmKG5ldyBWZWN0b3IzKCkpXG4gIGNvbnN0IHNjcmF0Y2hGd2QgPSB1c2VSZWYobmV3IFZlY3RvcjMoKSlcbiAgY29uc3Qgc2NyYXRjaFJpZ2h0ID0gdXNlUmVmKG5ldyBWZWN0b3IzKCkpXG4gIGNvbnN0IG9ydGhvZ3JhcGhpYyA9IHVzZVJlZihuZXcgTWF0cml4NCgpKVxuICBjb25zdCBpbnRyb1Bvc2UgPSB1c2VSZWY8U2hlZXRDYW1lcmFQb3NlPih7XG4gICAgcG9zaXRpb246IG5ldyBWZWN0b3IzKCksXG4gICAgdGFyZ2V0OiBuZXcgVmVjdG9yMygpLFxuICAgIHVwOiBuZXcgVmVjdG9yMygwLCAxLCAwKSxcbiAgICBmb3Y6IDMwLFxuICAgIG9ydGhvOiAwLFxuICAgIGRpc3RhbmNlOiAxLFxuICB9KVxuICBjb25zdCBpbnRyb09ydGhvID0gdXNlUmVmKDApXG4gIGNvbnN0IHJlc3RPcmJpdCA9IHVzZVJlZigwKVxuICBjb25zdCBpbnNwZWN0aW9uQ2FtZXJhID0gdXNlUmVmKHtcbiAgICBzYXZlZDogZmFsc2UsIG9ic2VydmU6IGZhbHNlLCBwb3NpdGlvbjogbmV3IFZlY3RvcjMoKSwgcXVhdGVybmlvbjogbmV3IFF1YXRlcm5pb24oKSwgdXA6IG5ldyBWZWN0b3IzKCksIHNjYWxlOiBuZXcgVmVjdG9yMygpLFxuICAgIGN1cnJlbnRQb3M6IG5ldyBWZWN0b3IzKCksIGN1cnJlbnRUYXJnZXQ6IG5ldyBWZWN0b3IzKCksIHByb2plY3Rpb246IG5ldyBNYXRyaXg0KCksIGludmVyc2VQcm9qZWN0aW9uOiBuZXcgTWF0cml4NCgpLFxuICAgIG1hY3JvUm90YXRpb246IG5ldyBRdWF0ZXJuaW9uKCksIG1hdHJpeDogbmV3IE1hdHJpeDQoKSxcbiAgICBmb3Y6IDQyLCBuZWFyOiAwLjAwNSwgZmFyOiAxNTAsIHpvb206IDEsIGFzcGVjdDogMSwgZm9jdXM6IDEwLCBmaWxtR2F1Z2U6IDM1LCBmaWxtT2Zmc2V0OiAwLFxuICAgIHZpZXc6IG51bGwgYXMgUGVyc3BlY3RpdmVDYW1lcmFbJ3ZpZXcnXSwgdmlld1ZhbHVlOiBudWxsIGFzIFBlcnNwZWN0aXZlQ2FtZXJhWyd2aWV3J10sIGludHJvT3J0aG86IDAsIHJlc3RPcmJpdDogMCxcbiAgfSlcblxuICB1c2VGcmFtZSgoc3RhdGUsIGRlbHRhKSA9PiB7XG4gICAgY29uc3Qgc2hvdCA9IGluc3BlY3Rpb25DYW1lcmEuY3VycmVudFxuICAgIGlmIChpbnNwZWN0aW9uLmFjdGl2ZSAmJiAhaW5zcGVjdGlvbi5zdGF0aWMpIHtcbiAgICAgIGlmICghc2hvdC5zYXZlZCkge1xuICAgICAgICBzaG90LnNhdmVkID0gdHJ1ZTsgc2hvdC5vYnNlcnZlID0gZmFsc2VcbiAgICAgICAgc2hvdC5wb3NpdGlvbi5jb3B5KGNhbWVyYS5wb3NpdGlvbik7IHNob3QucXVhdGVybmlvbi5jb3B5KGNhbWVyYS5xdWF0ZXJuaW9uKVxuICAgICAgICBzaG90LnVwLmNvcHkoY2FtZXJhLnVwKTsgc2hvdC5zY2FsZS5jb3B5KGNhbWVyYS5zY2FsZSk7IHNob3QucHJvamVjdGlvbi5jb3B5KGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4KTsgc2hvdC5pbnZlcnNlUHJvamVjdGlvbi5jb3B5KGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZSlcbiAgICAgICAgc2hvdC5jdXJyZW50UG9zLmNvcHkoY3VycmVudFBvcy5jdXJyZW50KTsgc2hvdC5jdXJyZW50VGFyZ2V0LmNvcHkoY3VycmVudFRhcmdldC5jdXJyZW50KVxuICAgICAgICBzaG90LmludHJvT3J0aG8gPSBpbnRyb09ydGhvLmN1cnJlbnQ7IHNob3QucmVzdE9yYml0ID0gcmVzdE9yYml0LmN1cnJlbnRcbiAgICAgICAgaWYgKGNhbWVyYSBpbnN0YW5jZW9mIFBlcnNwZWN0aXZlQ2FtZXJhKSB7XG4gICAgICAgICAgc2hvdC5mb3YgPSBjYW1lcmEuZm92OyBzaG90Lm5lYXIgPSBjYW1lcmEubmVhcjsgc2hvdC5mYXIgPSBjYW1lcmEuZmFyOyBzaG90Lnpvb20gPSBjYW1lcmEuem9vbTsgc2hvdC5hc3BlY3QgPSBjYW1lcmEuYXNwZWN0XG4gICAgICAgICAgc2hvdC5mb2N1cyA9IGNhbWVyYS5mb2N1czsgc2hvdC5maWxtR2F1Z2UgPSBjYW1lcmEuZmlsbUdhdWdlOyBzaG90LmZpbG1PZmZzZXQgPSBjYW1lcmEuZmlsbU9mZnNldFxuICAgICAgICAgIHNob3QudmlldyA9IGNhbWVyYS52aWV3OyBzaG90LnZpZXdWYWx1ZSA9IGNhbWVyYS52aWV3ID8geyAuLi5jYW1lcmEudmlldyB9IDogbnVsbFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBjb25zdCBydW50aW1lID0gaW5zcGVjdGlvbi5ydW50aW1lXG4gICAgICBpZiAoIXJ1bnRpbWU/LmNhbWVyYS52YWxpZCkgcmV0dXJuXG4gICAgICBjb25zdCBzYW1wbGUgPSBydW50aW1lLmNhbWVyYVxuICAgICAgY29uc3QgZW50ZXIgPSBlYXNlKGluc3BlY3Rpb24uZW50cnlFbGFwc2VkIC8gMS4yKSwgYmxlbmQgPSBlbnRlciAqICgxIC0gcnVudGltZS5mcmFtZS5yZXR1cm5CbGVuZClcbiAgICAgIHNob3QubWF0cml4Lmxvb2tBdChzYW1wbGUucG9zaXRpb24sIHNhbXBsZS50YXJnZXQsIHNhbXBsZS51cClcbiAgICAgIHNob3QubWFjcm9Sb3RhdGlvbi5zZXRGcm9tUm90YXRpb25NYXRyaXgoc2hvdC5tYXRyaXgpXG4gICAgICBjYW1lcmEucG9zaXRpb24ubGVycFZlY3RvcnMoc2hvdC5wb3NpdGlvbiwgc2FtcGxlLnBvc2l0aW9uLCBibGVuZClcbiAgICAgIGNhbWVyYS5xdWF0ZXJuaW9uLnNsZXJwUXVhdGVybmlvbnMoc2hvdC5xdWF0ZXJuaW9uLCBzaG90Lm1hY3JvUm90YXRpb24sIGJsZW5kKVxuICAgICAgY2FtZXJhLnVwLmxlcnBWZWN0b3JzKHNob3QudXAsIHNhbXBsZS51cCwgYmxlbmQpLm5vcm1hbGl6ZSgpXG4gICAgICBpZiAoY2FtZXJhIGluc3RhbmNlb2YgUGVyc3BlY3RpdmVDYW1lcmEpIHsgY2FtZXJhLmZvdiA9IHNob3QuZm92ICsgKHNhbXBsZS5mb3YgLSBzaG90LmZvdikgKiBibGVuZDsgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKSB9XG4gICAgICBpZiAoYmxlbmQgPT09IDApIHsgY2FtZXJhLnByb2plY3Rpb25NYXRyaXguY29weShzaG90LnByb2plY3Rpb24pOyBjYW1lcmEucHJvamVjdGlvbk1hdHJpeEludmVyc2UuY29weShzaG90LmludmVyc2VQcm9qZWN0aW9uKSB9XG4gICAgICBjYW1lcmEudXBkYXRlTWF0cml4V29ybGQoKVxuICAgICAgdGVsZW1ldHJ5LmNhbWVyYS54ID0gY2FtZXJhLnBvc2l0aW9uLng7IHRlbGVtZXRyeS5jYW1lcmEueSA9IGNhbWVyYS5wb3NpdGlvbi55OyB0ZWxlbWV0cnkuY2FtZXJhLnogPSBjYW1lcmEucG9zaXRpb24uelxuICAgICAgdGVsZW1ldHJ5LmNhbWVyYS5mb3YgPSBjYW1lcmEgaW5zdGFuY2VvZiBQZXJzcGVjdGl2ZUNhbWVyYSA/IGNhbWVyYS5mb3YgOiBzaG90LmZvdlxuICAgICAgaW5zcGVjdGlvblRlbGVtZXRyeS5jYW1lcmFPd25lciA9ICdDYW1lcmFSaWcnXG4gICAgICBjb25zdCBwcm9iZSA9IGluc3BlY3Rpb25UZWxlbWV0cnkgYXMgdW5rbm93biBhcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPlxuICAgICAgcHJvYmUuY2FtZXJhU2FtcGxlVGltZSA9IHJ1bnRpbWUuZnJhbWUudGltZTsgcHJvYmUuY2FtZXJhU2FtcGxlU3RhbXAgPSBzdGF0ZS5jbG9jay5lbGFwc2VkVGltZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChzaG90Lm9ic2VydmUpIHtcbiAgICAgIC8vIE9ic2VydmUgdGhlIHByZXZpb3VzbHkgcmVuZGVyZWQgcmVzdG9yZSBmcmFtZSBCRUZPUkUgYW55IG5hcnJhdGl2ZSBjYW1lcmEgd3JpdGUuXG4gICAgICBzaG90Lm9ic2VydmUgPSBmYWxzZVxuICAgICAgaW5zcGVjdGlvblRlbGVtZXRyeS5yZXN0b3JlZFBvc2VFcnJvciA9IGNhbWVyYS5wb3NpdGlvbi5kaXN0YW5jZVRvKHNob3QucG9zaXRpb24pICsgY2FtZXJhLnF1YXRlcm5pb24uYW5nbGVUbyhzaG90LnF1YXRlcm5pb24pICsgY2FtZXJhLnVwLmRpc3RhbmNlVG8oc2hvdC51cCkgKyBjYW1lcmEuc2NhbGUuZGlzdGFuY2VUbyhzaG90LnNjYWxlKVxuICAgICAgbGV0IHByb2plY3Rpb25FcnJvciA9IDBcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykgcHJvamVjdGlvbkVycm9yID0gTWF0aC5tYXgocHJvamVjdGlvbkVycm9yLCBNYXRoLmFicyhjYW1lcmEucHJvamVjdGlvbk1hdHJpeC5lbGVtZW50c1tpXSAtIHNob3QucHJvamVjdGlvbi5lbGVtZW50c1tpXSksIE1hdGguYWJzKGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5lbGVtZW50c1tpXSAtIHNob3QuaW52ZXJzZVByb2plY3Rpb24uZWxlbWVudHNbaV0pKVxuICAgICAgY29uc3QgcHJvYmUgPSBpbnNwZWN0aW9uVGVsZW1ldHJ5IGFzIHVua25vd24gYXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj5cbiAgICAgIHByb2JlLnJlc3RvcmVQcm9qZWN0aW9uRXJyb3IgPSBwcm9qZWN0aW9uRXJyb3JcbiAgICAgIHByb2JlLnJlc3RvcmVTdGF0ZUVycm9yID0gY2FtZXJhIGluc3RhbmNlb2YgUGVyc3BlY3RpdmVDYW1lcmEgPyBNYXRoLmFicyhjYW1lcmEuZm92IC0gc2hvdC5mb3YpICsgTWF0aC5hYnMoY2FtZXJhLm5lYXIgLSBzaG90Lm5lYXIpICsgTWF0aC5hYnMoY2FtZXJhLmZhciAtIHNob3QuZmFyKSArIE1hdGguYWJzKGNhbWVyYS56b29tIC0gc2hvdC56b29tKSArIE1hdGguYWJzKGNhbWVyYS5hc3BlY3QgLSBzaG90LmFzcGVjdCkgKyBNYXRoLmFicyhjYW1lcmEuZm9jdXMgLSBzaG90LmZvY3VzKSArIE1hdGguYWJzKGNhbWVyYS5maWxtR2F1Z2UgLSBzaG90LmZpbG1HYXVnZSkgKyBNYXRoLmFicyhjYW1lcmEuZmlsbU9mZnNldCAtIHNob3QuZmlsbU9mZnNldCkgOiAwXG4gICAgICBwcm9iZS5yZXN0b3JlT2JzZXJ2ZWQgPSB0cnVlXG4gICAgICByZW5kZXJPd25lcnNoaXAucmVzdG9yZU9ic2VydmVkID0gdHJ1ZVxuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIGlmIChzaG90LnNhdmVkKSB7XG4gICAgICBzaG90LnNhdmVkID0gZmFsc2U7IHNob3Qub2JzZXJ2ZSA9IHRydWVcbiAgICAgIGNhbWVyYS5wb3NpdGlvbi5jb3B5KHNob3QucG9zaXRpb24pOyBjYW1lcmEucXVhdGVybmlvbi5jb3B5KHNob3QucXVhdGVybmlvbik7IGNhbWVyYS51cC5jb3B5KHNob3QudXApOyBjYW1lcmEuc2NhbGUuY29weShzaG90LnNjYWxlKVxuICAgICAgaWYgKGNhbWVyYSBpbnN0YW5jZW9mIFBlcnNwZWN0aXZlQ2FtZXJhKSB7XG4gICAgICAgIGNhbWVyYS5mb3YgPSBzaG90LmZvdjsgY2FtZXJhLm5lYXIgPSBzaG90Lm5lYXI7IGNhbWVyYS5mYXIgPSBzaG90LmZhcjsgY2FtZXJhLnpvb20gPSBzaG90Lnpvb207IGNhbWVyYS5hc3BlY3QgPSBzaG90LmFzcGVjdFxuICAgICAgICBjYW1lcmEuZm9jdXMgPSBzaG90LmZvY3VzOyBjYW1lcmEuZmlsbUdhdWdlID0gc2hvdC5maWxtR2F1Z2U7IGNhbWVyYS5maWxtT2Zmc2V0ID0gc2hvdC5maWxtT2Zmc2V0XG4gICAgICAgIGNhbWVyYS52aWV3ID0gc2hvdC52aWV3OyBpZiAoc2hvdC52aWV3ICYmIHNob3Qudmlld1ZhbHVlKSBPYmplY3QuYXNzaWduKHNob3Qudmlldywgc2hvdC52aWV3VmFsdWUpXG4gICAgICB9XG4gICAgICBjYW1lcmEucHJvamVjdGlvbk1hdHJpeC5jb3B5KHNob3QucHJvamVjdGlvbik7IGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KHNob3QuaW52ZXJzZVByb2plY3Rpb24pXG4gICAgICBjdXJyZW50UG9zLmN1cnJlbnQuY29weShzaG90LmN1cnJlbnRQb3MpOyBjdXJyZW50VGFyZ2V0LmN1cnJlbnQuY29weShzaG90LmN1cnJlbnRUYXJnZXQpXG4gICAgICBpbnRyb09ydGhvLmN1cnJlbnQgPSBzaG90LmludHJvT3J0aG87IHJlc3RPcmJpdC5jdXJyZW50ID0gc2hvdC5yZXN0T3JiaXRcbiAgICAgIGNhbWVyYS51cGRhdGVNYXRyaXhXb3JsZCgpXG4gICAgICByZXR1cm5cbiAgICB9XG4gICAgLy8gUmVkdWNlZCBtb3Rpb246IHBpbiB0aGUgY2FtZXJhIHRvIHRoZSBjaGFwdGVyLTEgaGVybyBrZXlmcmFtZSDigJQgbm9cbiAgICAvLyBzY3JvbGwgaW50ZXJwb2xhdGlvbiwgbm8gcG9pbnRlciBwYXJhbGxheCwgbm8gZGFtcGVkIGRyaWZ0LlxuICAgIGlmIChnZXRRdWFsaXR5KCkucmVkdWNlZE1vdGlvbiAmJiAhZHJhd2luZ1J1bnRpbWUucmVhZHkpIHtcbiAgICAgIGNvbnN0IGhlcm8gPSBDQU1FUkFfUEFUSFswXVxuICAgICAgY2FtZXJhLnBvc2l0aW9uLnNldChoZXJvLnBvc2l0aW9uWzBdLCBoZXJvLnBvc2l0aW9uWzFdLCBoZXJvLnBvc2l0aW9uWzJdKVxuICAgICAgY2FtZXJhLmxvb2tBdChzY3JhdGNoQS5jdXJyZW50LnNldChoZXJvLnRhcmdldFswXSwgaGVyby50YXJnZXRbMV0sIGhlcm8udGFyZ2V0WzJdKSlcbiAgICAgIGlmIChjYW1lcmEgaW5zdGFuY2VvZiBQZXJzcGVjdGl2ZUNhbWVyYSAmJiBjYW1lcmEuZm92ICE9PSBoZXJvLmZvdikge1xuICAgICAgICBjYW1lcmEuZm92ID0gaGVyby5mb3ZcbiAgICAgICAgY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKVxuICAgICAgICB0ZWxlbWV0cnkuY2FtZXJhLmZvdiA9IGNhbWVyYS5mb3ZcbiAgICAgIH1cbiAgICAgIHRlbGVtZXRyeS5jYW1lcmEueCA9IGNhbWVyYS5wb3NpdGlvbi54XG4gICAgICB0ZWxlbWV0cnkuY2FtZXJhLnkgPSBjYW1lcmEucG9zaXRpb24ueVxuICAgICAgdGVsZW1ldHJ5LmNhbWVyYS56ID0gY2FtZXJhLnBvc2l0aW9uLnpcbiAgICAgIHRlbGVtZXRyeS5jYW1lcmEuZnJhbWluZ0JpYXMgPSAwXG4gICAgICB0ZWxlbWV0cnkuY2FtZXJhLmZyYW1pbmdCaWFzWSA9IDBcbiAgICAgIHRlbGVtZXRyeS5jYW1lcmEucG9ydHJhaXREb2xseSA9IDFcbiAgICAgIHdyaXRlU2Nyb2xsVGVsZW1ldHJ5KClcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGNvbnN0IHsgaG90c3BvdElkLCB2ZWxvY2l0eSB9ID0gZ2V0U2Nyb2xsU3RhdGUoKVxuICAgIC8vIFJlZHVjZWQgbW90aW9uIHNoYXJlcyB0aGUgZHJhd2luZy9tb2RlbCdzIGZ1bGx5IGZvY3VzZWQgcmVnaXN0ZXJlZCBmcmFtZS5cbiAgICBjb25zdCBwcm9ncmVzcyA9IGdldFF1YWxpdHkoKS5yZWR1Y2VkTW90aW9uXG4gICAgICA/IERSQVdJTkdfSU5UUk9fV0lORE9XLnJlbGVhc2VFbmQgKiBSRURVQ0VEX01PVElPTl9JTlRST19UXG4gICAgICA6IGdldFNjcm9sbFN0YXRlKCkucHJvZ3Jlc3NcblxuICAgIC8vIC0tLS0gMS4gQ29udGVudC1hbGlnbmVkIGJhc2UgdHJhamVjdG9yeSAoUEFUSF9TRUdNRU5UUyB0YWJsZSkgLS0tLVxuICAgIGNvbnN0IGJhc2UgPSBiYXNlQXQocHJvZ3Jlc3MpXG4gICAgZ29hbFBvcy5jdXJyZW50LnNldChiYXNlLnBvc2l0aW9uWzBdLCBiYXNlLnBvc2l0aW9uWzFdLCBiYXNlLnBvc2l0aW9uWzJdKVxuICAgIGdvYWxUYXJnZXQuY3VycmVudC5zZXQoYmFzZS50YXJnZXRbMF0sIGJhc2UudGFyZ2V0WzFdLCBiYXNlLnRhcmdldFsyXSlcbiAgICBsZXQgZ29hbEZvdiA9IGJhc2UuZm92XG5cbiAgICAvLyAtLS0tIDIuIENSLTM6IFNoaWZ0IGdyb292ZSByZXZlYWwgJiBoYW5kbGUgb3JiaXQgc3ViLXNlcXVlbmNlIChwcm9ncmVzcyAwLjAzNSDihpIgMC4xOCkgLS0tLVxuICAgIGNvbnN0IHNoaWZ0VyA9IGJlbGxXZWlnaHQocHJvZ3Jlc3MsIHJlbWFwSGVyb1Byb2dyZXNzKDAuMDM1KSwgcmVtYXBIZXJvUHJvZ3Jlc3MoMC4wNTUpLCByZW1hcEhlcm9Qcm9ncmVzcygwLjExNSksIDAuMTgpXG4gICAgaWYgKHNoaWZ0VyA+IDAuMDAxKSB7XG4gICAgICBjb25zdCBvcmJpdFQgPSBzbW9vdGhzdGVwKE1hdGgubWluKE1hdGgubWF4KChwcm9ncmVzcyAtIHJlbWFwSGVyb1Byb2dyZXNzKDAuMDUpKSAvIChyZW1hcEhlcm9Qcm9ncmVzcygwLjEwKS1yZW1hcEhlcm9Qcm9ncmVzcygwLjA1KSksIDApLCAxKSlcbiAgICAgIGNvbnN0IGdyUG9zOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gPSBbXG4gICAgICAgIGxlcnBOKDAuMTYsIDAuMTIsIG9yYml0VCksXG4gICAgICAgIGxlcnBOKDAuMDYsIDAuMDUsIG9yYml0VCksXG4gICAgICAgIGxlcnBOKDAuMTYsIDAuMDIsIG9yYml0VCksXG4gICAgICBdXG4gICAgICBjb25zdCBnclRndDogW251bWJlciwgbnVtYmVyLCBudW1iZXJdID0gWzAsIDAuMDEyLCAwLjAyMl1cbiAgICAgIGNvbnN0IGdyRm92ID0gMjJcbiAgICAgIGdvYWxQb3MuY3VycmVudC54ID0gbGVycE4oZ29hbFBvcy5jdXJyZW50LngsIGdyUG9zWzBdLCBzaGlmdFcpXG4gICAgICBnb2FsUG9zLmN1cnJlbnQueSA9IGxlcnBOKGdvYWxQb3MuY3VycmVudC55LCBnclBvc1sxXSwgc2hpZnRXKVxuICAgICAgZ29hbFBvcy5jdXJyZW50LnogPSBsZXJwTihnb2FsUG9zLmN1cnJlbnQueiwgZ3JQb3NbMl0sIHNoaWZ0VylcbiAgICAgIGdvYWxUYXJnZXQuY3VycmVudC54ID0gbGVycE4oZ29hbFRhcmdldC5jdXJyZW50LngsIGdyVGd0WzBdLCBzaGlmdFcpXG4gICAgICBnb2FsVGFyZ2V0LmN1cnJlbnQueSA9IGxlcnBOKGdvYWxUYXJnZXQuY3VycmVudC55LCBnclRndFsxXSwgc2hpZnRXKVxuICAgICAgZ29hbFRhcmdldC5jdXJyZW50LnogPSBsZXJwTihnb2FsVGFyZ2V0LmN1cnJlbnQueiwgZ3JUZ3RbMl0sIHNoaWZ0VylcbiAgICAgIGdvYWxGb3YgPSBsZXJwTihnb2FsRm92LCBnckZvdiwgc2hpZnRXKVxuICAgIH1cblxuICAgIC8vIC0tLS0gMy4gSkctMDIxIFdTMS4zOiBFeHBsb2RlZCByZWR1Y3Rpb24tdHJhaW4gbG9va0F0IGNlbnRyb2lkIHRyYWNraW5nIC0tLS1cbiAgICAvLyBEdXJpbmcgc2VnbWVudCAwIChKR3VuIGJlYXRzLCBwcm9ncmVzcyA8PSAwLjUyNSksIHNoaWZ0IGdvYWxUYXJnZXQgdG93YXJkIHRoZVxuICAgIC8vIGV4cGxvZGVkLXRyYWluIGNlbnRyb2lkIChtaWRwb2ludCBvZiBvdXRwdXQgZmFjZSArMC4xMDJtIGFuZCBleHBsb2RlZCBoYW5kbGUgdGFpbCAtMC41ODdtLFxuICAgIC8vIHJlY2VudGVyZWQgYnkgcmlnLmNlbnRlciAtMC4wOTA2bSAtPiBjZW50cm9pZFogPSAtMC4xNTJtIGF0IGV4cGxvZGU9MSkgcm90YXRlZCBieSBoZXJvIHlhdy5cbiAgICBpZiAocHJvZ3Jlc3MgPD0gMC41MjUpIHtcbiAgICAgIC8vIHRlbGVtZXRyeS5yaWcuZXhwbG9kZUZhY3RvciBpcyB3cml0dGVuIGJ5IHRoZSBoZXJvJ3MgR1NBUCBwcm94eSBldmVyeSBmcmFtZS5cbiAgICAgIGNvbnN0IGV4cGxvZGVGYWN0b3IgPSBwcm9ncmVzcyA8PSBEUkFXSU5HX0lOVFJPX1dJTkRPVy5yZWxlYXNlRW5kID8gMCA6IHRlbGVtZXRyeS5yaWcuZXhwbG9kZUZhY3RvclxuICAgICAgaWYgKGV4cGxvZGVGYWN0b3IgPiAwLjAwMSkge1xuICAgICAgICBjb25zdCBzcGluUHJvZ3Jlc3MgPSBNYXRoLm1pbigxLCBNYXRoLm1heCgwLCAocHJvZ3Jlc3MgLSAwLjE4KSAvIDAuMTcpKVxuICAgICAgICBjb25zdCBoZXJvWWF3ID0gc3BpblByb2dyZXNzICogTWF0aC5QSSAqIDAuODVcbiAgICAgICAgY29uc3QgY2VudHJvaWRaID0gLTAuMTUyICogZXhwbG9kZUZhY3RvclxuICAgICAgICBjb25zdCBjZW50cm9pZFdvcmxkWCA9IGNlbnRyb2lkWiAqIE1hdGguc2luKGhlcm9ZYXcpXG4gICAgICAgIGNvbnN0IGNlbnRyb2lkV29ybGRaID0gY2VudHJvaWRaICogTWF0aC5jb3MoaGVyb1lhdylcbiAgICAgICAgY29uc3QgZXhwbG9kZVdlaWdodCA9IGV4cGxvZGVGYWN0b3IgKiAwLjdcbiAgICAgICAgZ29hbFRhcmdldC5jdXJyZW50LnggKz0gY2VudHJvaWRXb3JsZFggKiBleHBsb2RlV2VpZ2h0XG4gICAgICAgIGdvYWxUYXJnZXQuY3VycmVudC56ICs9IGNlbnRyb2lkV29ybGRaICogZXhwbG9kZVdlaWdodFxuICAgICAgfVxuICAgIH1cblxuICAgIC8vIC0tLS0gNC4gQ1ItNSAvIEpHLTAyMSBXUzEuMjogUG9zdC1leHBsb2RlIHJlYXIgTENEIG9yYml0IHdpdGggcnVudGltZS1kZXJpdmVkIGNvbnRpbnVpdHkgLS0tLVxuICAgIC8vIEV2YWx1YXRlcyBzdGFydCBhbmQgcmV0dXJuIGtleWZyYW1lcyBkeW5hbWljYWxseSBmcm9tIGJhc2VBdCgpIHNvIHRyYWplY3RvcnkgY29udGludWl0eVxuICAgIC8vIGlzIGd1YXJhbnRlZWQgYnkgY29uc3RydWN0aW9uIHdpdGhvdXQgaGFyZGNvZGVkIGtleWZyYW1lIHN5bmNpbmcuXG4gICAgY29uc3QgeyBzdGFydCwgZHdlbGxTdGFydCwgZHdlbGxFbmQsIGVuZCB9ID0gTENEX1JFVkVBTF9XSU5ET1dcbiAgICBpZiAocHJvZ3Jlc3MgPj0gc3RhcnQgJiYgcHJvZ3Jlc3MgPD0gZW5kKSB7XG4gICAgICBjb25zdCBvcmJpdFN0YXJ0ID0gYmFzZUF0KHN0YXJ0KVxuICAgICAgY29uc3Qgb3JiaXRSZXR1cm4gPSBiYXNlQXQoZW5kKVxuICAgICAgY29uc3Qgb3JiaXQgPSBMQ0RfT1JCSVRfS0VZRlJBTUVTXG4gICAgICBjb25zdCBtaWRBcmMgPSBzdGFydCArIChkd2VsbFN0YXJ0IC0gc3RhcnQpIC8gMlxuICAgICAgY29uc3QgYmxlbmQgPSAoZnJvbTogbnVtYmVyLCB0bzogbnVtYmVyLCBsbzogbnVtYmVyLCBoaTogbnVtYmVyKTogbnVtYmVyID0+XG4gICAgICAgIGxlcnBOKGZyb20sIHRvLCBzbW9vdGhzdGVwKE1hdGgubWluKE1hdGgubWF4KChwcm9ncmVzcyAtIGxvKSAvIChoaSAtIGxvKSwgMCksIDEpKSlcbiAgICAgIGNvbnN0IHNlZyA9IDxUIGV4dGVuZHMgcmVhZG9ubHkgbnVtYmVyW10+KGZyb206IFQsIHRvOiBULCBsbzogbnVtYmVyLCBoaTogbnVtYmVyKSA9PlxuICAgICAgICBbYmxlbmQoZnJvbVswXSwgdG9bMF0sIGxvLCBoaSksIGJsZW5kKGZyb21bMV0sIHRvWzFdLCBsbywgaGkpLCBibGVuZChmcm9tWzJdLCB0b1syXSwgbG8sIGhpKV0gYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgICBsZXQgcmVhclBvczogW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgICBsZXQgcmVhclRhcmdldDogW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgICBsZXQgcmVhckZvdjogbnVtYmVyXG4gICAgICBpZiAocHJvZ3Jlc3MgPCBtaWRBcmMpIHtcbiAgICAgICAgcmVhclBvcyA9IHNlZyhvcmJpdFN0YXJ0LnBvc2l0aW9uLCBvcmJpdC5hcmMucG9zaXRpb24sIHN0YXJ0LCBtaWRBcmMpXG4gICAgICAgIHJlYXJUYXJnZXQgPSBzZWcob3JiaXRTdGFydC50YXJnZXQsIG9yYml0LmFyYy50YXJnZXQsIHN0YXJ0LCBtaWRBcmMpXG4gICAgICAgIHJlYXJGb3YgPSBibGVuZChvcmJpdFN0YXJ0LmZvdiwgb3JiaXQuYXJjLmZvdiwgc3RhcnQsIG1pZEFyYylcbiAgICAgIH0gZWxzZSBpZiAocHJvZ3Jlc3MgPCBkd2VsbFN0YXJ0KSB7XG4gICAgICAgIHJlYXJQb3MgPSBzZWcob3JiaXQuYXJjLnBvc2l0aW9uLCBvcmJpdC5kd2VsbC5wb3NpdGlvbiwgbWlkQXJjLCBkd2VsbFN0YXJ0KVxuICAgICAgICByZWFyVGFyZ2V0ID0gc2VnKG9yYml0LmFyYy50YXJnZXQsIG9yYml0LmR3ZWxsLnRhcmdldCwgbWlkQXJjLCBkd2VsbFN0YXJ0KVxuICAgICAgICByZWFyRm92ID0gYmxlbmQob3JiaXQuYXJjLmZvdiwgb3JiaXQuZHdlbGwuZm92LCBtaWRBcmMsIGR3ZWxsU3RhcnQpXG4gICAgICB9IGVsc2UgaWYgKHByb2dyZXNzIDw9IGR3ZWxsRW5kKSB7XG4gICAgICAgIHJlYXJQb3MgPSBbLi4ub3JiaXQuZHdlbGwucG9zaXRpb25dIGFzIFtudW1iZXIsIG51bWJlciwgbnVtYmVyXVxuICAgICAgICByZWFyVGFyZ2V0ID0gWy4uLm9yYml0LmR3ZWxsLnRhcmdldF0gYXMgW251bWJlciwgbnVtYmVyLCBudW1iZXJdXG4gICAgICAgIHJlYXJGb3YgPSBvcmJpdC5kd2VsbC5mb3ZcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlYXJQb3MgPSBzZWcob3JiaXQuZHdlbGwucG9zaXRpb24sIG9yYml0UmV0dXJuLnBvc2l0aW9uLCBkd2VsbEVuZCwgZW5kKVxuICAgICAgICByZWFyVGFyZ2V0ID0gc2VnKG9yYml0LmR3ZWxsLnRhcmdldCwgb3JiaXRSZXR1cm4udGFyZ2V0LCBkd2VsbEVuZCwgZW5kKVxuICAgICAgICByZWFyRm92ID0gYmxlbmQob3JiaXQuZHdlbGwuZm92LCBvcmJpdFJldHVybi5mb3YsIGR3ZWxsRW5kLCBlbmQpXG4gICAgICB9XG4gICAgICBnb2FsUG9zLmN1cnJlbnQuc2V0KHJlYXJQb3NbMF0sIHJlYXJQb3NbMV0sIHJlYXJQb3NbMl0pXG4gICAgICBnb2FsVGFyZ2V0LmN1cnJlbnQuc2V0KHJlYXJUYXJnZXRbMF0sIHJlYXJUYXJnZXRbMV0sIHJlYXJUYXJnZXRbMl0pXG4gICAgICBnb2FsRm92ID0gcmVhckZvdlxuICAgIH1cblxuICAgIC8vIC0tLS0gNS4gQ0guMDQgTTI0OSBjb250aW51b3VzIHpvb20tb3V0IChwcm9ncmVzcyAwLjc2IOKGkiAxLjAwLCBTdGF0aW9uIDM6IFs1NiwgMCwgLTEyXSkgLS0tLVxuICAgIC8vIEpHLTAyMSByZW1lZGlhdGlvbjogb3ZlcnJpZGUgc3RhcnQgPT09IEszICh6ZXJvIGdvYWwganVtcCBhdCB0aGUgMC43NjBcbiAgICAvLyBib3VuZGFyeSDigJQgdGhlIG9sZCAwLjgyMiBtIGRhbXBlZCBqdW1wIGlzIGdvbmUpLCBkb2xseWluZyBvdXQgZnJvbSB0aGVcbiAgICAvLyB+Mi41IG0gbmVhciBwb3NlIHRvIGEgfjMuNSBtIG92ZXJ2aWV3IGFjcm9zcyBhIDAuMTggd2luZG93IHNvIHRoZSAxLjE4IG1cbiAgICAvLyByZWNlaXZlciBjbGVhcnMgdGhlIGxlZnQgQ0guMDQgY2FyZCBsYW5lIGluc3RlYWQgb2YgZmlsbGluZyAxMzElIG9mIHRoZVxuICAgIC8vIHNjcmVlbi5cbiAgICBpZiAocHJvZ3Jlc3MgPj0gMC43Nikge1xuICAgICAgY29uc3QgdDQgPSBzbW9vdGhzdGVwKE1hdGgubWluKChwcm9ncmVzcyAtIDAuNzYpIC8gMC4xOCwgMSkpXG4gICAgICBjb25zdCBtMjQ5UG9zOiBbbnVtYmVyLCBudW1iZXIsIG51bWJlcl0gPSBbXG4gICAgICAgIGxlcnBOKDU2LjQzLCA1Ni42LCB0NCksXG4gICAgICAgIGxlcnBOKDAuNjUsIDAuOSwgdDQpLFxuICAgICAgICBsZXJwTigtOS42MiwgLTguNjcsIHQ0KSxcbiAgICAgIF1cbiAgICAgIGNvbnN0IG0yNDlUZ3Q6IFtudW1iZXIsIG51bWJlciwgbnVtYmVyXSA9IFs1NiwgMCwgLTEyXVxuICAgICAgY29uc3QgbTI0OUZvdiA9IGxlcnBOKDM1LCAzOCwgdDQpXG4gICAgICBnb2FsUG9zLmN1cnJlbnQuc2V0KG0yNDlQb3NbMF0sIG0yNDlQb3NbMV0sIG0yNDlQb3NbMl0pXG4gICAgICBnb2FsVGFyZ2V0LmN1cnJlbnQuc2V0KG0yNDlUZ3RbMF0sIG0yNDlUZ3RbMV0sIG0yNDlUZ3RbMl0pXG4gICAgICBnb2FsRm92ID0gbTI0OUZvdlxuICAgIH1cblxuICAgIC8vIC0tLS0gNi4gQ2xpY2stdG8tSW5zcGVjdCBTdWJhc3NlbWJseSBGb2N1cyAtLS0tXG4gICAgY29uc3QgaW5MY2RXaW5kb3cgPVxuICAgICAgcHJvZ3Jlc3MgPj0gTENEX1JFVkVBTF9XSU5ET1cuc3RhcnQgJiYgcHJvZ3Jlc3MgPD0gTENEX1JFVkVBTF9XSU5ET1cuZW5kXG4gICAgY29uc3QgaW5zcGVjdEZyYW1lID1cbiAgICAgIGhvdHNwb3RJZCAmJiAhKGhvdHNwb3RJZCA9PT0gJ2xjZCcgJiYgaW5MY2RXaW5kb3cpXG4gICAgICAgID8gSE9UU1BPVF9JTlNQRUNUX0ZSQU1FU1tob3RzcG90SWRdXG4gICAgICAgIDogbnVsbFxuICAgIGlmIChpbnNwZWN0RnJhbWUpIHtcbiAgICAgIGNvbnN0IGV4cGxvZGUgPSB0ZWxlbWV0cnkucmlnLmV4cGxvZGVGYWN0b3JcbiAgICAgIGNvbnN0IGlzU3RhdGlvbjFIYW5kbGUgPVxuICAgICAgICBob3RzcG90SWQgPT09ICdyb3RvcicgfHxcbiAgICAgICAgaG90c3BvdElkID09PSAnbW90b3ItaG91c2luZycgfHxcbiAgICAgICAgaG90c3BvdElkID09PSAnZmxhbmdlJyB8fFxuICAgICAgICBob3RzcG90SWQgPT09ICdtY3UnIHx8XG4gICAgICAgIGhvdHNwb3RJZCA9PT0gJ2xjZCcgfHxcbiAgICAgICAgaG90c3BvdElkID09PSAnbGlwbydcbiAgICAgIGNvbnN0IG9mZnNldFogPSBpc1N0YXRpb24xSGFuZGxlID8gRVhQTE9ERV9PRkZTRVRTLmhhbmRsZSAqIGV4cGxvZGUgOiAwXG5cbiAgICAgIGdvYWxQb3MuY3VycmVudC5zZXQoXG4gICAgICAgIGluc3BlY3RGcmFtZS5wb3NpdGlvblswXSxcbiAgICAgICAgaW5zcGVjdEZyYW1lLnBvc2l0aW9uWzFdLFxuICAgICAgICBpbnNwZWN0RnJhbWUucG9zaXRpb25bMl0gKyBvZmZzZXRaLFxuICAgICAgKVxuICAgICAgZ29hbFRhcmdldC5jdXJyZW50LnNldChcbiAgICAgICAgaW5zcGVjdEZyYW1lLnRhcmdldFswXSxcbiAgICAgICAgaW5zcGVjdEZyYW1lLnRhcmdldFsxXSxcbiAgICAgICAgaW5zcGVjdEZyYW1lLnRhcmdldFsyXSArIG9mZnNldFosXG4gICAgICApXG4gICAgICBnb2FsRm92ID0gaW5zcGVjdEZyYW1lLmZvdlxuICAgIH1cblxuICAgIC8vIC0tLS0gNi41IFBvcnRyYWl0LXZpZXdwb3J0IGNvbXBvc2l0aW9uIChKRy0wMjEgcmVtZWRpYXRpb24pIC0tLS1cbiAgICAvLyBPbiBuYXJyb3cgcG9ydHJhaXQgdmlld3BvcnRzIChhc3BlY3QgPCAwLjkpIHRoZSBnbGFzcyBjYXJkcyBzcGFuIH45MCUgb2ZcbiAgICAvLyB0aGUgd2lkdGgsIHNvIG5vIGhvcml6b250YWwgbGFuZSBleGlzdHMuIFdoaWxlIHRoZSBjYW1lcmEgaXMgYXQgdGhlXG4gICAgLy8gc3RhdGlvbnMgKHAgPj0gMC41MDsgcmFtcHMgaW4gb3ZlciAwLjA2IHNvIHRoZSBDSC4wMS8wMiBoZXJvIGZyYW1pbmcgaXNcbiAgICAvLyB1bnRvdWNoZWQpLCBkb2xseSB0aGUgZ29hbCBvdXQgYWxvbmcgaXRzIHZpZXcgYXhpcyBhbmQgd2lkZW4gdGhlIEZPViBzb1xuICAgIC8vIHRoZSBzdWJqZWN0IGZpdHMgdGhlIG5hcnJvdyBmcmFtZSBhdCBhbGw7IHRoZSB2ZXJ0aWNhbCBiaWFzIGJlbG93IHRoZW5cbiAgICAvLyBjb21wb3NlcyBpdCBpbnRvIHRoZSBmcmVlIGJhbmQgYWJvdmUgdGhlIGNhcmQuIENILjA0IGRlZXBlbnMgdGhlIGRvbGx5XG4gICAgLy8gcHJvZ3Jlc3NpdmVseSAoeDIuMCAtPiB4Mi44KSBiZWNhdXNlIGl0cyBkZXNrdG9wIHpvb20gcGF0aCBzdGFydHMgYXQgYVxuICAgIC8vIDEuNTUgbSBuZWFyIHBvc2UgdGhhdCBzdGF5cyB0b28gY2xvc2UgZm9yIHBvcnRyYWl0IGV2ZW4gYXQgeDIuXG4gICAgY29uc3QgYXNwZWN0ID0gc3RhdGUuc2l6ZS53aWR0aCAvIE1hdGgubWF4KHN0YXRlLnNpemUuaGVpZ2h0LCAxKVxuICAgIGNvbnN0IHBvcnRyYWl0ID0gYXNwZWN0IDwgMC45XG4gICAgbGV0IHBvcnRyYWl0RG9sbHkgPSAxXG4gICAgaWYgKHBvcnRyYWl0KSB7XG4gICAgICBjb25zdCB3ID0gc21vb3Roc3RlcChNYXRoLm1pbihNYXRoLm1heCgocHJvZ3Jlc3MgLSAwLjUpIC8gMC4wNiwgMCksIDEpKVxuICAgICAgY29uc3QgY2g0ID0gcHJvZ3Jlc3MgPj0gMC43NiA/IHNtb290aHN0ZXAoTWF0aC5taW4oKHByb2dyZXNzIC0gMC43NikgLyAwLjI0LCAxKSkgOiAwXG4gICAgICBwb3J0cmFpdERvbGx5ID0gMSArIHcgKiAoMS4wICsgMC44ICogY2g0KVxuICAgICAgZ29hbEZvdiArPSAxMCAqIHdcbiAgICAgIGlmIChwb3J0cmFpdERvbGx5ID4gMSkge1xuICAgICAgICBnb2FsUG9zLmN1cnJlbnQuc3ViKGdvYWxUYXJnZXQuY3VycmVudCkubXVsdGlwbHlTY2FsYXIocG9ydHJhaXREb2xseSkuYWRkKGdvYWxUYXJnZXQuY3VycmVudClcbiAgICAgIH1cbiAgICB9XG4gICAgdGVsZW1ldHJ5LmNhbWVyYS5wb3J0cmFpdERvbGx5ID0gcG9ydHJhaXREb2xseVxuXG4gICAgLy8gLS0tLSA3LiBKRy0wMjEgV1MxLjQgKHJlbWVkaWF0ZWQpOiBmcmFtaW5nIGJpYXMgYWxvbmcgVFJVRSBjYW1lcmEtbGVmdCAtLS0tXG4gICAgLy8gU2hpZnRzIGdvYWxUYXJnZXQgYWxvbmcgY2FtZXJhLUxFRlQgc28gdGhlIGNhbWVyYSBwYW5zIGxlZnQgYW5kIHRoZVxuICAgIC8vIFNVQkpFQ1QgcmVuZGVycyBzY3JlZW4tcmlnaHQgKE5EQy14IOKJiCArYmlhcyksIGNsZWFyIG9mIHRoZSBsZWZ0IG5hcnJhdGl2ZVxuICAgIC8vIHRleHQgbGFuZS4gVGhlIG9yaWdpbmFsIGltcGxlbWVudGF0aW9uIGNvbXB1dGVkIChmd2QueiwgMCwgLWZ3ZC54KSBhbmRcbiAgICAvLyBzdWJ0cmFjdGVkIGl0IOKAlCB0aGF0IHZlY3RvciBpcyB1cCDDlyBmd2QgPSBjYW1lcmEtTEVGVCBpbiB0aHJlZS5qcydcbiAgICAvLyByaWdodC1oYW5kZWQgY29udmVudGlvbiwgc28gdGhlIG5ldCBzaGlmdCByYW4gY2FtZXJhLVJJR0hUIGFuZCBwdXNoZWQgdGhlXG4gICAgLy8gc3ViamVjdCBVTkRFUiB0aGUgY2FyZCAob3duZXIgdmlzdWFsIHBhc3MgZmFpbCAjMSkuIFBvcnRyYWl0IHZpZXdwb3J0c1xuICAgIC8vIGJpYXMgdmVydGljYWxseSBpbnN0ZWFkOiB0aGUgdGFyZ2V0IGRyb3BzICh3b3JsZCAtWSkgc28gdGhlIHN1YmplY3QgcmlzZXNcbiAgICAvLyBpbnRvIHRoZSBiYW5kIGFib3ZlIHRoZSBmdWxsLXdpZHRoIG1vYmlsZSBjYXJkLlxuICAgIGNvbnN0IGJpYXNWZWMgPSBmcmFtaW5nQmlhc1ZlYyhwcm9ncmVzcylcbiAgICAvLyBBdHRlbnVhdGUgdGhlIGhvcml6b250YWwgYmlhcyBkdXJpbmcgdGhlIHB1cmUgd2hpcC1mbGlnaHQgdHJhbnNpdHM6IHRoZVxuICAgIC8vIHN1YmplY3QgaXMgbWlkLXN3ZWVwIHRoZXJlIGFuZCB0aGUgbGFuZSBvbmx5IG1hdHRlcnMgb25jZSB0aGUgY2FtZXJhXG4gICAgLy8gc2V0dGxlcyAocmVtZWRpYXRpb24gZm9yIHRoZSBcIm9mZi1zY3JlZW4gcmlnaHQgYXQgNTglXCIgdHJhbnNpdCBmaW5kaW5nKS5cbiAgICBjb25zdCBhdHQgPSAobG86IG51bWJlciwgaGk6IG51bWJlcik6IG51bWJlciA9PlxuICAgICAgTWF0aC5taW4oTWF0aC5tYXgoKHByb2dyZXNzIC0gbG8pIC8gMC4wMTUsIDApLCBNYXRoLm1heCgoaGkgLSBwcm9ncmVzcykgLyAwLjAxNSwgMCksIDEpXG4gICAgY29uc3QgZmxpZ2h0VyA9IE1hdGgubWF4KGF0dCgwLjUzLCAwLjU5OCksIGF0dCgwLjcyMiwgMC43NTgpKVxuICAgIGNvbnN0IGZsaWdodEF0dCA9IDEgLSAwLjc1ICogZmxpZ2h0V1xuICAgIC8vIENhcmQtYXZvaWRhbmNlIGZyYW1pbmcgYmlhcyBiZWxvbmdzIHRvIHRoZSBjaGFwdGVyIGNhcmRzOyBob2xkIGl0IG9mZiB1bnRpbCB0aGVcbiAgICAvLyBkcmF3aW5nIGhhcyBoYW5kZWQgb2ZmLCBvdGhlcndpc2UgdGhlIHNoZWV0IGlzIG51ZGdlZCBvZmYtY2VudHJlIGZvciBubyByZWFzb24uXG4gICAgY29uc3QgYWZ0ZXJJbnRybyA9IHNtb290aDAxKChwcm9ncmVzcyAtIERSQVdJTkdfSU5UUk9fV0lORE9XLnJlbGVhc2VFbmQpIC8gMC4wMylcbiAgICBjb25zdCBiaWFzWCA9IChwb3J0cmFpdCA/IGJpYXNWZWMueCAqIDAuMjUgKiBmbGlnaHRBdHQgOiBiaWFzVmVjLnggKiBmbGlnaHRBdHQpICogYWZ0ZXJJbnRyb1xuICAgIGNvbnN0IGJpYXNZID0gKHBvcnRyYWl0ID8gYmlhc1ZlYy55IDogMCkgKiBhZnRlckludHJvXG4gICAgdGVsZW1ldHJ5LmNhbWVyYS5mcmFtaW5nQmlhcyA9IGJpYXNYXG4gICAgdGVsZW1ldHJ5LmNhbWVyYS5mcmFtaW5nQmlhc1kgPSBiaWFzWVxuXG4gICAgaWYgKGJpYXNYID4gMC4wMDAxIHx8IGJpYXNZID4gMC4wMDAxKSB7XG4gICAgICBzY3JhdGNoRndkLmN1cnJlbnQuc3ViVmVjdG9ycyhnb2FsVGFyZ2V0LmN1cnJlbnQsIGdvYWxQb3MuY3VycmVudClcbiAgICAgIGNvbnN0IGRpc3QgPSBzY3JhdGNoRndkLmN1cnJlbnQubGVuZ3RoKClcbiAgICAgIGlmIChkaXN0ID4gMC4wMDAxKSB7XG4gICAgICAgIGNvbnN0IGZvdlJhZCA9IChnb2FsRm92ICogTWF0aC5QSSkgLyAxODBcbiAgICAgICAgaWYgKGJpYXNYID4gMC4wMDAxKSB7XG4gICAgICAgICAgc2NyYXRjaEZ3ZC5jdXJyZW50Lm11bHRpcGx5U2NhbGFyKDEgLyBkaXN0KVxuICAgICAgICAgIC8vIENhbWVyYS1MRUZUID0gdXAgw5cgZndkID0gKGZ3ZC56LCAwLCAtZndkLngpIG5vcm1hbGl6ZWQuXG4gICAgICAgICAgc2NyYXRjaFJpZ2h0LmN1cnJlbnQuc2V0KFxuICAgICAgICAgICAgc2NyYXRjaEZ3ZC5jdXJyZW50LnosXG4gICAgICAgICAgICAwLFxuICAgICAgICAgICAgLXNjcmF0Y2hGd2QuY3VycmVudC54LFxuICAgICAgICAgIClcbiAgICAgICAgICBjb25zdCBsZWZ0TGVuID0gc2NyYXRjaFJpZ2h0LmN1cnJlbnQubGVuZ3RoKClcbiAgICAgICAgICBpZiAobGVmdExlbiA+IDAuMDAwMSkge1xuICAgICAgICAgICAgc2NyYXRjaFJpZ2h0LmN1cnJlbnQubXVsdGlwbHlTY2FsYXIoMSAvIGxlZnRMZW4pXG4gICAgICAgICAgICBjb25zdCBiaWFzTWV0ZXJzID0gYmlhc1ggKiBkaXN0ICogTWF0aC50YW4oZm92UmFkIC8gMikgKiBhc3BlY3RcbiAgICAgICAgICAgIGdvYWxUYXJnZXQuY3VycmVudC5hZGRTY2FsZWRWZWN0b3Ioc2NyYXRjaFJpZ2h0LmN1cnJlbnQsIGJpYXNNZXRlcnMpXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChiaWFzWSA+IDAuMDAwMSkge1xuICAgICAgICAgIC8vIFZlcnRpY2FsIE5EQyBuZWVkcyBubyBhc3BlY3QgZmFjdG9yOyB0YXJnZXQgRE9XTiA9IHN1YmplY3QgVVAuXG4gICAgICAgICAgY29uc3QgYmlhc01ldGVyc1kgPSBiaWFzWSAqIGRpc3QgKiBNYXRoLnRhbihmb3ZSYWQgLyAyKVxuICAgICAgICAgIGdvYWxUYXJnZXQuY3VycmVudC55IC09IGJpYXNNZXRlcnNZXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAtLS0tIDYuIEIxL0IyIGludHJvOiB0aGUgZHJhd2luZyBvd25zIHRoZSBmcmFtZSB1cCB0byB0aGUgaGFuZG9mZiAtLS0tXG4gICAgLy8gVGhlIGludHJvIHBvc2UgaXMgYXV0aG9yZWQgb3ZlciB0aGUgc2hlZXQgKHNoZWV0Q2FtZXJhKSBhbmQgYmxlbmRlZCBpbnRvIHdoYXRldmVyIHRoZVxuICAgIC8vIG1haW4gdHJhamVjdG9yeSBhbHJlYWR5IHdhbnRzLCBzbyB0aGUgbGFzdCBpbnRybyBmcmFtZSBhbmQgdGhlIGZpcnN0IENILjAxIGZyYW1lIGFyZVxuICAgIC8vIHRoZSBzYW1lIGNhbWVyYS4gYHBlcnNwZWN0aXZlYCBhbHNvIGNhcnJpZXMgdGhlIHJvbGw6IHRoZSB1cCB2ZWN0b3Igc3RhcnRzIG9uIHRoZVxuICAgIC8vIHNoZWV0J3MgcHJpbnRlZC11cCBheGlzICh3b3JsZCAtWCkgc28gdGhlIHByaW50IHJlYWRzIHJpZ2h0LXdheS11cCBmcm9tIHRoZSBtb21lbnQgaXRcbiAgICAvLyBhcHBlYXJzIHVudGlsIHRoZSBtb2RlbCBoYXMgbGVmdCBpdCwgYW5kIGZpbmlzaGVzIG9uIHdvcmxkIHVwIGZvciBDSC4wMS5cbiAgICBjb25zdCBsYXlvdXQgPSBkcmF3aW5nUnVudGltZS5sYXlvdXRcbiAgICBjb25zdCByZWR1Y2VkTW90aW9uID0gZ2V0UXVhbGl0eSgpLnJlZHVjZWRNb3Rpb25cbiAgICBjb25zdCBpbnRybyA9IGRyYXdpbmdJbnRyb1N0YXRlKHByb2dyZXNzLCBkcmF3aW5nUnVudGltZS5leHRyYWN0aW9uPy5jcm9zc2luZylcbiAgICBjb25zdCBpbnRyb0FjdGl2ZSA9IHByb2dyZXNzIDw9IERSQVdJTkdfSU5UUk9fV0lORE9XLnJlbGVhc2VFbmQgJiYgbGF5b3V0ICE9PSBudWxsXG4gICAgY29uc3QgaW50cm9CbGVuZCA9IGludHJvQWN0aXZlID8gKHJlZHVjZWRNb3Rpb24gPyAwIDogaW50cm8ucGVyc3BlY3RpdmUpIDogMVxuICAgIGlmIChpbnRyb0FjdGl2ZSAmJiBsYXlvdXQpIHtcbiAgICAgIGNvbnN0IHBvc2UgPSBpbnRyb0NhbWVyYVBvc2UobGF5b3V0LCBhc3BlY3QsIHJlZHVjZWRNb3Rpb24gPyBSRURVQ0VEX01PVElPTl9JTlRST19UIDogaW50cm8udCwgaW50cm9Qb3NlLmN1cnJlbnQpXG4gICAgICB0ZWxlbWV0cnkuY2FtZXJhLnNoZWV0RGlzdGFuY2UgPSBwb3NlLmRpc3RhbmNlXG4gICAgICBnb2FsUG9zLmN1cnJlbnQubGVycFZlY3RvcnMocG9zZS5wb3NpdGlvbiwgZ29hbFBvcy5jdXJyZW50LCBpbnRyb0JsZW5kKVxuICAgICAgZ29hbFRhcmdldC5jdXJyZW50LmxlcnBWZWN0b3JzKHBvc2UudGFyZ2V0LCBnb2FsVGFyZ2V0LmN1cnJlbnQsIGludHJvQmxlbmQpXG4gICAgICBnb2FsRm92ID0gcG9zZS5mb3YgKyAoZ29hbEZvdiAtIHBvc2UuZm92KSAqIGludHJvQmxlbmRcbiAgICAgIGludHJvT3J0aG8uY3VycmVudCA9IHBvc2Uub3J0aG8gKiAoMSAtIGludHJvQmxlbmQpXG4gICAgICBjYW1lcmEudXBcbiAgICAgICAgLnNldChcbiAgICAgICAgICBwb3NlLnVwLnggKiAoMSAtIGludHJvQmxlbmQpLFxuICAgICAgICAgIHBvc2UudXAueSAqICgxIC0gaW50cm9CbGVuZCkgKyBpbnRyb0JsZW5kLFxuICAgICAgICAgIHBvc2UudXAueiAqICgxIC0gaW50cm9CbGVuZCksXG4gICAgICAgIClcbiAgICAgICAgLm5vcm1hbGl6ZSgpXG4gICAgfSBlbHNlIHtcbiAgICAgIGludHJvT3J0aG8uY3VycmVudCA9IDBcbiAgICAgIGNhbWVyYS51cC5zZXQoMCwgMSwgMClcbiAgICAgIHRlbGVtZXRyeS5jYW1lcmEuc2hlZXREaXN0YW5jZSA9IDBcbiAgICB9XG5cbiAgICAvLyBIb3ZlciBwYXJhbGxheCBvbiB0aGUgY2FtZXJhIGl0c2VsZiAodGhlIGhlcm8gYWRkcyBpdHMgb3duIG9iamVjdC1zcGFjZSBwYXJhbGxheCkuXG4gICAgLy8gU3VwcHJlc3NlZCB3aGlsZSB0aGUgc2hlZXQgaXMgYmVpbmcgcmVhZCDigJQgYSBkcmlmdGluZyBjYW1lcmEgb3ZlciBhIGZsYXQgcHJpbnQgcmVhZHNcbiAgICAvLyBhcyBhIHdvYmJsZSwgbm90IGFzIGRlcHRoLlxuICAgIGNvbnN0IHBhcmFsbGF4ID0gaW50cm9BY3RpdmUgPyAwIDogMVxuICAgIGdvYWxQb3MuY3VycmVudC54ICs9IHN0YXRlLnBvaW50ZXIueCAqIDAuMDMgKiBwYXJhbGxheFxuICAgIGdvYWxQb3MuY3VycmVudC55ICs9IHN0YXRlLnBvaW50ZXIueSAqIDAuMDIgKiBwYXJhbGxheFxuXG4gICAgLy8gRXhjaXRhdGlvbiByZW1haW5zIHJlZ2lzdGVyZWQ6IG5vIGZyYW1lLWNvdW50ZWQgY2FtZXJhIHNoYWtlIGR1cmluZyB0aGUgcHJpbnQgaG9sZC5cblxuICAgIC8vIEIyIGdhcm5pc2ggIzE3OiBhdCBzY3JvbGwgcmVzdCBvbmx5LCBvcmJpdCB0aGUgc2V0dGxlZCBKR3VuIHZpZXcgYXRcbiAgICAvLyAwLjPCsC9zLiBUaGlzIHN0YXlzIG91dHNpZGUgdGhlIGRyYXdpbmcgaGFuZG9mZiBhbmQgcmVkdWNlZC1tb3Rpb24gcGF0aC5cbiAgICBpZiAoXG4gICAgICBNYXRoLmFicyh2ZWxvY2l0eSkgPCAwLjAwMSAmJlxuICAgICAgcHJvZ3Jlc3MgPiBEUkFXSU5HX0lOVFJPX1dJTkRPVy5yZWxlYXNlRW5kICYmXG4gICAgICBwcm9ncmVzcyA8IDAuNTQ1XG4gICAgKSB7XG4gICAgICByZXN0T3JiaXQuY3VycmVudCArPSBkZWx0YSAqICgoMC4zICogTWF0aC5QSSkgLyAxODApXG4gICAgICBnb2FsUG9zLmN1cnJlbnQueCArPSBNYXRoLnNpbihyZXN0T3JiaXQuY3VycmVudCkgKiAwLjAwM1xuICAgICAgZ29hbFBvcy5jdXJyZW50LnogKz0gKE1hdGguY29zKHJlc3RPcmJpdC5jdXJyZW50KSAtIDEpICogMC4wMDNcbiAgICB9XG5cbiAgICAvLyBFeHBvbmVudGlhbCBkYW1waW5nIHdpdGggY2xhbXAgdG8gcHJldmVudCBvdmVyc2hvb3Qgb24gZnJhbWUgZHJvcHNcbiAgICBjb25zdCBzYWZlRGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC4xKVxuICAgIGNvbnN0IGRhbXAgPSAxIC0gTWF0aC5leHAoLTYgKiBzYWZlRGVsdGEpXG4gICAgY3VycmVudFBvcy5jdXJyZW50LmxlcnAoZ29hbFBvcy5jdXJyZW50LCBkYW1wKVxuICAgIGN1cnJlbnRUYXJnZXQuY3VycmVudC5sZXJwKGdvYWxUYXJnZXQuY3VycmVudCwgZGFtcClcblxuICAgIGNhbWVyYS5wb3NpdGlvbi5jb3B5KGN1cnJlbnRQb3MuY3VycmVudClcbiAgICBjYW1lcmEubG9va0F0KGN1cnJlbnRUYXJnZXQuY3VycmVudClcbiAgICBpZiAoY2FtZXJhIGluc3RhbmNlb2YgUGVyc3BlY3RpdmVDYW1lcmEpIHtcbiAgICAgIGNhbWVyYS5mb3YgKz0gKGdvYWxGb3YgLSBjYW1lcmEuZm92KSAqIGRhbXBcbiAgICAgIGNhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KClcbiAgICAgIC8vIFdoaWxlIHRoZSBzaGVldCBpcyB0aGUgc3ViamVjdCB0aGUgcHJvamVjdGlvbiBpcyBibGVuZGVkIHRvd2FyZCBhIHRydWUgb3J0aG9ncmFwaGljXG4gICAgICAvLyBtYXRyaXgsIHdoaWNoIGlzIHdoYXQgbWFrZXMgdGhlIHByaW50IHJlZ2lzdGVyIHRvIHRoZSBtb2RlbCdzIG93biBwcm9qZWN0aW9uIHJhdGhlclxuICAgICAgLy8gdGhhbiB0byBhIHBlcnNwZWN0aXZlIGFwcHJveGltYXRpb24gb2YgaXQuXG4gICAgICAvLyBUaGUgb3J0aG8gZnJ1c3R1bSBpcyBzaXplZCB0byB0aGUgcGVyc3BlY3RpdmUgb25lIEFUIHRoZSBsb29rLWF0IGRpc3RhbmNlLCBzbyB0aGUgYmxlbmRcbiAgICAgIC8vIGNoYW5nZXMgcGFyYWxsYXggb25seSwgbmV2ZXIgZnJhbWluZy5cbiAgICAgIGNvbnN0IG9ydGhvID0gaW50cm9PcnRoby5jdXJyZW50XG4gICAgICBpZiAoaW50cm9BY3RpdmUgJiYgbGF5b3V0ICYmIG9ydGhvID4gMWUtNCkge1xuICAgICAgICBjb25zdCBkaXN0YW5jZSA9IGN1cnJlbnRQb3MuY3VycmVudC5kaXN0YW5jZVRvKGN1cnJlbnRUYXJnZXQuY3VycmVudClcbiAgICAgICAgY29uc3QgaGFsZiA9IGRpc3RhbmNlICogTWF0aC50YW4oKGNhbWVyYS5mb3YgKiBNYXRoLlBJKSAvIDM2MClcbiAgICAgICAgb3J0aG9ncmFwaGljLmN1cnJlbnQubWFrZU9ydGhvZ3JhcGhpYyhcbiAgICAgICAgICAtaGFsZiAqIGFzcGVjdCxcbiAgICAgICAgICBoYWxmICogYXNwZWN0LFxuICAgICAgICAgIGhhbGYsXG4gICAgICAgICAgLWhhbGYsXG4gICAgICAgICAgY2FtZXJhLm5lYXIsXG4gICAgICAgICAgY2FtZXJhLmZhcixcbiAgICAgICAgKVxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpICs9IDEpIHtcbiAgICAgICAgICBjYW1lcmEucHJvamVjdGlvbk1hdHJpeC5lbGVtZW50c1tpXSA9XG4gICAgICAgICAgICBvcnRob2dyYXBoaWMuY3VycmVudC5lbGVtZW50c1tpXSAqIGRpc3RhbmNlICogb3J0aG8gK1xuICAgICAgICAgICAgY2FtZXJhLnByb2plY3Rpb25NYXRyaXguZWxlbWVudHNbaV0gKiAoMSAtIG9ydGhvKVxuICAgICAgICB9XG4gICAgICAgIGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4SW52ZXJzZS5jb3B5KGNhbWVyYS5wcm9qZWN0aW9uTWF0cml4KS5pbnZlcnQoKVxuICAgICAgfVxuICAgICAgdGVsZW1ldHJ5LmNhbWVyYS5mb3YgPSBjYW1lcmEuZm92XG4gICAgfVxuXG4gICAgdGVsZW1ldHJ5LmNhbWVyYS54ID0gY2FtZXJhLnBvc2l0aW9uLnhcbiAgICB0ZWxlbWV0cnkuY2FtZXJhLnkgPSBjYW1lcmEucG9zaXRpb24ueVxuICAgIHRlbGVtZXRyeS5jYW1lcmEueiA9IGNhbWVyYS5wb3NpdGlvbi56XG4gICAgLy8gUHJlYWxsb2NhdGVkIGdvYWwgcmVhZG91dCDigJQgbm8gcGVyLWZyYW1lIG9iamVjdCBvciBhcnJheSBhbGxvY2F0aW9uIChyZXBvIHJ1bGUpLlxuICAgIHRlbGVtZXRyeS5jYW1lcmEuZ29hbC5wb3NpdGlvblswXSA9IGdvYWxQb3MuY3VycmVudC54XG4gICAgdGVsZW1ldHJ5LmNhbWVyYS5nb2FsLnBvc2l0aW9uWzFdID0gZ29hbFBvcy5jdXJyZW50LnlcbiAgICB0ZWxlbWV0cnkuY2FtZXJhLmdvYWwucG9zaXRpb25bMl0gPSBnb2FsUG9zLmN1cnJlbnQuelxuICAgIHRlbGVtZXRyeS5jYW1lcmEuZ29hbC50YXJnZXRbMF0gPSBnb2FsVGFyZ2V0LmN1cnJlbnQueFxuICAgIHRlbGVtZXRyeS5jYW1lcmEuZ29hbC50YXJnZXRbMV0gPSBnb2FsVGFyZ2V0LmN1cnJlbnQueVxuICAgIHRlbGVtZXRyeS5jYW1lcmEuZ29hbC50YXJnZXRbMl0gPSBnb2FsVGFyZ2V0LmN1cnJlbnQuelxuICAgIHRlbGVtZXRyeS5jYW1lcmEuZ29hbC5mb3YgPSBnb2FsRm92XG4gICAgdGVsZW1ldHJ5LmNhbWVyYS51cFswXSA9IGNhbWVyYS51cC54XG4gICAgdGVsZW1ldHJ5LmNhbWVyYS51cFsxXSA9IGNhbWVyYS51cC55XG4gICAgdGVsZW1ldHJ5LmNhbWVyYS51cFsyXSA9IGNhbWVyYS51cC56XG4gICAgY2FtZXJhLnVwZGF0ZU1hdHJpeFdvcmxkKClcbiAgICB3cml0ZVNjcm9sbFRlbGVtZXRyeSgpXG4gIH0pXG5cbiAgcmV0dXJuIG51bGxcbn1cblxuIl0sImZpbGUiOiJDOi9Vc2Vycy9NYXJraW11cy8uYnV6ei9SRVBPUy9qZ3VuLXBvcnRmb2xpby9zcmMvc2NlbmUvQ2FtZXJhUmlnLnRzeCJ9