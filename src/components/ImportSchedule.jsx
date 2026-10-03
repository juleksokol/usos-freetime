import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Save,
  Upload,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { parseScheduleText } from '../lib/importParser'
import { readFileAsText } from '../lib/usosParser'
import { replaceUserSchedule } from '../lib/scheduleService'
import EventsTable from './EventsTable'

export default function ImportSchedule({ onImported }) {
  const { user } = useAuth()

  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const reset = () => {
    setResult(null)
    setFileName('')
    setError('')
  }

  const handleFile = async (e) => {
    const input = e.target
    const file = input.files?.[0]
    if (!file) return

    setError('')
    setSuccess('')
    setResult(null)
    setFileName(file.name)

    try {
      const text = await readFileAsText(file)
      const parsed = parseScheduleText(text, file.name)
      if (parsed.error) {
        setError(parsed.error)
      } else {
        setResult(parsed)
      }
    } catch (err) {
      setError(`Nie udało się odczytać pliku: ${err.message}`)
    } finally {
      input.value = '' // pozwala wybrać ten sam plik ponownie
    }
  }

  const handleSave = async () => {
    if (!result || !user) return

    setSaving(true)
    setError('')

    try {
      await replaceUserSchedule(user.id, result.events)
      setSuccess(`Zapisano ${result.events.length} zajęć w Twoim planie.`)
      setResult(null)
      setFileName('')
      onImported?.()
    } catch (err) {
      setError(`Nie udało się zapisać planu: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl bg-white p-6 shadow">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
        <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
        Import planu (CSV z USOS lub iCal)
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Wybierz plik <strong>.csv</strong> albo <strong>.ics</strong> z planem
        zajęć. Przed zapisem zobaczysz podgląd. Zapisanie zastąpi Twój
        zaimportowany plan; własne wydarzenia zostają.
      </p>

      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-4 py-6 text-slate-600 transition hover:border-indigo-400 hover:bg-indigo-50">
        <Upload className="h-5 w-5" />
        <span>{fileName || 'Kliknij, aby wybrać plik .csv lub .ics'}</span>
        <input
          type="file"
          accept=".csv,.txt,.ics,text/csv,text/plain,text/calendar"
          onChange={handleFile}
          className="hidden"
        />
      </label>

      {error && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {success}
        </p>
      )}

      {result && (
        <div className="mt-4 flex flex-col gap-4">
          <p className="text-sm text-slate-700">
            Rozpoznano <strong>{result.events.length}</strong> zajęć
            {result.warnings.length > 0 &&
              `, ostrzeżeń: ${result.warnings.length}`}
            .
          </p>

          {result.warnings.length > 0 && (
            <details className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <summary className="cursor-pointer font-medium">
                Ostrzeżenia ({result.warnings.length})
              </summary>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {result.warnings.slice(0, 10).map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
                {result.warnings.length > 10 && (
                  <li>…i {result.warnings.length - 10} więcej</li>
                )}
              </ul>
            </details>
          )}

          <EventsTable events={result.events} />

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              Zapisz mój plan
            </button>
            <button
              onClick={reset}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
            >
              <X className="h-5 w-5" />
              Anuluj
            </button>
          </div>
        </div>
      )}
    </section>
  )
}