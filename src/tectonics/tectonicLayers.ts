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
    label: 'Plate boundaries',
    color: '#ffffff',
    kind: 'outline',
    scienceNote: 'All plate edges (PB2002) — white animated dashes separate each plate',
  },
  divergent: {
    label: 'Tectonic plates diverge',
    color: '#5ce1ff',
    kind: 'line',
    scienceNote: 'Oceanic spreading ridges (OSR) and continental rifts (CRB), PB2002',
  },
  'converge-ocean-continental': {
    label: 'Tectonic plates converge, oceanic plate subducts under continental plate',
    color: '#e03030',
    kind: 'line',
    scienceNote: 'Ocean–continent subduction zones (OCB/SUB), PB2002',
  },
  'converge-ocean-ocean': {
    label: 'Tectonic plates converge, oceanic plate subducts under oceanic plate',
    color: '#9b59d4',
    kind: 'line',
    scienceNote: 'Ocean–ocean subduction zones (OCB/SUB), PB2002',
  },
  'converge-continental': {
    label: 'Continental plates converge',
    color: '#3ecf6e',
    kind: 'line',
    scienceNote: 'Continental collision zones (CCB), e.g. Himalaya and Alps, PB2002',
  },
  transform: {
    label: 'Plates slide past each other',
    color: '#f5d547',
    kind: 'line',
    scienceNote: 'Oceanic and continental transform faults (OTF/CTF), PB2002',
  },
  volcanoes: {
    label: 'Volcanoes',
    color: '#ff2a2a',
    kind: 'point',
    scienceNote: 'Major Holocene volcanoes (Smithsonian GVP coordinates)',
  },
  seismic: {
    label: 'Seismic hazard',
    color: '#c9955c',
    kind: 'zone',
    scienceNote: 'High-strain plate margins derived from PB2002 subduction and transform arcs',
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
