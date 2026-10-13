import { Fragment, useEffect, useRef, useState } from 'react'
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { mergeVisibleOrder, resolveOrder } from '../lib/blockOrder'
import '../edit.css'

// Pojedynczy blok w trybie edycji: uchwyt z nazwą + zablokowana zawartość
function SortableBlock({ id, label, children }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const contentRef = useRef(null)
  const [empty, setEmpty] = useState(false)

  // Blok bez zawartości (np. brak danych) oznaczamy jako pusty
  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const update = () => setEmpty(element.offsetHeight === 0)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`edit-block ${isDragging ? 'edit-block-dragging' : ''}`}
    >
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        className="edit-handle"
        aria-label={`Przesuń blok: ${label}`}
      >
        <GripVertical className="h-4 w-4 shrink-0" />
        <span className="min-w-0 truncate">{label}</span>
        {empty && <span className="edit-empty">teraz pusty</span>}
      </button>
      <div ref={contentRef} className="edit-content">
        {children}
      </div>
    </div>
  )
}

/**
 * Lista bloków w zapisanej kolejności; w trybie edycji bloki można przeciągać.
 *
 * id:       unikalna nazwa listy
 * items:    [{ id, label, node }]  (node === null oznacza ukryty blok)
 * allIds:   wszystkie możliwe identyfikatory bloków (także ukrytych), żeby zachować ich miejsca
 * order:    zapisana kolejność (lista identyfikatorów) albo undefined
 * onReorder(newFullOrder): zapis nowej kolejności
 */
export default function ReorderableList({
  id,
  items,
  allIds,
  order,
  editing,
  onReorder,
  className = 'flex flex-col gap-6',
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const visible = items.filter(
    (item) => item.node !== null && item.node !== undefined && item.node !== false
  )
  const byId = Object.fromEntries(visible.map((item) => [item.id, item]))
  const ordered = resolveOrder(
    order,
    visible.map((item) => item.id)
  )

  if (!editing) {
    return (
      <>
        {ordered.map((itemId) => (
          <Fragment key={itemId}>{byId[itemId].node}</Fragment>
        ))}
      </>
    )
  }

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return

    const newVisible = arrayMove(
      ordered,
      ordered.indexOf(active.id),
      ordered.indexOf(over.id)
    )
    const fullOrder = resolveOrder(order, allIds ?? ordered)
    onReorder(mergeVisibleOrder(fullOrder, newVisible))
  }

  return (
    <DndContext
      id={id}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ordered} strategy={verticalListSortingStrategy}>
        <div className={className}>
          {ordered.map((itemId) => (
            <SortableBlock key={itemId} id={itemId} label={byId[itemId].label}>
              {byId[itemId].node}
            </SortableBlock>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}