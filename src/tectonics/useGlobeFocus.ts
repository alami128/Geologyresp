import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3 } from 'three'
import { getTopicById, latLonToPosition } from './earthTopics'

/** Camera distance from Earth center while focused on a topic */
const FOCUS_DISTANCE = 3.1

const startPos = new Vector3()
const endPos = new Vector3()

export function useGlobeFocus(
  focusTopicId: string | null,
  controlsRef: RefObject<OrbitControlsImpl | null>,
  enabled: boolean,
) {
  const { camera } = useThree()
  const animatingRef = useRef(false)
  const progressRef = useRef(0)

  useEffect(() => {
    if (!enabled || !focusTopicId) return
    const topic = getTopicById(focusTopicId)
    if (!topic) return

    const [x, y, z] = latLonToPosition(topic.lat, topic.lon, 1)
    endPos.set(x, y, z).normalize().multiplyScalar(FOCUS_DISTANCE)
    startPos.copy(camera.position)

    animatingRef.current = true
    progressRef.current = 0

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(0, 0, 0)
    }
  }, [focusTopicId, enabled, camera, controlsRef])

  useFrame((_, delta) => {
    if (!animatingRef.current || !enabled) return

    progressRef.current = Math.min(1, progressRef.current + delta * 1.5)
    const t = 1 - (1 - progressRef.current) ** 3

    camera.position.lerpVectors(startPos, endPos, t)

    const controls = controlsRef.current
    if (controls) {
      controls.target.set(0, 0, 0)
      controls.update()
    } else {
      camera.lookAt(0, 0, 0)
    }

    if (progressRef.current >= 1) {
      animatingRef.current = false
    }
  })
}
