import { supabase } from './supabase'

// Reguły widoczności przedmiotów: { [nazwa przedmiotu]: 'busy' | 'hidden' }
export async function fetchVisibilityRules(userId) {
  const { data, error } = await supabase
    .from('subject_visibility')
    .select('subject, visibility')
    .eq('user_id', userId)

  if (error) throw error
  return Object.fromEntries((data ?? []).map((row) => [row.subject, row.visibility]))
}

// visibility 'default' (albo puste) usuwa regułę przedmiotu
export async function saveSubjectVisibility(userId, subject, visibility) {
  if (!visibility || visibility === 'default') {
    const { error } = await supabase
      .from('subject_visibility')
      .delete()
      .eq('user_id', userId)
      .eq('subject', subject)

    if (error) throw error
    return
  }

  const { error } = await supabase
    .from('subject_visibility')
    .upsert({ user_id: userId, subject, visibility }, { onConflict: 'user_id,subject' })

  if (error) throw error
}

// Widoczność jednego terminu: 'default' | 'busy' | 'hidden'
export async function saveEventVisibility(eventId, visibility) {
  const { error } = await supabase
    .from('schedule_events')
    .update({ visibility })
    .eq('id', eventId)

  if (error) throw error
}