import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type { Object3D, PerspectiveCamera } from 'three'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { SOLAR_SYSTEM_SETTINGS } from './solarSystemModels'

function easeInOutCubic(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2
}

type EarthZoomControllerProps = {
  earthAnchor: Object3D | null
  active: boolean
  controlsRef: RefObject<OrbitControlsImpl | null>
  onProgress: (progress: number) => void
  onComplete: () => void
}

export function EarthZoomController({
  earthAnchor,
  active,
  controlsRef,
  onProgress,
  onComplete,
}: EarthZoomControllerProps) {
  const { camera } = useThree()
  const progressRef = useRef(0)
  const startedRef = useRef(false)
  const finishedRef = useRef(false)
  const startPos = useRef(new Vector3())
  const startTarget = useRef(new Vector3())
  const endPos = useRef(new Vector3())
  const endTarget = useRef(new Vector3())
  const lookTarget = useRef(new Vector3())
  const startFov = useRef(45)

  useEffect(() => {
    if (!active) {
      progressRef.current = 0
      startedRef.current = false
      finishedRef.current = false
    }
  }, [active])

  useFrame((_, delta) => {
    if (!active || !earthAnchor || finishedRef.current) return

    if (!startedRef.current) {
      startPos.current.copy(camera.position)
      const controls = controlsRef.current
      if (controls) {
        startTarget.current.copy(controls.target)
      } else {
        startTarget.current.set(0, 0, 0)
      }

      earthAnchor.getWorldPosition(endTarget.current)

      const approach = startPos.current.clone().sub(endTarget.current)
      if (approach.lengthSq() < 0.01) {
        approach.set(0.35, 0.25, 1)
      } else {
        approach.normalize()
      }

      endPos.current
        .copy(endTarget.current)
        .add(approach.multiplyScalar(SOLAR_SYSTEM_SETTINGS.earthZoomDistance))

      startFov.current = (camera as PerspectiveCamera).fov
      startedRef.current = true
    }

    const duration = SOLAR_SYSTEM_SETTINGS.earthZoomDuration
    progressRef.current = Math.min(1, progressRef.current + delta / duration)
    const t = easeInOutCubic(progressRef.current)

    onProgress(progressRef.current)

    camera.position.lerpVectors(startPos.current, endPos.current, t)
    lookTarget.current.lerpVectors(startTarget.current, endTarget.current, t)
    camera.lookAt(lookTarget.current)

    const controls = controlsRef.current
    if (controls) {
      controls.target.copy(lookTarget.current)
      controls.update()
    }

    const cam = camera as PerspectiveCamera
    cam.fov = startFov.current + (SOLAR_SYSTEM_SETTINGS.earthZoomFov - startFov.current) * t
    cam.updateProjectionMatrix()

    if (progressRef.current >= 1 && !finishedRef.current) {
      finishedRef.current = true
      onComplete()
    }
  })

  return null
}
