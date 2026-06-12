import type { Object3D } from 'three'
import { Color, Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three'
import type { EarthModelLayerId } from '../earthStructureLayers'
import { materialNameToLayerId } from '../earthInteriorModel'

function getMaterialName(material: MeshStandardMaterial | unknown): string {
  if (material instanceof MeshStandardMaterial && material.name) return material.name
  return ''
}

/** Clone materials so highlights never mutate the cached GLTF. */
export function prepareEarthInteriorMaterials(scene: Object3D) {
  scene.traverse((child) => {
    if (!(child instanceof Mesh) || child.userData.earthInteriorPrepared) return

    child.userData.clickable = true
    child.userData.earthInteriorPrepared = true
    const materials = Array.isArray(child.material) ? child.material : [child.material]
    const cloned = materials.map((material) => material.clone())

    for (const material of cloned) {
      if (material instanceof MeshStandardMaterial) {
        if (material.map) material.map.colorSpace = SRGBColorSpace
        if (material.emissiveMap) material.emissiveMap.colorSpace = SRGBColorSpace
        material.opacity = 1
        material.transparent = false
        child.userData.layerId = materialNameToLayerId(material.name)
      }
    }

    child.material = cloned.length === 1 ? cloned[0] : cloned
  })
}

function cacheMaterialBase(entry: MeshStandardMaterial) {
  if (!(entry.userData.baseColor instanceof Color)) {
    entry.userData.baseColor = entry.color.clone()
  }
  if (!(entry.userData.baseEmissive instanceof Color)) {
    entry.userData.baseEmissive = entry.emissive.clone()
  }
  if (entry.userData.baseEmissiveIntensity === undefined) {
    entry.userData.baseEmissiveIntensity = entry.emissiveIntensity
  }
  if (entry.userData.baseOpacity === undefined) {
    entry.userData.baseOpacity = 1
  }
  entry.opacity = 1
  entry.transparent = false
}

function setMeshVisual(
  mesh: Mesh,
  mode: 'normal' | 'dim' | 'highlight',
  accentColor?: string,
  pulse = 1,
) {
  const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]

  for (const entry of materials) {
    if (!(entry instanceof MeshStandardMaterial)) continue
    cacheMaterialBase(entry)

    if (mode === 'normal') {
      entry.opacity = 1
      entry.transparent = false
      entry.color.copy(entry.userData.baseColor as Color)
      entry.emissive.copy(entry.userData.baseEmissive as Color)
      entry.emissiveIntensity = entry.userData.baseEmissiveIntensity as number
      continue
    }

    if (mode === 'dim') {
      entry.opacity = 1
      entry.transparent = false
      entry.color.copy(entry.userData.baseColor as Color).multiplyScalar(0.42)
      entry.emissive.copy(entry.userData.baseEmissive as Color).multiplyScalar(0.25)
      entry.emissiveIntensity = (entry.userData.baseEmissiveIntensity as number) * 0.25
      continue
    }

    const glow = accentColor ?? '#ffd54f'
    entry.opacity = 1
    entry.transparent = false
    entry.color.copy(entry.userData.baseColor as Color).lerp(new Color(glow), 0.22)
    entry.emissive.set(glow)
    entry.emissiveIntensity = Math.max((entry.userData.baseEmissiveIntensity as number) * pulse, 1.6 * pulse)
  }
}

export function applyEarthInteriorHighlight(
  root: Object3D,
  activeLayerId: EarthModelLayerId | null,
  hoveredLayerId: EarthModelLayerId | null,
  getLayerColor: (id: EarthModelLayerId) => string,
  activeAccentColor?: string | null,
  pulse = 1,
) {
  const focusId = hoveredLayerId ?? activeLayerId
  const accent =
    activeAccentColor ??
    (focusId ? getLayerColor(focusId) : undefined)

  root.traverse((child) => {
    if (!(child instanceof Mesh) || !child.userData.clickable) return

    const layerId = child.userData.layerId as EarthModelLayerId | undefined
    if (!layerId) {
      setMeshVisual(child, 'normal')
      return
    }

    if (!focusId) {
      setMeshVisual(child, 'normal')
      return
    }

    if (layerId === focusId) {
      setMeshVisual(child, 'highlight', accent, pulse)
    } else {
      setMeshVisual(child, 'dim')
    }
  })
}

export function pickLayerFromMesh(object: Object3D | null): EarthModelLayerId | null {
  if (!object) return null

  let current: Object3D | null = object
  while (current) {
    if (current.userData.layerId) return current.userData.layerId as EarthModelLayerId
    const materials =
      current instanceof Mesh
        ? Array.isArray(current.material)
          ? current.material
          : [current.material]
        : []
    for (const material of materials) {
      const layerId = materialNameToLayerId(getMaterialName(material))
      if (layerId) return layerId
    }
    current = current.parent
  }

  return null
}
