import { EARTH_TOPICS } from '../earthTopics'
import { topicHasDetail } from '../topicDetail'

type TopicListProps = {
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

export function TopicList({ selectedId, onSelect, className = '' }: TopicListProps) {
  return (
    <nav className={`tectonics-topic-list${className ? ` ${className}` : ''}`} aria-label="Tectonic topics">
      <p className="tectonics-topic-list__heading">Choose a phenomenon</p>
      <ul className="tectonics-topic-list__items">
        {EARTH_TOPICS.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              className={`tectonics-topic-list__btn${selectedId === topic.id ? ' tectonics-topic-list__btn--active' : ''}`}
              onClick={() => onSelect(topic.id)}
            >
              <span className="tectonics-topic-list__name">{topic.name}</span>
              {topicHasDetail(topic.id) ? (
                <span className="tectonics-topic-list__badge">Interactive</span>
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
