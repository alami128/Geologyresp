import type { DetailId } from './topicDetail'

export type EarthTopic = {
  id: string
  name: string
  lat: number
  lon: number
  title: string
  description: string
  detailId?: DetailId
}

export const EARTH_TOPICS: EarthTopic[] = [
  {
    id: 'midatlantic',
    name: "Earth's interior",
    lat: 10,
    lon: -30,
    title: "Earth's interior",
    description:
      'Explore Earth’s layers in an interactive 3D model — crust, mantle, and core — hosted on Sketchfab.',
    detailId: 'earth-structure',
  },
  {
    id: 'pacific',
    name: 'Pacific Ring of Fire',
    lat: 10,
    lon: 165,
    title: 'Pacific Ring of Fire',
    description:
      'Most of the world’s earthquakes and volcanoes cluster along this belt where plates collide, slide, or sink. About 75% of active volcanoes sit on this ring.',
  },
  {
    id: 'himalaya',
    name: 'Himalaya',
    lat: 28,
    lon: 85,
    title: 'Continental collision',
    description:
      'India pushes into Asia, crumpling the crust upward. The Himalayas are still rising today as that collision continues.',
  },
  {
    id: 'sanandreas',
    name: 'San Andreas Fault',
    lat: 35,
    lon: -120,
    title: 'Transform boundary',
    description:
      'The Pacific and North American plates slide past each other horizontally. Stress builds along the fault until earthquakes release it.',
  },
  {
    id: 'mariana',
    name: 'Mariana Trench',
    lat: 14,
    lon: 142,
    title: 'Subduction zone',
    description:
      'Dense oceanic crust dives beneath lighter rock, descending into the mantle. Deep trenches and powerful quakes form where plates sink.',
  },
  {
    id: 'east_africa',
    name: 'Tectonic plates',
    lat: 10,
    lon: -30,
    title: 'Tectonic plates',
    description:
      'Toggle plate boundaries, volcanoes, and seismic zones on the globe using the Control menu.',
    detailId: 'rift',
  },
]

/** lat/lon in degrees → position on sphere of given radius */
export function latLonToPosition(
  lat: number,
  lon: number,
  radius: number,
): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180
  const theta = ((lon + 180) * Math.PI) / 180
  const x = -radius * Math.sin(phi) * Math.cos(theta)
  const y = radius * Math.cos(phi)
  const z = radius * Math.sin(phi) * Math.sin(theta)
  return [x, y, z]
}

export function getTopicById(id: string | null): EarthTopic | undefined {
  if (!id) return undefined
  return EARTH_TOPICS.find((t) => t.id === id)
}
