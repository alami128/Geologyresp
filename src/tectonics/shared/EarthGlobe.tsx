import { useTexture } from '@react-three/drei'
import { Suspense, useLayoutEffect, useRef, type Ref } from 'react'
import type { Mesh } from 'three'
import { SRGBColorSpace } from 'three'

const EARTH_TEXTURE = '/textures/earth.jpg'

type EarthGlobeProps = {
  radius?: number
  onClick?: () => void
  interactive?: boolean
  meshRef?: Ref<Mesh>
}

function TexturedEarth({
  radius,
  onClick,
  interactive,
  meshRef,
}: {
  radius: number
  onClick?: () => void
  interactive: boolean
  meshRef?: Ref<Mesh>
}) {
  const localRef = useRef<Mesh>(null)
  const earthMap = useTexture(EARTH_TEXTURE)

  useLayoutEffect(() => {
    earthMap.colorSpace = SRGBColorSpace
    earthMap.anisotropy = 16
    earthMap.needsUpdate = true
  }, [earthMap])

  return (
    <mesh
      ref={(node) => {
        localRef.current = node
        if (typeof meshRef === 'function') meshRef(node)
        else if (meshRef) meshRef.current = node
      }}
      onClick={(e) => {
        if (!interactive) return
        e.stopPropagation()
        onClick?.()
      }}
    >
      <sphereGeometry args={[radius, 96, 64]} />
      <meshStandardMaterial
        map={earthMap}
        roughness={0.55}
        metalness={0.02}
      />
    </mesh>
  )
}

function SolidEarth({
  radius,
  onClick,
  interactive,
  meshRef,
}: {
  radius: number
  onClick?: () => void
  interactive: boolean
  meshRef?: Ref<Mesh>
}) {
  return (
    <mesh
      ref={meshRef}
      onClick={(e) => {
        if (!interactive) return
        e.stopPropagation()
        onClick?.()
      }}
    >
      <sphereGeometry args={[radius, 64, 48]} />
      <meshStandardMaterial
        color="#2a7fc4"
        roughness={0.7}
        metalness={0.05}
        emissive="#1a4a7a"
        emissiveIntensity={0.12}
      />
    </mesh>
  )
}

export function EarthGlobe({
  radius = 1,
  onClick,
  interactive = false,
  meshRef,
}: EarthGlobeProps) {
  return (
    <Suspense
      fallback={
        <SolidEarth
          radius={radius}
          onClick={onClick}
          interactive={interactive}
          meshRef={meshRef}
        />
      }
    >
      <TexturedEarth
        radius={radius}
        onClick={onClick}
        interactive={interactive}
        meshRef={meshRef}
      />
    </Suspense>
  )
}
