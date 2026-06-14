import { Center, Html, OrbitControls, Stars, useAnimations, useGLTF, useProgress } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import type { AnimationAction, Group, Object3D } from 'three'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import {
  SOLAR_SYSTEM_BODIES,
  SOLAR_SYSTEM_MODEL,
  SOLAR_SYSTEM_SETTINGS,
  type SolarBodyDef,
  type SolarBodyId,
} from '../solarSystemModels'
import { EarthZoomController } from '../useSolarEarthZoom'

export type EarthZoomPhase = 'idle' | 'zooming' | 'flash'

type SolarSystemSceneProps = {
  onSelectEarth: () => void
  zoomPhase: EarthZoomPhase
  onZoomPhaseChange: (phase: EarthZoomPhase) => void
  onZoomProgress: (progress: number) => void
}

type PlanetAnchor = SolarBodyDef & {
  anchor: Object3D
}

const labelOffset = new Vector3(0, 0.65, 0)

function PlanetNumberMarker({
  body,
  revealed,
  hidden,
  onClick,
}: {
  body: PlanetAnchor
  revealed: boolean
  hidden: boolean
  onClick: () => void
}) {
  const labelRef = useRef<Group>(null)
  const scratch = useRef(new Vector3())

  useFrame(() => {
    if (!labelRef.current || hidden) return
    body.anchor.getWorldPosition(scratch.current)
    scratch.current.add(labelOffset)
    labelRef.current.position.copy(scratch.current)
  })

  if (hidden) return null

  const isEarth = body.id === 'earth'

  return (
    <group ref={labelRef}>
      <Html
        center
        occlude={false}
        distanceFactor={SOLAR_SYSTEM_SETTINGS.labelDistanceFactor}
        zIndexRange={[40, 0]}
        style={{ pointerEvents: 'auto' }}
      >
        <button
          type="button"
          className={`solar-planet-number${revealed ? ' solar-planet-number--revealed' : ''}${isEarth ? ' solar-planet-number--earth' : ''}${revealed && isEarth ? ' solar-planet-number--earth-active' : ''}`}
          aria-label={
            revealed
              ? `${body.name}${isEarth ? ' · ouvre l’explorateur Terre' : ''}`
              : `Planète ${body.number}`
          }
          onClick={(event) => {
            event.stopPropagation()
            onClick()
          }}
        >
          {revealed ? body.name : body.number}
        </button>
      </Html>
    </group>
  )
}

function SolarSystemModel({
  zoomPhase,
  onZoomPhaseChange,
  onZoomProgress,
  onSelectEarth,
}: Pick<SolarSystemSceneProps, 'zoomPhase' | 'onZoomPhaseChange' | 'onZoomProgress' | 'onSelectEarth'>) {
  const groupRef = useRef<Group>(null)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const [planetAnchors, setPlanetAnchors] = useState<PlanetAnchor[]>([])
  const [revealedId, setRevealedId] = useState<SolarBodyId | null>(null)
  const [earthAnchor, setEarthAnchor] = useState<Object3D | null>(null)
  const gltf = useGLTF(SOLAR_SYSTEM_MODEL)
  const { actions } = useAnimations(gltf.animations, groupRef)

  const zooming = zoomPhase !== 'idle'

  useEffect(() => {
    const anchors = SOLAR_SYSTEM_BODIES.flatMap((body) => {
      const anchor = gltf.scene.getObjectByName(body.nodeName)
      return anchor ? [{ ...body, anchor }] : []
    })
    setPlanetAnchors(anchors)
    setEarthAnchor(gltf.scene.getObjectByName('erath_8') ?? null)
  }, [gltf.scene])

  useEffect(() => {
    const runningActions = Object.values(actions).filter(
      (action): action is AnimationAction => Boolean(action),
    )

    for (const action of runningActions) {
      action.reset().fadeIn(0.25).play()
    }

    return () => {
      for (const action of runningActions) {
        action.fadeOut(0.2)
      }
    }
  }, [actions])

  const handleZoomComplete = useCallback(() => {
    onZoomPhaseChange('flash')
    window.setTimeout(() => {
      onSelectEarth()
    }, SOLAR_SYSTEM_SETTINGS.earthZoomFlashMs)
  }, [onSelectEarth, onZoomPhaseChange])

  const handlePlanetClick = (body: PlanetAnchor) => {
    if (zooming) return

    if (body.id === 'earth') {
      onZoomPhaseChange('zooming')
      return
    }

    setRevealedId((current) => (current === body.id ? null : body.id))
  }

  return (
    <>
      <Center>
        <group ref={groupRef} scale={SOLAR_SYSTEM_SETTINGS.scale}>
          <primitive object={gltf.scene} frustumCulled={false} />
        </group>
      </Center>

      {planetAnchors.map((body) => (
        <PlanetNumberMarker
          key={body.id}
          body={body}
          revealed={revealedId === body.id}
          hidden={zooming}
          onClick={() => handlePlanetClick(body)}
        />
      ))}

      <EarthZoomController
        earthAnchor={earthAnchor}
        active={zoomPhase === 'zooming'}
        controlsRef={controlsRef}
        onProgress={onZoomProgress}
        onComplete={handleZoomComplete}
      />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enabled={!zooming}
        enableDamping
        enableZoom
        dampingFactor={0.06}
        rotateSpeed={0.7}
        zoomSpeed={SOLAR_SYSTEM_SETTINGS.zoomSpeed}
        minDistance={SOLAR_SYSTEM_SETTINGS.minDistance}
        maxDistance={SOLAR_SYSTEM_SETTINGS.maxDistance}
        enablePan={false}
        maxPolarAngle={Math.PI / 1.65}
      />
    </>
  )
}

function ModelFallback() {
  return (
    <mesh>
      <sphereGeometry args={[1.2, 32, 32]} />
      <meshStandardMaterial color="#2a7fc4" wireframe emissive="#2a7fc4" emissiveIntensity={0.4} />
    </mesh>
  )
}

function SceneLoader() {
  const { progress, active } = useProgress()
  if (!active) return null

  return (
    <Html center zIndexRange={[30, 0]}>
      <div className="solar-loading">
        Chargement du système solaire… {Math.round(progress)} %
      </div>
    </Html>
  )
}

export function SolarSystemScene({
  onSelectEarth,
  zoomPhase,
  onZoomPhaseChange,
  onZoomProgress,
}: SolarSystemSceneProps) {
  return (
    <>
      <color attach="background" args={['#020408']} />
      <ambientLight intensity={0.45} />
      <hemisphereLight intensity={0.35} color="#88bbff" groundColor="#101820" />
      <directionalLight position={[8, 6, 4]} intensity={0.75} color="#ffe8cc" />
      <pointLight position={[0, 0, 0]} intensity={2.2} distance={80} decay={1.5} color="#ffd080" />

      <Stars radius={80} depth={40} count={4500} factor={3.5} saturation={0.15} fade speed={0.4} />

      <SceneLoader />

      <Suspense fallback={<ModelFallback />}>
        <SolarSystemModel
          zoomPhase={zoomPhase}
          onZoomPhaseChange={onZoomPhaseChange}
          onZoomProgress={onZoomProgress}
          onSelectEarth={onSelectEarth}
        />
      </Suspense>
    </>
  )
}

useGLTF.preload(SOLAR_SYSTEM_MODEL)
