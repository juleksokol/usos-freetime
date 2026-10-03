import { useState } from 'react'
import { Loader2, ShieldCheck, Trash2, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { deleteMyAccount, updateProfile } from '../lib/accountService'
import { deleteAllMyEvents } from '../lib/scheduleService'

export default function SettingsPanel({ onDataChanged }) {
  const { user, profile, refreshProfile, signOut } = useAuth()
  const userId = user?.id

  const [nickname, setNickname] = useState(null) // null = nie edytowano
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const shareDetails = profile?.share_details ?? true
  const nicknameValue = nickname ?? profile?.display_name ?? ''

  const run = async (name, action, successMessage) => {
    setBusy(name)
    setError('')
    setMessage('')
    try {
      await action()
      if (successMessage) setMessage(successMessage)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy('')
    }
  }

  const saveNickname = (e) => {
    e.preventDefault()
    const value = nicknameValue.trim()
    if (value.length < 1 || value.length > 40) {
      setError('Pseudonim musi mieć od 1 do 40 znaków.')
      return
    }

    run(
      'nickname',
      async () => {
        await updateProfile(userId, { display_name: value })
        await refreshProfile()
        setNickname(null)
      },
      'Zapisano pseudonim.'
    )
  }

  const togglePrivacy = () => {
    const next = !shareDetails
    run(
      'privacy',
      async () => {
        await updateProfile(userId, { share_details: next })
        await refreshProfile()
      },
      next
        ? 'Znajomi widzą teraz szczegóły Twoich zajęć.'
        : 'Znajomi widzą teraz tylko, że jesteś zajęty.'
    )
  }

  const deletePlan = () => {
    if (
      !window.confirm(
        'Usunąć cały Twój plan (zaimportowany i własne wydarzenia)? Tej operacji nie można cofnąć.'
      )
    ) {
      return
    }

    run(
      'plan',
      async () => {
        await deleteAllMyEvents(userId)
        await onDataChanged?.()
      },
      'Usunięto wszystkie Twoje zajęcia.'
    )
  }

  const deleteAccount = () => {
    run('account', async () => {
      await deleteMyAccount()
      await signOut()
    })
  }

  const cardClass = 'rounded-2xl bg-white p-4 shadow sm:p-6'
  const headingClass =
    'flex items-center gap-2 text-lg font-semibold text-slate-800'

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      {message && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {message}
        </p>
      )}

      <section className={cardClass}>
        <h2 className={headingClass}>
          <User className="h-5 w-5 text-indigo-600" />
          Profil
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Pseudonim widzą znajomi z grup (także jako znak wodny na zajęciach).
        </p>
        <form onSubmit={saveNickname} className="mt-3 flex gap-2">
          <input
            type="text"
            value={nicknameValue}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={40}
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          <button
            type="submit"
            disabled={busy === 'nickname' || nickname === null}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Zapisz
          </button>
        </form>
      </section>

      <section className={cardClass}>
        <h2 className={headingClass}>
          <ShieldCheck className="h-5 w-5 text-indigo-600" />
          Prywatność
        </h2>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-800">
              Pokazuj znajomym szczegóły moich zajęć
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Po wyłączeniu znajomi z Twoich grup zobaczą tylko blok „Zajęty”
              z godzinami, bez nazwy przedmiotu, sali i prowadzącego.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={shareDetails}
            onClick={togglePrivacy}
            disabled={busy === 'privacy' || !profile}
            className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${
              shareDetails ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                shareDetails ? 'left-[1.375rem]' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </section>

      <section className={cardClass}>
        <h2 className={headingClass}>
          <Trash2 className="h-5 w-5 text-red-600" />
          Dane i konto
        </h2>

        <div className="mt-3 flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              Usuń cały swój plan (zaimportowany i własne wydarzenia).
            </p>
            <button
              onClick={deletePlan}
              disabled={busy === 'plan'}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
            >
              Usuń mój plan
            </button>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600">
              Usunięcie konta kasuje Twój profil, plan i członkostwa. Grupy,
              których jesteś właścicielem, zostaną usunięte dla wszystkich ich
              członków. Tej operacji nie można cofnąć.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Wpisz USUŃ, aby potwierdzić"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder-slate-400 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-200"
              />
              <button
                onClick={deleteAccount}
                disabled={
                  busy === 'account' ||
                  confirmText.trim().toUpperCase() !== 'USUŃ'
                }
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy === 'account' && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                Usuń konto
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}