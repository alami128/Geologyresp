import type { Camera, Object3D } from 'three'
import { Box3, Mesh, Raycaster, Vector3 } from 'three'
import type { MantleFlowDef } from '../mantleConvectionModel'

export type SnapMantleFlowsOptions = {
  /** Meshes to raycast against. Use the GLB root, not groups that also hold flow lines. */
  meshRoot?: Object3D
  camera?: Camera | null
  /** Project flows onto the cross-section cut face at this local Z. */
  cutFaceZ?: number
  /** Nudge toward the camera so lines sit on the visible face. */
  surfaceOffset?: number
}

const RAY_DEPTH = 18

const _origin = new Vector3()
const _target = new Vector3()
const _direction = new Vector3()
const _normal = new Vector3()

/** Earth cross-section meshes only (exclude animated plate rig). */
function collectCrossSectionMeshes(root: Object3D): Mesh[] {
  const meshes: Mesh[] = []

  root.traverse((child) => {
    if (!(child instanceof Mesh)) return
    if (child.type === 'Line2' || child.type === 'LineSegments2') return

    let node: Object3D | null = child
    while (node && node !== root) {
      const name = node.name
      if (
        name.includes('Moving tectonic plates') ||
        name.includes('Plate_') ||
        name.includes('row') ||
        name.includes('Skeleton') ||
        name.includes('skeletal')
      ) {
        return
      }
      node = node.parent
    }

    meshes.push(child)
  })

  return meshes
}

function snapFlowsToCutFace(
  flows: MantleFlowDef[],
  cutFaceZ: number,
  surfaceOffset: number,
): MantleFlowDef[] {
  const z = cutFaceZ + surfaceOffset

  return flows.map((flow) => ({
    ...flow,
    points: flow.points.map(([x, y]) => [x, y, z] as [number, number, number]),
  }))
}

function castOntoSurface(
  raycaster: Raycaster,
  meshes: Mesh[],
  anchor: Object3D,
  localX: number,
  localY: number,
  localZ: number,
  surfaceOffset: number,
): Vector3 | null {
  _origin.set(localX, localY, localZ + RAY_DEPTH)
  _target.set(localX, localY, localZ - RAY_DEPTH)
  anchor.localToWorld(_origin)
  anchor.localToWorld(_target)
  _direction.copy(_target).sub(_origin).normalize()
  raycaster.set(_origin, _direction)

  const hits = raycaster.intersectObjects(meshes, false)
  if (hits.length === 0) return null

  const hit = hits[0]
  const point = hit.point.clone()

  if (hit.face) {
    _normal.copy(hit.face.normal).transformDirection(hit.object.matrixWorld).normalize()
    point.addScaledVector(_normal, surfaceOffset)
  }

  return point
}

function snapPointToSurface(
  raycaster: Raycaster,
  meshes: Mesh[],
  anchor: Object3D,
  x: number,
  y: number,
  zHint: number,
  surfaceOffset: number,
): [number, number, number] {
  const hit =
    castOntoSurface(raycaster, meshes, anchor, x, y, zHint, surfaceOffset) ??
    castOntoSurface(raycaster, meshes, anchor, x, y, zHint * 0.5, surfaceOffset)

  if (!hit) {
    const fallback = anchor.worldToLocal(new Vector3(x, y, zHint))
    return [fallback.x, fallback.y, fallback.z]
  }

  anchor.worldToLocal(hit)
  return [hit.x, hit.y, hit.z]
}

export function getMeshCutFaceZ(meshRoot: Object3D): number {
  const box = new Box3().setFromObject(meshRoot)
  return box.max.z
}

export function snapMantleFlowsToSurface(
  anchor: Object3D,
  flows: MantleFlowDef[],
  options: SnapMantleFlowsOptions = {},
): MantleFlowDef[] {
  const meshRoot = options.meshRoot ?? anchor
  const surfaceOffset = options.surfaceOffset ?? 0.004

  if (options.cutFaceZ !== undefined) {
    return snapFlowsToCutFace(flows, options.cutFaceZ, surfaceOffset)
  }

  anchor.updateMatrixWorld(true)
  meshRoot.updateMatrixWorld(true)

  const meshes = collectCrossSectionMeshes(meshRoot)
  if (meshes.length === 0) {
    return flows
  }

  const raycaster = new Raycaster()
  if (options.camera) {
    raycaster.camera = options.camera
  }

  return flows.map((flow) => ({
    ...flow,
    points: flow.points.map(([x, y, z]) =>
      snapPointToSurface(raycaster, meshes, anchor, x, y, z, surfaceOffset),
    ),
  }))
}
