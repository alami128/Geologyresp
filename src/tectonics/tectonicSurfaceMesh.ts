import {
  CatmullRomCurve3,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
} from 'three'
import type { LatLon } from './tectonicLayers'
import { surfacePoints } from './tectonicGeo'

const _point = new Vector3()

/** Sample count scales with path length so long boundaries stay smooth. */
export function tubeSegmentCount(pointCount: number) {
  return Math.min(96, Math.max(12, Math.ceil(pointCount * 1.4)))
}

export function clampPointsToSphere(
  points: [number, number, number][],
  radius: number,
): Vector3[] {
  return points.map(([x, y, z]) => _point.set(x, y, z).normalize().multiplyScalar(radius).clone())
}

export function buildSurfacePathPoints(
  path: LatLon[],
  globeRadius: number,
  lift: number,
  segmentsPerLeg = 24,
): [number, number, number][] {
  return surfacePoints(path, globeRadius + lift, segmentsPerLeg)
}

export function createBoundaryTubeGeometry(
  pathPoints: [number, number, number][],
  options: {
    globeRadius: number
    tubeRadius: number
    radialSegments?: number
  },
): BufferGeometry | null {
  if (pathPoints.length < 2) return null

  const trackRadius = options.globeRadius + options.tubeRadius * 0.85
  const clamped = clampPointsToSphere(pathPoints, trackRadius)

  let curvePoints = clamped
  if (clamped.length === 2) {
    const mid = clamped[0].clone().add(clamped[1]).multiplyScalar(0.5).normalize().multiplyScalar(trackRadius)
    curvePoints = [clamped[0], mid, clamped[1]]
  }

  const curve = new CatmullRomCurve3(curvePoints, false, 'centripetal', 0.12)
  const tubularSegments = tubeSegmentCount(pathPoints.length)

  const geometry = new TubeGeometry(
    curve,
    tubularSegments,
    options.tubeRadius,
    options.radialSegments ?? 8,
    false,
  )

  // Re-project every tube vertex onto the sphere shell so ribbons hug the globe.
  const pos = geometry.attributes.position
  for (let i = 0; i < pos.count; i += 1) {
    _point.fromBufferAttribute(pos, i).normalize().multiplyScalar(trackRadius + options.tubeRadius * 0.15)
    pos.setXYZ(i, _point.x, _point.y, _point.z)
  }
  pos.needsUpdate = true
  geometry.computeVertexNormals()

  return geometry
}
