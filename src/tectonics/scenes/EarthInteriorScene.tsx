import { Center, OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { Group, Object3D } from 'three'
import { LoopOnce } from 'three'
import {
  EARTH_STRUCTURE_LAYERS,
  getLayerByIdSafe,
  getPrimaryLayerForModelId,
  type EarthDiagramLayerId,
  type EarthLayerInfo,
  type EarthModelLayerId,
} from '../earthStructureLayers'
import {
  EARTH_INTERIOR_ANIMATION,
  EARTH_INTERIOR_MODEL,
} from '../earthInteriorModel'
import {
  applyEarthInteriorHighlight,
  pickLayerFromMesh,
  prepareEarthInteriorMaterials,
} from '../shared/earthInteriorMaterials'

type EarthInteriorSceneProps = {
  scale?: number
  minDistance?: number
  maxDistance?: number
  selectedLayerId: EarthDiagramLayerId | null
  playAnimationKey: number
  onLayerSelect: (layer: EarthLayerInfo) => void
}

function AnimatedEarthInterior({
  scale = 0.55,
  selectedLayerId,
  playAnimationKey,
  onLayerSelect,
}: Omit<EarthInteriorSceneProps, 'minDistance' | 'maxDistance'>) {
  const groupRef = useRef<Group>(null)
  const hoveredRef = useRef<EarthModelLayerId | null>(null)
  const gltf = useGLTF(EARTH_INTERIOR_MODEL)
  const { actions, mixer } = useAnimations(gltf.animations, groupRef)

  const selectedLayerInfo = useMemo(
    () => getLayerByIdSafe(selectedLayerId),
    [selectedLayerId],
  )

  const selectedModelLayerId = selectedLayerInfo?.modelLayerId ?? null

  useLayoutEffect(() => {
    prepareEarthInteriorMaterials(gltf.scene)
  }, [gltf.scene])

  const playExplode = useCallback(() => {
    const action = actions[EARTH_INTERIOR_ANIMATION]
    if (!action) return

    action.reset()
    action.setLoop(LoopOnce, 1)
    action.clampWhenFinished = true
    action.paused = false
    action.fadeIn(0.2).play()
  }, [actions])

  useEffect(() => {
    playExplode()
  }, [playAnimationKey, playExplode])

  useEffect(() => {
    if (!selectedLayerId) return
    hoveredRef.current = null
  }, [selectedLayerId])

  useEffect(() => {
    if (!selectedLayerId || !mixer) return
    const action = actions[EARTH_INTERIOR_ANIMATION]
    if (!action) return

    action.paused = false
    action.time = action.getClip().duration
    action.clampWhenFinished = true
    mixer.update(0)
  }, [actions, mixer, selectedLayerId])

  useFrame(({ clock }) => {
    if (!groupRef.current) return

    const pulse = selectedModelLayerId ? 0.85 + Math.sin(clock.elapsedTime * 4) * 0.15 : 1

    applyEarthInteriorHighlight(
      groupRef.current,
      selectedModelLayerId,
      hoveredRef.current,
      (id) => EARTH_STRUCTURE_LAYERS.find((layer) => layer.modelLayerId === id)?.color ?? '#ffffff',
      selectedLayerInfo?.color ?? null,
      pulse,
    )
  })

  const handlePointerMove = useCallback((event: { object: Object3D; stopPropagation: () => void }) => {
    event.stopPropagation()
    hoveredRef.current = pickLayerFromMesh(event.object)
    document.body.style.cursor = hoveredRef.current ? 'pointer' : 'auto'
  }, [])

  const handlePointerOut = useCallback(() => {
    hoveredRef.current = null
    document.body.style.cursor = 'auto'
  }, [])

  const handleClick = useCallback(
    (event: { object: Object3D; stopPropagation: () => void }) => {
      event.stopPropagation()
      const modelLayerId = pickLayerFromMesh(event.object)
      if (!modelLayerId) return
      onLayerSelect(getPrimaryLayerForModelId(modelLayerId))
    },
    [onLayerSelect],
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
        <primitive object={gltf.scene} />
      </group>
    </Center>
  )
}

function ModelFallback({ scale = 0.55 }: { scale?: number }) {
  return (
    <Center>
      <mesh scale={scale}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial color="#1a4a7a" wireframe />
      </mesh>
    </Center>
  )
}

export function EarthInteriorScene({
  scale,
  minDistance,
  maxDistance,
  selectedLayerId,
  playAnimationKey,
  onLayerSelect,
}: EarthInteriorSceneProps) {
  return (
    <>
      <color attach="background" args={['#0a1628']} />
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1.25} color="#fff8ee" />
      <directionalLight position={[-3, -1, -4]} intensity={0.45} color="#6a9fd4" />
      <pointLight position={[0, -2, 2]} intensity={0.75} color="#ffb347" distance={14} />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableZoom
        enablePan={false}
        enableRotate
        minDistance={minDistance ?? 1.8}
        maxDistance={maxDistance ?? 16}
        rotateSpeed={0.85}
        zoomSpeed={1.05}
      />

      <Suspense fallback={<ModelFallback scale={scale} />}>
        <AnimatedEarthInterior
          scale={scale}
          selectedLayerId={selectedLayerId}
          playAnimationKey={playAnimationKey}
          onLayerSelect={onLayerSelect}
        />
      </Suspense>
    </>
  )
}

useGLTF.preload(EARTH_INTERIOR_MODEL)
