import type { MutableRefObject, RefObject } from 'react'
import { useEffect, useRef, useState } from 'react'
import { FaceDetector, FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
import { Vector2 } from 'three'

type FaceBox = {
  originX: number
  originY: number
  width: number
  height: number
}

type FingerPointerState = {
  enabled: boolean
  setEnabled: (enabled: boolean) => void
  error: string | null
  videoRef: RefObject<HTMLVideoElement | null>
  ndcRef: MutableRefObject<Vector2 | null>
  hasHand: boolean
  gesture: 'none' | 'open' | 'point'
  movementActive: boolean
  faceBox: FaceBox | null
  twistDirection: -1 | 0 | 1
}

const DEFAULT_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

function distance2D(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x
  const dy = a.y - b.y
  return Math.hypot(dx, dy)
}

function classifyGesture(
  hand: Array<{ x: number; y: number; z: number }>,
): 'none' | 'open' | 'point' {
  if (!hand[0] || !hand[8] || !hand[12] || !hand[16] || !hand[20]) return 'none'

  const wrist = hand[0]
  const indexTip = hand[8]
  const middleTip = hand[12]
  const ringTip = hand[16]
  const pinkyTip = hand[20]

  const indexPip = hand[6]
  const middlePip = hand[10]
  const ringPip = hand[14]
  const pinkyPip = hand[18]

  const scale = Math.max(distance2D(hand[5], hand[17]), 1e-3)
  const fingerExtension = (tip: { x: number; y: number }, pip: { x: number; y: number }) =>
    (distance2D(tip, wrist) - distance2D(pip, wrist)) / scale

  const indexExt = fingerExtension(indexTip, indexPip)
  const middleExt = fingerExtension(middleTip, middlePip)
  const ringExt = fingerExtension(ringTip, ringPip)
  const pinkyExt = fingerExtension(pinkyTip, pinkyPip)

  const isExtended = (v: number) => v > 0.22
  const isFolded = (v: number) => v < 0.1

  const extendedCount =
    Number(isExtended(indexExt)) +
    Number(isExtended(middleExt)) +
    Number(isExtended(ringExt)) +
    Number(isExtended(pinkyExt))

  if (
    isExtended(indexExt) &&
    isFolded(middleExt) &&
    isFolded(ringExt) &&
    isFolded(pinkyExt)
  ) {
    return 'point'
  }

  if (extendedCount >= 3) return 'open'
  return 'none'
}

export function useFingerPointer(): FingerPointerState {
  const [enabled, setEnabled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasHand, setHasHand] = useState(false)
  const [gesture, setGesture] = useState<'none' | 'open' | 'point'>('none')
  const [faceBox, setFaceBox] = useState<FaceBox | null>(null)
  const [twistDirection, setTwistDirection] = useState<-1 | 0 | 1>(0)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const ndcRef = useRef<Vector2 | null>(null)

  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const landmarkerRef = useRef<HandLandmarker | null>(null)
  const faceDetectorRef = useRef<FaceDetector | null>(null)
  const lastVideoTimeRef = useRef(-1)
  const lastGestureRef = useRef<'none' | 'open' | 'point'>('none')
  const lastPalmAngleRef = useRef<number | null>(null)
  const lastTwistAtRef = useRef(0)

  useEffect(() => {
    async function stop() {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      lastVideoTimeRef.current = -1
      setHasHand(false)
      setGesture('none')
      setTwistDirection(0)
      lastGestureRef.current = 'none'
      lastPalmAngleRef.current = null
      lastTwistAtRef.current = 0
      ndcRef.current = null

      const lm = landmarkerRef.current
      landmarkerRef.current = null
      lm?.close()
      const fd = faceDetectorRef.current
      faceDetectorRef.current = null
      fd?.close()
      setFaceBox(null)

      const stream = streamRef.current
      streamRef.current = null
      stream?.getTracks().forEach((t) => t.stop())

      const video = videoRef.current
      if (video) {
        video.pause()
        video.srcObject = null
      }
    }

    async function start() {
      setError(null)

      const video = videoRef.current
      if (!video) {
        throw new Error('Video element not mounted')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      })
      streamRef.current = stream
      video.srcObject = stream
      video.playsInline = true
      video.muted = true

      await video.play()

      const fileset = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm',
      )
      const landmarker = await HandLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: DEFAULT_MODEL_URL },
        runningMode: 'VIDEO',
        numHands: 1,
      })
      const faceDetector = await FaceDetector.createFromOptions(fileset, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite',
        },
        runningMode: 'VIDEO',
      })
      landmarkerRef.current = landmarker
      faceDetectorRef.current = faceDetector

      const tick = () => {
        const v = videoRef.current
        const lm = landmarkerRef.current
        const fd = faceDetectorRef.current
        if (!v || !lm || !fd) return

        const t = v.currentTime
        if (t !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = t
          const nowMs = performance.now()
          const res = lm.detectForVideo(v, performance.now())
          const hand = res.landmarks?.[0]
          const faceRes = fd.detectForVideo(v, nowMs)
          const face = faceRes.detections?.[0]
          const box = face?.boundingBox
          const vw = Math.max(1, v.videoWidth || 1)
          const vh = Math.max(1, v.videoHeight || 1)
          if (
            box &&
            Number.isFinite(box.originX) &&
            Number.isFinite(box.originY) &&
            Number.isFinite(box.width) &&
            Number.isFinite(box.height)
          ) {
            setFaceBox({
              originX: box.originX / vw,
              originY: box.originY / vh,
              width: box.width / vw,
              height: box.height / vh,
            })
          } else {
            setFaceBox(null)
          }

          if (hand && hand[8]) {
            // Index finger tip landmark (8), coordinates are normalized [0..1]
            const p = hand[8]
            if (!ndcRef.current) ndcRef.current = new Vector2()

            // Convert video-space -> NDC. Mirror horizontally for selfie view feel.
            const x = (1 - p.x) * 2 - 1
            const y = -(p.y * 2 - 1)
            ndcRef.current.set(x, y)
            setHasHand(true)

            const nextGesture = classifyGesture(hand)
            if (nextGesture !== lastGestureRef.current) {
              lastGestureRef.current = nextGesture
              setGesture(nextGesture)
            }

            // Jar-twist style detection from palm orientation change in screen space.
            // Use wrist (0) to middle MCP (9) as a stable palm axis.
            if (nextGesture === 'open' && hand[9]) {
              const wrist = hand[0]
              const midMcp = hand[9]
              const angle = Math.atan2(midMcp.y - wrist.y, midMcp.x - wrist.x)
              const prev = lastPalmAngleRef.current
              lastPalmAngleRef.current = angle

              if (prev !== null) {
                let delta = angle - prev
                if (delta > Math.PI) delta -= Math.PI * 2
                if (delta < -Math.PI) delta += Math.PI * 2

                const now = nowMs
                const strongTurn = Math.abs(delta) > 0.085
                if (strongTurn) {
                  const dir = delta > 0 ? 1 : -1
                  setTwistDirection(dir)
                  lastTwistAtRef.current = now
                } else if (now - lastTwistAtRef.current > 150) {
                  setTwistDirection(0)
                }
              }
            } else {
              lastPalmAngleRef.current = null
              if (lastTwistAtRef.current !== 0) {
                lastTwistAtRef.current = 0
                setTwistDirection(0)
              }
            }
          } else {
            ndcRef.current = null
            setHasHand(false)
            if (lastGestureRef.current !== 'none') {
              lastGestureRef.current = 'none'
              setGesture('none')
            }
            lastPalmAngleRef.current = null
            if (lastTwistAtRef.current !== 0) {
              lastTwistAtRef.current = 0
              setTwistDirection(0)
            }
          }
        }

        rafRef.current = requestAnimationFrame(tick)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    if (!enabled) {
      void stop()
      return
    }

    start().catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Camera error'
      setError(message)
      setEnabled(false)
    })

    return () => {
      void stop()
    }
  }, [enabled])

  const movementActive = hasHand
  return {
    enabled,
    setEnabled,
    error,
    videoRef,
    ndcRef,
    hasHand,
    gesture,
    movementActive,
    faceBox,
    twistDirection,
  }
}

