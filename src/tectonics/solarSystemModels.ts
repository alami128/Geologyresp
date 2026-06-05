export const SOLAR_SYSTEM_MODEL = '/models/solar_system_animation.glb'
export const EARTHS_INTERIOR_MODEL = '/models/earths_interior.glb'

/** Earth node names in the solar system GLB (Sketchfab typo: "erath") */
export const SOLAR_EARTH_NODE_NAMES = ['erath_8', 'Object_11', 'Object_40']

export type SolarBodyId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type SolarBodyDef = {
  number: number
  id: SolarBodyId
  name: string
  /** Animated group node in the GLB */
  nodeName: string
}

/** Planets in order from the Sun (numbers 1–8). */
export const SOLAR_SYSTEM_BODIES: SolarBodyDef[] = [
  { number: 1, id: 'mercury', name: 'Mercury', nodeName: 'mercury_2' },
  { number: 2, id: 'venus', name: 'Venus', nodeName: 'venus_5' },
  { number: 3, id: 'earth', name: 'Earth', nodeName: 'erath_8' },
  { number: 4, id: 'mars', name: 'Mars', nodeName: 'mars_12' },
  { number: 5, id: 'jupiter', name: 'Jupiter', nodeName: 'jupiter_15' },
  { number: 6, id: 'saturn', name: 'Saturn', nodeName: 'saturn_19' },
  { number: 7, id: 'uranus', name: 'Uranus', nodeName: 'uranus_22' },
  { number: 8, id: 'neptune', name: 'Neptune', nodeName: 'neptune_25' },
]

export const SOLAR_SYSTEM_SETTINGS = {
  scale: 1.15,
  /** Starting camera — scroll to zoom in/out freely */
  camera: [0, 4.5, 16] as [number, number, number],
  fov: 45,
  minDistance: 2,
  maxDistance: 100,
  zoomSpeed: 1.2,
  /** Html label scale in 3D (higher = larger badges) */
  labelDistanceFactor: 14,
  /** Earth click → fly-in before switching scenes */
  earthZoomDuration: 1.75,
  earthZoomDistance: 1.05,
  earthZoomFov: 28,
  earthZoomFlashMs: 450,
}

export const EARTHS_INTERIOR_SETTINGS = {
  scale: 0.55,
  camera: [0, 0.8, 5] as [number, number, number],
  minDistance: 1.5,
  maxDistance: 18,
}

export function isSolarEarthObject(name: string): boolean {
  const lower = name.toLowerCase()
  return lower.includes('erath') || lower.includes('earth')
}
