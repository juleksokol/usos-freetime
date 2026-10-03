import { supabase } from './supabase'

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

// Zastępuje cały plan użytkownika nowym zestawem wydarzeń
export async function replaceUserSchedule(userId, events) {
  const { data: oldRows, error: selectError } = await supabase
    .from('schedule_events')
    .select('id')
    .eq('user_id', userId)

  if (selectError) throw selectError

  const oldIds = (oldRows ?? []).map((row) => row.id)

  const payload = events.map((event) => ({ ...event, user_id: userId }))
  const { error: insertError } = await supabase
    .from('schedule_events')
    .insert(payload)

  if (insertError) throw insertError

  for (let i = 0; i < oldIds.length; i += 100) {
    const chunk = oldIds.slice(i, i + 100)
    const { error: deleteError } = await supabase
      .from('schedule_events')
      .delete()
      .in('id', chunk)

    if (deleteError) throw deleteError
  }
}