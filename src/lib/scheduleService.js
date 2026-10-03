import { supabase } from './supabase'

// Własny plan: pełne dane prosto z tabeli (z polem "source")
export async function fetchUserSchedule(userId) {
  const { data, error } = await supabase
    .from('schedule_events')
    .select('*')
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data ?? []
}

// Plan członka grupy (lub własny) przez funkcję w bazie, która respektuje tryb prywatności
export async function fetchMemberSchedule(memberId) {
  const { data, error } = await supabase.rpc('get_member_schedule', {
    member_id: memberId,
  })

  if (error) throw error
  return data ?? []
}

// Zastępuje zaimportowany plan nowym zestawem. Własne wydarzenia (source = 'custom') zostają.
// Najpierw wstawiamy nowe wpisy, dopiero potem kasujemy stare, żeby błąd nie zostawił pustego planu.
export async function replaceUserSchedule(userId, events) {
  const { data: oldRows, error: selectError } = await supabase
    .from('schedule_events')
    .select('id')
    .eq('user_id', userId)
    .eq('source', 'import')

  if (selectError) throw selectError

  const oldIds = (oldRows ?? []).map((row) => row.id)
  const payload = events.map((event) => ({
    ...event,
    user_id: userId,
    source: 'import',
  }))

  for (let i = 0; i < payload.length; i += 500) {
    const { error: insertError } = await supabase
      .from('schedule_events')
      .insert(payload.slice(i, i + 500))

    if (insertError) throw insertError
  }

  for (let i = 0; i < oldIds.length; i += 100) {
    const { error: deleteError } = await supabase
      .from('schedule_events')
      .delete()
      .in('id', oldIds.slice(i, i + 100))

    if (deleteError) throw deleteError
  }
}

export async function createCustomEvent(userId, fields) {
  const { error } = await supabase
    .from('schedule_events')
    .insert({ ...fields, user_id: userId, source: 'custom' })

  if (error) throw error
}

export async function updateCustomEvent(eventId, fields) {
  const { error } = await supabase
    .from('schedule_events')
    .update(fields)
    .eq('id', eventId)
    .eq('source', 'custom')

  if (error) throw error
}

export async function deleteEvent(eventId) {
  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

// Usuwa cały własny plan (zaimportowany i własne wydarzenia)
export async function deleteAllMyEvents(userId) {
  const { error } = await supabase
    .from('schedule_events')
    .delete()
    .eq('user_id', userId)

  if (error) throw error
}