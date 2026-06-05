import { Center, OrbitControls, useAnimations, useGLTF } from '@react-three/drei'
import { Suspense, useEffect, useRef } from 'react'
import type { AnimationAction } from 'three'
import type { Group } from 'three'

type SketchfabModelSceneProps = {
  modelPath: string
  scale?: number
  minDistance?: number
  maxDistance?: number
}

function SketchfabModel({ modelPath, scale = 0.65 }: SketchfabModelSceneProps) {
  const groupRef = useRef<Group>(null)
  const gltf = useGLTF(modelPath)
  const { actions } = useAnimations(gltf.animations, groupRef)

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

  return (
    <Center>
      <group ref={groupRef} scale={scale}>
        <primitive object={gltf.scene} />
      </group>
    </Center>
  )
}

function ModelFallback() {
  return (
    <mesh>
      <sphereGeometry args={[0.9, 32, 32]} />
      <meshStandardMaterial color="#2a4a7a" wireframe />
    </mesh>
  )
}

export function SketchfabModelScene({
  modelPath,
  scale,
  minDistance = 1.5,
  maxDistance = 22,
}: SketchfabModelSceneProps) {
  return (
    <>
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enableZoom
        enablePan
        enableRotate
        minDistance={minDistance}
        maxDistance={maxDistance}
        rotateSpeed={0.85}
        zoomSpeed={1.1}
        panSpeed={0.7}
      />
      <Suspense fallback={<ModelFallback />}>
        <SketchfabModel modelPath={modelPath} scale={scale} />
      </Suspense>
    </>
  )
}

export function preloadSketchfabModels(paths: string[]) {
  for (const path of paths) {
    useGLTF.preload(path)
  }
}
