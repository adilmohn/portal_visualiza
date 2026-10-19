import { Link } from 'react-router-dom'
import { ArrowRight, Search, Users, BarChart3, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center animate-fade-in">
      {/* Hero Section */}
      <section className="w-full py-12 sm:py-20 text-center flex flex-col items-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Plataforma de Viabilidade de Projetos
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl leading-[1.1]">
          Portal <span className="text-primary">Viabilize</span>
        </h1>

        <p className="mt-5 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
          A plataforma para viabilizar seus projetos.
        </p>

        {/* CTA buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold px-8 py-6 rounded text-base shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Link to="/cadastro" className="inline-flex items-center gap-2">
              Começar Agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto border-border text-foreground hover:bg-muted font-semibold px-6 py-6 rounded text-base transition-all"
          >
            <Link to="/diretorio">Explorar Diretório</Link>
          </Button>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-muted-foreground">
          <div className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Acesso Rápido</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Dados Estruturados</span>
          </div>
          <div className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>100% Digital</span>
          </div>
        </div>
      </section>

      {/* Feature Preview Cards */}
      <section className="w-full py-8 sm:py-12 border-t border-border/60">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Recursos em Destaque
          </h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Tudo o que você precisa para estruturar, avaliar e viabilizar iniciativas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border border-border bg-card rounded shadow-subtle hover:shadow-elevation hover:-translate-y-1 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <Search className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                Diretório Inteligente
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Consulte diretórios de projetos, linhas de financiamento e oportunidades de
                viabilização.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/diretorio"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Ver diretório
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded shadow-subtle hover:shadow-elevation hover:-translate-y-1 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <Users className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">Rede de Parceiros</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Conecte proponentes, especialistas técnicos, investidores e órgãos reguladores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/area"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Acessar área
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>

          <Card className="border border-border bg-card rounded shadow-subtle hover:shadow-elevation hover:-translate-y-1 transition-all duration-200">
            <CardHeader className="pb-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary mb-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <CardTitle className="text-lg font-bold text-foreground">
                Análise e Indicadores
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Acompanhe o status, métricas de viabilidade econômico-financeira e evolução dos
                projetos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Painel analítico
                <ArrowRight className="h-3 w-3" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
