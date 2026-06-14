import { Canvas } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTopicById } from './earthTopics'
import {
  DETAIL_HINTS,
  getDetailId,
  getDetailStepCount,
  getDetailSteps,
  getSketchfabEmbed,
  topicHasDetail,
  usesSketchfabEmbed,
} from './topicDetail'
import { createInitialMantleFlowState, type MantleFlowId } from './mantleConvectionModel'
import { createInitialLayerState, type TectonicLayerId } from './tectonicLayers'
import {
  resolveDiagramLayerId,
  type EarthDiagramLayerId,
  type EarthLayerInfo,
} from './earthStructureLayers'
import { TectonicsScene, type AppView } from './TectonicsScene'
import { EarthInteriorPanel } from './ui/EarthInteriorPanel'
import { GlobeInfoBar, InfoBar } from './ui/InfoBar'
import { MantleConvectionPanel } from './ui/MantleConvectionPanel'
import { TectonicControlPanel } from './ui/TectonicControlPanel'
import { SketchfabEmbed } from './ui/SketchfabEmbed'
import { TopicList } from './ui/TopicList'

const TRANSITION_MS = 900

type EarthViewProps = {
  onBack: () => void
  ready?: boolean
}

export function EarthView({ onBack, ready = true }: EarthViewProps) {
  const [view, setView] = useState<AppView>('globe')
  const [transitioning, setTransitioning] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [focusTopicId, setFocusTopicId] = useState<string | null>(null)
  const [detailStep, setDetailStep] = useState(0)
  const [activeTectonicLayers, setActiveTectonicLayers] = useState(createInitialLayerState)
  const [layerAnimKeys, setLayerAnimKeys] = useState<Partial<Record<TectonicLayerId, number>>>({})
  const [selectedEarthLayerId, setSelectedEarthLayerId] = useState<EarthDiagramLayerId | null>(null)
  const [earthInteriorAnimKey, setEarthInteriorAnimKey] = useState(0)
  const [activeMantleFlows, setActiveMantleFlows] = useState(createInitialMantleFlowState)
  const [mantleFlowAnimKeys, setMantleFlowAnimKeys] = useState<Partial<Record<MantleFlowId, number>>>({})

  useEffect(() => {
    if (!selectedEarthLayerId) return
    const resolved = resolveDiagramLayerId(selectedEarthLayerId)
    if (!resolved) {
      setSelectedEarthLayerId(null)
    } else if (resolved !== selectedEarthLayerId) {
      setSelectedEarthLayerId(resolved)
    }
  }, [selectedEarthLayerId])

  const topic = getTopicById(selectedId)
  const detailId = getDetailId(selectedId)
  const inModelDetail = view === 'model-detail'
  const inTectonicPlates = inModelDetail && detailId === 'rift'
  const inEarthInterior = inModelDetail && detailId === 'earth-structure'
  const inMantleConvection = inModelDetail && detailId === 'mantle-convection'
  const inSketchfabEmbed = usesSketchfabEmbed(detailId) && inModelDetail
  const sketchfabConfig = detailId && usesSketchfabEmbed(detailId) ? getSketchfabEmbed(detailId) : null
  const showSketchfabViewer = Boolean(
    sketchfabConfig && usesSketchfabEmbed(detailId) && (inModelDetail || transitioning),
  )
  const detailSteps = detailId ? getDetailSteps(detailId) : []
  const detailStepCount = detailId ? getDetailStepCount(detailId) : 0

  const detailHint = useMemo(() => {
    if (!detailId) return 'Drag to rotate · scroll to zoom · or pick a topic from the list'
    return DETAIL_HINTS[detailId]
  }, [detailId])

  const startTransition = useCallback((nextView: AppView) => {
    setTransitioning(true)
    setTimeout(() => {
      setView(nextView)
      setTransitioning(false)
    }, TRANSITION_MS)
  }, [])

  const enterModelDetailForTopic = useCallback(
    (topicId: string) => {
      setDetailStep(0)
      const nextDetailId = getDetailId(topicId)
      if (nextDetailId === 'rift') {
        setActiveTectonicLayers(createInitialLayerState())
        setLayerAnimKeys({})
      }
      if (nextDetailId === 'earth-structure') {
        setSelectedEarthLayerId(null)
        setEarthInteriorAnimKey((key) => key + 1)
      }
      if (nextDetailId === 'mantle-convection') {
        setActiveMantleFlows(createInitialMantleFlowState())
        setMantleFlowAnimKeys({})
      }
      startTransition('model-detail')
    },
    [startTransition],
  )

  const enterModelDetail = useCallback(() => {
    if (!selectedId) return
    enterModelDetailForTopic(selectedId)
  }, [enterModelDetailForTopic, selectedId])

  const handlePlayEarthAnimation = useCallback(() => {
    setEarthInteriorAnimKey((key) => key + 1)
  }, [])

  const handleEarthLayerSelect = useCallback((layer: EarthLayerInfo) => {
    setSelectedEarthLayerId(layer.id)
  }, [])

  const toggleMantleFlow = useCallback((id: MantleFlowId) => {
    setActiveMantleFlows((current) => {
      const next = !current[id]
      if (next) {
        setMantleFlowAnimKeys((keys) => ({ ...keys, [id]: (keys[id] ?? 0) + 1 }))
      }
      return { ...current, [id]: next }
    })
  }, [])

  const toggleTectonicLayer = useCallback((id: TectonicLayerId) => {
    setActiveTectonicLayers((current) => {
      const next = !current[id]
      if (next) {
        setLayerAnimKeys((keys) => ({ ...keys, [id]: (keys[id] ?? 0) + 1 }))
      }
      return { ...current, [id]: next }
    })
  }, [])

  const handleSelectTopic = useCallback(
    (id: string) => {
      setSelectedId(id)
      setFocusTopicId(id)
      if (view === 'model-detail') {
        setDetailStep(0)
        startTransition('globe')
        return
      }
      if (topicHasDetail(id)) {
        enterModelDetailForTopic(id)
      }
    },
    [view, startTransition, enterModelDetailForTopic],
  )

  const exitModelDetail = useCallback(() => {
    startTransition('globe')
    setDetailStep(0)
    setSelectedEarthLayerId(null)
  }, [startTransition])

  const handleClose = useCallback(() => {
    if (inModelDetail) {
      exitModelDetail()
    }
    setSelectedId(null)
  }, [inModelDetail, exitModelDetail])

  const handleBack = useCallback(() => {
    exitModelDetail()
  }, [exitModelDetail])

  const handleNext = useCallback(() => {
    if (view === 'globe' && topicHasDetail(selectedId)) {
      enterModelDetail()
      return
    }
    if (view === 'model-detail') {
      if (detailStep < detailStepCount - 1) {
        setDetailStep((s) => s + 1)
      } else {
        exitModelDetail()
        setSelectedId(null)
      }
    }
  }, [view, selectedId, detailStep, detailStepCount, enterModelDetail, exitModelDetail])

  const showBar = Boolean(topic) || inModelDetail

  return (
    <>
      <button
        type="button"
        className={`tectonics-back-btn tectonics-earth-ui${ready ? ' tectonics-earth-ui--visible' : ''}`}
        onClick={onBack}
      >
        ← Solar system
      </button>

      <p
        className={`tectonics-hint tectonics-earth-ui tectonics-earth-ui--delay-1${ready ? ' tectonics-earth-ui--visible' : ''}`}
      >
        {inModelDetail
          ? detailHint
          : 'Choisissez un phénomène dans la liste · faites glisser pour tourner · molette pour zoomer'}
      </p>

      {inTectonicPlates ? (
        <TectonicControlPanel
          activeLayers={activeTectonicLayers}
          onToggle={toggleTectonicLayer}
          onClose={handleBack}
          className={`tectonics-earth-ui${ready ? ' tectonics-earth-ui--visible' : ''}`}
        />
      ) : null}

      {inEarthInterior ? (
        <EarthInteriorPanel
          selectedLayerId={selectedEarthLayerId}
          onSelect={handleEarthLayerSelect}
          onPlayAnimation={handlePlayEarthAnimation}
          onClose={handleBack}
          className={`tectonics-earth-ui${ready ? ' tectonics-earth-ui--visible' : ''}`}
        />
      ) : null}

      {inMantleConvection ? (
        <MantleConvectionPanel
          activeFlows={activeMantleFlows}
          onToggle={toggleMantleFlow}
          onClose={handleBack}
          className={`tectonics-earth-ui${ready ? ' tectonics-earth-ui--visible' : ''}`}
        />
      ) : null}

      <div
        className={`tectonics-canvas-wrap tectonics-earth-ui tectonics-earth-ui--delay-2${ready ? ' tectonics-earth-ui--visible' : ''}${transitioning ? ' tectonics-canvas-wrap--transition' : ''}`}
      >
        {showSketchfabViewer && sketchfabConfig ? (
          <SketchfabEmbed
            modelId={sketchfabConfig.modelId}
            title={sketchfabConfig.title}
            pageUrl={sketchfabConfig.pageUrl}
          />
        ) : (
          <Canvas
            camera={{ position: [0, 0.2, 4], fov: 45, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            dpr={[1, 2]}
            onCreated={({ gl }) => {
              gl.toneMappingExposure = 1.05
            }}
          >
            <TectonicsScene
              view={view}
              transitioning={transitioning}
              selectedId={selectedId}
              focusTopicId={focusTopicId}
              detailId={detailId}
              activeTectonicLayers={activeTectonicLayers}
              layerAnimKeys={layerAnimKeys}
              selectedEarthLayerId={selectedEarthLayerId}
              earthInteriorAnimKey={earthInteriorAnimKey}
              activeMantleFlows={activeMantleFlows}
              mantleFlowAnimKeys={mantleFlowAnimKeys}
              onEarthLayerSelect={handleEarthLayerSelect}
              onSelectTopic={handleSelectTopic}
              onDeselect={() => setSelectedId(null)}
            />
          </Canvas>
        )}
      </div>

      {!inModelDetail ? (
        <TopicList
          selectedId={selectedId}
          onSelect={handleSelectTopic}
          className={`tectonics-earth-ui tectonics-earth-ui--delay-3${ready ? ' tectonics-earth-ui--visible' : ''}`}
        />
      ) : null}

      {showBar && topic && !inModelDetail ? (
        <GlobeInfoBar
          topic={topic}
          onClose={handleClose}
          onNext={handleNext}
          showNext={topicHasDetail(topic.id)}
        />
      ) : null}

      {inModelDetail &&
      detailSteps.length > 0 &&
      !inTectonicPlates &&
      !inEarthInterior &&
      !inMantleConvection &&
      !inSketchfabEmbed ? (
        <InfoBar
          title={detailSteps[detailStep].title}
          description={detailSteps[detailStep].description}
          stepIndicator={`Step ${detailStep + 1} of ${detailStepCount}`}
          showBack
          showNext
          nextLabel={detailStep < detailStepCount - 1 ? 'Next' : 'Done'}
          onBack={handleBack}
          onNext={handleNext}
        />
      ) : null}

      {inSketchfabEmbed && detailSteps[0] ? (
        <InfoBar
          title={detailSteps[detailStep].title}
          description={detailSteps[detailStep].description}
          showBack
          onBack={handleBack}
        />
      ) : null}

      {inEarthInterior ? (
        <InfoBar
          title="Intérieur de la Terre"
          description="Coupe animée — les enveloppes se séparent automatiquement. Cliquez une couche sur le schéma ou le modèle 3D."
          showBack
          onBack={handleBack}
        />
      ) : null}

      {inMantleConvection ? (
        <InfoBar
          title="Convection mantellique"
          description="Les courants chauds montent, refroidissent sous la lithosphère, puis plongent en subduction. Activez les flux dans le panneau."
          showBack
          onBack={handleBack}
        />
      ) : null}
    </>
  )
}
