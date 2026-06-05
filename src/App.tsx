import { Button } from '@base-ui/react/button'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import type { ShapeControls } from './ThreeScene'
import { useFingerPointer } from './useFingerPointer'
import './App.css'
const ThreeScene = lazy(() =>
  import('./ThreeScene').then((mod) => ({ default: mod.ThreeScene })),
)

const DEFAULT_CONTROLS: ShapeControls = {
  rotationSpeed: 1.1,
  scale: 1,
  stretch: 0,
  bounceHeight: 0.35,
  bounceSpeed: 1.2,
  sphereCount: 96,
  clusterSpread: 1.8,
  sphereRadius: 0.2,
  influenceRadius: 1.35,
  repelStrength: 12,
  returnStrength: 14,
  damping: 5.5,
}

function App() {
  const [shapeControls, setShapeControls] =
    useState<ShapeControls>(DEFAULT_CONTROLS)
  const [showBrief, setShowBrief] = useState(false)
  const [micEnabled, setMicEnabled] = useState(false)
  const [clapSensitivity, setClapSensitivity] = useState(0.85)
  const [helloSignal, setHelloSignal] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)
  const [micLevel, setMicLevel] = useState(0)
  const [lastClapMsAgo, setLastClapMsAgo] = useState<number | null>(null)
  const [glassesSize, setGlassesSize] = useState(1)

  const {
    enabled: camEnabled,
    setEnabled: setCamEnabled,
    error: camError,
    videoRef: camVideoRef,
    ndcRef: camNdcRef,
    hasHand: camHasHand,
    gesture: camGesture,
    movementActive: camMovementActive,
    faceBox: camFaceBox,
    twistDirection: camTwistDirection,
  } = useFingerPointer()

  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const lastRmsRef = useRef(0)
  const lastClapAtRef = useRef(0)
  const clapSensitivityRef = useRef(clapSensitivity)
  const lastUiUpdateAtRef = useRef(0)

  function updateControl<K extends keyof ShapeControls>(
    key: K,
    value: ShapeControls[K],
  ) {
    setShapeControls((prev) => ({ ...prev, [key]: value }))
  }

  function resetControls() {
    setShapeControls(DEFAULT_CONTROLS)
  }

  useEffect(() => {
    clapSensitivityRef.current = clapSensitivity
  }, [clapSensitivity])

  useEffect(() => {
    async function startMic() {
      setMicError(null)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      })

      const ctx = new AudioContext()
      // Some browsers start suspended until explicitly resumed after a gesture.
      await ctx.resume()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.2

      const source = ctx.createMediaStreamSource(stream)
      source.connect(analyser)

      audioCtxRef.current = ctx
      analyserRef.current = analyser
      mediaStreamRef.current = stream
      lastRmsRef.current = 0
      lastClapAtRef.current = 0
      lastUiUpdateAtRef.current = 0
      setMicLevel(0)
      setLastClapMsAgo(null)

      const buffer = new Float32Array(analyser.fftSize)

      const tick = () => {
        const a = analyserRef.current
        if (!a) return

        a.getFloatTimeDomainData(buffer)
        let sumSq = 0
        for (let i = 0; i < buffer.length; i += 1) {
          const v = buffer[i]
          sumSq += v * v
        }

        const rms = Math.sqrt(sumSq / buffer.length)
        const prev = lastRmsRef.current
        lastRmsRef.current = rms

        // Map sensitivity (0..1) -> lower threshold at higher sensitivity.
        const baseThreshold = 0.14
        const sensitivity = clapSensitivityRef.current
        const threshold = baseThreshold * (1.15 - sensitivity)
        const rise = rms - prev
        const riseThreshold = 0.045 * (1.15 - sensitivity)

        const now = performance.now()
        const cooldownMs = 280
        const isClap = rms > threshold && rise > riseThreshold

        if (isClap && now - lastClapAtRef.current > cooldownMs) {
          lastClapAtRef.current = now
          setHelloSignal((n) => n + 1)
        }

        // UI updates (throttled) so we can see if the mic is working.
        if (now - lastUiUpdateAtRef.current > 90) {
          lastUiUpdateAtRef.current = now
          setMicLevel(rms)
          setLastClapMsAgo(
            lastClapAtRef.current ? Math.round(now - lastClapAtRef.current) : null,
          )
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    async function stopMic() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      analyserRef.current = null

      const ctx = audioCtxRef.current
      audioCtxRef.current = null
      if (ctx) await ctx.close()

      const stream = mediaStreamRef.current
      mediaStreamRef.current = null
      if (stream) {
        for (const track of stream.getTracks()) track.stop()
      }
    }

    if (micEnabled) {
      startMic().catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Microphone error'
        setMicError(message)
        setMicEnabled(false)
      })
    } else {
      void stopMic()
    }

    return () => {
      void stopMic()
    }
  }, [micEnabled])

  return (
    <div className="mx-auto flex min-h-svh w-full max-w-6xl flex-col gap-4 p-4 md:gap-6 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-hard)]">
        <div>
          <h1 className="m-0 text-sm font-bold uppercase tracking-[0.08em] text-[var(--text-h)] md:text-base">
            HandTalk Gestures
          </h1>
        </div>
        <div className="relative flex flex-wrap items-center gap-2">
          <Button
            type="button"
            className="cursor-pointer border-2 border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-h)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            onClick={() => setShowBrief((open) => !open)}
            aria-expanded={showBrief}
            aria-controls="student-brief"
          >
            Project brief
          </Button>
          <Button
            type="button"
            className="cursor-pointer border-2 border-[var(--border)] bg-[var(--accent)] px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--accent-contrast)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            onClick={resetControls}
          >
            Reset sliders
          </Button>

          <Button
            type="button"
            className="cursor-pointer border-2 border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-h)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            onClick={() => setMicEnabled((v) => !v)}
            aria-pressed={micEnabled}
          >
            {micEnabled ? 'Mic on' : 'Mic off'}
          </Button>
          <Button
            type="button"
            className="cursor-pointer border-2 border-[var(--border)] bg-transparent px-3 py-2 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-h)] transition-transform hover:translate-x-[1px] hover:translate-y-[1px] active:translate-x-[2px] active:translate-y-[2px]"
            onClick={() => setCamEnabled(!camEnabled)}
            aria-pressed={camEnabled}
          >
            {camEnabled ? 'Cam on' : 'Cam off'}
          </Button>
          <div className="min-w-[10rem] font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-h)]">
            <div>
              Level: <span className="tabular-nums">{micLevel.toFixed(3)}</span>
            </div>
            <div>
              Clap:{" "}
              <span className="tabular-nums">
                {lastClapMsAgo === null ? '—' : `${lastClapMsAgo}ms`}
              </span>
            </div>
          </div>
          <div className="min-w-[9rem] font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-h)]">
            <div>
              Hand:{' '}
              <span className="tabular-nums">
                {camEnabled ? (camHasHand ? 'yes' : 'no') : '—'}
              </span>
            </div>
            <div>
              Gesture:{' '}
              <span className="tabular-nums">{camEnabled ? camGesture : '—'}</span>
            </div>
          </div>

          {camEnabled ? (
            <div
              className="relative h-[174px] w-[189px] overflow-hidden border-2 border-[var(--border)] bg-[var(--code-bg)] shadow-[var(--shadow-hard)]"
              style={{ transform: 'scaleX(-1)' }}
            >
              <video
                ref={camVideoRef}
                className="h-full w-full object-cover"
                aria-label="Webcam preview"
              />
              {camMovementActive ? (
                <div
                  className="pointer-events-none absolute text-center leading-none"
                  style={{
                    left: camFaceBox
                      ? `${(camFaceBox.originX + camFaceBox.width * 0.5) * 100}%`
                      : '50%',
                    top: camFaceBox
                      ? `${(camFaceBox.originY + camFaceBox.height * 0.3) * 100}%`
                      : '38%',
                    fontSize: camFaceBox
                      ? `${Math.max(12, camFaceBox.width * 84 * glassesSize)}px`
                      : `${Math.max(16, 22 * glassesSize)}px`,
                    transform: 'translate(-50%, -50%) scaleX(-1)',
                  }}
                >
                  😎
                </div>
              ) : null}
            </div>
          ) : null}

          {showBrief ? (
            <div
              id="student-brief"
              role="dialog"
              aria-label="Project brief"
              className="absolute right-0 top-full z-10 mt-2 w-[min(30rem,92vw)] border-2 border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-hard)]"
            >
              <p className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-h)]">
                Project brief
              </p>
              <ul className="mb-3 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                <li>Swap the cube for your own geometry, models, or particle systems.</li>
                <li>Map sliders to your own visual rules and animation logic.</li>
                <li>Make visuals react to inputs like keyboard, mic, camera, or time.</li>
                <li>Design a mood and style: color, motion, composition, and rhythm.</li>
                <li>Treat this as a base, not a final piece: personalize it heavily.</li>
              </ul>
              <Button
                type="button"
                className="cursor-pointer border-2 border-[var(--border)] bg-transparent px-2 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-h)]"
                onClick={() => setShowBrief(false)}
              >
                Close
              </Button>
            </div>
          ) : null}
        </div>
      </header>
      {micError ? (
        <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs font-semibold text-[var(--text-h)] shadow-[var(--shadow-hard)]">
          Mic error: <span className="font-mono">{micError}</span>
        </div>
      ) : null}
      {camError ? (
        <div className="border-2 border-[var(--border)] bg-[var(--surface)] p-3 font-mono text-xs font-semibold text-[var(--text-h)] shadow-[var(--shadow-hard)]">
          Camera error: <span className="font-mono">{camError}</span>
        </div>
      ) : null}

      <section
        className="flex-1 border-2 border-[var(--border)] bg-[var(--surface)] p-3 shadow-[var(--shadow-hard)] md:p-4"
        aria-labelledby="canvas-heading"
      >
        <h2
          id="canvas-heading"
          className="mb-2 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--text-h)]"
        >
          Canvas
        </h2>
        <Suspense
          fallback={
            <div className="three-scene-wrap" aria-hidden />
          }
        >
          <ThreeScene
            controls={shapeControls}
            helloSignal={helloSignal}
            helloHoldMs={1600}
            pointerNdcRef={camEnabled ? camNdcRef : undefined}
            pointerAttract={camEnabled}
            cameraGesture={camEnabled ? camGesture : 'none'}
            handTwistDirection={camEnabled ? camTwistDirection : 0}
          />
        </Suspense>
      </section>

      <section className="grid gap-3 border-2 border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-hard)] md:grid-cols-2 lg:grid-cols-5">
        <label className="slider-control lg:col-span-2">
          <span className="slider-label">Sunglasses size</span>
          <input
            className="slider-range"
            type="range"
            min={0.6}
            max={1.8}
            step={0.01}
            value={glassesSize}
            onChange={(event) => setGlassesSize(Number(event.target.value))}
          />
          <span className="slider-value">{glassesSize.toFixed(2)}x</span>
        </label>

        <label className="slider-control lg:col-span-2">
          <span className="slider-label">Clap sensitivity</span>
          <input
            className="slider-range"
            type="range"
            min={0.35}
            max={1}
            step={0.01}
            value={clapSensitivity}
            onChange={(event) => setClapSensitivity(Number(event.target.value))}
          />
          <span className="slider-value">{clapSensitivity.toFixed(2)}</span>
        </label>

        <label className="slider-control lg:col-span-2">
          <span className="slider-label">Sphere count</span>
          <input
            className="slider-range"
            type="range"
            min={1}
            max={220}
            step={1}
            value={shapeControls.sphereCount}
            onChange={(event) =>
              updateControl('sphereCount', Number(event.target.value))
            }
          />
          <span className="slider-value">{shapeControls.sphereCount}</span>
        </label>

        <label className="slider-control lg:col-span-2">
          <span className="slider-label">Cluster spread</span>
          <input
            className="slider-range"
            type="range"
            min={0.15}
            max={3.2}
            step={0.01}
            value={shapeControls.clusterSpread}
            onChange={(event) =>
              updateControl('clusterSpread', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.clusterSpread.toFixed(2)}
          </span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Sphere size</span>
          <input
            className="slider-range"
            type="range"
            min={0.04}
            max={0.35}
            step={0.005}
            value={shapeControls.sphereRadius}
            onChange={(event) =>
              updateControl('sphereRadius', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.sphereRadius.toFixed(3)}
          </span>
        </label>

        <label className="slider-control lg:col-span-2">
          <span className="slider-label">Mouse influence radius</span>
          <input
            className="slider-range"
            type="range"
            min={0.15}
            max={2.2}
            step={0.01}
            value={shapeControls.influenceRadius}
            onChange={(event) =>
              updateControl('influenceRadius', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.influenceRadius.toFixed(2)}
          </span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Repel strength</span>
          <input
            className="slider-range"
            type="range"
            min={0}
            max={22}
            step={0.1}
            value={shapeControls.repelStrength}
            onChange={(event) =>
              updateControl('repelStrength', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.repelStrength.toFixed(1)}
          </span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Return strength</span>
          <input
            className="slider-range"
            type="range"
            min={0}
            max={40}
            step={0.2}
            value={shapeControls.returnStrength}
            onChange={(event) =>
              updateControl('returnStrength', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.returnStrength.toFixed(1)}
          </span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Damping</span>
          <input
            className="slider-range"
            type="range"
            min={0}
            max={12}
            step={0.1}
            value={shapeControls.damping}
            onChange={(event) => updateControl('damping', Number(event.target.value))}
          />
          <span className="slider-value">{shapeControls.damping.toFixed(1)}</span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Rotation speed</span>
          <input
            className="slider-range"
            type="range"
            min={0}
            max={3}
            step={0.05}
            value={shapeControls.rotationSpeed}
            onChange={(event) =>
              updateControl('rotationSpeed', Number(event.target.value))
            }
          />
          <span className="slider-value">{shapeControls.rotationSpeed.toFixed(2)}x</span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Scale</span>
          <input
            className="slider-range"
            type="range"
            min={0.5}
            max={2.2}
            step={0.05}
            value={shapeControls.scale}
            onChange={(event) => updateControl('scale', Number(event.target.value))}
          />
          <span className="slider-value">{shapeControls.scale.toFixed(2)}</span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Stretch</span>
          <input
            className="slider-range"
            type="range"
            min={-0.8}
            max={0.8}
            step={0.01}
            value={shapeControls.stretch}
            onChange={(event) =>
              updateControl('stretch', Number(event.target.value))
            }
          />
          <span className="slider-value">{shapeControls.stretch.toFixed(2)}</span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Bounce height</span>
          <input
            className="slider-range"
            type="range"
            min={0}
            max={1.2}
            step={0.01}
            value={shapeControls.bounceHeight}
            onChange={(event) =>
              updateControl('bounceHeight', Number(event.target.value))
            }
          />
          <span className="slider-value">
            {shapeControls.bounceHeight.toFixed(2)}
          </span>
        </label>

        <label className="slider-control">
          <span className="slider-label">Bounce speed</span>
          <input
            className="slider-range"
            type="range"
            min={0.2}
            max={4}
            step={0.05}
            value={shapeControls.bounceSpeed}
            onChange={(event) =>
              updateControl('bounceSpeed', Number(event.target.value))
            }
          />
          <span className="slider-value">{shapeControls.bounceSpeed.toFixed(2)}x</span>
        </label>
      </section>
    </div>
  )
}

export default App
