import { useCallback, useEffect, useState } from 'react'
import {
  Check,
  Copy,
  Loader2,
  LogOut,
  Plus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  createGroup,
  deleteGroup,
  fetchMyGroups,
  joinGroupByCode,
  leaveGroup,
  removeMember,
} from '../lib/groupService'

function translateError(message) {
  if (!message) return 'Wystąpił nieznany błąd.'
  if (message.includes('Nieprawidlowy kod')) return 'Nieprawidłowy kod grupy.'
  if (message.includes('Musisz byc zalogowany')) {
    return 'Musisz być zalogowany.'
  }
  return message
}

export default function GroupsPanel() {
  const { user } = useAuth()
  const userId = user?.id

  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [newName, setNewName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [copiedId, setCopiedId] = useState(null)

  const load = useCallback(async () => {
    try {
      setGroups(await fetchMyGroups())
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Wspólna obsługa akcji: blokada przycisków, komunikaty, odświeżenie listy
  const run = async (action, successMessage) => {
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await action()
      setMessage(successMessage)
      await load()
    } catch (err) {
      setError(translateError(err.message))
    } finally {
      setBusy(false)
    }
  }

  const handleCreate = (e) => {
    e.preventDefault()
    const name = newName.trim()
    if (!name || !userId) return

    run(async () => {
      await createGroup(name, userId)
      setNewName('')
    }, `Utworzono grupę „${name}".`)
  }

  const handleJoin = (e) => {
    e.preventDefault()
    const code = joinCode.trim()
    if (!code) return

    run(async () => {
      await joinGroupByCode(code)
      setJoinCode('')
    }, 'Dołączono do grupy.')
  }

  const handleLeave = (group) => {
    if (!window.confirm(`Opuścić grupę „${group.name}"?`)) return
    run(() => leaveGroup(group.id, userId), `Opuszczono grupę „${group.name}".`)
  }

  const handleDelete = (group) => {
    if (
      !window.confirm(
        `Usunąć grupę „${group.name}" dla wszystkich członków? Tej operacji nie można cofnąć.`
      )
    ) {
      return
    }
    run(() => deleteGroup(group.id), `Usunięto grupę „${group.name}".`)
  }

  const handleRemoveMember = (group, member) => {
    if (!window.confirm(`Usunąć ${member.displayName} z grupy?`)) return
    run(
      () => removeMember(group.id, member.userId),
      `Usunięto ${member.displayName} z grupy.`
    )
  }

  const handleCopy = async (group) => {
    try {
      await navigator.clipboard.writeText(group.inviteCode)
      setCopiedId(group.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      setError('Nie udało się skopiować kodu. Zaznacz go i skopiuj ręcznie.')
    }
  }

  const inputClass =
    'min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200'

  const primaryButtonClass =
    'flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60'

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2">
        <form
          onSubmit={handleCreate}
          className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Plus className="h-5 w-5 text-indigo-600" />
            Utwórz grupę
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nazwa, np. Ekipa od obiadów"
              maxLength={60}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy || !newName.trim()}
              className={primaryButtonClass}
            >
              Utwórz
            </button>
          </div>
        </form>

        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <UserPlus className="h-5 w-5 text-indigo-600" />
            Dołącz kodem
          </h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Kod od znajomego"
              maxLength={20}
              className={inputClass}
            />
            <button
              type="submit"
              disabled={busy || !joinCode.trim()}
              className={primaryButtonClass}
            >
              Dołącz
            </button>
          </div>
        </form>
      </div>

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

      <section className="flex flex-col gap-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Users className="h-5 w-5 text-indigo-600" />
          Moje grupy
        </h2>

        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        ) : groups.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-sm text-slate-500 shadow">
            Nie należysz jeszcze do żadnej grupy. Utwórz własną i wyślij znajomym
            kod zaproszenia albo dołącz do istniejącej grupy.
          </p>
        ) : (
          groups.map((group) => {
            const isOwner = group.ownerId === userId

            return (
              <article
                key={group.id}
                className="rounded-2xl bg-white p-6 shadow"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">
                      {group.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      Członkowie: {group.members.length}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                    <span className="text-xs text-slate-500">Kod:</span>
                    <code className="font-mono text-sm font-semibold text-slate-800">
                      {group.inviteCode}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(group)}
                      className="rounded p-1 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800"
                      aria-label="Kopiuj kod zaproszenia"
                    >
                      {copiedId === group.id ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <ul className="mt-4 divide-y divide-slate-100">
                  {group.members.map((member) => {
                    const isMe = member.userId === userId
                    const memberIsOwner = member.userId === group.ownerId

                    return (
                      <li
                        key={member.userId}
                        className="flex items-center justify-between gap-2 py-2 text-sm"
                      >
                        <span className="text-slate-700">
                          {member.displayName}
                          {isMe && (
                            <span className="ml-1 text-slate-400">(Ty)</span>
                          )}
                          {memberIsOwner && (
                            <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                              właściciel
                            </span>
                          )}
                        </span>

                        {isOwner && !isMe && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleRemoveMember(group, member)}
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                          >
                            <UserMinus className="h-4 w-4" />
                            Usuń
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>

                <div className="mt-4 flex justify-end">
                  {isOwner ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDelete(group)}
                      className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                      Usuń grupę
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleLeave(group)}
                      className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
                    >
                      <LogOut className="h-4 w-4" />
                      Opuść grupę
                    </button>
                  )}
                </div>
              </article>
            )
          })
        )}
      </section>
    </div>
  )
}