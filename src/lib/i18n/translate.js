// Tłumaczenie: słownik płaski (klucz -> tekst). Parametry zapisujemy w nawiasach klamrowych,
// np. „Wersja z {date}”. Liczba mnoga: klucze z końcówką _one, _few, _many, _other
// i parametr count.

export function interpolate(template, params = {}) {
  return template.replace(/\{(\w+)\}/g, (match, name) => params[name] ?? match)
}

export function createTranslator(lang, dictionaries, fallbackLang = 'pl') {
  const plurals = new Intl.PluralRules(lang)
  const lookup = (key) => dictionaries[lang]?.[key] ?? dictionaries[fallbackLang]?.[key]

  return function t(key, params = {}) {
    let template

    if (typeof params.count === 'number') {
      template = lookup(`${key}_${plurals.select(params.count)}`) ?? lookup(`${key}_other`)
    }
    template ??= lookup(key)

    return template === undefined ? key : interpolate(template, params)
  }
}