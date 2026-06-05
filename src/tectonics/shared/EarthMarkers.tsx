import { Html } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import { Vector3 } from 'three'
import { EARTH_TOPICS, latLonToPosition, type EarthTopic } from '../earthTopics'

const MARKER_RADIUS = 1.02
const _normal = new Vector3()
const _toCamera = new Vector3()

type EarthMarkersProps = {
  selectedId: string | null
  onSelectTopic: (id: string) => void
}

type TopicMarkerProps = {
  topic: EarthTopic
  selected: boolean
  onSelectTopic: (id: string) => void
}

function TopicMarker({ topic, selected, onSelectTopic }: TopicMarkerProps) {
  const [x, y, z] = latLonToPosition(topic.lat, topic.lon, MARKER_RADIUS)
  const position = useRef(new Vector3(x, y, z)).current
  const [visible, setVisible] = useState(true)

  useFrame(({ camera }) => {
    _normal.copy(position).normalize()
    _toCamera.copy(camera.position).sub(position).normalize()
    const facing = _normal.dot(_toCamera) > 0.08
    if (facing !== visible) setVisible(facing)
  })

  if (!visible) return null

  return (
    <Html
      position={[x, y, z]}
      center
      distanceFactor={10}
      zIndexRange={[10, 0]}
      style={{ pointerEvents: 'none' }}
    >
      <button
        type="button"
        className={`earth-dot${selected ? ' earth-dot--selected' : ''}`}
        style={{ pointerEvents: 'auto' }}
        aria-label={topic.name}
        onClick={(e) => {
          e.stopPropagation()
          onSelectTopic(topic.id)
        }}
      />
    </Html>
  )
}

export function EarthMarkers({ selectedId, onSelectTopic }: EarthMarkersProps) {
  return (
    <group>
      {EARTH_TOPICS.map((topic) => (
        <TopicMarker
          key={topic.id}
          topic={topic}
          selected={selectedId === topic.id}
          onSelectTopic={onSelectTopic}
        />
      ))}
    </group>
  )
}
