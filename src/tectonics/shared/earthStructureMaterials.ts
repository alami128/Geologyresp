import type { Object3D } from 'three'
import { Mesh, MeshStandardMaterial, SRGBColorSpace } from 'three'

export type EarthStructureMeshKind = 'crust' | 'inner'

export function getEarthStructureMeshKind(meshName: string): EarthStructureMeshKind | null {
  if (meshName.includes('Earth_BaseColor')) return 'crust'
  if (meshName.includes('Mat.2')) return 'inner'
  return null
}

/** Clone Sketchfab materials so highlights do not mutate the cached GLTF. */
export function prepareSketchfabMaterials(scene: Object3D) {
  scene.traverse((child) => {
    if (!(child instanceof Mesh)) return

    child.userData.clickable = true
    const kind = getEarthStructureMeshKind(child.name)
    if (kind) child.userData.meshKind = kind

    const materials = Array.isArray(child.material) ? child.material : [child.material]
    const cloned = materials.map((material) => material.clone())

    for (const material of cloned) {
      if (material instanceof MeshStandardMaterial && material.map) {
        material.map.colorSpace = SRGBColorSpace
      }
    }

    child.material = cloned.length === 1 ? cloned[0] : cloned
  })
}

function setMeshHighlight(mesh: Mesh, active: boolean, accentColor?: string) {
  const material = mesh.material
  const materials = Array.isArray(material) ? material : [material]

  for (const entry of materials) {
    if (!(entry instanceof MeshStandardMaterial)) continue

    if (!active) {
      entry.emissiveIntensity = entry.userData.baseEmissiveIntensity ?? entry.emissiveIntensity
      if (entry.userData.baseEmissive) {
        entry.emissive.copy(entry.userData.baseEmissive)
      }
      continue
    }

    if (entry.userData.baseEmissive === undefined) {
      entry.userData.baseEmissive = entry.emissive.clone()
      entry.userData.baseEmissiveIntensity = entry.emissiveIntensity
    }

    entry.emissive.set(accentColor ?? '#ffffff')
    entry.emissiveIntensity = Math.max(entry.userData.baseEmissiveIntensity ?? 0, 0.12)
  }
}

export function highlightLayerMeshes(
  root: Object3D,
  layerId: string | null,
  getLayerColor: (id: string) => string | undefined,
) {
  root.traverse((child) => {
    if (!(child instanceof Mesh)) return

    const kind = child.userData.meshKind as EarthStructureMeshKind | undefined
    if (!kind || !layerId) {
      setMeshHighlight(child, false)
      return
    }

    if (layerId === 'crust' && kind === 'crust') {
      setMeshHighlight(child, true, getLayerColor(layerId))
      return
    }

    if (layerId !== 'crust' && kind === 'inner') {
      setMeshHighlight(child, true, getLayerColor(layerId))
      return
    }

    setMeshHighlight(child, false)
  })
}
