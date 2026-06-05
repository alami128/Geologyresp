import { OrbitControls } from '@react-three/drei'
import { useRef } from 'react'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { EarthGlobe } from '../shared/EarthGlobe'
import { EarthMarkers } from '../shared/EarthMarkers'
import { useGlobeFocus } from '../useGlobeFocus'

type EarthExplorerProps = {
  selectedId: string | null
  focusTopicId: string | null
  onSelectTopic: (id: string) => void
  onDeselect: () => void
  controlsEnabled?: boolean
}

export function EarthExplorer({
  selectedId,
  focusTopicId,
  onSelectTopic,
  onDeselect,
  controlsEnabled = true,
}: EarthExplorerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null)

  useGlobeFocus(focusTopicId, controlsRef, controlsEnabled)

  return (
    <>
      {controlsEnabled ? (
        <OrbitControls
          ref={controlsRef}
          makeDefault
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.06}
          rotateSpeed={0.85}
          minDistance={2.05}
          maxDistance={8}
          enablePan={false}
        />
      ) : null}
      <group>
        <EarthGlobe interactive onClick={onDeselect} />
        <EarthMarkers selectedId={selectedId} onSelectTopic={onSelectTopic} />
      </group>
    </>
  )
}
