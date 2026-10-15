import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, LayoutGrid, Pencil, Plus, X } from 'lucide-react'
import { useSettings } from '../../context/SettingsContext'
import { MAX_LINKS, hostnameOf } from '../../lib/quickLinks'
import LinkEditor from './LinkEditor'
import LinkIcon from './LinkIcon'
import '../../edit.css'

const chipClass =
  'flex h-9 shrink-0 items-center rounded-lg border border-slate-200 bg-white px-2 transition'
const tileClass =
  'flex flex-col items-center rounded-xl border border-slate-200 bg-white p-2.5 transition'

// Wygląd przycisku: pasek na komputerze (chip) albo kafelek w szufladzie na telefonie
function LinkVisual({ link, layout }) {
  if (layout === 'tile') {
    return (
      <span className="flex w-full flex-col items-center gap-1.5">
        <LinkIcon icon={link.icon} size={44} />
        <span className="line-clamp-2 w-full break-words text-center text-xs font-medium text-slate-700">
          {link.name}
        </span>
      </span>
    )
  }

  return (
    <span className="flex items-center gap-2">
      <LinkIcon icon={link.icon} size={24} />
      <span className="hidden max-w-[6.5rem] truncate text-xs font-medium text-slate-700 lg:inline">
        {link.name}
      </span>
    </span>
  )
}

// Zwykły przycisk otwierający stronę w nowej karcie
function LinkAnchor({ link, layout, onNavigate }) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onNavigate}
      title={`${link.name} — ${hostnameOf(link.url) ?? link.url}`}
      className={`${layout === 'tile' ? tileClass : chipClass} hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md`}
    >
      <LinkVisual link={link} layout={layout} />
    </a>
  )
}

// Przycisk w trybie edycji: przeciągalny, z ikoną ołówka do edycji
function SortableItem({ link, layout, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: link.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, touchAction: 'none' }}
      {...attributes}
      {...listeners}
      className={`relative cursor-grab border-dashed ${
        layout === 'tile' ? tileClass : chipClass
      } ${isDragging ? 'edit-tab-dragging' : ''}`}
    >
      <span
        className="block w-full"
        style={{ animation: 'edit-wiggle 0.4s ease-in-out infinite alternate' }}
      >
        <LinkVisual link={link} layout={layout} />
      </span>

      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onEdit(link)}
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow transition hover:bg-indigo-700"
        aria-label={`Edytuj: ${link.name}`}
      >
        <Pencil className="h-3 w-3" />
      </button>
    </div>
  )
}

// Lista przeciągalnych przycisków (children: np. przycisk "+")
function SortableLinks({ links, layout, onReorder, onEdit, children }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )
  const ids = links.map((link) => link.id)

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    onReorder(arrayMove(ids, ids.indexOf(active.id), ids.indexOf(over.id)))
  }

  return (
    <DndContext
      id={`links-${layout}`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={ids}
        strategy={layout === 'tile' ? rectSortingStrategy : horizontalListSortingStrategy}
      >
        {links.map((link) => (
          <SortableItem key={link.id} link={link} layout={layout} onEdit={onEdit} />
        ))}
        {children}
      </SortableContext>
    </DndContext>
  )
}

// Szuflada z kafelkami linków (telefon)
function Sheet({ links, manage, canAdd, onToggleManage, onClose, onEdit, onAdd, onReorder }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const addTile = canAdd && (
    <button
      type="button"
      onClick={onAdd}
      className={`${tileClass} justify-center gap-1 border-dashed text-slate-500 hover:border-indigo-300 hover:text-indigo-600`}
    >
      <Plus className="h-6 w-6" />
      <span className="text-xs font-medium">Dodaj</span>
    </button>
  )

  return (
    <div
      className="modal-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/50 md:hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Szybkie linki"
    >
      <div
        className="modal-card max-h-[80vh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-2xl"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-slate-800">Szybkie linki</h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onToggleManage}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition ${
                manage
                  ? 'border-indigo-600 bg-indigo-600 text-white'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {manage ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
              {manage ? 'Gotowe' : 'Edytuj'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
              aria-label="Zamknij"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {links.length === 0 && !manage ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 px-4 py-8 text-center text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Dodaj pierwszy link</span>
            <span className="text-xs text-slate-500">
              UPeL, Syllabus, poczta, USOS, akademik…
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
            {manage ? (
              <SortableLinks links={links} layout="tile" onReorder={onReorder} onEdit={onEdit}>
                {addTile}
              </SortableLinks>
            ) : (
              links.map((link) => (
                <LinkAnchor key={link.id} link={link} layout="tile" onNavigate={onClose} />
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Szybkie linki w nagłówku: pasek przycisków na komputerze, a na telefonie przycisk z siatką
 * otwierający szufladę z kafelkami. Linki zapisują się w ustawieniach konta (quickLinks).
 *
 * editing: tryb edycji układu (ołówek w nagłówku): przeciąganie, edycja i dodawanie
 */
export default function QuickLinks({ editing }) {
  const { settings, updateSettings } = useSettings()
  const links = settings.quickLinks ?? []

  const [editor, setEditor] = useState(null) // { link } (link === null: nowy)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [sheetManage, setSheetManage] = useState(false)

  const canAdd = links.length < MAX_LINKS

  const save = (link) => {
    const exists = links.some((item) => item.id === link.id)
    updateSettings({
      quickLinks: exists
        ? links.map((item) => (item.id === link.id ? link : item))
        : [...links, link],
    })
    setEditor(null)
  }

  const remove = (id) => {
    updateSettings({ quickLinks: links.filter((item) => item.id !== id) })
    setEditor(null)
  }

  const reorder = (ids) =>
    updateSettings({ quickLinks: ids.map((id) => links.find((item) => item.id === id)) })

  const openEditor = (link = null) => setEditor({ link })

  const addChip = canAdd && (
    <button
      type="button"
      onClick={() => openEditor()}
      className={`${chipClass} gap-1.5 border-dashed text-slate-500 hover:border-indigo-300 hover:text-indigo-600`}
      aria-label="Dodaj link"
      title="Dodaj link"
    >
      <Plus className="h-4 w-4" />
      <span className="hidden text-xs font-medium lg:inline">Dodaj</span>
    </button>
  )

  return (
    <>
      {/* Komputer: pasek przycisków obok logo */}
      <div className="no-scrollbar hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto px-1 py-1.5 md:flex">
        {editing ? (
          <SortableLinks links={links} layout="chip" onReorder={reorder} onEdit={openEditor}>
            {addChip}
          </SortableLinks>
        ) : (
          <>
            {links.map((link) => (
              <LinkAnchor key={link.id} link={link} layout="chip" />
            ))}
            {links.length === 0 && canAdd && (
              <button
                type="button"
                onClick={() => openEditor()}
                className={`${chipClass} gap-1.5 border-dashed text-xs font-medium text-slate-500 hover:border-indigo-300 hover:text-indigo-600`}
              >
                <Plus className="h-4 w-4" />
                Dodaj skróty
              </button>
            )}
          </>
        )}
      </div>

      {/* Telefon: jeden mały przycisk, który otwiera szufladę z linkami */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-300 text-slate-700 transition hover:bg-slate-100 md:hidden"
        aria-label="Szybkie linki"
        title="Szybkie linki"
      >
        <LayoutGrid className="h-4 w-4" />
      </button>

      {sheetOpen &&
        createPortal(
          <Sheet
            links={links}
            manage={sheetManage}
            canAdd={canAdd}
            onToggleManage={() => setSheetManage((value) => !value)}
            onClose={() => {
              setSheetOpen(false)
              setSheetManage(false)
            }}
            onEdit={openEditor}
            onAdd={() => openEditor()}
            onReorder={reorder}
          />,
          document.body
        )}

      {editor && (
        <LinkEditor
          initial={editor.link}
          existingHosts={links.map((link) => hostnameOf(link.url))}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditor(null)}
        />
      )}
    </>
  )
}