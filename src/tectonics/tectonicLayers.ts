import boundaryData from './tectonicBoundaryPaths.json'

export type TectonicLayerId =
  | 'plate-boundaries'
  | 'divergent'
  | 'converge-ocean-continental'
  | 'converge-ocean-ocean'
  | 'converge-continental'
  | 'transform'
  | 'volcanoes'
  | 'seismic'

/** [latitude, longitude] in degrees (WGS84). */
export type LatLon = [number, number]

export type TectonicLayerDef = {
  id: TectonicLayerId
  label: string
  color: string
  kind: 'line' | 'point' | 'zone' | 'outline'
  paths?: LatLon[][]
  points?: LatLon[]
  /** PB2002 boundary classes represented in this layer. */
  scienceNote?: string
}

const LAYER_META: Record<
  TectonicLayerId,
  Omit<TectonicLayerDef, 'paths' | 'points' | 'id'>
> = {
  'plate-boundaries': {
    label: 'Limites des plaques',
    color: '#ffffff',
    kind: 'outline',
    scienceNote:
      'Tous les bords de plaques (PB2002) — tirets blancs animés séparant chaque plaque',
  },
  divergent: {
    label: 'Les plaques tectoniques divergent',
    color: '#5ce1ff',
    kind: 'line',
    scienceNote: 'Dorsales océaniques (OSR) et rifts continentaux (CRB), PB2002',
  },
  'converge-ocean-continental': {
    label: 'Convergence océan–continent (subduction)',
    color: '#e03030',
    kind: 'line',
    scienceNote: 'Zones de subduction océan–continent (OCB/SUB), PB2002',
  },
  'converge-ocean-ocean': {
    label: 'Convergence océan–océan (subduction)',
    color: '#9b59d4',
    kind: 'line',
    scienceNote: 'Zones de subduction océan–océan (OCB/SUB), PB2002',
  },
  'converge-continental': {
    label: 'Les plaques continentales convergent',
    color: '#3ecf6e',
    kind: 'line',
    scienceNote: 'Zones de collision continentale (CCB), ex. Himalaya et Alpes, PB2002',
  },
  transform: {
    label: 'Les plaques glissent l’une contre l’autre',
    color: '#f5d547',
    kind: 'line',
    scienceNote: 'Failles transformantes océaniques et continentales (OTF/CTF), PB2002',
  },
  volcanoes: {
    label: 'Volcans',
    color: '#ff2a2a',
    kind: 'point',
    scienceNote: 'Volcans holocènes majeurs (coordonnées Smithsonian GVP)',
  },
  seismic: {
    label: 'Risque sismique',
    color: '#c9955c',
    kind: 'zone',
    scienceNote:
      'Marges de plaques à forte déformation (arcs de subduction et transformantes PB2002)',
  },
}

function buildLayer(id: TectonicLayerId): TectonicLayerDef {
  const meta = LAYER_META[id]

  if (meta.kind === 'outline') {
    return { id, ...meta }
  }

  const data = boundaryData.layers[id as Exclude<TectonicLayerId, 'plate-boundaries'>]

  if (meta.kind === 'point') {
    return {
      id,
      ...meta,
      points: data as LatLon[],
    }
  }

  return {
    id,
    ...meta,
    paths: data as LatLon[][],
  }
}

export const TECTONIC_DATA_SOURCE = boundaryData.source

export const TECTONIC_LAYERS: TectonicLayerDef[] = [
  buildLayer('plate-boundaries'),
  buildLayer('divergent'),
  buildLayer('converge-ocean-continental'),
  buildLayer('converge-ocean-ocean'),
  buildLayer('converge-continental'),
  buildLayer('transform'),
  buildLayer('volcanoes'),
  buildLayer('seismic'),
]

export function createInitialLayerState(): Record<TectonicLayerId, boolean> {
  return {
    'plate-boundaries': false,
    divergent: false,
    'converge-ocean-continental': false,
    'converge-ocean-ocean': false,
    'converge-continental': false,
    transform: false,
    volcanoes: false,
    seismic: false,
  }
}

export function getTectonicLayer(id: TectonicLayerId): TectonicLayerDef {
  const layer = TECTONIC_LAYERS.find((entry) => entry.id === id)
  if (!layer) throw new Error(`Unknown tectonic layer: ${id}`)
  return layer
}
