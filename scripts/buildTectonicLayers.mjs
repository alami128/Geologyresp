/**
 * Build tectonic layer paths from PB2002 (Bird 2003, doi:10.1029/2001GC000252).
 * Sources:
 * - public/data/PB2002_steps.dat.txt (boundary segment types)
 * - public/data/PB2002_boundaries.json (GeoJSON subduction arcs)
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const stepsPath = path.join(root, 'public/data/PB2002_steps.dat.txt')
const boundariesPath = path.join(root, 'public/data/PB2002_boundaries.json')
const outPath = path.join(root, 'src/tectonics/tectonicBoundaryPaths.json')

/** Plates whose margins are largely continental crust (PB2002 codes). */
const CONTINENTAL_PLATES = new Set([
  'NA',
  'SA',
  'EU',
  'AF',
  'AN',
  'IN',
  'AR',
  'AM',
  'SU',
  'SO',
  'YA',
])

/** Major Holocene volcanoes (Smithsonian GVP coordinates, simplified). */
const VOLCANOES = [
  [64.05, -19.62],
  [52.83, 169.94],
  [46.2, -122.19],
  [19.41, -155.29],
  [14.47, -90.88],
  [4.92, -75.32],
  [-0.67, -78.44],
  [-16.27, -68.08],
  [-41.33, -72.61],
  [35.36, 138.73],
  [31.59, 130.66],
  [22.02, 128.33],
  [28.68, 83.6],
  [-1.41, 36.02],
  [19.02, 28.05],
  [37.73, 15.0],
  [-8.41, 115.19],
  [55.98, -160.53],
  [49.42, -123.5],
  [-37.52, 177.18],
  [14.17, 39.78],
  [-6.1, 105.42],
  [42.93, 142.44],
  [-4.08, 152.2],
]

const STEP_RE =
  /^\s*\d+\s+:?([^ ]+)\s+([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\s+([-+]?\d+\.?\d*)\s+.*?\s:?([A-Z]{3})\s*$/

function parseSteps(text) {
  const segments = []
  for (const line of text.split('\n')) {
    const match = line.match(STEP_RE)
    if (!match) continue
    const [, name, lon1, lat1, lon2, lat2, type] = match
    segments.push({
      name: name.replace(':', ''),
      type,
      coords: [
        [Number(lat1), Number(lon1)],
        [Number(lat2), Number(lon2)],
      ],
    })
  }
  return segments
}

function plateCodes(name) {
  const clean = name.replace(/\\/g, '/')
  if (clean.includes('/')) {
    const [a, b] = clean.split('/')
    return [a, b]
  }
  const dash = clean.indexOf('-')
  if (dash === -1) return [clean, '']
  return [clean.slice(0, dash), clean.slice(dash + 1)]
}

function isOceanContinentalSubduction(name) {
  const [a, b] = plateCodes(name)
  return CONTINENTAL_PLATES.has(a) !== CONTINENTAL_PLATES.has(b)
}

function keyPoint([lat, lon]) {
  return `${lat.toFixed(1)}:${lon.toFixed(1)}`
}

function pathLength(path) {
  let total = 0
  for (let i = 1; i < path.length; i += 1) {
    const [lat1, lon1] = path[i - 1]
    const [lat2, lon2] = path[i]
    total += Math.hypot(lat2 - lat1, lon2 - lon1)
  }
  return total
}

function decimatePath(path, minDistanceDeg = 0.55) {
  if (path.length <= 2) return path
  const out = [path[0]]
  for (let i = 1; i < path.length; i += 1) {
    const prev = out[out.length - 1]
    const cur = path[i]
    const dist = Math.hypot(cur[0] - prev[0], cur[1] - prev[1])
    if (dist >= minDistanceDeg || i === path.length - 1) out.push(cur)
  }
  return out
}

function classifyStepLayer(seg) {
  switch (seg.type) {
    case 'OSR':
    case 'CRB':
      return 'divergent'
    case 'OTF':
    case 'CTF':
      return 'transform'
    case 'CCB':
      return 'converge-continental'
    case 'OCB':
    case 'SUB':
      return isOceanContinentalSubduction(seg.name)
        ? 'converge-ocean-continental'
        : 'converge-ocean-ocean'
    default:
      return null
  }
}

/** Merge step segments of the same layer into continuous polylines. */
function mergeLayerPaths(segments, layer) {
  const edges = segments
    .filter((seg) => classifyStepLayer(seg) === layer)
    .map((seg) => seg.coords)

  const adjacency = new Map()
  const addEdge = (a, b) => {
    const ka = keyPoint(a)
    const kb = keyPoint(b)
    if (!adjacency.has(ka)) adjacency.set(ka, { point: a, neighbors: new Map() })
    if (!adjacency.has(kb)) adjacency.set(kb, { point: b, neighbors: new Map() })
    adjacency.get(ka).neighbors.set(kb, b)
    adjacency.get(kb).neighbors.set(ka, a)
  }

  for (const [start, end] of edges) addEdge(start, end)

  const visited = new Set()
  const paths = []

  const walk = (startKey) => {
    const chain = [adjacency.get(startKey).point]
    visited.add(startKey)
    let currentKey = startKey

    while (true) {
      const node = adjacency.get(currentKey)
      const nextEntry = [...node.neighbors.entries()].find(([key]) => !visited.has(key))
      if (!nextEntry) break
      const [nextKey, nextPoint] = nextEntry
      visited.add(nextKey)
      chain.push(nextPoint)
      currentKey = nextKey
    }

    return chain
  }

  for (const key of adjacency.keys()) {
    if (visited.has(key)) continue
    const chain = walk(key)
    if (chain.length >= 3 && pathLength(chain) >= 2.0) {
      paths.push(decimatePath(chain))
    }
  }

  return paths.sort((a, b) => pathLength(b) - pathLength(a))
}

function addSubductionFromGeoJSON(geojson, buckets) {
  for (const feature of geojson.features) {
    const name = feature.properties?.Name ?? ''
    if (!name.includes('/') && !name.includes('\\') && feature.properties?.Type !== 'subduction') {
      continue
    }
    const layer = isOceanContinentalSubduction(name)
      ? 'converge-ocean-continental'
      : 'converge-ocean-ocean'
    const coords = feature.geometry.coordinates.map(([lon, lat]) => [lat, lon])
    if (coords.length >= 2 && pathLength(coords) >= 1.5) {
      buckets[layer].push(decimatePath(coords, 0.35))
    }
  }
}

function dedupePaths(paths) {
  const seen = new Set()
  const out = []
  for (const path of paths) {
    const signature = path.map((p) => keyPoint(p)).join('|')
    if (seen.has(signature)) continue
    seen.add(signature)
    out.push(path)
  }
  return out
}

function buildSeismicZones(buckets) {
  return dedupePaths([
    ...buckets['converge-ocean-continental'],
    ...buckets['converge-ocean-ocean'],
    ...buckets.transform,
  ])
    .filter((path) => path.length >= 4)
    .sort((a, b) => pathLength(b) - pathLength(a))
    .slice(0, 14)
    .map((path) => decimatePath(path, 0.75))
}

function main() {
  const stepsText = fs.readFileSync(stepsPath, 'utf8')
  const geojson = JSON.parse(fs.readFileSync(boundariesPath, 'utf8'))
  const segments = parseSteps(stepsText)

  const buckets = {
    divergent: dedupePaths(mergeLayerPaths(segments, 'divergent')),
    'converge-ocean-continental': [],
    'converge-ocean-ocean': [],
    'converge-continental': dedupePaths(mergeLayerPaths(segments, 'converge-continental')),
    transform: dedupePaths(mergeLayerPaths(segments, 'transform')),
  }

  addSubductionFromGeoJSON(geojson, buckets)
  buckets['converge-ocean-continental'] = dedupePaths(buckets['converge-ocean-continental'])
  buckets['converge-ocean-ocean'] = dedupePaths(buckets['converge-ocean-ocean'])

  // Also add OCB/SUB segments from steps (GeoJSON misses some).
  for (const layer of ['converge-ocean-continental', 'converge-ocean-ocean']) {
    buckets[layer].push(...dedupePaths(mergeLayerPaths(segments, layer)))
    buckets[layer] = dedupePaths(buckets[layer]).sort((a, b) => pathLength(b) - pathLength(a))
  }

  const output = {
    source:
      'PB2002 plate boundaries (Bird 2003, doi:10.1029/2001GC000252). Volcano points from Smithsonian GVP.',
    layers: {
      divergent: buckets.divergent,
      'converge-ocean-continental': buckets['converge-ocean-continental'],
      'converge-ocean-ocean': buckets['converge-ocean-ocean'],
      'converge-continental': buckets['converge-continental'],
      transform: buckets.transform,
      volcanoes: VOLCANOES,
      seismic: buildSeismicZones(buckets),
    },
  }

  fs.writeFileSync(outPath, `${JSON.stringify(output)}\n`)
  for (const [id, paths] of Object.entries(output.layers)) {
    const count = Array.isArray(paths) ? paths.length : paths.length
    console.log(`${id}: ${count} ${id === 'volcanoes' ? 'points' : 'paths'}`)
  }
  console.log(`Wrote ${outPath} (${fs.statSync(outPath).size} bytes)`)
}

main()
