import { useI18n } from '../../context/I18nContext'
import { Row, Segmented } from './controls'

// Zawartość sekcji „Język / Language” w Ustawieniach
export default function LanguageBody() {
  const { t, choice, setLang } = useI18n()

  const options = [
    { value: 'auto', label: t('language.auto') },
    { value: 'pl', label: 'Polski' },
    { value: 'en', label: 'English' },
  ]

  return (
    <Row label="Język / Language" hint={t('language.hint')}>
      <Segmented value={choice} options={options} onChange={setLang} />
    </Row>
  )
}