import { Center, Html, OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Box3, Sphere, Vector3, type Group } from 'three'
import {
  EARTH_STRUCTURE_LAYERS,
  getLayerHotspotPosition,
  resolveLayerFromLocalPoint,
  type EarthLayerInfo,
  type LayerBounds,
} from '../earthStructureLayers'
import {
  highlightLayerMeshes,
  prepareSketchfabMaterials,
} from '../shared/earthStructureMaterials'

const MODEL_PATH = '/models/earth-structure.glb'

type EarthStructureModelSceneProps = {
  scale?: number
  minDistance?: number
  maxDistance?: number
  selectedLayerId: EarthLayerInfo['id'] | null
  onLayerSelect: (layer: EarthLayerInfo) => void
}

function InteractiveEarthModel({
  scale = 0.48,
  selectedLayerId,
  hoveredLayerId,
  onLayerSelect,
  onLayerHover,
  onBoundsReady,
}: {
  scale?: number
  selectedLayerId: EarthLayerInfo['id'] | null
  hoveredLayerId: EarthLayerInfo['id'] | null
  onLayerSelect: (layer: EarthLayerInfo) => void
  onLayerHover: (layerId: EarthLayerInfo['id'] | null) => void
  onBoundsReady: (bounds: LayerBounds) => void
}) {
  const groupRef = useRef<Group>(null)
  const boundsRef = useRef<LayerBounds | null>(null)
  const gltf = useGLTF(MODEL_PATH)

  const scene = useMemo(() => {
    const cloned = gltf.scene.clone(true)
    prepareSketchfabMaterials(cloned)
    return cloned
  }, [gltf.scene])

  useEffect(() => {
    if (!groupRef.current) return

    const box = new Box3().setFromObject(groupRef.current)
    const center = box.getCenter(new Vector3())
    const sphere = box.getBoundingSphere(new Sphere())
    const bounds: LayerBounds = { box, radius: sphere.radius, center }
    boundsRef.current = bounds
    onBoundsReady(bounds)
  }, [scene, scale, onBoundsReady])

  useEffect(() => {
    if (!groupRef.current) return

    const activeLayerId = hoveredLayerId ?? selectedLayerId
    highlightLayerMeshes(groupRef.current, activeLayerId, (id) => {
      return EARTH_STRUCTURE_LAYERS.find((layer) => layer.id === id)?.color
    })
  }, [hoveredLayerId, selectedLayerId])

  const pickLayer = useCallback((worldPoint: Vector3) => {
    if (!groupRef.current || !boundsRef.current) return null
    const localPoint = groupRef.current.worldToLocal(worldPoint.clone())
    return resolveLayerFromLocalPoint(localPoint, boundsRef.current)
  }, [])

  const handlePointerMove = useCallback(
    (event: { point: Vector3; stopPropagation: () => void }) => {
      event.stopPropagation()
      const layer = pickLayer(event.point)
      onLayerHover(layer?.id ?? null)
      document.body.style.cursor = layer ? 'pointer' : 'auto'
    },
    [onLayerHover, pickLayer],
  )

  const handlePointerOut = useCallback(() => {
    onLayerHover(null)
    document.body.style.cursor = 'auto'
  }, [onLayerHover])

  const handleClick = useCallback(
    (event: { point: Vector3; stopPropagation: () => void }) => {
      event.stopPropagation()
      const layer = pickLayer(event.point)
      if (layer) onLayerSelect(layer)
    },
    [onLayerSelect, pickLayer],
  )

  useEffect(() => {
    return () => {
      document.body.style.cursor = 'auto'
    }
  }, [])

  return (
    <Center>
      <group
        ref={groupRef}
        scale={scale}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <primitive object={scene} />
      </group>
    </Center>
  )
}

function LayerHotspots({
  bounds,
  selectedLayerId,
  hoveredLayerId,
  onLayerSelect,
  onLayerHover,
}: {
  bounds: LayerBounds | null
  selectedLayerId: EarthLayerInfo['id'] | null
  hoveredLayerId: EarthLayerInfo['id'] | null
  onLayerSelect: (layer: EarthLayerInfo) => void
  onLayerHover: (layerId: EarthLayerInfo['id'] | null) => void
}) {
  if (!bounds) return null

  return (
    <>
      {EARTH_STRUCTURE_LAYERS.map((layer) => {
        const position = getLayerHotspotPosition(layer, bounds)
        const active = selectedLayerId === layer.id || hoveredLayerId === layer.id

        return (
          <Html
            key={layer.id}
            position={position}
            center
            distanceFactor={14}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: 'none' }}
          >
            <button
              type="button"
              className={`earth-layer-hotspot${active ? ' earth-layer-hotspot--active' : ''}`}
              style={{ '--layer-color': layer.color } as CSSProperties}
              aria-label={`Learn about the ${layer.title}`}
              onPointerEnter={() => onLayerHover(layer.id)}
              onPointerLeave={() => onLayerHover(null)}
              onClick={(event) => {
                event.stopPropagation()
                onLayerSelect(layer)
              }}
            >
              <span className="earth-layer-hotspot__dot" aria-hidden="true" />
              <span className="earth-layer-hotspot__label">{layer.title}</span>
            </button>
          </Html>
        )
      })}
    </>
  )
}

function ModelFallback({ scale = 0.48 }: { scale?: number }) {
  return (
    <Center>
      <mesh scale={scale}>
        <sphereGeometry args={[1.2, 32, 32]} />
        <meshStandardMaterial color="#2a7fc4" wireframe />
      </mesh>
    </Center>
  )
}

export function EarthStructureModelScene({
  scale,
  minDistance,
  maxDistance,
  selectedLayerId,
  onLayerSelect,
}: EarthStructureModelSceneProps) {
  const [bounds, setBounds] = useState<LayerBounds | null>(null)
  const [hoveredLayerId, setHoveredLayerId] = useState<EarthLayerInfo['id'] | null>(null)

  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableZoom
        enablePan
        enableRotate
        minDistance={minDistance ?? 2.5}
        maxDistance={maxDistance ?? 30}
        rotateSpeed={0.85}
        zoomSpeed={1.1}
        panSpeed={0.7}
      />
      <Suspense fallback={<ModelFallback scale={scale} />}>
        <InteractiveEarthModel
          scale={scale}
          selectedLayerId={selectedLayerId}
          hoveredLayerId={hoveredLayerId}
          onLayerSelect={onLayerSelect}
          onLayerHover={setHoveredLayerId}
          onBoundsReady={setBounds}
        />
        <LayerHotspots
          bounds={bounds}
          selectedLayerId={selectedLayerId}
          hoveredLayerId={hoveredLayerId}
          onLayerSelect={onLayerSelect}
          onLayerHover={setHoveredLayerId}
        />
      </Suspense>
    </>
  )
}

useGLTF.preload(MODEL_PATH)
