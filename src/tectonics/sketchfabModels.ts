/** Sketchfab models loaded via embed (no local .glb required). */
export type SketchfabEmbedConfig = {
  modelId: string
  title: string
  pageUrl: string
}

export const SKETCHFAB_SEISME: SketchfabEmbedConfig = {
  modelId: '5325ba12207c4dada68345e52c35ee38',
  title: 'Séisme et tsunami',
  pageUrl:
    'https://sketchfab.com/3d-models/earthquake-and-tsunami-5325ba12207c4dada68345e52c35ee38',
}

export const SKETCHFAB_SUBDUCTION: SketchfabEmbedConfig = {
  modelId: '7805590c82a54063aab2f2d691a345b8',
  title: 'Plaques tectoniques en mouvement',
  pageUrl:
    'https://sketchfab.com/3d-models/moving-tectonic-plates-7805590c82a54063aab2f2d691a345b8',
}

export const SKETCHFAB_COLLISION: SketchfabEmbedConfig = {
  modelId: '4a052941a17941b39052fa1451c63928',
  title: 'Collision animée de plaques tectoniques',
  pageUrl:
    'https://sketchfab.com/3d-models/animated-tectonic-plates-collide-loop-4a052941a17941b39052fa1451c63928',
}

export const SKETCHFAB_FORMATION_OCEAN: SketchfabEmbedConfig = {
  modelId: 'e2e56660c9a54078b6fe8851a584ac11',
  title: 'Sédiments de marge continentale passive',
  pageUrl:
    'https://sketchfab.com/3d-models/passive-continental-margin-sediments-e2e56660c9a54078b6fe8851a584ac11',
}

export const SKETCHFAB_EARTH_CORE: SketchfabEmbedConfig = {
  modelId: '44c547c28fbf46f4ab430bf1398f5fdb',
  title: 'Noyau terrestre',
  pageUrl: 'https://sketchfab.com/3d-models/earth-core-44c547c28fbf46f4ab430bf1398f5fdb',
}

export function getSketchfabEmbedUrl(modelId: string): string {
  const params = new URLSearchParams({
    autostart: '1',
    ui_controls: '1',
    ui_infos: '0',
    ui_watermark: '0',
    ui_theme: 'dark',
    transparent: '0',
  })
  return `https://sketchfab.com/models/${modelId}/embed?${params.toString()}`
}

/** Extract model UID from a Sketchfab share URL. */
export function parseSketchfabModelId(url: string): string | null {
  const match = url.match(/sketchfab\.com\/(?:3d-)?models\/(?:[^/]+-)?([a-f0-9]{32})/i)
  return match?.[1] ?? null
}
