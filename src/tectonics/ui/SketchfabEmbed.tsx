import { getSketchfabEmbedUrl } from '../sketchfabModels'

type SketchfabEmbedProps = {
  modelId: string
  title: string
  pageUrl: string
}

export function SketchfabEmbed({ modelId, title, pageUrl }: SketchfabEmbedProps) {
  const embedUrl = getSketchfabEmbedUrl(modelId)

  return (
    <div className="tectonics-sketchfab-wrap">
      <iframe
        className="tectonics-sketchfab"
        title={title}
        src={embedUrl}
        allow="autoplay; fullscreen; xr-spatial-tracking"
        allowFullScreen
        loading="lazy"
      />
      <a
        className="tectonics-sketchfab__credit"
        href={pageUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Sketchfab
      </a>
    </div>
  )
}
