import { useLayoutEffect, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSettings } from '../context/SettingsContext'
import '../edit.css'

// Zakładka w trybie edycji: można ją przeciągnąć w bok
function SortableTab({ tab }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: tab.id })
  const Icon = tab.icon

  return (
    <button
      type="button"
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={`edit-tab ${isDragging ? 'edit-tab-dragging' : ''}`}
      aria-label={`Przesuń zakładkę: ${tab.label}`}
    >
      <span className="edit-tab-inner">
        <Icon className="h-4 w-4" />
        {tab.label}
      </span>
    </button>
  )
}

/**
 * Pasek zakładek z przesuwanym wskaźnikiem aktywnej zakładki.
 * tabs: [{ id, label, icon }] w wyświetlanej kolejności
 * onReorder(newVisibleIds): nowa kolejność widocznych zakładek (tryb edycji)
 */
export default function TabBar({ tabs, activeId, onSelect, editing, onReorder }) {
  const { settings } = useSettings()
  const tabRefs = useRef({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const ids = tabs.map((tab) => tab.id)
  const orderKey = ids.join(',')

  useLayoutEffect(() => {
    if (editing) return

    const update = () => {
      const element = tabRefs.current[activeId]
      if (element) {
        setIndicator({ left: element.offsetLeft, width: element.offsetWidth })
      }
    }

    update()
    tabRefs.current[activeId]?.scrollIntoView({
      inline: 'center',
      block: 'nearest',
      behavior: 'smooth',
    })

    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [activeId, orderKey, editing, settings.fontScale])

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <nav className="relative mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4">
      {editing ? (
        <DndContext
          id="tabs"
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={horizontalListSortingStrategy}>
            {tabs.map((tab) => (
              <SortableTab key={tab.id} tab={tab} />
            ))}
          </SortableContext>
        </DndContext>
      ) : (
        <>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              ref={(element) => {
                tabRefs.current[id] = element
              }}
              onClick={() => onSelect(id)}
              className={`flex shrink-0 items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                activeId === id
                  ? 'text-indigo-600'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
          <span
            className="tab-indicator"
            style={{ left: indicator.left, width: indicator.width }}
          />
        </>
      )}
    </nav>
  )
}