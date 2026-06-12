import {
  MANTLE_CONVECTION_FLOWS,
  MANTLE_CONVECTION_LEGEND,
  type MantleFlowId,
} from '../mantleConvectionModel'

type MantleConvectionPanelProps = {
  activeFlows: Record<MantleFlowId, boolean>
  onToggle: (id: MantleFlowId) => void
  onClose: () => void
  className?: string
}

export function MantleConvectionPanel({
  activeFlows,
  onToggle,
  onClose,
  className = '',
}: MantleConvectionPanelProps) {
  return (
    <aside
      className={`mantle-convection-panel${className ? ` ${className}` : ''}`}
      aria-label="Courants de convection mantellique"
    >
      <header className="mantle-convection-panel__header">
        <div>
          <span className="mantle-convection-panel__eyebrow">Manteau</span>
          <span className="mantle-convection-panel__title">Convection mantellique</span>
        </div>
        <button type="button" className="mantle-convection-panel__close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </header>

      <p className="mantle-convection-panel__hint">
        Courants animés sur la coupe — remontée centrale (rouge), subduction (bleu), cellules dans le manteau.
      </p>

      <ul className="mantle-convection-panel__list">
        {MANTLE_CONVECTION_FLOWS.map((flow) => {
          const active = activeFlows[flow.id]
          return (
            <li key={flow.id}>
              <button
                type="button"
                className={`mantle-convection-panel__item${active ? ' mantle-convection-panel__item--active' : ''}`}
                onClick={() => onToggle(flow.id)}
                aria-pressed={active}
              >
                <span
                  className="mantle-convection-panel__swatch"
                  style={{ backgroundColor: flow.color }}
                  aria-hidden="true"
                />
                <span className="mantle-convection-panel__label">{flow.label}</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mantle-convection-panel__legend" aria-label="Légende du schéma">
        <p className="mantle-convection-panel__legend-title">Schéma</p>
        <ul className="mantle-convection-panel__legend-list">
          {MANTLE_CONVECTION_LEGEND.map((item) => (
            <li
              key={item.text}
              className={`mantle-convection-panel__legend-item mantle-convection-panel__legend-item--${item.position}`}
            >
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
