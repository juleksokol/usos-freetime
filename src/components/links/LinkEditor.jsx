import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Shuffle, Trash2, X } from 'lucide-react'
import { SYMBOLS } from '../../lib/linkSymbols'
import {
  EMOJI_PRESETS,
  ICON_COLORS,
  SUGGESTED_LINKS,
  generateIcon,
  hostnameOf,
  initialsOf,
  newLinkId,
  validateLink,
} from '../../lib/quickLinks'
import LinkIcon from './LinkIcon'

const TABS = [
  { id: 'symbol', label: 'Symbol' },
  { id: 'initials', label: 'Litery' },
  { id: 'emoji', label: 'Emoji' },
  { id: 'favicon', label: 'Ikona strony' },
]

const SHAPES = [
  { id: 'rounded', label: 'Zaokrąglony' },
  { id: 'circle', label: 'Koło' },
  { id: 'square', label: 'Kwadrat' },
]

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

/**
 * Edytor linku z podglądem ikony na żywo.
 * initial:       edytowany link albo null (nowy)
 * existingHosts: domeny już dodanych linków (do ukrycia propozycji)
 */
export default function LinkEditor({ initial, existingHosts, onSave, onDelete, onClose }) {
  const isEdit = Boolean(initial)

  const [name, setName] = useState(initial?.name ?? '')
  const [url, setUrl] = useState(initial?.url ?? '')
  const [seed, setSeed] = useState(0)
  const [custom, setCustom] = useState(initial?.icon ?? null) // ręcznie ustawiona ikona
  const [tab, setTab] = useState('symbol')
  const [error, setError] = useState('')

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  // Dopóki nie ruszysz ikony ręcznie, jest dobierana automatycznie z nazwy i adresu
  const autoIcon = useMemo(() => generateIcon(name, url, seed), [name, url, seed])
  const icon = custom ?? autoIcon
  const host = hostnameOf(url)

  const change = (patch) => setCustom({ ...icon, ...patch })

  const shuffle = () => {
    setCustom(null)
    setSeed((value) => value + 1)
  }

  const suggestions = isEdit
    ? []
    : SUGGESTED_LINKS.filter((item) => !existingHosts.includes(hostnameOf(item.url)))

  const applySuggestion = (item) => {
    setName(item.name)
    setUrl(item.url)
    setCustom(null)
    setSeed(0)
    setError('')
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const result = validateLink({ name, url })
    if (result.error) {
      setError(result.error)
      return
    }

    let finalIcon = icon
    if (icon.kind === 'initials' && !icon.value.trim()) {
      finalIcon = { ...icon, value: initialsOf(result.name) }
    }
    if (icon.kind === 'favicon') {
      finalIcon = { ...icon, value: hostnameOf(result.url) }
    }

    onSave({
      id: initial?.id ?? newLinkId(),
      name: result.name,
      url: result.url,
      icon: finalIcon,
    })
  }

  const handleDelete = () => {
    if (window.confirm(`Usunąć link „${initial.name}”?`)) onDelete(initial.id)
  }

  return createPortal(
    <div
      className="modal-backdrop fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? 'Edytuj link' : 'Nowy link'}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="modal-card max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-t-[6px] border-indigo-600 px-6 py-4">
          <h3 className="text-lg font-bold text-slate-900">
            {isEdit ? 'Edytuj link' : 'Nowy link'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100"
            aria-label="Zamknij"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-6 pb-5">
          {suggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500">Propozycje:</span>
              {suggestions.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => applySuggestion(item)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600"
                >
                  {item.name}
                </button>
              ))}
              <span className="w-full text-xs text-slate-400">
                Sprawdź adres przed zapisaniem, mogą się zmieniać.
              </span>
            </div>
          )}

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Nazwa przycisku
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="np. UPeL, Poczta AGH, OLIMP"
              maxLength={24}
              className={inputClass}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Adres strony
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="np. upel.agh.edu.pl"
              className={inputClass}
            />
          </label>

          {/* Podgląd */}
          <div className="flex items-center gap-4 rounded-xl bg-slate-50 p-4">
            <LinkIcon icon={icon} size={64} />
            <div className="min-w-0">
              <p className="text-xs text-slate-500">Tak będzie wyglądał przycisk:</p>
              <span className="mt-1 inline-flex h-9 max-w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-2">
                <LinkIcon icon={icon} size={24} />
                <span className="truncate text-xs font-medium text-slate-700">
                  {name.trim() || 'Nazwa'}
                </span>
              </span>
            </div>
          </div>

          {/* Ikona: automatyczna, losowanie i ręczne ustawienia */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={shuffle}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              <Shuffle className="h-4 w-4" />
              Losuj inną
            </button>
            {custom && (
              <button
                type="button"
                onClick={() => setCustom(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100"
              >
                Przywróć automatyczną
              </button>
            )}
          </div>

          <div>
            <div className="flex flex-wrap gap-1.5">
              {TABS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`rounded-lg border px-3 py-1 text-sm transition ${
                    tab === item.id
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              {tab === 'symbol' && (
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                  {Object.entries(SYMBOLS).map(([key, symbol]) => {
                    const SymbolIcon = symbol.icon
                    const active = icon.kind === 'symbol' && icon.value === key

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => change({ kind: 'symbol', value: key })}
                        title={symbol.label}
                        aria-label={symbol.label}
                        className={`flex h-10 items-center justify-center rounded-lg border transition ${
                          active
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <SymbolIcon className="h-5 w-5" />
                      </button>
                    )
                  })}
                </div>
              )}

              {tab === 'initials' && (
                <input
                  type="text"
                  value={icon.kind === 'initials' ? icon.value : initialsOf(name)}
                  onChange={(e) =>
                    change({ kind: 'initials', value: e.target.value.toUpperCase().slice(0, 3) })
                  }
                  maxLength={3}
                  placeholder="Do 3 liter"
                  className={`${inputClass} max-w-[10rem]`}
                />
              )}

              {tab === 'emoji' && (
                <div className="flex flex-col gap-2">
                  <input
                    type="text"
                    value={icon.kind === 'emoji' ? icon.value : ''}
                    onChange={(e) =>
                      change({ kind: 'emoji', value: Array.from(e.target.value).slice(0, 2).join('') })
                    }
                    placeholder="Wpisz lub wklej emoji"
                    className={`${inputClass} max-w-[14rem]`}
                  />
                  <div className="flex flex-wrap gap-1.5">
                    {EMOJI_PRESETS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => change({ kind: 'emoji', value: emoji })}
                        className="h-9 w-9 rounded-lg border border-slate-200 text-lg transition hover:bg-slate-100"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {tab === 'favicon' && (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={!host}
                    onClick={() => change({ kind: 'favicon', value: host })}
                    className="w-fit rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                  >
                    Pobierz ikonę strony{host ? ` (${host})` : ''}
                  </button>
                  <p className="text-xs text-slate-500">
                    Ikona jest pobierana z usługi Google, która dowiaduje się
                    tylko nazwy domeny. Gdy się nie uda, pokażemy litery.
                  </p>
                </div>
              )}
            </div>
          </div>

          {icon.kind !== 'favicon' && (
            <>
              <div>
                <p className="mb-2 text-sm text-slate-600">Kolor</p>
                <div className="flex flex-wrap gap-2">
                  {ICON_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => change({ color })}
                      aria-label={`Kolor ${color}`}
                      className={`h-7 w-7 rounded-full transition ${
                        icon.color === color
                          ? 'ring-2 ring-slate-800 ring-offset-2'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <p className="mb-2 text-sm text-slate-600">Kształt</p>
            <div className="flex flex-wrap gap-1.5">
              {SHAPES.map((shape) => (
                <button
                  key={shape.id}
                  type="button"
                  onClick={() => change({ shape: shape.id })}
                  className={`rounded-lg border px-3 py-1 text-sm transition ${
                    icon.shape === shape.id
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {shape.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-6 py-4">
          <div className="flex gap-3">
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {isEdit ? 'Zapisz zmiany' : 'Dodaj'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
            >
              Anuluj
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
              Usuń
            </button>
          )}
        </div>
      </form>
    </div>,
    document.body
  )
}