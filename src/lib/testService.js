import { supabase } from './supabase'

export async function fetchTests(userId) {
  const { data, error } = await supabase
    .from('tests')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: true })
    .order('start_time', { ascending: true })

  if (error) throw error
  return data ?? []
}

export async function createTest(userId, fields) {
  const { error } = await supabase
    .from('tests')
    .insert({ ...fields, user_id: userId })

  if (error) throw error
}

export async function updateTest(testId, fields) {
  const { error } = await supabase.from('tests').update(fields).eq('id', testId)

  if (error) throw error
}

export async function deleteTest(testId) {
  const { error } = await supabase.from('tests').delete().eq('id', testId)

  if (error) throw error
}