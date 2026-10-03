import { supabase } from './supabase'

export async function updateProfile(userId, fields) {
  const { error } = await supabase
    .from('profiles')
    .update(fields)
    .eq('id', userId)

  if (error) throw error
}

// Funkcja w bazie usuwa konto wraz z danymi (kaskadowo)
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')

  if (error) throw error
}