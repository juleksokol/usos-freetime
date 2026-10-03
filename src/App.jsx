import { Loader2 } from 'lucide-react'
import { useAuth } from './context/AuthContext'
import AuthForm from './components/AuthForm'
import Dashboard from './pages/Dashboard'

export default function App() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    )
  }

  return session ? <Dashboard /> : <AuthForm />
}