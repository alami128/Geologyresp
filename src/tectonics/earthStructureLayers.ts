import { Box3, Vector3 } from 'three'

/** Depth boundaries (km) from the reference diagram */
export const EARTH_DEPTH_KM = {
  surface: 0,
  crustBottom: 100,
  mantleBottom: 2900,
  outerCoreBottom: 5150,
  center: 6371,
} as const

export type EarthLayerId = 'crust' | 'mantle' | 'outer-core' | 'inner-core'

export type EarthLayerInfo = {
  id: EarthLayerId
  title: string
  depth: string
  description: string
  fact: string
  color: string
  /** Normalized Y (0 = model bottom / center, 1 = top / surface) for hotspot placement */
  hotspotY: number
}

export const EARTH_STRUCTURE_LAYERS: EarthLayerInfo[] = [
  {
    id: 'crust',
    title: 'Crust',
    depth: '0–100 km',
    description:
      'The thin rocky shell beneath continents and oceans. Oceanic crust is thinner basalt; continental crust is thicker granite.',
    fact: 'The crust makes up less than 1% of Earth’s volume — thinner than the skin on an apple.',
    color: '#4b2c20',
    hotspotY: 0.97,
  },
  {
    id: 'mantle',
    title: 'Mantle',
    depth: '100–2,900 km',
    description:
      'The thick layer of hot, solid rock that moves slowly over geologic time. Convection in the mantle drives plate tectonics.',
    fact: 'The mantle holds about 84% of Earth’s volume — by far the largest layer.',
    color: '#e67e22',
    hotspotY: 0.76,
  },
  {
    id: 'outer-core',
    title: 'Outer core',
    depth: '2,900–5,150 km',
    description:
      'Liquid iron and nickel swirling around the inner core. Its motion generates Earth’s magnetic field.',
    fact: 'The outer core is about as hot as the surface of the Sun — roughly 4,400 °C.',
    color: '#f39c12',
    hotspotY: 0.37,
  },
  {
    id: 'inner-core',
    title: 'Inner core',
    depth: '5,150–6,371 km',
    description:
      'A solid ball of iron-nickel at Earth’s center. Extreme pressure keeps it solid despite intense heat.',
    fact: 'The inner core is about the size of the Moon and grows by roughly 1 mm per year.',
    color: '#f8f0d0',
    hotspotY: 0.1,
  },
]

export type LayerBounds = {
  box: Box3
  radius: number
  center: Vector3
}

export function getLayerById(id: EarthLayerId): EarthLayerInfo {
  const layer = EARTH_STRUCTURE_LAYERS.find((entry) => entry.id === id)
  if (!layer) throw new Error(`Unknown earth layer: ${id}`)
  return layer
}

/** Depth from surface as fraction of Earth radius (0 = surface, 1 = center) */
export function depthFromSurfaceNorm(yNorm: number): number {
  return 1 - yNorm
}

export function resolveLayerFromLocalPoint(
  point: Vector3,
  bounds: LayerBounds,
): EarthLayerInfo {
  const yMin = bounds.box.min.y
  const yMax = bounds.box.max.y
  const ySpan = yMax - yMin || 1
  const yNorm = (point.y - yMin) / ySpan
  const normR = point.distanceTo(bounds.center) / bounds.radius
  const depthNorm = depthFromSurfaceNorm(yNorm)

  if (normR > 0.78 || depthNorm <= EARTH_DEPTH_KM.crustBottom / EARTH_DEPTH_KM.center) {
    return getLayerById('crust')
  }

  if (depthNorm <= EARTH_DEPTH_KM.mantleBottom / EARTH_DEPTH_KM.center) {
    return getLayerById('mantle')
  }

  if (depthNorm <= EARTH_DEPTH_KM.outerCoreBottom / EARTH_DEPTH_KM.center) {
    return getLayerById('outer-core')
  }

  return getLayerById('inner-core')
}

export function getLayerHotspotPosition(layer: EarthLayerInfo, bounds: LayerBounds): Vector3 {
  const y = bounds.box.min.y + (bounds.box.max.y - bounds.box.min.y) * layer.hotspotY
  const x = bounds.box.max.x * 0.72
  return new Vector3(x, y, bounds.center.z)
}
