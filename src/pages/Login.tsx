import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { LogIn, Mail, Lock, Loader2, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react'
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

type Mode = 'login' | 'forgot' | 'reset'

export default function Login() {
  const { signIn, isAuthenticated, requestPasswordReset, confirmPasswordReset } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  // /redefinir-senha também renderiza este componente (rota dedicada), com o
  // token vindo dos query params do e-mail de redefinição do PocketBase.
  const pathname = location.pathname
  const isResetRoute = pathname === '/redefinir-senha'
  const resetToken = searchParams.get('token') || ''

  const [mode, setMode] = useState<Mode>(isResetRoute ? 'reset' : 'login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [resetDone, setResetDone] = useState(false)

  useEffect(() => {
    if (isResetRoute) setMode('reset')
  }, [isResetRoute])

  useEffect(() => {
    document.title = 'Acessar Conta | Portal Viabilize'
  }, [])

  // Redirect if already authenticated (only on the login screen itself)
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/area'

  if (isAuthenticated && mode === 'login') {
    navigate(from, { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (mode === 'forgot') {
      if (!email.trim()) {
        toast.error('Informe o e-mail da sua conta para continuar.')
        return
      }
      setIsSubmitting(true)
      try {
        // A resposta é sempre neutra: não revela se o e-mail existe ou não.
        const result = await requestPasswordReset(email)
        if (result.success) {
          setMode('login')
          toast.success(
            'Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.',
            { duration: 7000 },
          )
        } else {
          toast.error(result.error || 'Não foi possível enviar o e-mail. Tente novamente.')
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (mode === 'reset') {
      if (!newPassword || !newPasswordConfirm) {
        toast.error('Preencha a nova senha e a confirmação.')
        return
      }
      if (newPassword.length < 8) {
        toast.error('A nova senha deve ter pelo menos 8 caracteres.')
        return
      }
      if (newPassword !== newPasswordConfirm) {
        toast.error('As senhas informadas não coincidem.')
        return
      }
      if (!resetToken) {
        toast.error('Link de redefinição inválido ou incompleto. Solicite um novo link.')
        return
      }
      setIsSubmitting(true)
      try {
        const result = await confirmPasswordReset({
          token: resetToken,
          newPassword,
          newPasswordConfirm,
        })
        if (result.success) {
          setResetDone(true)
          toast.success('Senha redefinida com sucesso! Faça login com a nova senha.')
        } else {
          toast.error(result.error || 'Não foi possível redefinir a senha. Solicite um novo link.')
        }
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    // mode === 'login'
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

  // ---------- Tela: senha redefinida com sucesso ----------
  if (mode === 'reset' && resetDone) {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-border/80">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-green-500/10 text-green-600 mb-1">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Senha redefinida
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Sua senha foi alterada com sucesso. Agora você pode entrar com a nova senha.
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-2">
            <Button asChild className="w-full font-semibold">
              <Link to="/login">Ir para o login</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  // ---------- Tela: redefinir senha (rota /redefinir-senha) ----------
  if (mode === 'reset') {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-border/80">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Definir nova senha
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Crie uma nova senha com pelo menos 8 caracteres para a sua conta.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo de 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password-confirm">Confirmar nova senha</Label>
                <Input
                  id="new-password-confirm"
                  type="password"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  placeholder="Repita a nova senha"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full font-semibold gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Redefinindo...</span>
                  </>
                ) : (
                  <>
                    <span>Redefinir senha</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Voltar para o login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // ---------- Tela: esqueci minha senha ----------
  if (mode === 'forgot') {
    return (
      <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
        <Card className="w-full max-w-md shadow-lg border-border/80">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
              Recuperar senha
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit} noValidate>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="forgot-email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="forgot-email"
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
            </CardContent>

            <CardFooter className="flex flex-col gap-4 pt-2">
              <Button type="submit" className="w-full font-semibold gap-2" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <span>Enviar link de recuperação</span>
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Lembrou a senha?{' '}
                <Link
                  to="/login"
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  Voltar para o login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    )
  }

  // ---------- Tela: login ----------
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

        <form onSubmit={handleSubmit} noValidate>
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
                  autoComplete="username"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                >
                  Esqueci minha senha
                </button>
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
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
