import { Html, Line } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Group, Mesh } from 'three'
import * as THREE from 'three'

type RiftDetailSceneProps = {
  step: number
}

const STEP = {
  spread: [0.08, 0.55, 0.82],
  drop: [0, 0.32, 0.42],
  magma: [0.15, 0.55, 1],
  conduit: [0, 0.35, 1],
  lava: [0, 0, 1],
  sideArrows: [1, 1, 0.85],
  faultArrows: [0, 1, 1],
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function Label({ children, position }: { children: string; position: [number, number, number] }) {
  return (
    <Html position={position} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
      <span className="rift-label">{children}</span>
    </Html>
  )
}

export function RiftDetailScene({ step }: RiftDetailSceneProps) {
  const leftOuterRef = useRef<Mesh>(null)
  const leftInnerRef = useRef<Mesh>(null)
  const centerRef = useRef<Mesh>(null)
  const rightInnerRef = useRef<Mesh>(null)
  const rightOuterRef = useRef<Mesh>(null)
  const magmaRef = useRef<Mesh>(null)
  const conduitRef = useRef<Mesh>(null)
  const lavaRef = useRef<Group>(null)
  const leftArrowRef = useRef<Group>(null)
  const rightArrowRef = useRef<Group>(null)
  const leftFaultArrowRef = useRef<Group>(null)
  const rightFaultArrowRef = useRef<Group>(null)

  const anim = useRef({
    spread: STEP.spread[0],
    drop: STEP.drop[0],
    magma: STEP.magma[0],
    conduit: STEP.conduit[0],
    lava: STEP.lava[0],
    sideArrows: STEP.sideArrows[0],
    faultArrows: STEP.faultArrows[0],
  })

  const convectionPoints = useMemo((): [number, number, number][] => {
    return [
      [-0.5, -1.15, 0.2],
      [-0.2, -0.95, 0.2],
      [0.3, -1.05, 0.2],
      [0.55, -0.9, 0.2],
      [0.2, -1.2, 0.2],
      [-0.5, -1.15, 0.2],
    ]
  }, [])

  const setGroupOpacity = (group: Group | null, opacity: number) => {
    if (!group) return
    group.visible = opacity > 0.04
    group.children.forEach((child) => {
      const mesh = child as Mesh
      if (mesh.material && 'opacity' in mesh.material) {
        const mat = mesh.material as THREE.MeshBasicMaterial
        mat.transparent = true
        mat.opacity = opacity
      }
    })
  }

  useFrame((state, delta) => {
    const s = Math.min(step, 2)
    const speed = 2.8
    const a = anim.current

    a.spread = lerp(a.spread, STEP.spread[s], Math.min(1, delta * speed))
    a.drop = lerp(a.drop, STEP.drop[s], Math.min(1, delta * speed))
    a.magma = lerp(a.magma, STEP.magma[s], Math.min(1, delta * speed))
    a.conduit = lerp(a.conduit, STEP.conduit[s], Math.min(1, delta * speed))
    a.lava = lerp(a.lava, STEP.lava[s], Math.min(1, delta * speed))
    a.sideArrows = lerp(a.sideArrows, STEP.sideArrows[s], Math.min(1, delta * speed))
    a.faultArrows = lerp(a.faultArrows, STEP.faultArrows[s], Math.min(1, delta * speed))

    const spread = a.spread
    const drop = a.drop
    const pulse = Math.sin(state.clock.elapsedTime * 2.2) * 0.018 * a.sideArrows

    if (leftOuterRef.current) leftOuterRef.current.position.set(-1.05 - spread - pulse, 0.35, 0)
    if (leftInnerRef.current) leftInnerRef.current.position.set(-0.42 - spread * 0.5, 0.12 - drop, 0)
    if (centerRef.current) centerRef.current.position.set(0, -0.08 - drop * 1.15, 0)
    if (rightInnerRef.current) rightInnerRef.current.position.set(0.42 + spread * 0.5, 0.12 - drop, 0)
    if (rightOuterRef.current) rightOuterRef.current.position.set(1.05 + spread + pulse, 0.35, 0)

    if (magmaRef.current) {
      magmaRef.current.scale.y = 0.35 + a.magma * 0.65
      const mat = magmaRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.35 + a.magma * 0.65
    }

    if (conduitRef.current) {
      conduitRef.current.scale.y = 0.08 + a.conduit * 0.92
      const mat = conduitRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = a.conduit
    }

    if (lavaRef.current) {
      lavaRef.current.visible = a.lava > 0.05
      lavaRef.current.children.forEach((child) => {
        if ((child as Mesh).isMesh) {
          const mat = (child as Mesh).material as THREE.MeshBasicMaterial
          mat.opacity = a.lava
        }
      })
    }

    setGroupOpacity(leftArrowRef.current, a.sideArrows)
    setGroupOpacity(rightArrowRef.current, a.sideArrows)
    setGroupOpacity(leftFaultArrowRef.current, a.faultArrows)
    setGroupOpacity(rightFaultArrowRef.current, a.faultArrows)

  })

  return (
    <group position={[0, 0.1, 0]}>
      {/* Magma chamber */}
      <group position={[0, -1.05, 0]}>
        <mesh ref={magmaRef} position={[0, -0.15, 0]}>
          <boxGeometry args={[2.6, 0.55, 0.35]} />
          <meshBasicMaterial color="#ff9500" transparent opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <boxGeometry args={[2.4, 0.35, 0.32]} />
          <meshBasicMaterial color="#ffcc33" transparent opacity={0.85} />
        </mesh>
        {step >= 1 ? (
          <Line
            points={convectionPoints}
            color="#ffffff"
            lineWidth={2}
            transparent
            opacity={0.75}
          />
        ) : null}
        <Label position={[0, -0.5, 0.35]}>Magma</Label>
      </group>

      <mesh ref={conduitRef} position={[0, -0.15, 0.12]}>
        <boxGeometry args={[0.12, 1.1, 0.12]} />
        <meshBasicMaterial color="#e53935" transparent opacity={0} />
      </mesh>
      <Label position={[0.22, 0.05, 0.35]}>Lava conduit</Label>

      <mesh ref={leftOuterRef} position={[-1.05, 0.35, 0]}>
        <boxGeometry args={[0.75, 0.55, 0.4]} />
        <meshBasicMaterial color="#3d3d3d" />
      </mesh>
      <mesh ref={leftInnerRef} position={[-0.42, 0.12, 0]}>
        <boxGeometry args={[0.55, 0.45, 0.38]} />
        <meshBasicMaterial color="#a67c52" />
      </mesh>
      <mesh ref={centerRef} position={[0, -0.08, 0]}>
        <boxGeometry args={[0.45, 0.38, 0.36]} />
        <meshBasicMaterial color="#8f6848" />
      </mesh>
      <mesh ref={rightInnerRef} position={[0.42, 0.12, 0]}>
        <boxGeometry args={[0.55, 0.45, 0.38]} />
        <meshBasicMaterial color="#a67c52" />
      </mesh>
      <mesh ref={rightOuterRef} position={[1.05, 0.35, 0]}>
        <boxGeometry args={[0.75, 0.55, 0.4]} />
        <meshBasicMaterial color="#3d3d3d" />
      </mesh>

      <Label position={[1.15, 0.55, 0.35]}>Continental crust</Label>

      <mesh position={[-0.72, 0.05, 0.18]}>
        <boxGeometry args={[0.06, 0.5, 0.02]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.18, -0.05, 0.18]}>
        <boxGeometry args={[0.06, 0.45, 0.02]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.18, -0.05, 0.18]}>
        <boxGeometry args={[0.06, 0.45, 0.02]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.72, 0.05, 0.18]}>
        <boxGeometry args={[0.06, 0.5, 0.02]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <Label position={[-0.45, 0.35, 0.35]}>Fault</Label>

      <group ref={lavaRef} visible={false} position={[0, 0.22, 0.2]}>
        <mesh position={[-0.08, 0, 0]}>
          <boxGeometry args={[0.2, 0.06, 0.15]} />
          <meshBasicMaterial color="#e53935" transparent opacity={0} />
        </mesh>
        <mesh position={[0.1, 0, 0]}>
          <boxGeometry args={[0.15, 0.05, 0.12]} />
          <meshBasicMaterial color="#ef5350" transparent opacity={0} />
        </mesh>
        <Label position={[0, 0.18, 0.2]}>Lava flow</Label>
      </group>

      {/* Large white outward arrows */}
      <group ref={leftArrowRef} position={[-1.55, 0.55, 0.35]}>
        <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <coneGeometry args={[0.14, 0.35, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
        <mesh scale={[0.65, 1, 1]}>
          <boxGeometry args={[0.5, 0.1, 0.08]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
      </group>
      <group ref={rightArrowRef} position={[1.55, 0.55, 0.35]}>
        <mesh position={[0.35, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.14, 0.35, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
        <mesh scale={[0.65, 1, 1]}>
          <boxGeometry args={[0.5, 0.1, 0.08]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={1} />
        </mesh>
      </group>

      {/* Black downward fault arrows */}
      <group ref={leftFaultArrowRef} position={[-0.55, 0.05, 0.25]}>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.05, 0.12, 4]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={1} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.04, 0.14, 0.04]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={1} />
        </mesh>
      </group>
      <group ref={rightFaultArrowRef} position={[0.55, 0.05, 0.25]}>
        <mesh position={[0, -0.12, 0]}>
          <coneGeometry args={[0.05, 0.12, 4]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={1} />
        </mesh>
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[0.04, 0.14, 0.04]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={1} />
        </mesh>
      </group>

      <mesh position={[0, 0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4, 0.5]} />
        <meshBasicMaterial color="#3a6a9a" transparent opacity={0.4} />
      </mesh>
    </group>
  )
}
