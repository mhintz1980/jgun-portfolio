// Scene configuration: edit this file, not main.js, for most projects.
// Units are meters (glTF convention). Scale CAD exports from mm with modelScale: 0.001.

export const CONFIG = {
  // Model. null = built-in placeholder assembly so the starter runs out of the box.
  modelUrl: null, // e.g. './models/pump-package.opt.glb' (compressed with glTF Transform)
  modelScale: 1,
  // 'keep' = use the GLB's materials as authored. 'cad-auto' = upgrade raw CAD display colors
  // (metalness 0 / roughness 1) to metal or paint by color. Authored PBR materials are never touched.
  materials: 'keep',
  // true = beat camera/target and explode offsets are in multiples of the model's bounding radius,
  // measured from its bounding-box center. Works at any model scale (a 0.2 m tool or a 5 m skid).
  fitToModel: false,
  // 'model' (default) = explode offsets × radius when fitToModel; 'meters' = world meters as written.
  // Use 'meters' when the project already has measured offsets. Offsets on nested nodes add to their parent's.
  explodeUnits: 'model',

  // Lighting. null = three.js RoomEnvironment (no download). Or a Poly Haven .hdr (CC0).
  hdrUrl: null, // e.g. './env/studio_small_09_1k.hdr'
  envIntensity: 1.0,
  toneMapping: 'AgX', // 'AgX' | 'ACESFilmic' | 'Neutral'
  exposure: 1.0,
  background: '#0b0d10',

  // Camera. If the GLB contains a baked camera animation with this name AND a camera,
  // the scroll scrubs that clip. Otherwise the camera follows the beats below on splines.
  cameraClip: 'CameraPath',
  fov: 30, // product-shot lens; widen only for "inside the machine" beats
  minCameraDistance: 0, // keep the camera at least this far from the model center (× radius if fitToModel). 0 = off
  damping: 0.08, // 0..1 per 60fps frame, lower = smoother/laggier. Reduced-motion users get 1 (instant).
  frameOffsetX: 0.18, // fraction of viewport width to push the model right of the copy column (desktop)

  // Story beats. One per <section data-beat="..."> in index.html, in order.
  // camera/target in world meters. explode 0..1. callouts = node names to label.
  // Optional per beat: mobile: { camera, target } overrides for narrow (<720px) screens.
  beats: [
    { id: 'reveal', camera: [4.5, 2.2, 6.5], target: [0, 0.6, 0], explode: 0, callouts: [] },
    { id: 'explode', camera: [5.5, 3.2, 3.5], target: [0.2, 0.8, 0], explode: 1, callouts: ['engine', 'pump_end', 'frame'] },
    { id: 'detail', camera: [4.2, 1.6, 3.0], target: [2.0, 0.8, 0], explode: 1, callouts: ['pump_end'] },
    { id: 'specs', camera: [-4.5, 2.6, 5.5], target: [0, 0.6, 0], explode: 0, callouts: ['engine'] },
  ],

  // Exploded view: node name -> offset (meters, world axes) at explode = 1.
  // Names must match nodes in the GLB (keep CAD assembly names when exporting from Blender).
  explode: {
    engine: [0, 0.7, 0],
    pump_end: [1.4, 0, 0],
    frame: [0, -0.25, 0],
  },

  // HUD callouts: node name -> label. Keep to a name + one spec.
  callouts: {
    engine: { title: 'ENGINE', spec: '4-CYL DIESEL / 74 KW' },
    pump_end: { title: 'PUMP END', spec: '6" × 6" / 2,000 GPM' },
    frame: { title: 'SKID FRAME', spec: 'A36 STEEL / FORKLIFT POCKETS' },
  },
};
