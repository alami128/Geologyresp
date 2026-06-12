import { Box3, Vector3 } from 'three'

/** Profondeurs (km) d’après le schéma de référence */
export const EARTH_DEPTH_KM = {
  surface: 0,
  continentalCrustMax: 45,
  oceanicCrustMax: 6,
  upperMantleBottom: 370,
  transitionZoneBottom: 720,
  mantleBottom: 2886,
  outerCoreBottom: 5156,
  center: 6371,
} as const

/** Couches cliquables sur le modèle 3D (4 enveloppes Sketchfab) */
export type EarthModelLayerId = 'crust' | 'mantle' | 'outer-core' | 'inner-core'

/** Couches du schéma en coupe (comme l’illustration) */
export type EarthDiagramLayerId =
  | 'crust-continental'
  | 'crust-oceanic'
  | 'upper-mantle'
  | 'transition-zone'
  | 'lower-mantle'
  | 'outer-core'
  | 'inner-core'

/** @deprecated alias — préférer EarthModelLayerId */
export type EarthLayerId = EarthModelLayerId

export type EarthLayerInfo = {
  id: EarthDiagramLayerId
  modelLayerId: EarthModelLayerId
  title: string
  state?: string
  depth: string
  description: string
  fact: string
  color: string
  pattern?: 'solid' | 'hatch' | 'speckle'
  letter?: string
}

export const EARTH_STRUCTURE_LAYERS: EarthLayerInfo[] = [
  {
    id: 'crust-continental',
    modelLayerId: 'crust',
    title: 'Croûte continentale',
    state: 'solide',
    depth: '35–45 km',
    description:
      'La croûte continentale est épaisse et granitique. Elle forme les continents et les plateformes sous-marines peu profondes.',
    fact: 'Sous les continents, la croûte peut atteindre 70 km dans les zones de collision (Himalaya).',
    color: '#1a1410',
    pattern: 'solid',
  },
  {
    id: 'crust-oceanic',
    modelLayerId: 'crust',
    title: 'Croûte océanique',
    state: 'solide',
    depth: '6 km',
    description:
      'La croûte océanique est fine et basaltique. Elle se forme aux dorsales et disparaît dans les zones de subduction.',
    fact: 'La croûte océanique est régénérée en permanence : elle n’a en moyenne que 200 millions d’années.',
    color: '#2a4a6a',
    pattern: 'solid',
  },
  {
    id: 'upper-mantle',
    modelLayerId: 'mantle',
    title: 'Manteau supérieur',
    state: 'solide',
    depth: '0–370 km',
    description:
      'Roche silicatée rigide située sous la croûte. Avec celle-ci, elle compose la lithosphère.',
    fact: 'La discontinuité de Mohorovičić (Moho) marque la limite entre croûte et manteau supérieur.',
    color: '#6b4423',
    pattern: 'hatch',
    letter: 'B',
  },
  {
    id: 'transition-zone',
    modelLayerId: 'mantle',
    title: 'Zone de transition',
    depth: '370–720 km',
    description:
      'Région où les minéraux du manteau se transforment sous la pression. Les séismes y changent de comportement.',
    fact: 'La zone de transition contient deux discontinuités sismiques majeures, aux environs de 410 et 660 km.',
    color: '#7a5230',
    pattern: 'hatch',
    letter: 'C',
  },
  {
    id: 'lower-mantle',
    modelLayerId: 'mantle',
    title: 'Manteau inférieur',
    state: 'fluide',
    depth: '720–2 886 km',
    description:
      'La plus grande enveloppe de la Terre. La roche y est très chaude et se déforme lentement — c’est l’asthénosphère profonde.',
    fact: 'Le manteau représente environ 84 % du volume terrestre.',
    color: '#c4722a',
    pattern: 'hatch',
    letter: 'D',
  },
  {
    id: 'outer-core',
    modelLayerId: 'outer-core',
    title: 'Noyau',
    state: 'liquide',
    depth: '2 886–5 156 km',
    description:
      'Noyau externe liquide, riche en fer et nickel. Ses mouvements de convection génèrent le champ magnétique terrestre.',
    fact: 'La température du noyau externe dépasse 4 000 °C — comparable à la surface du Soleil.',
    color: '#e8941a',
    pattern: 'speckle',
    letter: 'E',
  },
  {
    id: 'inner-core',
    modelLayerId: 'inner-core',
    title: 'Graine',
    state: 'solide',
    depth: '5 156–6 371 km',
    description:
      'Centre solide de la Terre. La pression extrême maintient le fer-nickel à l’état solide malgré la chaleur intense.',
    fact: 'La graine a à peu près la taille de la Lune et grandit d’environ 1 mm par an.',
    color: '#ffd54f',
    pattern: 'speckle',
    letter: 'G',
  },
]

export const EARTH_MECHANICAL_GROUPS = [
  {
    title: 'Lithosphère',
    state: 'solide',
    description: 'Croûte + manteau supérieur rigide — les plaques tectoniques.',
  },
  {
    title: 'Asthénosphère',
    state: 'fluide',
    description: 'Manteau ductile — les plaques y « flottent » et se déforment lentement.',
  },
] as const

export type LayerBounds = {
  box: Box3
  radius: number
  center: Vector3
}

/** Map diagram ids, legacy model ids, and stale state to a diagram layer id. */
export function resolveDiagramLayerId(id: string): EarthDiagramLayerId | null {
  const direct = EARTH_STRUCTURE_LAYERS.find((entry) => entry.id === id)
  if (direct) return direct.id

  const byModel = EARTH_STRUCTURE_LAYERS.find((entry) => entry.modelLayerId === id)
  return byModel?.id ?? null
}

export function getLayerById(id: EarthDiagramLayerId | EarthModelLayerId | string): EarthLayerInfo {
  const resolved = resolveDiagramLayerId(id)
  if (!resolved) throw new Error(`Unknown earth layer: ${id}`)
  return EARTH_STRUCTURE_LAYERS.find((entry) => entry.id === resolved)!
}

export function getLayerByIdSafe(id: string | null | undefined): EarthLayerInfo | null {
  if (!id) return null
  const resolved = resolveDiagramLayerId(id)
  if (!resolved) return null
  return EARTH_STRUCTURE_LAYERS.find((entry) => entry.id === resolved) ?? null
}

export function getLayersForModelId(modelLayerId: EarthModelLayerId): EarthLayerInfo[] {
  return EARTH_STRUCTURE_LAYERS.filter((entry) => entry.modelLayerId === modelLayerId)
}

export function getPrimaryLayerForModelId(modelLayerId: EarthModelLayerId): EarthLayerInfo {
  const layers = getLayersForModelId(modelLayerId)
  if (modelLayerId === 'crust') return layers.find((l) => l.id === 'crust-continental') ?? layers[0]
  return layers[0]
}

/** Profondeur normalisée depuis la surface (0 = surface, 1 = centre) */
export function depthFromSurfaceNorm(yNorm: number): number {
  return 1 - yNorm
}

export function resolveModelLayerFromLocalPoint(
  point: Vector3,
  bounds: LayerBounds,
): EarthModelLayerId {
  const yMin = bounds.box.min.y
  const yMax = bounds.box.max.y
  const ySpan = yMax - yMin || 1
  const yNorm = (point.y - yMin) / ySpan
  const normR = point.distanceTo(bounds.center) / bounds.radius
  const depthNorm = depthFromSurfaceNorm(yNorm)

  if (normR > 0.78 || depthNorm <= EARTH_DEPTH_KM.continentalCrustMax / EARTH_DEPTH_KM.center) {
    return 'crust'
  }

  if (depthNorm <= EARTH_DEPTH_KM.mantleBottom / EARTH_DEPTH_KM.center) {
    return 'mantle'
  }

  if (depthNorm <= EARTH_DEPTH_KM.outerCoreBottom / EARTH_DEPTH_KM.center) {
    return 'outer-core'
  }

  return 'inner-core'
}

export function resolveLayerFromLocalPoint(point: Vector3, bounds: LayerBounds): EarthLayerInfo {
  return getPrimaryLayerForModelId(resolveModelLayerFromLocalPoint(point, bounds))
}

export function getLayerHotspotPosition(layer: EarthLayerInfo, bounds: LayerBounds): Vector3 {
  const hotspotYByModel: Record<EarthModelLayerId, number> = {
    crust: 0.97,
    mantle: 0.76,
    'outer-core': 0.37,
    'inner-core': 0.1,
  }
  const yNorm = hotspotYByModel[layer.modelLayerId]
  const y = bounds.box.min.y + (bounds.box.max.y - bounds.box.min.y) * yNorm
  const x = bounds.box.max.x * 0.72
  return new Vector3(x, y, bounds.center.z)
}
