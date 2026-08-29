# TASK SPECIFICATION: Multi-Station WebGL Experience & GD&T Scrollytelling Architecture

> **TRIAGED 2026-08-28: SUPERSEDED — do not implement from this document.**
> Every capability described here (multi-station world at `[0,0,0]` / `[28,0,-6]` / `[56,0,-12]`, datum leader lines, whip-pan post-processing, wheel-release inspection, kinematic idling, airflow/acoustic interaction) was implemented and telemetry-verified as **JG-014, JG-016, JG-017, JG-018, and JG-020** — see [`../INDEX.md`](../INDEX.md) for plans and evidence. The sample code below predates the real CAD rig and does not match measured reality (animation-spec §5 wins over any numbers here). Retained for history only.


## 1. Executive Summary & Core Objectives
Upgrade the existing React 19 / React Three Fiber (R3F) / GSAP / Lenis portfolio application into a seamless multi-station 3D world representing three distinct engineering milestones.

### Key Problems Resolved:
1. **Viewport & Typography Collision:** Chapter headings, specs, and HUD telemetry currently render simultaneously and collide over the 3D model. All chapter copy must be partitioned to a left-side 5-column grid (`max-width: 42%`) with strict GSAP scroll-range opacity clamping.
2. **Datum Anchoring & Screen-Space Leader Lines:** Replace static/desynced HTML overlays with dynamic 3D datum trackers that project from live mesh world coordinates and render responsive SVG leader lines.
3. **Multi-Station Spatial World:** Rather than in-place mesh swapping, build a spatial world with three discrete 3D stations traversed via accelerated kinetic whip-pan camera dollying:
   - **Station 1 (`[0, 0, 0]`):** JGUN-D1-AP Multi-Stage Planetary Torque Multiplier.
   - **Station 2 (`[28, 0, -6]`):** RL-300 Industrial Pump with 5-Layer Acoustic SAFE Enclosure Skid.
   - **Station 3 (`[56, 0, -12]`):** M249 / MK46 Scan-to-Parametric Reverse-Engineered Receiver Platform.
4. **Subassembly Inspection UX (Continuous Scroll Flow):** Allow users to click individual exploded components to zoom in for detailed inspection. The interface MUST NOT trap the user behind a mandatory exit button; any mouse-wheel scroll (`wheel` event) or touch drag must smoothly release focus and resume the master scroll path.
5. **Kinematic Idling:** The multi-stage planetary gear train must maintain continuous kinematic rotation around sun/planet pitch circles during scroll pauses.
6. **Mouse-Reactive Volumetric CFM Airflow & Acoustic Waves:** Station 2 features GPU-instanced velocity particles that deflect away from the user's cursor within the acoustic duct labyrinth, flanked by pulsing acoustic wave dissipation rings.
7. **Velocity-Driven Whip-Pan Post-Processing:** High-speed camera dollying between stations triggers dynamic directional chromatic aberration and bloom bursts proportional to instantaneous camera velocity.

---

## 2. File Tree Architecture
```
src/
├── components/
│   ├── layout/
│   │   ├── ChapterManager.tsx
│   │   └── HUDOverlay.tsx
│   └── 3d/
│       ├── SpatialWorld.tsx
│       ├── SpatialRig.tsx
│       ├── TrackedDatum.tsx
│       ├── PostProcessingComposer.tsx
│       ├── stations/
│       │   ├── Station1_TorqueGearTrain.tsx
│       │   ├── Station2_AcousticEnclosure.tsx
│       │   │   ├── InteractiveAirflowStream.tsx
│       │   │   └── AcousticBaffleField.tsx
│       │   └── Station3_ReceiverScan.tsx
```

---

## 3. Production Component Implementations

### Module 1: Layout & Chapter Scroll Overlay (`src/components/layout/ChapterManager.tsx`)
```tsx
import React from 'react';

interface ChapterData {
  id: string;
  chapterNumber: string;
  subtitle: string;
  title: string;
  description: string;
  specs: string[];
  tags: string[];
  range: [number, number]; // [startScroll, endScroll] (0.0 to 1.0)
}

const CHAPTERS: ChapterData[] = [
  {
    id: 'ch-01',
    chapterNumber: 'CH.01',
    subtitle: 'ASSEMBLY // SOLID PBR',
    title: 'The Full-Stack Physical & Digital Systems Architect',
    description: '25 years of planetary reduction gearboxes, 7-axis mill-turn, and ASME Y14.5 GD&T bridged into modern software, web-native 3D, and AI automation.',
    specs: ['Multi-stage planetary reduction', '7-axis mill-turn tooling', 'ASME Y14.5 GD&T'],
    tags: ['SOLIDWORKS', '7-AXIS MILL-TURN', 'ASME Y14.5'],
    range: [0.0, 0.22],
  },
  {
    id: 'ch-02',
    chapterNumber: 'CH.02',
    subtitle: 'X-RAY // EXPLODE',
    title: 'Zero to Prototype: Planetary Reduction at Full Torque',
    description: 'A multi-stage planetary gear train engineered for 7-axis mill-turn production and heat-treat-stable tolerances.',
    specs: [
      'Multi-stage planetary reduction gearbox machined complete on 7-axis mill-turn centers.',
      'Controlled heat-treat distortion across hardened gear stages to hold GD&T callouts post-process.',
      'Zero-prototype production run — first parts off the line met specification with no iteration cycle.',
    ],
    tags: ['HEAT-TREAT CONTROL', 'KINEMATICS', '0-PROTOTYPE'],
    range: [0.24, 0.46],
  },
  {
    id: 'ch-03',
    chapterNumber: 'CH.03',
    subtitle: 'THERMAL // ACOUSTIC',
    title: 'Engineered Silence: The Acoustic SAFE Enclosure',
    description: 'A 5-layer composite acoustic enclosure engineered around real CFM/FPM airflow math and vibration-isolated mounting.',
    specs: [
      '5-layer composite acoustic wall system attenuating noise without choking intake airflow.',
      'CFM/FPM calculations sizing duct labyrinths for active cooling under sound constraints.',
      'Vibration-decoupled isolation mounting preventing structure-borne chassis resonance.',
    ],
    tags: ['CFM / FPM', '5-LAYER COMPOSITE', 'VIBRATION DECOUPLING'],
    range: [0.50, 0.74],
  },
  {
    id: 'ch-04',
    chapterNumber: 'CH.04',
    subtitle: 'DIGITAL SYSTEMS',
    title: 'From Point Cloud to Parametric: Reverse-Engineering Mission-Critical Hardware',
    description: '3D scan data reconstructed into fully toleranced, manufacturable CAD for the M249/MK46 platform.',
    specs: [
      'Converted raw 3D scan point clouds of legacy mil-spec hardware into clean parametric CAD.',
      'Rebuilt ASME Y14.5 drawings from physical parts with no original technical data package.',
      'Delivered production-ready drawings meeting mil-spec interchangeability tolerances.',
    ],
    tags: ['SCAN-TO-CAD', 'NO TDP', 'MIL-SPEC INTERCHANGEABILITY'],
    range: [0.78, 1.0],
  },
];

export const ChapterManager: React.FC<{ scrollProgress: number }> = ({ scrollProgress }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 grid grid-cols-12 p-6 md:p-12">
      {CHAPTERS.map((ch) => {
        const [start, end] = ch.range;
        const fadeIn = Math.min(Math.max((scrollProgress - start) / 0.04, 0), 1);
        const fadeOut = Math.min(Math.max((end - scrollProgress) / 0.04, 0), 1);
        const opacity = Math.min(fadeIn, fadeOut);

        if (opacity <= 0.001) return null;

        return (
          <div
            key={ch.id}
            className="col-span-12 md:col-span-5 flex flex-col justify-center pointer-events-auto transition-opacity duration-150"
            style={{ opacity }}
          >
            <div className="bg-slate-950/85 border border-slate-800/80 p-6 md:p-8 rounded-lg backdrop-blur-md shadow-2xl">
              <div className="flex items-center gap-2 text-cyan-400 font-mono text-xs mb-2">
                <span>{ch.chapterNumber}</span>
                <span className="text-slate-600">//</span>
                <span className="text-slate-400 tracking-wider uppercase">{ch.subtitle}</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-3 tracking-tight font-sans">
                {ch.title}
              </h2>

              <p className="text-sm text-slate-300 mb-5 leading-relaxed font-sans">
                {ch.description}
              </p>

              <ul className="space-y-2.5 mb-6">
                {ch.specs.map((spec, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-400 font-mono">
                    <span className="text-cyan-400 mt-0.5">▸</span>
                    <span>{spec}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
                {ch.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="text-[10px] font-mono text-cyan-400 bg-cyan-950/50 border border-cyan-800/50 px-2 py-0.5 rounded"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
```

---

### Module 2: Live Mesh-Tracked Datum Anchor with Leader Line (`src/components/3d/TrackedDatum.tsx`)
```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface TrackedDatumProps {
  targetRef: React.RefObject<THREE.Object3D null |>;
  localOffset?: [number, number, number];
  leaderOffset?: { x: number; y: number };
  label: string;
  callout: string;
  scrollProgress: number;
  activeRange: [number, number];
}

export const TrackedDatum: React.FC<TrackedDatumProps> = ({
  targetRef,
  localOffset = [0, 0, 0],
  leaderOffset = { x: 50, y: -35 },
  label,
  callout,
  scrollProgress,
  activeRange,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const worldPos = useRef(new THREE.Vector3());

  const [start, end] = activeRange;
  const fadeIn = Math.min(Math.max((scrollProgress - start) / 0.03, 0), 1);
  const fadeOut = Math.min(Math.max((end - scrollProgress) / 0.03, 0), 1);
  const opacity = Math.min(fadeIn, fadeOut);

  useFrame(() => {
    if (!targetRef.current || !groupRef.current) return;
    targetRef.current.getWorldPosition(worldPos.current);
    worldPos.current.add(new THREE.Vector3(...localOffset));
    groupRef.current.position.copy(worldPos.current);
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={groupRef}>
      <Html 'opacity 0.1s center distanceFactor="{10}" ease-out', opacity opacity, pointerEvents: style="{{" transition:> 0.5 ? 'auto' : 'none',
        }}
      >
        <div
          className="relative flex items-center select-none font-mono text-[11px] tracking-wider whitespace-nowrap"
          style={{ transform: `translate3d(${leaderOffset.x}px, ${leaderOffset.y}px, 0)` }}
        >
          {/* Dynamic SVG Leader Line */}
          <svg
            className="absolute pointer-events-none overflow-visible"
            style={{
              left: -leaderOffset.x,
              top: -leaderOffset.y,
              width: Math.abs(leaderOffset.x),
              height: Math.abs(leaderOffset.y),
            }}
          >
            <circle cx={0} cy={0} r={3} fill="#06b6d4" />
            <line
              x1={0}
              y1={0}
              x2={leaderOffset.x}
              y2={leaderOffset.y}
              stroke="#06b6d4"
              strokeWidth={1.2}
              strokeDasharray="2 2"
            />
          </svg>

          {/* Datum HUD Badge */}
          <div className="bg-slate-950/90 border border-cyan-500/70 px-2.5 py-1 rounded shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 backdrop-blur-md">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span className="text-cyan-300 font-semibold">{label}</span>
            <span className="text-slate-400 border-l border-slate-700 pl-2 text-[10px]">{callout}</span>
          </div>
        </div>
      </Html>
    </group>
  );
};
```

---

### Module 3: Station 1 — Planetary Gearbox with Kinematic Idling (`src/components/3d/stations/Station1_TorqueGearTrain.tsx`)
```tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface Station1Props {
  explodeProgress: number; // 0.0 to 1.0 (mapped from 0.24 to 0.46 scroll)
  onSelectSubassembly: (targetPos: THREE.Vector3, name: string) => void;
}

export const Station1_TorqueGearTrain: React.FC<Station1Props> = ({
  explodeProgress,
  onSelectSubassembly,
}) => {
  const sunRef = useRef<THREE.Group>(null);
  const carrierRef = useRef<THREE.Group>(null);
  const planetRefs = useRef<THREE.Group[]>([]);
  const housingRef = useRef<THREE.Group>(null);
  const anvilRef = useRef<THREE.Group>(null);

  const SUN_TEETH = 18;
  const PLANET_TEETH = 24;
  const RING_TEETH = 66;
  const RATIO = 1 + RING_TEETH / SUN_TEETH;

  useFrame((_, delta) => {
    const sunSpeed = 1.8;
    const carrierSpeed = sunSpeed / RATIO;
    const planetSpinSpeed = -sunSpeed * (SUN_TEETH / PLANET_TEETH);

    if (sunRef.current) sunRef.current.rotation.x += sunSpeed * delta;
    if (carrierRef.current) carrierRef.current.rotation.x += carrierSpeed * delta;
    planetRefs.current.forEach((p) => {
      if (p) p.rotation.x += planetSpinSpeed * delta;
    });
  });

  const handleClick = (e: any, ref: React.RefObject<THREE.Group null |>, name: string) => {
    e.stopPropagation();
    if (!ref.current) return;
    const worldPos = new THREE.Vector3();
    ref.current.getWorldPosition(worldPos);
    onSelectSubassembly(worldPos, name);
  };

  const stage1Offset = explodeProgress * 0.14;
  const stage2Offset = explodeProgress * 0.28;
  const stage3Offset = explodeProgress * 0.42;

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Housing */}
      <group
        ref={housingRef}
        position={[-explodeProgress * 0.12, 0, 0]}
        onClick={(e) => handleClick(e, housingRef, 'GEARBOX HOUSING')}
        className="cursor-pointer"
      >
        <mesh>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 32]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.2}
            metalness={0.8}
            wireframe={explodeProgress > 0.1}
            transparent
            opacity={explodeProgress > 0.1 ? 0.35 : 1.0}
          />
        </mesh>
      </group>

      {/* Sun Gear Input */}
      <group
        ref={sunRef}
        position={[stage1Offset, 0, 0]}
        onClick={(e) => handleClick(e, sunRef, 'STAGE 1 SUN GEAR')}
        className="cursor-pointer"
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.024, 0.024, 0.04, 18]} />
          <meshStandardMaterial color="#38bdf8" roughness={0.3} metalness={0.9} />
        </mesh>
      </group>

      {/* Planetary Carrier & Planet Gears */}
      <group
        ref={carrierRef}
        position={[stage2Offset, 0, 0]}
        onClick={(e) => handleClick(e, carrierRef, 'PLANETARY CARRIER')}
        className="cursor-pointer"
      >
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.065, 0.065, 0.02, 32]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.8} />
        </mesh>
        {[0, (2 * Math.PI) / 3, (4 * Math.PI) / 3].map((angle, i) => {
          const pcd = 0.045;
          return (
            <group
              key={i}
              ref={(el) => { if (el) planetRefs.current[i] = el; }}
              position={[0, Math.cos(angle) * pcd, Math.sin(angle) * pcd]}
            >
              <mesh rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.018, 0.018, 0.035, 16]} />
                <meshStandardMaterial color="#0ea5e9" roughness={0.3} metalness={0.9} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Output Spindle & Spline Collar */}
      <group
        ref={anvilRef}
        position={[stage3Offset, 0, 0]}
        onClick={(e) => handleClick(e, anvilRef, '3/4" OUTPUT ANVIL')}
        className="cursor-pointer"
      >
        <mesh rotation={[0, 0, Math.PI / 2]} position={[0.04, 0, 0]}>
          <boxGeometry args={[0.03, 0.025, 0.025]} />
          <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.95} />
        </mesh>
      </group>
    </group>
  );
};
```

---

### Module 4: Station 2 — Mouse-Interactive Airflow & Acoustic Waves (`src/components/3d/stations/Station2_AcousticEnclosure.tsx`)
```tsx
import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const Station2_AcousticEnclosure: React.FC<{ origin?: [number, number, number] }> = ({
  origin = [28, 0, -6],
}) => {
  const particleCount = 450;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const { raycaster, mouse, camera } = useThree();
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 6), []);
  const mouseWorld = useRef(new THREE.Vector3());

  const bounds = { x: 3.2, y: 1.6, z: 2.0 };

  const particles = useMemo(() => {
    return Array.from({ length: particleCount }, () => ({
      x: (Math.random() - 0.5) * bounds.x,
      y: (Math.random() - 0.5) * bounds.y,
      z: (Math.random() - 0.5) * bounds.z,
      vx: 0.015 + Math.random() * 0.02,
      vy: (Math.random() - 0.5) * 0.002,
      vz: (Math.random() - 0.5) * 0.002,
      scale: 0.6 + Math.random() * 0.8,
    }));
  }, [particleCount]);

  useFrame(({ clock }) => {
    // 1. Mouse Tracking & Particle Repulsion
    raycaster.setFromCamera(mouse, camera);
    raycaster.ray.intersectPlane(plane, mouseWorld.current);

    if (meshRef.current) {
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        if (p.x > bounds.x / 2) p.x = -bounds.x / 2;

        const wx = origin[0] + p.x;
        const wy = origin[1] + p.y;
        const dx = wx - mouseWorld.current.x;
        const dy = wy - mouseWorld.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Repel airflow particles on mouse hover
        if (dist < 1.2 && dist > 0.01) {
          const force = (1.2 - dist) * 0.035;
          p.y += (dy / dist) * force;
          p.z += (Math.random() - 0.5) * force;
        }

        dummy.position.set(origin[0] + p.x, origin[1] + p.y, origin[2] + p.z);
        dummy.scale.set(p.scale, p.scale, p.scale * 2.5);
        dummy.updateMatrix();
        meshRef.current!.setMatrixAt(i, dummy.matrix);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2. Pulsing Acoustic Soundwave Baffles
    if (ringsRef.current) {
      const time = clock.getElapsedTime() * 2.5;
      ringsRef.current.children.forEach((child, i) => {
        const ring = child as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
        const phase = (i / 6) * Math.PI * 2;
        const wave = (Math.sin(time + phase) + 1) / 2;
        const scale = 1.0 + wave * 0.5;
        ring.scale.set(scale, scale, 1);
        ring.material.opacity = (1.0 - wave) * 0.6;
      });
    }
  });

  return (
    <group position={origin}>
      {/* 5-Layer Composite Enclosure Chassis */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[3.2, 1.8, 2.0]} />
        <meshStandardMaterial color="#1e293b" wireframe transparent opacity={0.25} />
      </mesh>

      {/* GPU Instanced Airflow Streamlines */}
      <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
        <coneGeometry args={[0.012, 0.08, 5]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.65} />
      </instancedMesh>

      {/* Dissipating Acoustic Wave Baffle Rings */}
      <group ref={ringsRef} position={[1.65, 0.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[0, 0, (i - 3) * 0.12]}>
            <ringGeometry args={[0.4 + i * 0.1, 0.415 + i * 0.1, 36]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
```

---

### Module 5: Spatial Camera Rig & Post-Processing (`src/components/3d/SpatialRig.tsx` & `PostProcessingComposer.tsx`)
```tsx
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATIONS = {
  torqueHero: { pos: new THREE.Vector3(0.35, 0.24, 0.28), target: new THREE.Vector3(0, 0, 0) },
  torqueExplode: { pos: new THREE.Vector3(0.65, 0.38, 0.52), target: new THREE.Vector3(0.12, 0, 0) },
  acousticSkid: { pos: new THREE.Vector3(28.8, 1.4, -4.2), target: new THREE.Vector3(28, 0, -6) },
  receiverCAD: { pos: new THREE.Vector3(56.6, 0.85, -10.2), target: new THREE.Vector3(56, 0, -12) },
};

interface SpatialRigProps {
  focusTarget: THREE.Vector3 | null;
  onClearFocus: () => void;
  focusedLabel: string | null;
}

export const SpatialRig: React.FC<SpatialRigProps> = ({ focusTarget, onClearFocus, focusedLabel }) => {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const scrollCamPos = useRef(new THREE.Vector3(0.35, 0.24, 0.28));

  // Continuous Scroll Flow: Any wheel scroll automatically releases subassembly focus
  useEffect(() => {
    const handleScrollOrKey = (e: WheelEvent | KeyboardEvent) => {
      if (focusTarget && (e instanceof WheelEvent || (e instanceof KeyboardEvent && e.key === 'Escape'))) {
        onClearFocus();
      }
    };
    window.addEventListener('wheel', handleScrollOrKey, { passive: true });
    window.addEventListener('keydown', handleScrollOrKey);
    return () => {
      window.removeEventListener('wheel', handleScrollOrKey);
      window.removeEventListener('keydown', handleScrollOrKey);
    };
  }, [focusTarget, onClearFocus]);

  useEffect(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '#main-scroll-track',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.7,
      },
    });

    // CH.01 -> CH.02: Torque Gun Explode (0% to 46%)
    tl.to(scrollCamPos.current, {
      x: STATIONS.torqueExplode.pos.x,
      y: STATIONS.torqueExplode.pos.y,
      z: STATIONS.torqueExplode.pos.z,
      ease: 'power2.inOut',
    }, 0)
    .to(targetLookAt.current, {
      x: STATIONS.torqueExplode.target.x,
      y: STATIONS.torqueExplode.target.y,
      z: STATIONS.torqueExplode.target.z,
      ease: 'power2.inOut',
    }, 0);

    // CH.02 -> CH.03: Whip-Pan to Acoustic Skid Station (46% to 75%)
    tl.to(scrollCamPos.current, {
      x: STATIONS.acousticSkid.pos.x,
      y: STATIONS.acousticSkid.pos.y,
      z: STATIONS.acousticSkid.pos.z,
      ease: 'expo.inOut',
    }, 0.46)
    .to(targetLookAt.current, {
      x: STATIONS.acousticSkid.target.x,
      y: STATIONS.acousticSkid.target.y,
      z: STATIONS.acousticSkid.target.z,
      ease: 'expo.inOut',
    }, 0.46);

    // CH.03 -> CH.04: Whip-Pan to Mil-Spec Receiver Station (75% to 100%)
    tl.to(scrollCamPos.current, {
      x: STATIONS.receiverCAD.pos.x,
      y: STATIONS.receiverCAD.pos.y,
      z: STATIONS.receiverCAD.pos.z,
      ease: 'expo.inOut',
    }, 0.75)
    .to(targetLookAt.current, {
      x: STATIONS.receiverCAD.target.x,
      y: STATIONS.receiverCAD.target.y,
      z: STATIONS.receiverCAD.target.z,
      ease: 'expo.inOut',
    }, 0.75);

    return () => tl.kill();
  }, []);

  useFrame(() => {
    if (focusTarget) {
      const desiredPos = focusTarget.clone().add(new THREE.Vector3(0.2, 0.15, 0.22));
      camera.position.lerp(desiredPos, 0.08);
      currentTarget.current.lerp(focusTarget, 0.08);
    } else {
      camera.position.lerp(scrollCamPos.current, 0.12);
      currentTarget.current.lerp(targetLookAt.current, 0.1);
    }
    camera.lookAt(currentTarget.current);
  });

  return (
    {focusTarget && (
      <Html 'none', 50 fullscreen pointerEvents: style="{{" zIndex: }}>
        <div className="fixed top-8 left-1/2 -translate-x-1/2 bg-slate-950/90 border border-cyan-500/60 px-4 py-2 rounded font-mono text-xs text-cyan-300 backdrop-blur-md shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>INSPECTING // {focusedLabel}</span>
          <span className="text-slate-400 border-l border-slate-700 pl-2 text-[10px]">
            [ 🖱️ SCROLL TO RESUME TOUR ]
          </span>
        </div>
      </Html>
    )}
  );
};
```

---

## 4. Execution Checklist for Coding Agent
1. **Replace** the existing chapter text component with `ChapterManager.tsx` to enforce left-column layout and eliminate text collision.
2. **Mount** `SpatialRig.tsx` inside your R3F `<Canvas>` root and bind the `focusTarget` state.
3. **Ensure** the main scroll track element `#main-scroll-track` has a height of `400vh` to `500vh` to drive the GSAP ScrollTrigger smoothly.
4. **Verify** that clicking subassemblies dollies into the mesh and that scrolling the mouse wheel immediately disengages focus back to the tour.