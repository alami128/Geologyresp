import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { Group } from 'three'
import type { EarthDiagramLayerId, EarthLayerInfo } from './earthStructureLayers'
import { EarthExplorer } from './scenes/EarthExplorer'
import { EarthInteriorScene } from './scenes/EarthInteriorScene'
import { MantleConvectionScene } from './scenes/MantleConvectionScene'
import { TectonicPlatesScene } from './scenes/TectonicPlatesScene'
import { preloadSketchfabModels, SketchfabModelScene } from './scenes/SketchfabModelScene'
import { ExplorerLighting } from './shared/ExplorerLighting'
import { DETAIL_MODELS, getDetailModelSettings, type DetailId } from './topicDetail'
import type { MantleFlowId } from './mantleConvectionModel'
import type { TectonicLayerId } from './tectonicLayers'
import { useExplorerCamera, type CameraMode } from './useExplorerCamera'

export type AppView = 'globe' | 'model-detail'

type TectonicsSceneProps = {
  view: AppView
  transitioning: boolean
  selectedId: string | null
  focusTopicId: string | null
  detailId: DetailId | null
  activeTectonicLayers: Record<TectonicLayerId, boolean>
  layerAnimKeys: Partial<Record<TectonicLayerId, number>>
  selectedEarthLayerId: EarthDiagramLayerId | null
  earthInteriorAnimKey: number
  activeMantleFlows: Record<MantleFlowId, boolean>
  mantleFlowAnimKeys: Partial<Record<MantleFlowId, number>>
  onEarthLayerSelect: (layer: EarthLayerInfo) => void
  onSelectTopic: (id: string) => void
  onDeselect: () => void
}

preloadSketchfabModels(Object.values(DETAIL_MODELS))

function CameraController({ mode, enabled }: { mode: CameraMode; enabled: boolean }) {
  useExplorerCamera(mode, enabled)
  return null
}

function ModelCameraSetup({
  active,
  cameraPosition,
}: {
  active: boolean
  cameraPosition: [number, number, number]
}) {
  const { camera } = useThree()

  useEffect(() => {
    if (!active) return
    camera.position.set(...cameraPosition)
    camera.lookAt(0, 0, 0)
  }, [active, camera, cameraPosition])

  return null
}

export function TectonicsScene({
  view,
  transitioning,
  selectedId,
  focusTopicId,
  detailId,
  activeTectonicLayers,
  layerAnimKeys,
  selectedEarthLayerId,
  earthInteriorAnimKey,
  activeMantleFlows,
  mantleFlowAnimKeys,
  onEarthLayerSelect,
  onSelectTopic,
  onDeselect,
}: TectonicsSceneProps) {
  const globeGroupRef = useRef<Group>(null)
  const earthStructureSettings = getDetailModelSettings('earth-structure')
  const mantleConvectionSettings = getDetailModelSettings('mantle-convection')

  const showTectonicPlates = view === 'model-detail' && detailId === 'rift' && !transitioning
  const showEarthStructure =
    view === 'model-detail' && detailId === 'earth-structure' && !transitioning
  const showMantleConvection =
    view === 'model-detail' && detailId === 'mantle-convection' && !transitioning
  const showLocalModel =
    view === 'model-detail' &&
    detailId !== null &&
    detailId !== 'rift' &&
    detailId !== 'earth-structure' &&
    detailId !== 'mantle-convection' &&
    !transitioning
  const modelSettings =
    detailId &&
    detailId !== 'rift' &&
    detailId !== 'earth-structure' &&
    detailId !== 'mantle-convection'
      ? getDetailModelSettings(detailId)
      : null
  const modelPath =
    detailId &&
    detailId !== 'rift' &&
    detailId !== 'earth-structure' &&
    detailId !== 'mantle-convection'
      ? DETAIL_MODELS[detailId]
      : null

  const cameraMode: CameraMode = view === 'model-detail' ? 'rift' : 'globe'
  const cameraDriven = transitioning
  const globeControls = view === 'globe' && !transitioning
  const showExplorerLighting =
    !showTectonicPlates && !showLocalModel && !showEarthStructure && !showMantleConvection

  useFrame(() => {
    if (!globeGroupRef.current) return
    const hideForDetail =
      detailId === 'rift' || detailId === 'earth-structure' || detailId === 'mantle-convection'
    globeGroupRef.current.visible =
      !showTectonicPlates &&
      !showEarthStructure &&
      !showMantleConvection &&
      (view === 'globe' || (transitioning && view === 'model-detail' && !hideForDetail))
  })

  return (
    <>
      {showExplorerLighting ? <ExplorerLighting /> : null}
      <CameraController
        mode={cameraMode}
        enabled={
          cameraDriven &&
          !showTectonicPlates &&
          !showLocalModel &&
          !showEarthStructure &&
          !showMantleConvection
        }
      />

      {!showTectonicPlates && !showEarthStructure && !showMantleConvection ? (
        <group ref={globeGroupRef}>
          <EarthExplorer
            selectedId={selectedId}
            focusTopicId={focusTopicId}
            onSelectTopic={onSelectTopic}
            onDeselect={onDeselect}
            controlsEnabled={globeControls}
          />
        </group>
      ) : null}

      {showTectonicPlates ? (
        <TectonicPlatesScene
          key="tectonic-plates"
          activeLayers={activeTectonicLayers}
          layerAnimKeys={layerAnimKeys}
        />
      ) : null}

      {showEarthStructure ? (
        <>
          <ModelCameraSetup active cameraPosition={earthStructureSettings.camera} />
          <EarthInteriorScene
            scale={earthStructureSettings.scale}
            minDistance={earthStructureSettings.minDistance}
            maxDistance={earthStructureSettings.maxDistance}
            selectedLayerId={selectedEarthLayerId}
            playAnimationKey={earthInteriorAnimKey}
            onLayerSelect={onEarthLayerSelect}
          />
        </>
      ) : null}

      {showMantleConvection ? (
        <>
          <ModelCameraSetup active cameraPosition={mantleConvectionSettings.camera} />
          <MantleConvectionScene
            scale={mantleConvectionSettings.scale}
            minDistance={mantleConvectionSettings.minDistance}
            maxDistance={mantleConvectionSettings.maxDistance}
            activeFlows={activeMantleFlows}
            flowAnimKeys={mantleFlowAnimKeys}
          />
        </>
      ) : null}

      {showLocalModel && modelPath && modelSettings ? (
        <>
          <ModelCameraSetup active cameraPosition={modelSettings.camera} />
          <SketchfabModelScene
            modelPath={modelPath}
            scale={modelSettings.scale}
            minDistance={modelSettings.minDistance}
            maxDistance={modelSettings.maxDistance}
          />
        </>
      ) : null}
    </>
  )
}
