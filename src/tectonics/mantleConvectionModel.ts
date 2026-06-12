export const MANTLE_CONVECTION_MODEL =
  '/models/mantle-convection/jayden_olivas-_earth_layers.glb'

/** Jayden earth-layers GLB has no embedded animation. */
export const MANTLE_CONVECTION_ANIMATION = ''

/** Half-extents and center from the Jayden GLB bounding box. */
const MODEL_HALF = { x: 23.82, y: 30.17, z: 29.5 }
const MODEL_CENTER = { x: -8.425, y: 30.17, z: -10.5 }

/** Local Z of the flat cross-section face (front of the model). */
export const MANTLE_CUT_FACE_Z = MODEL_CENTER.z + MODEL_HALF.z
export const MANTLE_FLOW_SURFACE_OFFSET = 0.005

export const MANTLE_CONVECTION_SETTINGS = {
  scale: 0.1,
  camera: [0, 0, 5.8] as [number, number, number],
  minDistance: 2.4,
  maxDistance: 14,
}

export type MantleFlowId =
  | 'upwelling'
  | 'left-cell'
  | 'right-cell'
  | 'subduction-left'
  | 'subduction-right'

export type MantleFlowDef = {
  id: MantleFlowId
  label: string
  color: string
  points: [number, number, number][]
}

export type MantleLegendItem = {
  text: string
  position: 'left' | 'right' | 'center'
}

/** Normalised coords (−1…1) on the cut face (x/y only — Z is set when snapping). */
function mp(xN: number, yN: number, zN = 1): [number, number, number] {
  return [
    MODEL_CENTER.x + xN * MODEL_HALF.x,
    MODEL_CENTER.y + yN * MODEL_HALF.y,
    MODEL_CENTER.z + zN * MODEL_HALF.z,
  ]
}

function lerpPoints(
  from: [number, number],
  to: [number, number],
  segments: number,
  zN = 1,
): [number, number, number][] {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    pts.push(mp(from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t, zN))
  }
  return pts
}

function quadBezier(
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  segments = 14,
  zN = 1,
): [number, number, number][] {
  const pts: [number, number, number][] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const u = 1 - t
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0]
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]
    pts.push(mp(x, y, zN))
  }
  return pts
}

function concatPaths(...parts: [number, number, number][][]): [number, number, number][] {
  return parts.flatMap((part, index) => (index === 0 ? part : part.slice(1)))
}

/**
 * Courants de convection calibrés sur jayden_olivas earth layers
 * (y = surface → noyau, x = gauche/droite, z = face de coupe).
 */
export const MANTLE_CONVECTION_FLOWS: MantleFlowDef[] = [
  {
    id: 'upwelling',
    label: 'Remontée (chaud)',
    color: '#e53935',
    points: lerpPoints([0, -0.62], [0, 0.86], 18),
  },
  {
    id: 'left-cell',
    label: 'Cellule de convection (gauche)',
    color: '#ff7043',
    points: concatPaths(
      quadBezier([0, 0.84], [-0.28, 0.9], [-0.68, 0.82], 10),
      quadBezier([-0.68, 0.82], [-0.86, 0.38], [-0.76, -0.02], 10),
      quadBezier([-0.76, -0.02], [-0.52, -0.48], [-0.12, -0.62], 10),
      quadBezier([-0.12, -0.62], [0, -0.55], [0, 0.84], 12),
    ),
  },
  {
    id: 'right-cell',
    label: 'Cellule de convection (droite)',
    color: '#ff7043',
    points: concatPaths(
      quadBezier([0, 0.84], [0.28, 0.9], [0.68, 0.82], 10),
      quadBezier([0.68, 0.82], [0.86, 0.38], [0.76, -0.02], 10),
      quadBezier([0.76, -0.02], [0.52, -0.48], [0.12, -0.62], 10),
      quadBezier([0.12, -0.62], [0, -0.55], [0, 0.84], 12),
    ),
  },
  {
    id: 'subduction-left',
    label: 'Subduction (gauche)',
    color: '#1e88e5',
    points: quadBezier([-0.74, 0.8], [-0.86, 0.22], [-0.62, -0.38], 16),
  },
  {
    id: 'subduction-right',
    label: 'Subduction (droite)',
    color: '#1e88e5',
    points: quadBezier([0.74, 0.8], [0.86, 0.22], [0.62, -0.38], 16),
  },
]

export const MANTLE_CONVECTION_LEGEND: MantleLegendItem[] = [
  { text: 'Lithosphère · plaques', position: 'left' },
  { text: 'Asthénosphère', position: 'right' },
  { text: 'Dorsale · remontée centrale', position: 'center' },
  { text: 'Fosse · subduction', position: 'left' },
  { text: 'Manteau · cellules de convection', position: 'right' },
  { text: 'Noyau externe · Noyau interne', position: 'center' },
]

export function createInitialMantleFlowState(): Record<MantleFlowId, boolean> {
  return {
    upwelling: true,
    'left-cell': false,
    'right-cell': false,
    'subduction-left': true,
    'subduction-right': true,
  }
}
