import { useI18n } from '../../context/I18nContext'
import PasswordChangeForm from '../password/PasswordChangeForm'

// Zawartość sekcji „Hasło” w Ustawieniach
export default function PasswordBody() {
  const { t } = useI18n()

  return (
    <div className="py-4">
      <p className="mb-4 text-sm text-slate-600">{t('password.settings.hint')}</p>
      <PasswordChangeForm />
    </div>
  )
}