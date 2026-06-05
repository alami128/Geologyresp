/** Sketchfab models loaded via embed (no local .glb required). */
export type SketchfabEmbedConfig = {
  modelId: string
  title: string
  pageUrl: string
}

export const SKETCHFAB_EARTH_CORE: SketchfabEmbedConfig = {
  modelId: '44c547c28fbf46f4ab430bf1398f5fdb',
  title: 'Earth core',
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
