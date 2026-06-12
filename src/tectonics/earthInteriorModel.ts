import type { EarthModelLayerId } from './earthStructureLayers'

/** Full-quality animated Sketchfab earth interior (design source files). */
export const EARTH_INTERIOR_MODEL = '/models/earthinterior/earths_interior.glb'

/** Lighter variant for slow connections (same rig + animation). */
export const EARTH_INTERIOR_MODEL_LITE = '/models/earthinterior/earths_interior (2).glb'

export const EARTH_INTERIOR_ANIMATION = 'Animation'

export const EARTH_INTERIOR_SETTINGS = {
  scale: 0.55,
  camera: [0, 0.4, 5.2] as [number, number, number],
  minDistance: 1.8,
  maxDistance: 16,
}

/** GLB material names → logical layer ids */
export const MATERIAL_TO_LAYER: Record<string, EarthModelLayerId> = {
  Surface: 'crust',
  Inner_Crust: 'crust',
  Mantle: 'mantle',
  Outer_Core: 'outer-core',
  Inner_Core: 'inner-core',
}

export function materialNameToLayerId(name: string): EarthModelLayerId | null {
  return MATERIAL_TO_LAYER[name] ?? null
}
