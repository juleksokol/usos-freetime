import { supabase } from './supabase'

// Zwraca grupy, w których jest zalogowany użytkownik (RLS filtruje resztę)
export async function fetchMyGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select(
      'id, name, owner_id, invite_code, created_at, group_members(user_id, joined_at, profiles(id, display_name, email))'
    )
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((group) => ({
    id: group.id,
    name: group.name,
    ownerId: group.owner_id,
    inviteCode: group.invite_code,
    members: (group.group_members ?? [])
      .map((member) => ({
        userId: member.user_id,
        displayName: member.profiles?.display_name ?? 'Nieznany użytkownik',
        email: member.profiles?.email ?? '',
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pl')),
  }))
}

// Właściciel zostaje członkiem automatycznie (trigger w bazie)
export async function createGroup(name, ownerId) {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, owner_id: ownerId })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function joinGroupByCode(code) {
  const { data, error } = await supabase.rpc('join_group_by_code', {
    code,
  })

  if (error) throw error
  return data
}

export async function leaveGroup(groupId, userId) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// Tylko właściciel (polityka RLS)
export async function removeMember(groupId, userId) {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
}

// Tylko właściciel (polityka RLS)
export async function deleteGroup(groupId) {
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) throw error
}