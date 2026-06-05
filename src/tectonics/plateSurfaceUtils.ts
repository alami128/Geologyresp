import { latLonToPosition } from './earthTopics'
import { Matrix4, Quaternion, Vector3 } from 'three'

const _east = new Vector3()
const _north = new Vector3()
const _outward = new Vector3()
const _matrix = new Matrix4()

export function getSurfaceFrame(
  lat: number,
  lon: number,
  radius: number,
): {
  position: [number, number, number]
  quaternion: Quaternion
} {
  const [x, y, z] = latLonToPosition(lat, lon, radius)
  _outward.set(x, y, z).normalize()

  _east.set(-_outward.z, 0, _outward.x)
  if (_east.lengthSq() < 1e-6) _east.set(1, 0, 0)
  _east.normalize()

  _north.crossVectors(_outward, _east).normalize()

  _matrix.makeBasis(_east, _north, _outward)

  return {
    position: [x, y, z],
    quaternion: new Quaternion().setFromRotationMatrix(_matrix),
  }
}
