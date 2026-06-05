import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import {
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { getSurfaceFrame } from '../plateSurfaceUtils'
import { TECTONIC_PLATES } from '../tectonicPlateLabels'

const GLOBE_RADIUS = 1
const LABEL_LIFT = 0.0018
const _normal = new Vector3()
const _toCamera = new Vector3()

type PlateLabelProps = {
  name: string
  lat: number
  lon: number
  tier: 'major' | 'minor'
}

function createNameTexture(name: string, tier: 'major' | 'minor') {
  const label = name.toUpperCase()
  const fontSize = tier === 'major' ? 26 : 18
  const paddingX = tier === 'major' ? 16 : 12
  const paddingY = tier === 'major' ? 10 : 8

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  const textWidth = ctx.measureText(label).width
  canvas.width = Math.ceil(textWidth + paddingX * 2)
  canvas.height = fontSize + paddingY * 2

  ctx.font = `600 ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = 'rgba(255, 255, 255, 0.14)'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)'
  ctx.lineWidth = 1.5
  const radius = 4
  const w = canvas.width
  const h = canvas.height
  ctx.beginPath()
  ctx.moveTo(radius, 0)
  ctx.lineTo(w - radius, 0)
  ctx.quadraticCurveTo(w, 0, w, radius)
  ctx.lineTo(w, h - radius)
  ctx.quadraticCurveTo(w, h, w - radius, h)
  ctx.lineTo(radius, h)
  ctx.quadraticCurveTo(0, h, 0, h - radius)
  ctx.lineTo(0, radius)
  ctx.quadraticCurveTo(0, 0, radius, 0)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = tier === 'major' ? 'rgba(248, 252, 255, 0.96)' : 'rgba(230, 240, 248, 0.88)'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(label, paddingX, h / 2)

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.needsUpdate = true

  const aspect = canvas.width / canvas.height
  const height = tier === 'major' ? 0.055 : 0.038
  const width = height * aspect

  return { texture, width, height }
}

function SurfacePlateLabel({ name, lat, lon, tier }: PlateLabelProps) {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<MeshBasicMaterial>(null)
  const visibleRef = useRef(true)

  const frame = useMemo(
    () => getSurfaceFrame(lat, lon, GLOBE_RADIUS + LABEL_LIFT),
    [lat, lon],
  )

  const { texture, width, height } = useMemo(
    () => createNameTexture(name, tier),
    [name, tier],
  )

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.position.set(...frame.position)
    mesh.quaternion.copy(frame.quaternion)
  }, [frame])

  useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  useFrame(({ camera }) => {
    const mesh = meshRef.current
    const material = materialRef.current
    if (!mesh || !material) return

    _normal.set(...frame.position).normalize()
    _toCamera.copy(camera.position).sub(mesh.position).normalize()
    const facing = _normal.dot(_toCamera) > 0.1

    if (facing !== visibleRef.current) {
      visibleRef.current = facing
      material.opacity = facing ? (tier === 'major' ? 0.96 : 0.88) : 0
    }
  })

  return (
    <mesh ref={meshRef} renderOrder={2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={tier === 'major' ? 0.96 : 0.88}
        depthWrite={false}
        depthTest
        side={DoubleSide}
        toneMapped={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  )
}

export function PlateLabels() {
  return (
    <group>
      {TECTONIC_PLATES.map((plate) => (
        <SurfacePlateLabel
          key={plate.code}
          name={plate.name}
          lat={plate.lat}
          lon={plate.lon}
          tier={plate.tier}
        />
      ))}
    </group>
  )
}
