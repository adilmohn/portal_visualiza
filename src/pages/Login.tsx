import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogIn, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'

export default function Login() {
  const { signIn, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/area'

  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Preencha e-mail e senha para continuar.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signIn({ email, password })

      if (result.success) {
        toast.success('Login realizado com sucesso! Bem-vindo(a).')
        navigate(from, { replace: true })
      } else {
        toast.error(result.error || 'Não foi possível entrar. Verifique seus dados.')
      }
    } catch {
      toast.error('Ocorreu um erro inesperado ao conectar. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
            <LogIn className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Acessar Conta
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Entre com seu e-mail e senha para gerenciar seus anúncios e acessar a plataforma.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  autoComplete="email"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Sua senha secreta"
                  required
                  autoComplete="current-password"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 pt-2">
            <Button type="submit" className="w-full font-semibold gap-2" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ainda não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Cadastre-se
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
