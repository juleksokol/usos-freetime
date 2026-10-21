import { useI18n } from '../../context/I18nContext'
import { useSettings } from '../../context/SettingsContext'
import { PERSON_PALETTES } from '../../lib/constants'
import { ACCENT_LABEL_KEYS } from '../../lib/labelKeys'
import { ACCENT_OPTIONS, DEFAULT_SETTINGS } from '../../lib/settingsDefaults'
import { Row, Segmented, Switch, selectClass } from './controls'

// Kontrolka jednego wiersza ustawień wybrana na podstawie jego typu ze schematu
function RowControl({ row }) {
  const { settings, updateSettings } = useSettings()
  const { t } = useI18n()
  const value = settings[row.key]

  const apply = (next) =>
    updateSettings(row.patch ? row.patch(next, settings) : { [row.key]: next })

  const rawOptions = typeof row.options === 'function' ? row.options(settings) : row.options
  const options = rawOptions?.map((option) => ({
    value: option.value,
    label: option.labelKey ? t(option.labelKey) : option.label,
  }))

  switch (row.type) {
    case 'switch':
      return <Switch checked={Boolean(value)} onChange={apply} label={t(row.labelKey)} />

    case 'segmented':
      return <Segmented value={value} options={options} onChange={apply} />

    case 'select':
      return (
        <select
          value={value}
          onChange={(e) => apply(row.number ? Number(e.target.value) : e.target.value)}
          className={selectClass}
          aria-label={t(row.labelKey)}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )

    case 'number':
      return (
        <input
          key={value}
          type="number"
          min={row.min}
          max={row.max}
          defaultValue={value}
          aria-label={t(row.labelKey)}
          onBlur={(e) => {
            const parsed = Number.parseInt(e.target.value, 10)
            const next = Number.isNaN(parsed)
              ? DEFAULT_SETTINGS[row.key]
              : Math.min(row.max, Math.max(row.min, parsed))
            apply(next)
            e.target.value = String(next)
          }}
          className={`${selectClass} w-24`}
        />
      )

    case 'date':
      return (
        <input
          type="date"
          value={value}
          aria-label={t(row.labelKey)}
          onChange={(e) => {
            if (e.target.value) apply(e.target.value)
          }}
          className={selectClass}
        />
      )

    case 'swatches':
      return (
        <div className="flex flex-wrap gap-2">
          {ACCENT_OPTIONS.map((accent) => (
            <button
              key={accent.id}
              type="button"
              onClick={() => apply(accent.id)}
              aria-label={t(ACCENT_LABEL_KEYS[accent.id])}
              aria-pressed={value === accent.id}
              title={t(ACCENT_LABEL_KEYS[accent.id])}
              className={`h-8 w-8 rounded-full transition ${
                value === accent.id
                  ? 'ring-2 ring-slate-800 ring-offset-2'
                  : 'hover:scale-110'
              }`}
              style={{ backgroundColor: accent.color }}
            />
          ))}
        </div>
      )

    case 'palette':
      return (
        <div className="flex flex-col gap-2 sm:items-end">
          <Segmented value={value} options={options} onChange={apply} />
          <div className="flex gap-1">
            {(PERSON_PALETTES[value] ?? PERSON_PALETTES.standard).map((color) => (
              <span
                key={color}
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      )

    default:
      return null
  }
}

export default function SettingRows({ rows }) {
  const { t } = useI18n()

  return (
    <>
      {rows.map((row) => (
        <Row
          key={row.key}
          label={t(row.labelKey)}
          hint={row.hintKey ? t(row.hintKey) : undefined}
        >
          <RowControl row={row} />
        </Row>
      ))}
    </>
  )
}
