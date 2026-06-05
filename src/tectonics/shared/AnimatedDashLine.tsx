import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type { Line2 } from 'three-stdlib'
import type { LatLon } from '../tectonicLayers'
import { buildSurfacePathPoints } from '../tectonicSurfaceMesh'

const GLOBE_RADIUS = 1
const DRAW_DURATION = 1.1

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export type AnimatedDashLineProps = {
  path: LatLon[]
  color: string
  playId: number
  dashOffsetRef: RefObject<number>
  zone?: boolean
  lift?: number
  lineWidth?: number
  segmentsPerLeg?: number
  renderOrder?: number
}

export function AnimatedDashLine({
  path,
  color,
  playId,
  dashOffsetRef,
  zone = false,
  lift = 0.003,
  lineWidth,
  segmentsPerLeg = 24,
  renderOrder = 5,
}: AnimatedDashLineProps) {
  const lineRef = useRef<Line2>(null)
  const fullPoints = useMemo(
    () => buildSurfacePathPoints(path, GLOBE_RADIUS, lift, segmentsPerLeg),
    [path, lift, segmentsPerLeg],
  )
  const finalOpacity = zone ? 0.55 : 0.94
  const progress = useRef(0)
  const animating = useRef(true)
  const lastCount = useRef(2)
  const lastOpacity = useRef(0)
  const [drawPoints, setDrawPoints] = useState<[number, number, number][]>(() =>
    fullPoints.slice(0, 2),
  )
  const [opacity, setOpacity] = useState(0)

  const width = lineWidth ?? (zone ? 2.4 : 1.35)
  const dashSize = zone ? 0.1 : 0.08
  const gapSize = zone ? 0.06 : 0.05

  useEffect(() => {
    progress.current = 0
    animating.current = true
    lastCount.current = 2
    lastOpacity.current = 0
    setDrawPoints(fullPoints.slice(0, 2))
    setOpacity(0)
  }, [playId, fullPoints])

  useFrame((_, delta) => {
    const material = lineRef.current?.material
    if (material && 'dashOffset' in material) {
      material.dashOffset = dashOffsetRef.current
    }

    if (!animating.current) return

    progress.current = Math.min(1, progress.current + delta / DRAW_DURATION)
    const t = easeOutCubic(progress.current)
    const count = Math.max(2, Math.ceil(fullPoints.length * t))
    const nextOpacity = finalOpacity * t

    if (count !== lastCount.current) {
      lastCount.current = count
      setDrawPoints(fullPoints.slice(0, count))
    }

    if (Math.abs(nextOpacity - lastOpacity.current) > 0.04) {
      lastOpacity.current = nextOpacity
      setOpacity(nextOpacity)
    }

    if (progress.current >= 1) {
      if (lastCount.current !== fullPoints.length) {
        lastCount.current = fullPoints.length
        setDrawPoints(fullPoints)
      }
      if (lastOpacity.current !== finalOpacity) {
        lastOpacity.current = finalOpacity
        setOpacity(finalOpacity)
      }
      animating.current = false
    }
  })

  if (drawPoints.length < 2) return null

  return (
    <Line
      ref={lineRef}
      points={drawPoints}
      color={color}
      lineWidth={width}
      dashed
      dashSize={dashSize}
      gapSize={gapSize}
      transparent
      opacity={opacity}
      depthWrite={false}
      depthTest
      renderOrder={renderOrder}
      toneMapped={false}
    />
  )
}

export function useDashOffset(speed = 0.55) {
  const dashOffsetRef = useRef(0)

  useFrame((_, delta) => {
    dashOffsetRef.current -= delta * speed
  })

  return dashOffsetRef
}
