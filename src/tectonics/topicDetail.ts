import { EARTHS_INTERIOR_MODEL } from './solarSystemModels'
import { EARTH_INTERIOR_SETTINGS } from './earthInteriorModel'
import { MANTLE_CONVECTION_MODEL, MANTLE_CONVECTION_SETTINGS } from './mantleConvectionModel'

export type DetailSlide = {
  title: string
  description: string
}

export type DetailId = 'rift' | 'earth-structure' | 'mantle-convection'

export type DetailModelSettings = {
  scale: number
  camera: [number, number, number]
  minDistance: number
  maxDistance: number
}

export const DETAIL_MODELS: Record<DetailId, string> = {
  rift: '/models/les-plaques-tectoniques.glb',
  'earth-structure': EARTHS_INTERIOR_MODEL,
  'mantle-convection': MANTLE_CONVECTION_MODEL,
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
  'earth-structure': EARTH_INTERIOR_SETTINGS,
  'mantle-convection': MANTLE_CONVECTION_SETTINGS,
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
      title: "Intérieur de la Terre",
      description:
        'Coupe animée — les enveloppes se séparent. Cliquez une couche sur le schéma ou le modèle 3D.',
    },
  ],
  'mantle-convection': [
    {
      title: 'Convection mantellique',
      description:
        'Courants chauds et froids dans le manteau — remontée, cellules de convection et subduction.',
    },
  ],
}

export const DETAIL_HINTS: Record<DetailId, string> = {
  rift: 'Tectonic plates — click Control items to show layers on Earth',
  'earth-structure': "Intérieur de la Terre — schéma en français · animation · cliquez une couche",
  'mantle-convection': 'Convection mantellique — activez les courants · faites tourner le modèle',
}

export function topicHasDetail(
  topicId: string | null,
): topicId is 'east_africa' | 'midatlantic' | 'mantle_convection' {
  return topicId === 'east_africa' || topicId === 'midatlantic' || topicId === 'mantle_convection'
}

export function getDetailId(topicId: string | null): DetailId | null {
  if (topicId === 'east_africa') return 'rift'
  if (topicId === 'midatlantic') return 'earth-structure'
  if (topicId === 'mantle_convection') return 'mantle-convection'
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
