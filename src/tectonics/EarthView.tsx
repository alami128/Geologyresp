import { Canvas } from '@react-three/fiber'
import { useCallback, useMemo, useState } from 'react'
import { getTopicById } from './earthTopics'
import {
  DETAIL_HINTS,
  getDetailId,
  getDetailStepCount,
  getDetailSteps,
  topicHasDetail,
} from './topicDetail'
import { createInitialLayerState, type TectonicLayerId } from './tectonicLayers'
import { TectonicsScene, type AppView } from './TectonicsScene'
import { GlobeInfoBar, InfoBar } from './ui/InfoBar'
import { TectonicControlPanel } from './ui/TectonicControlPanel'
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

  const topic = getTopicById(selectedId)
  const detailId = getDetailId(selectedId)
  const inModelDetail = view === 'model-detail'
  const inTectonicPlates = inModelDetail && detailId === 'rift'
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

  const enterModelDetail = useCallback(() => {
    setDetailStep(0)
    if (getDetailId(selectedId) === 'rift') {
      setActiveTectonicLayers(createInitialLayerState())
      setLayerAnimKeys({})
    }
    startTransition('model-detail')
  }, [selectedId, startTransition])

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
      }
    },
    [view, startTransition],
  )

  const exitModelDetail = useCallback(() => {
    startTransition('globe')
    setDetailStep(0)
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
          : 'Pick a phenomenon from the menu · drag to rotate · scroll to zoom'}
      </p>

      {inTectonicPlates ? (
        <TectonicControlPanel
          activeLayers={activeTectonicLayers}
          onToggle={toggleTectonicLayer}
          onClose={handleBack}
          className={`tectonics-earth-ui${ready ? ' tectonics-earth-ui--visible' : ''}`}
        />
      ) : null}

      <div
        className={`tectonics-canvas-wrap tectonics-earth-ui tectonics-earth-ui--delay-2${ready ? ' tectonics-earth-ui--visible' : ''}${transitioning ? ' tectonics-canvas-wrap--transition' : ''}`}
      >
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
            onSelectTopic={handleSelectTopic}
            onDeselect={() => setSelectedId(null)}
          />
        </Canvas>
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

      {inModelDetail && detailSteps.length > 0 && !inTectonicPlates ? (
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
    </>
  )
}
