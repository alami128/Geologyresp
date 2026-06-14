import { EARTHS_INTERIOR_MODEL } from './solarSystemModels'
import { EARTH_INTERIOR_SETTINGS } from './earthInteriorModel'
import { MANTLE_CONVECTION_MODEL, MANTLE_CONVECTION_SETTINGS } from './mantleConvectionModel'
import {
  SKETCHFAB_COLLISION,
  SKETCHFAB_FORMATION_OCEAN,
  SKETCHFAB_SEISME,
  SKETCHFAB_SUBDUCTION,
  type SketchfabEmbedConfig,
} from './sketchfabModels'

export type DetailSlide = {
  title: string
  description: string
}

export type DetailId =
  | 'rift'
  | 'earth-structure'
  | 'mantle-convection'
  | 'seisme'
  | 'subduction'
  | 'collision'
  | 'formation-ocean'

export type DetailModelSettings = {
  scale: number
  camera: [number, number, number]
  minDistance: number
  maxDistance: number
}

export const DETAIL_MODELS: Partial<Record<DetailId, string>> = {
  rift: '/models/les-plaques-tectoniques.glb',
  'earth-structure': EARTHS_INTERIOR_MODEL,
  'mantle-convection': MANTLE_CONVECTION_MODEL,
}

export const SKETCHFAB_EMBEDS: Partial<Record<DetailId, SketchfabEmbedConfig>> = {
  seisme: SKETCHFAB_SEISME,
  subduction: SKETCHFAB_SUBDUCTION,
  collision: SKETCHFAB_COLLISION,
  'formation-ocean': SKETCHFAB_FORMATION_OCEAN,
}

export function usesSketchfabEmbed(detailId: DetailId | null): detailId is DetailId {
  if (!detailId) return false
  return detailId in SKETCHFAB_EMBEDS
}

export function getSketchfabEmbed(detailId: DetailId): SketchfabEmbedConfig | null {
  return SKETCHFAB_EMBEDS[detailId] ?? null
}

export const DETAIL_MODEL_SETTINGS: Partial<Record<DetailId, DetailModelSettings>> = {
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
      title: 'Les limites et types des plaques',
      description:
        'Activez les couches dans le panneau — dorsales, subduction, failles transformantes, volcans et séismes.',
    },
  ],
  'earth-structure': [
    {
      title: "L'intérieur de la Terre",
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
  seisme: [
    {
      title: 'Séisme et tsunami',
      description:
        'Modèle 3D Sketchfab — secousse le long d’une faille et onde de tsunami associée.',
    },
  ],
  subduction: [
    {
      title: 'Subduction',
      description:
        'Plaque océanique en mouvement — une plaque dense plonge sous une autre.',
    },
  ],
  collision: [
    {
      title: 'Collision',
      description:
        'Deux plaques continentales entrent en collision — formation de chaînes de montagnes.',
    },
  ],
  'formation-ocean': [
    {
      title: "Formation d'océan",
      description:
        'Marge continentale passive — sédiments accumulés le long d’un continent où l’activité tectonique est faible.',
    },
  ],
}

export const DETAIL_HINTS: Record<DetailId, string> = {
  rift: 'Limites et types des plaques — activez les lignes animées depuis le panneau de contrôle',
  'earth-structure': "L'intérieur de la Terre — schéma en français · animation · cliquez une couche",
  'mantle-convection': 'Convection mantellique — activez les courants · faites tourner le modèle',
  seisme: 'Séisme — faites tourner le modèle · molette pour zoomer · plein écran disponible',
  subduction: 'Subduction — faites tourner le modèle · molette pour zoomer',
  collision: 'Collision — faites tourner le modèle · molette pour zoomer',
  'formation-ocean': "Formation d'océan — faites tourner le modèle · molette pour zoomer",
}

const TOPIC_DETAIL_MAP: Record<string, DetailId> = {
  interieur_terre: 'earth-structure',
  limites_plaques: 'rift',
  seisme: 'seisme',
  subduction: 'subduction',
  collision: 'collision',
  formation_ocean: 'formation-ocean',
}

export function topicHasDetail(topicId: string | null): topicId is keyof typeof TOPIC_DETAIL_MAP {
  if (!topicId) return false
  return topicId in TOPIC_DETAIL_MAP
}

export function getDetailId(topicId: string | null): DetailId | null {
  if (!topicId) return null
  return TOPIC_DETAIL_MAP[topicId] ?? null
}

export function getDetailSteps(detailId: DetailId): DetailSlide[] {
  return DETAIL_STEPS[detailId]
}

export function getDetailStepCount(detailId: DetailId): number {
  return DETAIL_STEPS[detailId].length
}

export function getDetailModelSettings(detailId: DetailId): DetailModelSettings {
  const settings = DETAIL_MODEL_SETTINGS[detailId]
  if (!settings) {
    throw new Error(`No local model settings for detail: ${detailId}`)
  }
  return settings
}
