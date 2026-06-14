import { Canvas } from '@react-three/fiber'
import { useCallback, useState, type CSSProperties } from 'react'
import { SolarSystemScene, type EarthZoomPhase } from './scenes/SolarSystemScene'
import { SOLAR_SYSTEM_SETTINGS } from './solarSystemModels'

type SolarSystemViewProps = {
  onSelectEarth: () => void
}

export function SolarSystemView({ onSelectEarth }: SolarSystemViewProps) {
  const [zoomPhase, setZoomPhase] = useState<EarthZoomPhase>('idle')
  const [zoomProgress, setZoomProgress] = useState(0)

  const handleSelectEarth = useCallback(() => {
    setZoomPhase('idle')
    setZoomProgress(0)
    onSelectEarth()
  }, [onSelectEarth])

  const zooming = zoomPhase !== 'idle'

  return (
    <>
      {!zooming ? (
        <p className="tectonics-hint">
          Cliquez sur le numéro d’une planète pour afficher son nom · la Terre (3) ouvre l’explorateur · faites glisser pour orbiter · molette ou pincement pour zoomer
        </p>
      ) : null}

      {zoomPhase === 'zooming' ? (
        <p className="tectonics-hint tectonics-hint--zoom">Vol vers la Terre…</p>
      ) : null}

      <div
        className={`tectonics-canvas-wrap${zoomPhase === 'flash' ? ' tectonics-canvas-wrap--earth-flash' : ''}${zoomPhase === 'zooming' ? ' tectonics-canvas-wrap--earth-zoom' : ''}`}
        style={
          zoomPhase === 'zooming'
            ? ({ '--earth-zoom-progress': zoomProgress } as CSSProperties)
            : undefined
        }
      >
        <Canvas
          camera={{
            position: SOLAR_SYSTEM_SETTINGS.camera,
            fov: SOLAR_SYSTEM_SETTINGS.fov,
            near: 0.01,
            far: 500,
          }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          onCreated={({ gl }) => {
            gl.toneMappingExposure = 1.25
          }}
        >
          <SolarSystemScene
            onSelectEarth={handleSelectEarth}
            zoomPhase={zoomPhase}
            onZoomPhaseChange={setZoomPhase}
            onZoomProgress={setZoomProgress}
          />
        </Canvas>
      </div>
    </>
  )
}
