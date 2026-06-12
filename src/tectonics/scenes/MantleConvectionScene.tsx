import { Center, OrbitControls, useGLTF } from '@react-three/drei'
import { Suspense, useLayoutEffect, useRef, useState } from 'react'
import type { Group } from 'three'
import { Mesh, Vector3 } from 'three'
import {
  MANTLE_CONVECTION_FLOWS,
  MANTLE_CONVECTION_MODEL,
  MANTLE_CUT_FACE_Z,
  MANTLE_FLOW_SURFACE_OFFSET,
  type MantleFlowDef,
  type MantleFlowId,
} from '../mantleConvectionModel'
import { AnimatedDashCurve } from '../shared/AnimatedDashCurve'
import { useDashOffset } from '../shared/AnimatedDashLine'
import { snapMantleFlowsToSurface } from '../shared/snapMantleFlowsToSurface'

type MantleConvectionSceneProps = {
  scale?: number
  minDistance?: number
  maxDistance?: number
  activeFlows: Record<MantleFlowId, boolean>
  flowAnimKeys: Partial<Record<MantleFlowId, number>>
}

function FlowLines({
  flows,
  activeFlows,
  flowAnimKeys,
}: {
  flows: MantleFlowDef[]
  activeFlows: Record<MantleFlowId, boolean>
  flowAnimKeys: Partial<Record<MantleFlowId, number>>
}) {
  const dashOffsetRef = useDashOffset(0.55)

  return (
    <>
      {flows.map((flow) =>
        activeFlows[flow.id] ? (
          <AnimatedDashCurve
            key={`${flow.id}-${flowAnimKeys[flow.id] ?? 0}`}
            points={flow.points}
            color={flow.color}
            playId={flowAnimKeys[flow.id] ?? 0}
            dashOffsetRef={dashOffsetRef}
            lineWidth={flow.id.startsWith('subduction') ? 2.2 : 2.0}
            dashSize={0.06}
            gapSize={0.04}
            renderOrder={1}
            surfaceStuck
          />
        ) : null,
      )}
    </>
  )
}

function ConvectionContent({
  scale = 0.1,
  activeFlows,
  flowAnimKeys,
}: {
  scale?: number
  activeFlows: Record<MantleFlowId, boolean>
  flowAnimKeys: Partial<Record<MantleFlowId, number>>
}) {
  const modelRef = useRef<Group>(null)
  const [surfaceFlows, setSurfaceFlows] = useState<MantleFlowDef[]>(() =>
    snapMantleFlowsToSurface({} as Group, MANTLE_CONVECTION_FLOWS, {
      cutFaceZ: MANTLE_CUT_FACE_Z,
      surfaceOffset: MANTLE_FLOW_SURFACE_OFFSET,
    }),
  )
  const gltf = useGLTF(MANTLE_CONVECTION_MODEL)

  useLayoutEffect(() => {
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.renderOrder = 0
      }
    })
  }, [gltf.scene])

  useLayoutEffect(() => {
    if (!modelRef.current) return

    const snap = () => {
      if (!modelRef.current) return
      setSurfaceFlows(
        snapMantleFlowsToSurface(modelRef.current, MANTLE_CONVECTION_FLOWS, {
          meshRoot: gltf.scene,
          cutFaceZ: MANTLE_CUT_FACE_Z,
          surfaceOffset: MANTLE_FLOW_SURFACE_OFFSET,
        }),
      )
    }

    snap()
    const id = requestAnimationFrame(snap)
    return () => cancelAnimationFrame(id)
  }, [gltf.scene])

  return (
    <Center>
      <group ref={modelRef} scale={scale}>
        <primitive object={gltf.scene} />
        <FlowLines flows={surfaceFlows} activeFlows={activeFlows} flowAnimKeys={flowAnimKeys} />
      </group>
    </Center>
  )
}

function ModelFallback({ scale = 0.1 }: { scale?: number }) {
  return (
    <Center>
      <mesh scale={scale}>
        <sphereGeometry args={[1.1, 32, 32]} />
        <meshStandardMaterial color="#6b3a1a" wireframe />
      </mesh>
    </Center>
  )
}

export function MantleConvectionScene({
  scale,
  minDistance,
  maxDistance,
  activeFlows,
  flowAnimKeys,
}: MantleConvectionSceneProps) {
  return (
    <>
      <color attach="background" args={['#0a1628']} />
      <ambientLight intensity={0.62} />
      <directionalLight position={[2, 4, 6]} intensity={1.1} color="#fff5e8" />
      <directionalLight position={[-3, 1, 2]} intensity={0.35} color="#8ab4d4" />

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableZoom
        enablePan={false}
        enableRotate
        target={new Vector3(0, 0, 0)}
        minDistance={minDistance ?? 2.4}
        maxDistance={maxDistance ?? 14}
        rotateSpeed={0.75}
        zoomSpeed={1.0}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
      />

      <Suspense fallback={<ModelFallback scale={scale} />}>
        <ConvectionContent scale={scale} activeFlows={activeFlows} flowAnimKeys={flowAnimKeys} />
      </Suspense>
    </>
  )
}

useGLTF.preload(MANTLE_CONVECTION_MODEL)
