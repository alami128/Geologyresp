export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

export type PlanetDef = {
  id: PlanetId
  name: string
  radius: number
  orbitRadius: number
  orbitSpeed: number
  color: string
  emissive?: string
  hasRing?: boolean
  /** Stagger starting angle so planets are spread out */
  startAngle: number
}

export const SUN_RADIUS = 0.55

export const SOLAR_PLANETS: PlanetDef[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    radius: 0.07,
    orbitRadius: 1.6,
    orbitSpeed: 2.4,
    color: '#9a9a9a',
    startAngle: 0.4,
  },
  {
    id: 'venus',
    name: 'Venus',
    radius: 0.11,
    orbitRadius: 2.2,
    orbitSpeed: 1.8,
    color: '#e8cda0',
    emissive: '#443322',
    startAngle: 2.1,
  },
  {
    id: 'earth',
    name: 'Earth',
    radius: 0.12,
    orbitRadius: 3,
    orbitSpeed: 1.2,
    color: '#2a7fc4',
    startAngle: 4.2,
  },
  {
    id: 'mars',
    name: 'Mars',
    radius: 0.09,
    orbitRadius: 3.8,
    orbitSpeed: 1,
    color: '#c1440e',
    startAngle: 5.5,
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    radius: 0.28,
    orbitRadius: 5.4,
    orbitSpeed: 0.55,
    color: '#d4a574',
    emissive: '#3d2810',
    startAngle: 1.2,
  },
  {
    id: 'saturn',
    name: 'Saturn',
    radius: 0.24,
    orbitRadius: 6.8,
    orbitSpeed: 0.42,
    color: '#e8d5a3',
    emissive: '#3a3018',
    hasRing: true,
    startAngle: 3.6,
  },
  {
    id: 'uranus',
    name: 'Uranus',
    radius: 0.16,
    orbitRadius: 8.2,
    orbitSpeed: 0.3,
    color: '#93b8c8',
    startAngle: 0.9,
  },
  {
    id: 'neptune',
    name: 'Neptune',
    radius: 0.15,
    orbitRadius: 9.4,
    orbitSpeed: 0.24,
    color: '#3f54b8',
    startAngle: 2.8,
  },
]

export function getPlanetById(id: PlanetId): PlanetDef {
  const planet = SOLAR_PLANETS.find((entry) => entry.id === id)
  if (!planet) throw new Error(`Unknown planet: ${id}`)
  return planet
}
