import type { CSSProperties } from 'react'
import {
  EARTH_MECHANICAL_GROUPS,
  EARTH_STRUCTURE_LAYERS,
  type EarthDiagramLayerId,
  type EarthLayerInfo,
} from '../earthStructureLayers'

type EarthInteriorPanelProps = {
  selectedLayerId: EarthDiagramLayerId | null
  onSelect: (layer: EarthLayerInfo) => void
  onPlayAnimation: () => void
  onClose: () => void
  className?: string
}

export function EarthInteriorPanel({
  selectedLayerId,
  onSelect,
  onPlayAnimation,
  onClose,
  className = '',
}: EarthInteriorPanelProps) {
  return (
    <aside
      className={`earth-interior-panel${className ? ` ${className}` : ''}`}
      aria-label="Couches de l'intérieur de la Terre"
    >
      <header className="earth-interior-panel__header">
        <div>
          <span className="earth-interior-panel__eyebrow">Modèle en coupe</span>
          <span className="earth-interior-panel__title">Intérieur de la Terre</span>
        </div>
        <button type="button" className="earth-interior-panel__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </header>

      <div className="earth-interior-panel__diagram-wrap">
        <EarthInteriorDiagram selectedLayerId={selectedLayerId} onSelect={onSelect} />
      </div>

      <div className="earth-interior-panel__actions">
        <button type="button" className="earth-interior-panel__play" onClick={onPlayAnimation}>
          <span className="earth-interior-panel__play-icon" aria-hidden="true">
            ▶
          </span>
          Lancer l&apos;animation
        </button>
      </div>

      <p className="earth-interior-panel__hint">
        Cliquez une couche sur le schéma, le modèle 3D ou la liste ci-dessous.
      </p>

      <ul className="earth-interior-panel__list">
        {EARTH_STRUCTURE_LAYERS.map((layer) => {
          const active = selectedLayerId === layer.id
          const label = layer.state ? `${layer.title} (${layer.state})` : layer.title
          return (
            <li key={layer.id}>
              <button
                type="button"
                className={`earth-interior-panel__item${active ? ' earth-interior-panel__item--active' : ''}`}
                onClick={() => onSelect(layer)}
                aria-pressed={active}
                style={{ '--layer-accent': layer.color } as CSSProperties}
              >
                <span
                  className={`earth-interior-panel__swatch earth-interior-panel__swatch--${layer.pattern ?? 'solid'}`}
                  style={{ backgroundColor: layer.color }}
                  aria-hidden="true"
                />
                <span className="earth-interior-panel__text">
                  <span className="earth-interior-panel__name">
                    {layer.letter ? (
                      <span className="earth-interior-panel__letter">{layer.letter}</span>
                    ) : null}
                    {label}
                  </span>
                  <span className="earth-interior-panel__depth">{layer.depth}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="earth-interior-panel__groups">
        {EARTH_MECHANICAL_GROUPS.map((group) => (
          <p key={group.title} className="earth-interior-panel__group">
            <strong>
              {group.title} ({group.state})
            </strong>
            {' — '}
            {group.description}
          </p>
        ))}
      </div>
    </aside>
  )
}

type DiagramProps = {
  selectedLayerId: EarthDiagramLayerId | null
  onSelect: (layer: EarthLayerInfo) => void
}

/** Schéma en coupe (wedge) inspiré du diagramme de référence */
function EarthInteriorDiagram({ selectedLayerId, onSelect }: DiagramProps) {
  const layers = EARTH_STRUCTURE_LAYERS

  return (
    <svg
      className="earth-interior-diagram"
      viewBox="0 0 220 320"
      role="img"
      aria-label="Schéma en coupe des couches de la Terre"
    >
      <defs>
        <pattern id="hatch-brown" patternUnits="userSpaceOnUse" width="6" height="6" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#3d2818" strokeWidth="1.2" />
        </pattern>
        <pattern id="speckle-orange" patternUnits="userSpaceOnUse" width="4" height="4">
          <circle cx="1" cy="1" r="0.6" fill="#a06010" />
          <circle cx="3" cy="3" r="0.5" fill="#c07818" />
        </pattern>
        <pattern id="speckle-yellow" patternUnits="userSpaceOnUse" width="4" height="4">
          <circle cx="1" cy="2" r="0.55" fill="#c9a020" />
          <circle cx="3" cy="1" r="0.45" fill="#e0b830" />
        </pattern>
      </defs>

      {/* Fond wedge */}
      <path d="M 20 20 L 200 20 L 110 300 Z" fill="#0d1828" stroke="#4a7090" strokeWidth="1" />

      {/* Croûte océanique (fine, à gauche) */}
      <DiagramSlice
        d="M 20 20 L 55 20 L 50 55 L 35 55 Z"
        fill="#2a4a6a"
        layer={layers[1]}
        selected={selectedLayerId === 'crust-oceanic'}
        onSelect={onSelect}
      />
      {/* Croûte continentale (épaisse, à droite) */}
      <DiagramSlice
        d="M 55 20 L 200 20 L 185 55 L 50 55 Z"
        fill="#1a1410"
        layer={layers[0]}
        selected={selectedLayerId === 'crust-continental'}
        onSelect={onSelect}
      />
      <DiagramSlice
        d="M 35 55 L 185 55 L 170 78 L 50 78 Z"
        fill="url(#hatch-brown)"
        layer={layers[2]}
        selected={selectedLayerId === 'upper-mantle'}
        onSelect={onSelect}
      />
      <DiagramSlice
        d="M 50 78 L 170 78 L 155 108 L 65 108 Z"
        fill="#7a5230"
        layer={layers[3]}
        selected={selectedLayerId === 'transition-zone'}
        onSelect={onSelect}
      />
      <DiagramSlice
        d="M 65 108 L 155 108 L 135 175 L 85 175 Z"
        fill="url(#hatch-brown)"
        layer={layers[4]}
        selected={selectedLayerId === 'lower-mantle'}
        onSelect={onSelect}
      />
      <DiagramSlice
        d="M 85 175 L 135 175 L 118 235 L 102 235 Z"
        fill="url(#speckle-orange)"
        layer={layers[5]}
        selected={selectedLayerId === 'outer-core'}
        onSelect={onSelect}
      />
      <DiagramSlice
        d="M 102 235 L 118 235 L 110 300 Z"
        fill="url(#speckle-yellow)"
        layer={layers[6]}
        selected={selectedLayerId === 'inner-core'}
        onSelect={onSelect}
      />

      {/* Profondeurs (km) */}
      <text x="8" y="78" className="earth-interior-diagram__depth">370</text>
      <text x="8" y="108" className="earth-interior-diagram__depth">720</text>
      <text x="8" y="175" className="earth-interior-diagram__depth">2886</text>
      <text x="8" y="235" className="earth-interior-diagram__depth">5156</text>
      <text x="8" y="300" className="earth-interior-diagram__depth">6371</text>
      <text x="4" y="14" className="earth-interior-diagram__unit">km</text>

      {/* Labels croûte */}
      <text x="148" y="38" className="earth-interior-diagram__label">Croûte</text>
      <text x="148" y="48" className="earth-interior-diagram__label earth-interior-diagram__label--small">
        continentale
      </text>
      <text x="148" y="58" className="earth-interior-diagram__label earth-interior-diagram__label--small">
        35–45 km
      </text>
      <text x="30" y="48" className="earth-interior-diagram__label earth-interior-diagram__label--small">
        océanique 6 km
      </text>

      {/* Groupes mécaniques */}
      <text x="168" y="95" className="earth-interior-diagram__group">
        Lithosphère
      </text>
      <text x="168" y="105" className="earth-interior-diagram__group earth-interior-diagram__group--sub">
        (solide)
      </text>
      <text x="168" y="145" className="earth-interior-diagram__group">
        Asthénosphère
      </text>
      <text x="168" y="155" className="earth-interior-diagram__group earth-interior-diagram__group--sub">
        (fluide)
      </text>
    </svg>
  )
}

function DiagramSlice({
  d,
  fill,
  layer,
  selected,
  onSelect,
}: {
  d: string
  fill: string
  layer: EarthLayerInfo
  selected: boolean
  onSelect: (layer: EarthLayerInfo) => void
}) {
  return (
    <path
      d={d}
      fill={fill}
      stroke={selected ? '#ffd54f' : 'rgba(255,255,255,0.15)'}
      strokeWidth={selected ? 2.5 : 0.8}
      className="earth-interior-diagram__slice"
      role="button"
      tabIndex={0}
      aria-label={layer.title}
      aria-pressed={selected}
      onClick={() => onSelect(layer)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onSelect(layer)
        }
      }}
    />
  )
}
