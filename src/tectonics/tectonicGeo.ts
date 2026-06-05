import { latLonToPosition } from './earthTopics'
import type { LatLon } from './tectonicLayers'

const DEG = Math.PI / 180

export function latLonToUnitVector([lat, lon]: LatLon): [number, number, number] {
  const [x, y, z] = latLonToPosition(lat, lon, 1)
  return [x, y, z]
}

export function unitVectorToLatLon(x: number, y: number, z: number): LatLon {
  const lat = Math.asin(Math.max(-1, Math.min(1, y))) / DEG
  const lon = (Math.atan2(z, -x) * 180) / Math.PI - 180
  return [lat, ((lon + 540) % 360) - 180]
}

/** Interpolate along the sphere surface (great-circle arc). */
export function slerpLatLon(a: LatLon, b: LatLon, t: number): LatLon {
  const ax = latLonToUnitVector(a)
  const bx = latLonToUnitVector(b)
  let dot = ax[0] * bx[0] + ax[1] * bx[1] + ax[2] * bx[2]
  dot = Math.max(-1, Math.min(1, dot))

  if (dot > 0.9999) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
  }

  const omega = Math.acos(dot)
  const sinOmega = Math.sin(omega)
  const wa = Math.sin((1 - t) * omega) / sinOmega
  const wb = Math.sin(t * omega) / sinOmega

  const x = ax[0] * wa + bx[0] * wb
  const y = ax[1] * wa + bx[1] * wb
  const z = ax[2] * wa + bx[2] * wb

  return unitVectorToLatLon(x, y, z)
}

export function densifyPath(coords: LatLon[], segmentsPerLeg = 14): LatLon[] {
  if (coords.length < 2) return coords

  const dense: LatLon[] = []
  for (let i = 0; i < coords.length - 1; i += 1) {
    const start = coords[i]
    const end = coords[i + 1]
    for (let s = 0; s <= segmentsPerLeg; s += 1) {
      if (i > 0 && s === 0) continue
      dense.push(slerpLatLon(start, end, s / segmentsPerLeg))
    }
  }
  return dense
}

export function surfacePoints(
  coords: LatLon[],
  radius: number,
  segmentsPerLeg = 14,
): [number, number, number][] {
  return densifyPath(coords, segmentsPerLeg).map(
    (point) => latLonToPosition(point[0], point[1], radius) as [number, number, number],
  )
}

export function surfacePoint(latLon: LatLon, radius: number): [number, number, number] {
  return latLonToPosition(latLon[0], latLon[1], radius) as [number, number, number]
}
