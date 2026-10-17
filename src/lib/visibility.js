// Widoczność zajęć dla znajomych:
//  'default' = zgodnie z ustawieniem konta (szczegóły albo tylko „Zajęty”),
//  'busy'    = znajomi widzą tylko blok „Zajęty” z godzinami,
//  'hidden'  = znajomi w ogóle nie widzą tych zajęć (dla nich jesteś wtedy wolny/a).

export const VISIBILITY_OPTIONS = [
  { value: 'default', label: 'Domyślnie' },
  { value: 'busy', label: 'Tylko „Zajęty”' },
  { value: 'hidden', label: 'Ukryte' },
]

/**
 * Obowiązująca widoczność zajęć: ustawienie pojedynczego terminu ma pierwszeństwo,
 * potem reguła przedmiotu (rules: { [nazwa przedmiotu]: 'busy' | 'hidden' }).
 * Działa tak samo jak funkcja get_member_schedule w bazie.
 */
export function effectiveVisibility(event, rules) {
  const own = event.visibility
  if (own && own !== 'default') return own

  return rules?.[event.title] ?? 'default'
}

/**
 * Co zobaczy znajomy: 'full' (szczegóły), 'busy' (tylko „Zajęty”) albo 'none' (nic).
 * shareDetails: ustawienie konta „Pokazuj znajomym szczegóły moich zajęć”.
 */
export function friendView(event, rules, shareDetails) {
  const visibility = effectiveVisibility(event, rules)

  if (visibility === 'hidden') return 'none'
  if (visibility === 'busy') return 'busy'
  return shareDetails ? 'full' : 'busy'
}

export function describeFriendView(view) {
  if (view === 'full') return 'Znajomi widzą szczegóły tych zajęć.'
  if (view === 'busy') return 'Znajomi widzą tylko blok „Zajęty” z godzinami.'
  return 'Znajomi nie widzą tych zajęć (dla nich jesteś wtedy wolny lub wolna).'
}