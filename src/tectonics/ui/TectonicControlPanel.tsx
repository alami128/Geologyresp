import { TECTONIC_DATA_SOURCE, TECTONIC_LAYERS, type TectonicLayerId } from '../tectonicLayers'

type TectonicControlPanelProps = {
  activeLayers: Record<TectonicLayerId, boolean>
  onToggle: (id: TectonicLayerId) => void
  onClose: () => void
  className?: string
}

function LayerIcon({
  color,
  kind,
}: {
  color: string
  kind: 'line' | 'point' | 'zone' | 'outline'
}) {
  if (kind === 'outline') {
    return <span className="tectonic-control__icon tectonic-control__icon--dash" aria-hidden="true" />
  }

  if (kind === 'point') {
    return <span className="tectonic-control__icon tectonic-control__icon--dot" style={{ background: color }} />
  }

  if (kind === 'zone') {
    return <span className="tectonic-control__icon tectonic-control__icon--zone" style={{ background: color }} />
  }

  return <span className="tectonic-control__icon tectonic-control__icon--line" style={{ background: color }} />
}

export function TectonicControlPanel({
  activeLayers,
  onToggle,
  onClose,
  className = '',
}: TectonicControlPanelProps) {
  return (
    <aside
      className={`tectonic-control${className ? ` ${className}` : ''}`}
      aria-label="Couches tectoniques"
    >
      <header className="tectonic-control__header">
        <span className="tectonic-control__title">
          <span className="tectonic-control__eye" aria-hidden="true">
            ◉
          </span>
          Contrôle
        </span>
        <button type="button" className="tectonic-control__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </header>

      <ul className="tectonic-control__list">
        {TECTONIC_LAYERS.map((layer) => {
          const active = activeLayers[layer.id]
          return (
            <li key={layer.id}>
              <button
                type="button"
                className={`tectonic-control__item${active ? ' tectonic-control__item--active' : ''}`}
                onClick={() => onToggle(layer.id)}
                aria-pressed={active}
                title={layer.scienceNote}
              >
                <LayerIcon color={layer.color} kind={layer.kind} />
                <span className="tectonic-control__label">{layer.label}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <p className="tectonic-control__source">{TECTONIC_DATA_SOURCE}</p>
    </aside>
  )
}
