import { useId, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useI18n } from '../../context/I18nContext'
import { authErrorText } from '../../lib/authErrors'
import { isPasswordValid } from '../../lib/passwordPolicy'
import PasswordChecklist from './PasswordChecklist'
import PasswordField from './PasswordField'

/**
 * Zmiana hasła: aktualne hasło, nowe hasło i powtórzenie.
 * onDone: wywoływane po udanej zmianie
 */
export default function PasswordChangeForm({ onDone }) {
  const { user, changePassword } = useAuth()
  const { t } = useI18n()
  const checklistId = useId()
  const messageId = useId()

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const email = user?.email ?? ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!isPasswordValid(next, { email })) {
      setError(t('password.err.rules'))
      return
    }
    if (next !== confirm) {
      setError(t('password.err.mismatch'))
      return
    }
    if (next === current) {
      setError(t('password.err.same'))
      return
    }

    setSubmitting(true)
    try {
      const { error: changeError } = await changePassword(current, next)
      if (changeError) {
        setError(authErrorText(changeError, 'change', t))
        return
      }

      setCurrent('')
      setNext('')
      setConfirm('')
      setSuccess(t('password.changed'))
      onDone?.()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <PasswordField
        label={t('password.current')}
        value={current}
        onChange={setCurrent}
        autoComplete="current-password"
        describedBy={error ? messageId : undefined}
      />
      <PasswordField
        label={t('password.new')}
        value={next}
        onChange={setNext}
        autoComplete="new-password"
        describedBy={checklistId}
      />
      <PasswordField
        label={t('password.repeatNew')}
        value={confirm}
        onChange={setConfirm}
        autoComplete="new-password"
        invalid={confirm !== '' && confirm !== next}
      />

      <PasswordChecklist id={checklistId} password={next} email={email} />

      {error && (
        <p id={messageId} role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-fit items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
        {t('password.submit')}
      </button>
    </form>
  )
}