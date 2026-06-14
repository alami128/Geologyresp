import type { EarthTopic } from '../earthTopics'

type InfoBarProps = {
  title: string
  description: string
  onClose?: () => void
  onNext?: () => void
  onBack?: () => void
  showClose?: boolean
  showNext?: boolean
  showBack?: boolean
  nextLabel?: string
  stepIndicator?: string
}

export function InfoBar({
  title,
  description,
  onClose,
  onNext,
  onBack,
  showClose = false,
  showNext = false,
  showBack = false,
  nextLabel = 'Suivant',
  stepIndicator,
}: InfoBarProps) {
  return (
    <div
      className="tectonics-info-bar"
      role="region"
      aria-label="Explication du phénomène"
      aria-live="polite"
    >
      <div className="tectonics-info-bar__inner">
        <div className="tectonics-info-bar__text">
          {stepIndicator ? (
            <p className="tectonics-info-bar__step">{stepIndicator}</p>
          ) : null}
          <h2 className="tectonics-info-bar__title">{title}</h2>
          <p className="tectonics-info-bar__desc">{description}</p>
        </div>
        <div className="tectonics-info-bar__actions">
          {showBack && onBack ? (
            <button type="button" className="tectonics-info-bar__back" onClick={onBack}>
              Retour
            </button>
          ) : null}
          {showNext && onNext ? (
            <button type="button" className="tectonics-info-bar__next" onClick={onNext}>
              {nextLabel}
            </button>
          ) : null}
          {showClose && onClose ? (
            <button
              type="button"
              className="tectonics-info-bar__close"
              onClick={onClose}
              aria-label="Fermer l'explication"
            >
              Fermer
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function GlobeInfoBar({
  topic,
  onClose,
  onNext,
  showNext,
}: {
  topic: EarthTopic
  onClose: () => void
  onNext?: () => void
  showNext?: boolean
}) {
  return (
    <InfoBar
      title={topic.title}
      description={topic.description}
      showClose
      showNext={showNext}
      onClose={onClose}
      onNext={onNext}
    />
  )
}
