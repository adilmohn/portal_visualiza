import { LayoutDashboard, User, Shield, Mail, Calendar, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function Area() {
  const { user, signOut } = useAuth()

  return (
    <div className="max-w-4xl mx-auto py-10 sm:py-16 px-4 animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Minha Área
            </h1>
            <p className="text-sm text-muted-foreground">
              Gerencie seu perfil e suas listagens no Portal Viabilize.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={signOut}
          className="gap-2 text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da conta</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Dados da Conta</span>
            </CardTitle>
            <CardDescription>Informações do usuário autenticado no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-4 w-4" /> E-mail
              </span>
              <span className="font-medium text-foreground">{user?.email}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <User className="h-4 w-4" /> Nome
              </span>
              <span className="font-medium text-foreground">{user?.name || 'Não informado'}</span>
            </div>

            <div className="flex items-center justify-between py-1 border-b border-border/50">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Shield className="h-4 w-4" /> Perfil / Papel
              </span>
              <Badge
                variant={user?.role === 'admin' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {user?.role || 'cadastrado'}
              </Badge>
            </div>

            {user?.created && (
              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" /> Membro desde
                </span>
                <span className="text-foreground">
                  {new Date(user.created).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Meus Anúncios</CardTitle>
            <CardDescription>
              Acompanhe o status e a aprovação das suas listagens cadastradas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Você ainda não possui anúncios cadastrados.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
