import { OrbitControls, Stars } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { Group, MeshStandardMaterial } from 'three'
import { DoubleSide, Vector3 } from 'three'
import { AnimatedDashLine, useDashOffset } from '../shared/AnimatedDashLine'
import { EarthGlobe } from '../shared/EarthGlobe'
import { ExplorerLighting } from '../shared/ExplorerLighting'
import { PlateBoundaryLayer } from '../shared/PlateBoundaryLayer'
import { PlateLabels } from '../shared/PlateLabels'
import { surfacePoint } from '../tectonicGeo'
import {
  TECTONIC_LAYERS,
  type LatLon,
  type TectonicLayerDef,
  type TectonicLayerId,
} from '../tectonicLayers'

type TectonicPlatesSceneProps = {
  activeLayers: Record<TectonicLayerId, boolean>
  layerAnimKeys: Partial<Record<TectonicLayerId, number>>
}

const GLOBE_RADIUS = 1
const VOLCANO_LIFT = 0.006
const MIN_CAMERA_DISTANCE = 2.35

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

function AnimatedVolcano({
  latLon,
  color,
  playId,
  delay,
}: {
  latLon: LatLon
  color: string
  playId: number
  delay: number
}) {
  const groupRef = useRef<Group>(null)
  const materialRef = useRef<MeshStandardMaterial>(null)
  const progress = useRef(0)
  const done = useRef(false)
  const [x, y, z] = surfacePoint(latLon, GLOBE_RADIUS + VOLCANO_LIFT)
  const outward = useMemo(() => new Vector3(x, y, z).normalize(), [x, y, z])

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return
    group.position.set(x, y, z)
    group.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), outward)
  }, [outward, x, y, z])

  useEffect(() => {
    progress.current = 0
    done.current = false
    if (groupRef.current) groupRef.current.scale.setScalar(0)
  }, [playId])

  useFrame((_, delta) => {
    if (done.current || !groupRef.current) return

    progress.current = Math.min(1, progress.current + delta / 0.5)
    const eased = easeOutCubic(Math.min(1, Math.max(0, (progress.current - delay) / (1 - delay))))
    const pulse = eased > 0 ? 1 + Math.sin(eased * Math.PI) * 0.15 : 0

    groupRef.current.scale.setScalar(eased * pulse)
    if (materialRef.current) materialRef.current.opacity = eased * 0.95

    if (progress.current >= 1) {
      groupRef.current.scale.setScalar(1)
      if (materialRef.current) materialRef.current.opacity = 0.95
      done.current = true
    }
  })

  return (
    <group ref={groupRef} renderOrder={6}>
      <mesh>
        <coneGeometry args={[0.011, 0.028, 10]} />
        <meshStandardMaterial
          ref={materialRef}
          color={color}
          emissive={color}
          emissiveIntensity={0.55}
          roughness={0.45}
          metalness={0.08}
          transparent
          opacity={0}
          depthWrite
        />
      </mesh>
      <mesh position={[0, -0.008, 0]}>
        <sphereGeometry args={[0.007, 10, 10]} />
        <meshStandardMaterial
          color="#2a0808"
          emissive={color}
          emissiveIntensity={0.25}
          roughness={0.7}
          transparent
          opacity={0.85}
        />
      </mesh>
    </group>
  )
}

function AnimatedLayer({
  layer,
  playId,
  dashOffsetRef,
}: {
  layer: TectonicLayerDef
  playId: number
  dashOffsetRef: ReturnType<typeof useDashOffset>
}) {
  if (layer.kind === 'point') {
    return (
      <>
        {(layer.points ?? []).map((point, index) => (
          <AnimatedVolcano
            key={`${layer.id}-${index}-${playId}`}
            latLon={point}
            color={layer.color}
            playId={playId}
            delay={Math.min(0.35, index * 0.04)}
          />
        ))}
      </>
    )
  }

  if (layer.kind !== 'line' && layer.kind !== 'zone') return null

  const paths = layer.paths ?? []
  const zone = layer.kind === 'zone'

  return (
    <>
      {paths.map((path, index) => (
        <AnimatedDashLine
          key={`${layer.id}-${index}-${playId}`}
          path={path}
          color={layer.color}
          playId={playId}
          dashOffsetRef={dashOffsetRef}
          zone={zone}
          lift={zone ? 0.0028 : 0.003}
          renderOrder={zone ? 4 : 5}
        />
      ))}
    </>
  )
}

function TectonicCameraSetup() {
  const { camera } = useThree()

  useEffect(() => {
    camera.position.set(2.2, 0.35, 3.4)
    camera.near = 0.1
    camera.far = 100
    camera.updateProjectionMatrix()
  }, [camera])

  return (
    <OrbitControls
      makeDefault
      target={[0, 0, 0]}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.85}
      zoomSpeed={0.9}
      minDistance={MIN_CAMERA_DISTANCE}
      maxDistance={7.5}
      minPolarAngle={0.2}
      maxPolarAngle={Math.PI - 0.2}
      enablePan={false}
    />
  )
}

export function TectonicPlatesScene({ activeLayers, layerAnimKeys }: TectonicPlatesSceneProps) {
  const dashOffsetRef = useDashOffset(0.55)
  const showPlateBoundaries = activeLayers['plate-boundaries']
  const plateBoundaryPlayId = layerAnimKeys['plate-boundaries'] ?? 0

  const visibleLayers = TECTONIC_LAYERS.filter(
    (layer) => layer.id !== 'plate-boundaries' && activeLayers[layer.id],
  )

  return (
    <>
      <ExplorerLighting />
      <Stars radius={80} depth={40} count={3500} factor={3} saturation={0.12} fade speed={0.3} />

      <TectonicCameraSetup />

      <group renderOrder={0}>
        <EarthGlobe radius={GLOBE_RADIUS} />

        {showPlateBoundaries ? (
          <>
            <PlateBoundaryLayer playId={plateBoundaryPlayId} dashOffsetRef={dashOffsetRef} />
            <PlateLabels />
          </>
        ) : null}

        {visibleLayers.map((layer) => (
          <AnimatedLayer
            key={`${layer.id}-${layerAnimKeys[layer.id] ?? 0}`}
            layer={layer}
            playId={layerAnimKeys[layer.id] ?? 0}
            dashOffsetRef={dashOffsetRef}
          />
        ))}
      </group>

      <mesh scale={1.022} renderOrder={1}>
        <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
        <meshBasicMaterial
          color="#7ec8ff"
          transparent
          opacity={0.05}
          side={DoubleSide}
          depthWrite={false}
          depthTest
        />
      </mesh>
    </>
  )
}
