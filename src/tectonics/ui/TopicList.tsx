import { useEffect, useState } from 'react'
import { EARTH_TOPIC_MENU, getGroupIdForTopic, type EarthTopic } from '../earthTopics'
import { topicHasDetail } from '../topicDetail'

type TopicListProps = {
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
}

function TopicButton({
  topic,
  selectedId,
  onSelect,
  nested = false,
}: {
  topic: EarthTopic
  selectedId: string | null
  onSelect: (id: string) => void
  nested?: boolean
}) {
  return (
    <button
      type="button"
      className={`tectonics-topic-list__btn${nested ? ' tectonics-topic-list__btn--nested' : ''}${selectedId === topic.id ? ' tectonics-topic-list__btn--active' : ''}`}
      onClick={() => onSelect(topic.id)}
    >
      <span className="tectonics-topic-list__name">{topic.name}</span>
      {topicHasDetail(topic.id) ? (
        <span className="tectonics-topic-list__badge">Modèle 3D</span>
      ) : null}
    </button>
  )
}

export function TopicList({ selectedId, onSelect, className = '' }: TopicListProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    mouvement_convergent: false,
    mouvement_divergent: false,
  })

  useEffect(() => {
    if (!selectedId) return
    const groupId = getGroupIdForTopic(selectedId)
    if (!groupId) return
    setOpenGroups((current) => ({ ...current, [groupId]: true }))
  }, [selectedId])

  const toggleGroup = (groupId: string) => {
    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }))
  }

  return (
    <nav
      className={`tectonics-topic-list${className ? ` ${className}` : ''}`}
      aria-label="Phénomènes géologiques"
    >
      <p className="tectonics-topic-list__heading">Phénomènes</p>
      <ul className="tectonics-topic-list__items">
        {EARTH_TOPIC_MENU.map((entry) => {
          if (entry.kind === 'topic') {
            return (
              <li key={entry.topic.id}>
                <TopicButton topic={entry.topic} selectedId={selectedId} onSelect={onSelect} />
              </li>
            )
          }

          const { group } = entry
          const isOpen = openGroups[group.id]
          const childActive = group.children.some((child) => child.id === selectedId)

          return (
            <li key={group.id} className="tectonics-topic-list__group">
              <button
                type="button"
                className={`tectonics-topic-list__group-btn${childActive ? ' tectonics-topic-list__group-btn--active' : ''}`}
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
              >
                <span className="tectonics-topic-list__name">{group.name}</span>
                <span className="tectonics-topic-list__chevron" aria-hidden="true">
                  {isOpen ? '▾' : '▸'}
                </span>
              </button>
              {isOpen ? (
                <ul className="tectonics-topic-list__subitems">
                  {group.children.map((topic) => (
                    <li key={topic.id}>
                      <TopicButton
                        topic={topic}
                        selectedId={selectedId}
                        onSelect={onSelect}
                        nested
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
