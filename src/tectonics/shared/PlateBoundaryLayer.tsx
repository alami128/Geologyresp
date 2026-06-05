import { useMemo, type RefObject } from 'react'
import { AnimatedDashLine } from './AnimatedDashLine'
import { TECTONIC_PLATE_OUTLINES } from '../tectonicPlateOutlines'

type PlateBoundaryLayerProps = {
  playId: number
  dashOffsetRef: RefObject<number>
}

export function PlateBoundaryLayer({ playId, dashOffsetRef }: PlateBoundaryLayerProps) {
  const paths = useMemo(() => TECTONIC_PLATE_OUTLINES, [])

  return (
    <group renderOrder={3}>
      {paths.map((path, index) => (
        <AnimatedDashLine
          key={`plate-outline-${index}-${playId}`}
          path={path}
          color="#ffffff"
          playId={playId}
          dashOffsetRef={dashOffsetRef}
          lift={0.0035}
          lineWidth={1.4}
          segmentsPerLeg={22}
          renderOrder={3}
        />
      ))}
    </group>
  )
}
