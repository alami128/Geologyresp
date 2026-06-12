import { Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState, type RefObject } from 'react'
import type { Line2 } from 'three-stdlib'

const DRAW_DURATION = 1.1

function easeOutCubic(t: number) {
  return 1 - (1 - t) ** 3
}

export type AnimatedDashCurveProps = {
  points: [number, number, number][]
  color: string
  playId: number
  dashOffsetRef: RefObject<number>
  lineWidth?: number
  dashSize?: number
  gapSize?: number
  renderOrder?: number
  opacity?: number
  /** When true, line is depth-tested on the model cut face (not a screen overlay). */
  surfaceStuck?: boolean
}

export function AnimatedDashCurve({
  points,
  color,
  playId,
  dashOffsetRef,
  lineWidth = 1.4,
  dashSize = 0.07,
  gapSize = 0.045,
  renderOrder = 1,
  opacity: finalOpacity = 0.96,
  surfaceStuck = false,
}: AnimatedDashCurveProps) {
  const lineRef = useRef<Line2>(null)
  const progress = useRef(0)
  const animating = useRef(true)
  const lastCount = useRef(2)
  const lastOpacity = useRef(0)
  const [drawPoints, setDrawPoints] = useState<[number, number, number][]>(() => points.slice(0, 2))
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    progress.current = 0
    animating.current = true
    lastCount.current = 2
    lastOpacity.current = 0
    setDrawPoints(points.slice(0, 2))
    setOpacity(0)
  }, [playId, points])

  useFrame((_, delta) => {
    const material = lineRef.current?.material
    if (material && 'dashOffset' in material) {
      material.dashOffset = dashOffsetRef.current
      if (surfaceStuck && 'polygonOffset' in material) {
        material.polygonOffset = true
        material.polygonOffsetFactor = -1
        material.polygonOffsetUnits = -1
      }
    }

    if (!animating.current) return

    progress.current = Math.min(1, progress.current + delta / DRAW_DURATION)
    const t = easeOutCubic(progress.current)
    const count = Math.max(2, Math.ceil(points.length * t))
    const nextOpacity = finalOpacity * t

    if (count !== lastCount.current) {
      lastCount.current = count
      setDrawPoints(points.slice(0, count))
    }

    if (Math.abs(nextOpacity - lastOpacity.current) > 0.04) {
      lastOpacity.current = nextOpacity
      setOpacity(nextOpacity)
    }

    if (progress.current >= 1) {
      if (lastCount.current !== points.length) {
        lastCount.current = points.length
        setDrawPoints(points)
      }
      if (lastOpacity.current !== finalOpacity) {
        lastOpacity.current = finalOpacity
        setOpacity(finalOpacity)
      }
      animating.current = false
    }
  })

  const validPoints = drawPoints.filter(
    (point) => point.every((value) => Number.isFinite(value)),
  )
  if (validPoints.length < 2) return null

  return (
    <Line
      ref={lineRef}
      points={validPoints}
      color={color}
      lineWidth={lineWidth}
      dashed
      dashSize={dashSize}
      gapSize={gapSize}
      transparent
      opacity={opacity}
      depthWrite={surfaceStuck}
      depthTest
      renderOrder={renderOrder}
      toneMapped={false}
    />
  )
}
