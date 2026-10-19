import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus, Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
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

export default function Cadastro() {
  const { signUp, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    navigate('/area', { replace: true })
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    if (password.length < 8) {
      toast.error('A senha deve possuir no mínimo 8 caracteres.')
      return
    }

    if (password !== passwordConfirm) {
      toast.error('A confirmação de senha não confere.')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await signUp({
        name,
        email,
        password,
        passwordConfirm,
      })

      if (result.success) {
        toast.success('Cadastro realizado com sucesso! Bem-vindo(a) ao Portal Viabilize.')
        navigate('/area', { replace: true })
      } else {
        toast.error(result.error || 'Não foi possível concluir o cadastro.')
      }
    } catch {
      toast.error('Ocorreu um erro inesperado ao realizar o cadastro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[calc(100vh-16rem)] items-center justify-center px-4 py-12 sm:px-6">
      <Card className="w-full max-w-md shadow-lg border-border/80">
        <CardHeader className="space-y-2 text-center pb-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-1">
            <UserPlus className="h-6 w-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Criar Conta
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Cadastre-se no Portal Viabilize para anunciar empresas, negócios e soluções.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome ou razão social"
                  autoComplete="name"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail *</Label>
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
              <Label htmlFor="password">Senha * (mínimo 8 caracteres)</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  className="pl-9"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="passwordConfirm">Confirmar senha *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input
                  id="passwordConfirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  minLength={8}
                  autoComplete="new-password"
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
                  <span>Criando conta...</span>
                </>
              ) : (
                <>
                  <span>Criar Conta</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Já possui uma conta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Faça login
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
