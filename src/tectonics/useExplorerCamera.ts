import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export type CameraMode = 'globe' | 'rift'

const PRESETS: Record<
  CameraMode,
  { position: [number, number, number]; target: [number, number, number] }
> = {
  globe: { position: [0, 0.2, 4], target: [0, 0, 0] },
  rift: { position: [0, 1, 8], target: [0, 0, 0] },
}

const _pos = new THREE.Vector3()
const _target = new THREE.Vector3()

/** Only runs when enabled — do not use during free globe orbit (fights OrbitControls). */
export function useExplorerCamera(mode: CameraMode, enabled: boolean) {
  const { camera } = useThree()
  const goalRef = useRef(PRESETS[mode])

  useEffect(() => {
    goalRef.current = PRESETS[mode]
  }, [mode])

  useFrame((_, delta) => {
    if (!enabled) return
    const goal = goalRef.current
    _pos.set(...goal.position)
    _target.set(...goal.target)
    const cam = camera as THREE.PerspectiveCamera
    cam.position.lerp(_pos, Math.min(1, delta * 2.2))
    cam.lookAt(_target)
  })
}
