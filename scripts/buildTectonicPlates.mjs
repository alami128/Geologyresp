/**
 * Extract plate label positions and boundary outlines from PB2002.
 * Run via: npm run build:tectonics
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const platesPath = path.join(root, 'public/data/PB2002_plates.json')
const boundariesPath = path.join(root, 'public/data/PB2002_boundaries.json')
const labelsOutPath = path.join(root, 'src/tectonics/tectonicPlateLabels.json')
const outlinesOutPath = path.join(root, 'src/tectonics/tectonicPlateOutlines.json')

const DEG = Math.PI / 180

const MAJOR_PLATE_CODES = new Set([
  'PA',
  'NA',
  'SA',
  'EU',
  'AF',
  'AN',
  'AU',
  'IN',
  'NZ',
  'CO',
  'PS',
  'SO',
  'AR',
  'SU',
  'CA',
  'SC',
  'JF',
  'OK',
  'AM',
  'YA',
])

function collectRings(geometry) {
  if (geometry.type === 'Polygon') return [geometry.coordinates[0]]
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.map((poly) => poly[0])
  return []
}

function addLonLat(acc, lon, lat) {
  const phi = (90 - lat) * DEG
  const theta = (lon + 180) * DEG
  acc.x += -Math.sin(phi) * Math.cos(theta)
  acc.y += Math.cos(phi)
  acc.z += Math.sin(phi) * Math.sin(theta)
  acc.n += 1
}

function vectorToLatLon(x, y, z) {
  const len = Math.hypot(x, y, z) || 1
  const nx = x / len
  const ny = y / len
  const nz = z / len
  const lat = Math.asin(Math.max(-1, Math.min(1, ny))) / DEG
  const lon = (Math.atan2(nz, -nx) * 180) / Math.PI - 180
  return [lat, ((lon + 540) % 360) - 180]
}

function decimatePath(coords, minDistanceDeg = 0.45) {
  if (coords.length < 2) return coords
  const out = [coords[0]]
  for (let i = 1; i < coords.length; i += 1) {
    const prev = out[out.length - 1]
    const cur = coords[i]
    const dist = Math.hypot(cur[0] - prev[0], cur[1] - prev[1])
    if (dist >= minDistanceDeg || i === coords.length - 1) out.push(cur)
  }
  return out
}

function buildLabels(geojson) {
  const grouped = new Map()

  for (const feature of geojson.features) {
    const code = feature.properties?.Code
    const name = feature.properties?.PlateName
    if (!code || !name) continue

    if (!grouped.has(code)) {
      grouped.set(code, { code, name, x: 0, y: 0, z: 0, n: 0 })
    }
    const acc = grouped.get(code)

    for (const ring of collectRings(feature.geometry)) {
      for (const [lon, lat] of ring) addLonLat(acc, lon, lat)
    }
  }

  return [...grouped.values()]
    .map(({ code, name, x, y, z, n }) => {
      const [lat, lon] = vectorToLatLon(x, y, z)
      return {
        code,
        name,
        lat: Math.round(lat * 100) / 100,
        lon: Math.round(lon * 100) / 100,
        tier: MAJOR_PLATE_CODES.has(code) ? 'major' : 'minor',
        vertices: n,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

function buildOutlines(geojson) {
  return geojson.features
    .map((feature) => {
      const coords = feature.geometry.coordinates.map(([lon, lat]) => [
        Math.round(lat * 100) / 100,
        Math.round(lon * 100) / 100,
      ])
      return decimatePath(coords, 0.4)
    })
    .filter((path) => path.length >= 2)
}

function main() {
  const plates = JSON.parse(fs.readFileSync(platesPath, 'utf8'))
  const boundaries = JSON.parse(fs.readFileSync(boundariesPath, 'utf8'))

  const labelData = {
    source: 'PB2002 plates (Bird 2003)',
    plates: buildLabels(plates),
  }

  const outlineData = {
    source: 'PB2002 plate boundaries (Bird 2003)',
    paths: buildOutlines(boundaries),
  }

  fs.writeFileSync(labelsOutPath, `${JSON.stringify(labelData, null, 2)}\n`)
  fs.writeFileSync(outlinesOutPath, `${JSON.stringify(outlineData)}\n`)

  console.log(`Wrote ${labelData.plates.length} plate labels to ${labelsOutPath}`)
  console.log(`Wrote ${outlineData.paths.length} outline paths to ${outlinesOutPath}`)
}

main()
