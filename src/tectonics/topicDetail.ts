import { EARTHS_INTERIOR_MODEL, EARTHS_INTERIOR_SETTINGS } from './solarSystemModels'

export type DetailSlide = {
  title: string
  description: string
}

export type DetailId = 'rift' | 'earth-structure'

export type DetailModelSettings = {
  scale: number
  camera: [number, number, number]
  minDistance: number
  maxDistance: number
}

export const DETAIL_MODELS: Record<DetailId, string> = {
  rift: '/models/les-plaques-tectoniques.glb',
  'earth-structure': EARTHS_INTERIOR_MODEL,
}

export const SKETCHFAB_EMBEDS = {} as const

export function usesSketchfabEmbed(_detailId: DetailId | null): false {
  return false
}

export const DETAIL_MODEL_SETTINGS: Record<DetailId, DetailModelSettings> = {
  rift: {
    scale: 0.65,
    camera: [0, 1.2, 6.5],
    minDistance: 1.5,
    maxDistance: 22,
  },
  'earth-structure': EARTHS_INTERIOR_SETTINGS,
}

export const DETAIL_STEPS: Record<DetailId, DetailSlide[]> = {
  rift: [
    {
      title: 'Tectonic plates',
      description:
        'Use the Control menu to turn layers on and off — divergent boundaries, subduction zones, transform faults, volcanoes, and seismic hazard.',
    },
  ],
  'earth-structure': [
    {
      title: "Earth's interior",
      description:
        'Animated cutaway of Earth’s layers — crust, mantle, outer core, and inner core. Drag to rotate and scroll to zoom.',
    },
  ],
}

export const DETAIL_HINTS: Record<DetailId, string> = {
  rift: 'Tectonic plates — click Control items to show layers on Earth',
  'earth-structure': "Earth's interior — drag to rotate · scroll to zoom",
}

export function topicHasDetail(
  topicId: string | null,
): topicId is 'east_africa' | 'midatlantic' {
  return topicId === 'east_africa' || topicId === 'midatlantic'
}

export function getDetailId(topicId: string | null): DetailId | null {
  if (topicId === 'east_africa') return 'rift'
  if (topicId === 'midatlantic') return 'earth-structure'
  return null
}

export function getDetailSteps(detailId: DetailId): DetailSlide[] {
  return DETAIL_STEPS[detailId]
}

export function getDetailStepCount(detailId: DetailId): number {
  return DETAIL_STEPS[detailId].length
}

export function getDetailModelSettings(detailId: DetailId): DetailModelSettings {
  return DETAIL_MODEL_SETTINGS[detailId]
}
