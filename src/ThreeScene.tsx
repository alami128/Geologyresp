import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, type MutableRefObject } from 'react'
import type { Group, InstancedMesh } from 'three'
import { Color, Object3D, Plane, Vector2, Vector3 } from 'three'

export type ShapeControls = {
  rotationSpeed: number
  scale: number
  stretch: number
  bounceHeight: number
  bounceSpeed: number
  sphereCount: number
  clusterSpread: number
  sphereRadius: number
  influenceRadius: number
  repelStrength: number
  returnStrength: number
  damping: number
}

type StarterShapeProps = {
  controls: ShapeControls
  pointerNdcRef: MutableRefObject<Vector2 | null>
  pointerAttract?: boolean
  cameraGesture?: 'none' | 'open' | 'point'
  handTwistDirection?: -1 | 0 | 1
  helloSignal?: number
  helloHoldMs?: number
}

function mulberry32(seed: number) {
  return function random() {
    let t = (seed += 0x6d2b79f5)
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function buildHelloPoints(count: number) {
  const safeCount = Math.max(1, Math.floor(count))
  if (typeof document === 'undefined') {
    // Fallback: simple line so SSR/tests don’t crash.
    return Array.from({ length: safeCount }, (_, i) => {
      const t = safeCount <= 1 ? 0 : i / (safeCount - 1)
      return new Vector3((t - 0.5) * 2, 0, 0)
    })
  }

  const w = 360
  const h = 140
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    return Array.from({ length: safeCount }, () => new Vector3(0, 0, 0))
  }

  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'white'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '900 96px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
  ctx.fillText('HELLO', w / 2, h / 2 + 6)

  const image = ctx.getImageData(0, 0, w, h)
  const data = image.data
  const candidates: Array<{ x: number; y: number }> = []

  // Sample bright pixels with a stride so we don’t generate a million points.
  const stride = 2
  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      const idx = (y * w + x) * 4
      const r = data[idx]
      // White text on black background: r is enough.
      if (r > 160) candidates.push({ x, y })
    }
  }

  if (candidates.length === 0) {
    return Array.from({ length: safeCount }, () => new Vector3(0, 0, 0))
  }

  const rand = mulberry32(4242)
  const out: Vector3[] = []
  for (let i = 0; i < safeCount; i += 1) {
    const p = candidates[Math.floor(rand() * candidates.length)]
    // Normalize to roughly [-1, 1] with aspect correction.
    const nx = (p.x / (w - 1)) * 2 - 1
    const ny = -((p.y / (h - 1)) * 2 - 1)
    out.push(new Vector3(nx * 1.25, ny * 0.55, 0))
  }
  return out
}

function SphereCluster({
  controls,
  pointerNdcRef,
  pointerAttract = false,
  cameraGesture = 'none',
  handTwistDirection = 0,
  helloSignal,
  helloHoldMs = 1400,
}: StarterShapeProps) {
  const groupRef = useRef<Group>(null)
  const instancedRef = useRef<InstancedMesh>(null)
  const dummy = useMemo(() => new Object3D(), [])
  const color = useMemo(() => new Color(), [])
  const groundPlane = useMemo(() => new Plane(new Vector3(0, 1, 0), 0), [])
  const mouseWorld = useMemo(() => new Vector3(), [])
  const mouseLocal = useMemo(() => new Vector3(), [])
  const tmpRef = useRef(new Vector3())
  const explosionRef = useRef<{ t: number; strength: number } | null>(null)
  const lastExplosionAtRef = useRef(0)
  const helloUntilRef = useRef(0)

  useEffect(() => {
    if (!helloSignal) return
    helloUntilRef.current = performance.now() + Math.max(200, helloHoldMs)
  }, [helloSignal, helloHoldMs])

  const basePoints = useMemo(() => {
    const count = Math.max(1, Math.floor(controls.sphereCount))
    const rand = mulberry32(1337)
    const out: Array<[number, number, number]> = []

    // Sample points in a unit sphere, then scale to our cluster size.
    while (out.length < count) {
      const x = rand() * 2 - 1
      const y = rand() * 2 - 1
      const z = rand() * 2 - 1
      if (x * x + y * y + z * z > 1) continue
      out.push([x, y, z])
    }

    return out
  }, [controls.sphereCount])

  const helloPoints = useMemo(() => {
    return buildHelloPoints(basePoints.length)
  }, [basePoints.length])

  const positionsRef = useRef<Vector3[]>([])
  const velocitiesRef = useRef<Vector3[]>([])

  useEffect(() => {
    // Reset simulation when count changes.
    const spreadX =
      Math.max(0.05, controls.clusterSpread) *
      Math.max(0.2, controls.scale + controls.stretch)
    const spreadY =
      Math.max(0.05, controls.clusterSpread) *
      Math.max(0.2, controls.scale - controls.stretch)
    const spreadZ = Math.max(0.05, controls.clusterSpread) * controls.scale

    positionsRef.current = basePoints.map(([x, y, z]) => {
      return new Vector3(x * spreadX, y * spreadY, z * spreadZ)
    })
    velocitiesRef.current = basePoints.map(() => new Vector3(0, 0, 0))
  }, [
    basePoints,
    controls.clusterSpread,
    controls.scale,
    controls.stretch,
    controls.sphereCount,
  ])

  useEffect(() => {
    const instanced = instancedRef.current
    if (!instanced) return

    for (let i = 0; i < basePoints.length; i += 1) {
      const hue = (0.55 + i * 0.007) % 1
      color.setHSL(hue, 0.7, 0.62)
      instanced.setColorAt(i, color)
    }

    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true
  }, [basePoints, color])

  useFrame((state, delta) => {
    const group = groupRef.current
    const instanced = instancedRef.current
    if (!group || !instanced) return
    const tmp = tmpRef.current

    const freezeMotion = cameraGesture === 'open'
    const gatherOnPointer = cameraGesture === 'point'

    // Cluster-level motion (existing controls)
    if (!freezeMotion) {
      const s = delta * controls.rotationSpeed
      const t = state.clock.elapsedTime * controls.bounceSpeed
      group.rotation.x += s * 0.5
      group.rotation.y += s * 0.35
      group.position.y = Math.sin(t) * controls.bounceHeight
    } else if (handTwistDirection !== 0) {
      // Open hand normally freezes; twisting acts like turning a jar lid.
      const twistSpeed = delta * (controls.rotationSpeed * 2.6)
      group.rotation.y += twistSpeed * handTwistDirection
    }

    // Mouse point in world space (ray -> ground plane y=0), then convert to cluster-local space.
    const mouseNdc = pointerNdcRef.current
    if (mouseNdc) state.raycaster.setFromCamera(mouseNdc, state.camera)
    const hit = mouseNdc
      ? state.raycaster.ray.intersectPlane(groundPlane, mouseWorld)
      : null
    const hasMousePoint = Boolean(hit)
    if (hasMousePoint) {
      mouseLocal.copy(mouseWorld)
      group.worldToLocal(mouseLocal)
    }

    const spreadX =
      Math.max(0.05, controls.clusterSpread) *
      Math.max(0.2, controls.scale + controls.stretch)
    const spreadY =
      Math.max(0.05, controls.clusterSpread) *
      Math.max(0.2, controls.scale - controls.stretch)
    const spreadZ = Math.max(0.05, controls.clusterSpread) * controls.scale

    const influenceRadius = Math.max(0.01, controls.influenceRadius)
    const repelStrength = Math.max(0, controls.repelStrength)
    const returnStrength = Math.max(0, controls.returnStrength)
    const damping = Math.max(0, controls.damping)
    const dampingFactor = Math.exp(-damping * delta)
    const r = Math.max(0.02, controls.sphereRadius)

    const positions = positionsRef.current
    const velocities = velocitiesRef.current

    const now = performance.now()
    const helloActive = now < helloUntilRef.current

    // Cursor-triggered explosion: burst when mouse is near the cluster.
    if (hasMousePoint) {
      const cooldownMs = 450
      const dToCenter = mouseLocal.length()
      const triggerRadius = influenceRadius * 0.9
      if (dToCenter < triggerRadius && now - lastExplosionAtRef.current > cooldownMs) {
        const proximity = 1 - dToCenter / triggerRadius
        const strength = 4.5 + proximity * 7.5
        explosionRef.current = { t: now, strength }
        lastExplosionAtRef.current = now
      }
    }

    const explosion = explosionRef.current
    const doExplosion = Boolean(explosion)

    for (let i = 0; i < basePoints.length; i += 1) {
      let restX: number
      let restY: number
      let restZ: number

      if (helloActive) {
        const p = helloPoints[i]
        // Map hello point cloud into the same “spread” space as the cluster.
        restX = p.x * spreadX
        restY = p.y * spreadY
        restZ = p.z * spreadZ
      } else {
        const [bx, by, bz] = basePoints[i]
        restX = bx * spreadX
        restY = by * spreadY
        restZ = bz * spreadZ
      }

      const pos = positions[i]
      const vel = velocities[i]
      if (!pos || !vel) continue

      // One-shot explosion impulse on click.
      if (doExplosion && explosion) {
        tmp.copy(pos)
        const d = tmp.length()
        if (d > 1e-6) tmp.multiplyScalar(1 / d)
        else tmp.set(0, 1, 0)

        // Add a little "chaos" so it feels like an explosion, not a perfect sphere.
        const chaos = (i * 0.37) % 1
        tmp.set(
          tmp.x + (chaos - 0.5) * 0.35,
          tmp.y + ((chaos * 1.7) % 1 - 0.5) * 0.25,
          tmp.z + ((chaos * 2.3) % 1 - 0.5) * 0.35,
        )
        tmp.normalize()

        vel.addScaledVector(tmp, explosion.strength)
      }

      // Spring back to rest position (or gather on pointer when pointing).
      if (gatherOnPointer && hasMousePoint) {
        const gatherStrength = Math.max(returnStrength, 36)
        vel.x += (mouseLocal.x - pos.x) * gatherStrength * delta
        vel.y += (mouseLocal.y - pos.y) * gatherStrength * delta
        vel.z += (mouseLocal.z - pos.z) * gatherStrength * delta
      } else {
        vel.x += (restX - pos.x) * returnStrength * delta
        vel.y += (restY - pos.y) * returnStrength * delta
        vel.z += (restZ - pos.z) * returnStrength * delta
      }

      // Pointer force: repel (mouse) or attract (webcam finger).
      if (hasMousePoint && !gatherOnPointer) {
        tmp.subVectors(pointerAttract ? mouseLocal : pos, pointerAttract ? pos : mouseLocal)
        const d = tmp.length()
        if (d > 1e-6 && d < influenceRadius) {
          const falloff = 1 - d / influenceRadius
          tmp.multiplyScalar((repelStrength * falloff * falloff * delta) / d)
          vel.add(tmp)
        }
      }

      if (freezeMotion) {
        vel.set(0, 0, 0)
      } else {
        vel.multiplyScalar(dampingFactor)
        pos.addScaledVector(vel, delta)
      }

      dummy.position.copy(pos)
      dummy.rotation.set(0, 0, 0)
      dummy.scale.setScalar(r)
      dummy.updateMatrix()
      instanced.setMatrixAt(i, dummy.matrix)
    }

    instanced.instanceMatrix.needsUpdate = true

    if (doExplosion) {
      explosionRef.current = null
    }
  })

  return (
    <group ref={groupRef}>
      <instancedMesh
        ref={instancedRef}
        args={[undefined, undefined, basePoints.length]}
      >
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial vertexColors roughness={0.35} metalness={0.1} />
      </instancedMesh>
    </group>
  )
}

type ThreeSceneProps = {
  controls: ShapeControls
  helloSignal?: number
  helloHoldMs?: number
  pointerNdcRef?: MutableRefObject<Vector2 | null>
  pointerAttract?: boolean
  cameraGesture?: 'none' | 'open' | 'point'
  handTwistDirection?: -1 | 0 | 1
}

export function ThreeScene({
  controls,
  helloSignal,
  helloHoldMs,
  pointerNdcRef,
  pointerAttract,
  cameraGesture,
  handTwistDirection,
}: ThreeSceneProps) {
  const mouseNdcRef = useRef<Vector2 | null>(null)
  const activePointerRef = pointerNdcRef ?? mouseNdcRef
  const wrapRef = useRef<HTMLDivElement>(null)
  const drawCanvasRef = useRef<HTMLCanvasElement>(null)
  const debugRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<'none' | 'open' | 'point'>(cameraGesture ?? 'none')
  const pointerRef = useRef<MutableRefObject<Vector2 | null>>(activePointerRef)

  useEffect(() => {
    gestureRef.current = cameraGesture ?? 'none'
  }, [cameraGesture])

  useEffect(() => {
    pointerRef.current = activePointerRef
  }, [activePointerRef])

  useEffect(() => {
    const canvas = drawCanvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId = 0
    let drawing = false
    let prevGesture: 'none' | 'open' | 'point' = gestureRef.current
    let lastW = 0
    let lastH = 0
    let lastDpr = 0
    const strokePoints: Array<{ x: number; y: number }> = []

    const tick = () => {
      const currentGesture = gestureRef.current
      const p = pointerRef.current.current
      const width = Math.max(1, Math.floor(wrap.clientWidth))
      const height = Math.max(1, Math.floor(wrap.clientHeight))
      const dpr = window.devicePixelRatio || 1
      const hasFinger = Boolean(p)
      const canDraw = currentGesture === 'point' || (pointerAttract && hasFinger && currentGesture !== 'open')

      if (width !== lastW || height !== lastH || dpr !== lastDpr) {
        lastW = width
        lastH = height
        lastDpr = dpr
        canvas.width = Math.floor(width * dpr)
        canvas.height = Math.floor(height * dpr)
        canvas.style.width = `${width}px`
        canvas.style.height = `${height}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.lineWidth = 8
        ctx.strokeStyle = '#111'
      }

      if (prevGesture === 'point' && currentGesture === 'none') {
        strokePoints.length = 0
      }
      prevGesture = currentGesture

      if (canDraw && p) {
        const x = ((p.x + 1) * 0.5) * width
        const y = ((1 - p.y) * 0.5) * height

        if (!drawing) {
          drawing = true
          strokePoints.push({ x, y })
        } else {
          const last = strokePoints[strokePoints.length - 1]
          if (!last || Math.hypot(x - last.x, y - last.y) > 0.8) {
            strokePoints.push({ x, y })
          }
          if (strokePoints.length > 4000) strokePoints.shift()
        }
      } else {
        drawing = false
      }

      ctx.clearRect(0, 0, width, height)
      if (strokePoints.length > 1) {
        ctx.beginPath()
        ctx.moveTo(strokePoints[0].x, strokePoints[0].y)
        for (let i = 1; i < strokePoints.length; i += 1) {
          const pt = strokePoints[i]
          ctx.lineTo(pt.x, pt.y)
        }
        ctx.stroke()
      }

      if (canDraw && p) {
        const cx = ((p.x + 1) * 0.5) * width
        const cy = ((1 - p.y) * 0.5) * height
        ctx.beginPath()
        ctx.arc(cx, cy, 4, 0, Math.PI * 2)
        ctx.fillStyle = '#ff2d55'
        ctx.fill()
      }

      const debugEl = debugRef.current
      if (debugEl) {
        const px = p ? p.x.toFixed(2) : '—'
        const py = p ? p.y.toFixed(2) : '—'
        debugEl.textContent = `gesture:${currentGesture} finger:${hasFinger ? 'yes' : 'no'} draw:${canDraw ? 'on' : 'off'} ndc:${px},${py}`
      }

      rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div ref={wrapRef} className="three-scene-wrap" aria-label="Three.js preview">
      <Canvas
        camera={{ position: [2.2, 1.8, 2.8], fov: 45 }}
        gl={{ alpha: true, antialias: true }}
        onPointerMove={(event) => {
          if (!mouseNdcRef.current) mouseNdcRef.current = new Vector2()
          const rect = event.currentTarget.getBoundingClientRect()
          const x = ((event.clientX - rect.left) / rect.width) * 2 - 1
          const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1)
          mouseNdcRef.current.set(x, y)
        }}
        onPointerLeave={() => {
          mouseNdcRef.current = null
        }}
      >
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 4]} intensity={0.95} />
        <pointLight position={[-3, 2, 2]} intensity={0.5} />
        <SphereCluster
          controls={controls}
          pointerNdcRef={activePointerRef}
          pointerAttract={pointerAttract}
          cameraGesture={cameraGesture}
          handTwistDirection={handTwistDirection}
          helloSignal={helloSignal}
          helloHoldMs={helloHoldMs}
        />
        <OrbitControls enableDamping makeDefault />
      </Canvas>
      <canvas
        ref={drawCanvasRef}
        className="finger-draw-overlay"
        aria-hidden="true"
      />
      <div ref={debugRef} className="finger-draw-debug" aria-live="polite" />
    </div>
  )
}
