import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Check,
  Building,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  HelpCircle,
  Mail,
  MessageCircle,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getActivePackages,
  MEDIA_TYPE_LABELS,
  PERIOD_LABELS,
  type PackageItem,
} from '@/services/monetization'
import { useRealtime } from '@/hooks/use-realtime'

export default function Planos() {
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadPackages = async () => {
    setIsLoading(true)
    try {
      const data = await getActivePackages()
      setPackages(data)
    } catch (err) {
      console.error('Erro ao carregar planos de publicidade:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPackages()
  }, [])

  // Live updates when packages collection changes
  useRealtime('packages', () => {
    loadPackages()
  })

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-16 animate-fade-in">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge
          variant="outline"
          className="px-3 py-1 text-xs border-primary/30 text-primary bg-primary/5"
        >
          <Sparkles className="h-3.5 w-3.5 mr-1" />
          Planos de Publicidade e Mídia
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Destaque sua empresa e alcance milhares de clientes
        </h1>
        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          Escolha o formato ideal de mídia para colocar seus produtos, serviços e soluções em
          evidência no Portal Viabilize.
        </p>
      </div>

      {/* Pricing packages grid */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 space-y-4 border-border">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full rounded-md" />
              </Card>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Building className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Planos em atualização</h3>
            <p className="text-sm text-muted-foreground">
              Novos formatos de destaque e mídia estão sendo preparados pela nossa equipe comercial.
              Fale conosco diretamente para uma proposta personalizada.
            </p>
            <div className="pt-2">
              <Link to="/contato">
                <Button className="min-h-[44px]">Falar com atendimento</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {packages.map((pkg, idx) => {
              const isFeatured = idx === 0 || pkg.mediaType === 'destaque_diretorio'

              return (
                <Card
                  key={pkg.id}
                  className={`flex flex-col justify-between transition-all duration-200 hover:shadow-lg ${
                    isFeatured
                      ? 'border-primary ring-1 ring-primary/40 relative bg-card'
                      : 'border-border bg-card'
                  }`}
                >
                  {isFeatured && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground text-[10px] px-2.5 py-0.5 uppercase tracking-wider font-semibold shadow">
                        Mais Procurado
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="space-y-2 pb-4">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {MEDIA_TYPE_LABELS[pkg.mediaType]}
                      </Badge>
                      <CardTitle className="text-xl font-bold text-foreground pt-1">
                        {pkg.name}
                      </CardTitle>
                    </div>
                    <CardDescription className="text-xs">
                      Formato de cobrança: {PERIOD_LABELS[pkg.period]}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-5 pb-6">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground uppercase tracking-wide">
                        Investimento
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold text-foreground font-mono">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(pkg.price)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          /{PERIOD_LABELS[pkg.period].toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-muted-foreground border-t border-border/50 pt-4">
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Formato: {MEDIA_TYPE_LABELS[pkg.mediaType]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Veiculação: {PERIOD_LABELS[pkg.period]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Visibilidade prioritária no diretório</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Check className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Suporte e métricas de desempenho</span>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0">
                    <Link to="/contato" className="w-full">
                      <Button
                        variant={isFeatured ? 'default' : 'outline'}
                        className="w-full min-h-[44px] gap-2 focus-visible:ring-2"
                        aria-label={`Contratar plano ${pkg.name}`}
                      >
                        <span>Anunciar agora</span>
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Feature highlights / benefits section */}
      <div className="grid gap-6 md:grid-cols-3 pt-8 border-t border-border">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
          <div className="p-2.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">Máxima Visibilidade</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Posicione sua marca na primeira página e nos pontos de maior atenção de investidores e
              clientes.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">Credibilidade e Confiança</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Anúncios verificados e destacados transmitem maior segurança para tomada de decisão
              comercial.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
            <MessageCircle className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-foreground text-sm">Contatos Diretos</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Receba leads qualificados diretamente no seu WhatsApp, telefone, e-mail e site
              oficial.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ / CTA banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">
              Dúvidas sobre qual pacote escolher?
            </h3>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Nossa equipe de atendimento pode auxiliar na definição do formato mais adequado para os
            objetivos da sua empresa ou negócio.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link to="/contato">
            <Button size="lg" className="min-h-[44px] gap-2">
              <Mail className="h-4 w-4" />
              <span>Falar com especialista</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
