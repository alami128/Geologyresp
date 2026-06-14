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

export type EarthTopicGroup = {
  id: string
  name: string
  children: EarthTopic[]
}

export type EarthTopicMenuEntry =
  | { kind: 'topic'; topic: EarthTopic }
  | { kind: 'group'; group: EarthTopicGroup }

const TOPIC_INTERIEUR: EarthTopic = {
  id: 'interieur_terre',
  name: "L'intérieur de la Terre",
  lat: 25,
  lon: -40,
  title: "L'intérieur de la Terre",
  description:
    'Coupe des enveloppes terrestres — croûte, manteau, noyau externe et graine.',
  detailId: 'earth-structure',
}

const TOPIC_LIMITES: EarthTopic = {
  id: 'limites_plaques',
  name: 'Les limites et types des plaques',
  lat: -3,
  lon: 37,
  title: 'Les limites et types des plaques',
  description:
    'Activez les limites divergentes, convergentes et transformantes — lignes animées sur le globe.',
  detailId: 'rift',
}

const TOPIC_SEISME: EarthTopic = {
  id: 'seisme',
  name: 'Séisme',
  lat: 35,
  lon: -120,
  title: 'Séisme',
  description:
    'Libération brutale d’énergie le long d’une faille — secousses et ondes sismiques.',
}

const TOPIC_SUBDUCTION: EarthTopic = {
  id: 'subduction',
  name: 'Subduction',
  lat: 14,
  lon: 142,
  title: 'Subduction',
  description:
    'Une plaque océanique dense plonge sous une autre — fosses profondes et arc volcanique.',
}

const TOPIC_COLLISION: EarthTopic = {
  id: 'collision',
  name: 'Collision',
  lat: 28,
  lon: 85,
  title: 'Collision',
  description:
    'Deux plaques continentales se rencontrent — chaînes de montagnes et épaississement crustal.',
}

const TOPIC_FORMATION_OCEAN: EarthTopic = {
  id: 'formation_ocean',
  name: "Formation d'océan",
  lat: 25,
  lon: -40,
  title: "Formation d'océan",
  description:
    'Marge passive — sédiments marins et formation de la croûte océanique le long d’un continent.',
  detailId: 'formation-ocean',
}

export const EARTH_TOPIC_MENU: EarthTopicMenuEntry[] = [
  { kind: 'topic', topic: TOPIC_INTERIEUR },
  { kind: 'topic', topic: TOPIC_LIMITES },
  { kind: 'topic', topic: TOPIC_SEISME },
  {
    kind: 'group',
    group: {
      id: 'mouvement_convergent',
      name: 'Mouvement convergent',
      children: [TOPIC_SUBDUCTION, TOPIC_COLLISION],
    },
  },
  {
    kind: 'group',
    group: {
      id: 'mouvement_divergent',
      name: 'Mouvement divergent',
      children: [TOPIC_FORMATION_OCEAN],
    },
  },
]

/** Flat list for globe markers and lookups */
export const EARTH_TOPICS: EarthTopic[] = EARTH_TOPIC_MENU.flatMap((entry) =>
  entry.kind === 'topic' ? [entry.topic] : entry.group.children,
)

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

export function getGroupIdForTopic(topicId: string): string | null {
  for (const entry of EARTH_TOPIC_MENU) {
    if (entry.kind === 'group' && entry.group.children.some((child) => child.id === topicId)) {
      return entry.group.id
    }
  }
  return null
}
