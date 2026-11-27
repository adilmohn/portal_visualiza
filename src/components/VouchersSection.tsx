import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Ticket, Copy, Check, Loader2, RefreshCw, Tag, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserVouchers } from '@/hooks/use-vouchers-list'
import { toast } from '@/hooks/use-toast'
import type { VoucherItem } from '@/services/vouchers'

interface VouchersSectionProps {
  onRetry?: () => void
}

function formatDate(value?: string) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch (_) {
    return '—'
  }
}

async function copyCode(code: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(code)
      return true
    }
    const textArea = document.createElement('textarea')
    textArea.value = code
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    return true
  } catch (_) {
    return false
  }
}

function VoucherCard({
  voucher,
  marking,
  onCopy,
  onMarkUsed,
}: {
  voucher: VoucherItem
  marking: boolean
  onCopy: (code: string) => void
  onMarkUsed: (voucher: VoucherItem) => void
}) {
  const promoTitle = voucher.expand?.promotionId?.title || 'Promoção'
  const listingName = voucher.expand?.listingId?.name || 'Anúncio'

  return (
    <Card className="animate-fade-in">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base font-bold text-foreground truncate">
              {promoTitle}
            </CardTitle>
            <span className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" aria-hidden="true" />
              <span className="truncate">{listingName}</span>
            </span>
          </div>
          <Badge
            variant={voucher.used ? 'secondary' : 'default'}
            className={
              voucher.used
                ? 'shrink-0 text-xs'
                : 'shrink-0 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs'
            }
          >
            {voucher.used ? 'Utilizado' : 'Disponível'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
          <span
            className="font-mono text-sm font-bold tracking-wider text-primary truncate"
            aria-label={`Código do voucher ${voucher.code}`}
          >
            {voucher.code}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onCopy(voucher.code)}
            aria-label={`Copiar código ${voucher.code}`}
            className="h-9 w-9 min-h-[44px] min-w-[44px] shrink-0"
          >
            <Copy className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">
            Emitido em {formatDate(voucher.created)}
          </span>
          {!voucher.used && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onMarkUsed(voucher)}
              disabled={marking}
              className="min-h-[44px] gap-2 text-xs font-medium"
              aria-label={`Marcar voucher ${voucher.code} como utilizado`}
            >
              {marking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Atualizando...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>Marcar como utilizado</span>
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function VouchersSection({ onRetry }: VouchersSectionProps) {
  const {
    visibleVouchers,
    filter,
    setFilter,
    counts,
    isLoading,
    error,
    load,
    markAsUsed,
    markingId,
  } = useUserVouchers()

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'Todos', count: counts.all },
      { value: 'available' as const, label: 'Disponíveis', count: counts.available },
      { value: 'used' as const, label: 'Utilizados', count: counts.used },
    ],
    [counts],
  )

  const handleCopy = async (code: string) => {
    const ok = await copyCode(code)
    if (ok) {
      toast({ title: 'Código copiado' })
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código. Tente manualmente.',
      })
    }
  }

  const handleMarkUsed = (voucher: VoucherItem) => {
    void markAsUsed(voucher)
  }

  return (
    <section aria-label="Meus vouchers" className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Ticket className="h-5 w-5 text-primary" aria-hidden="true" />
          <span>Meus Vouchers ({counts.all})</span>
        </h3>
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              type="button"
              size="sm"
              variant={filter === opt.value ? 'default' : 'outline'}
              onClick={() => setFilter(opt.value)}
              className="min-h-[44px] px-3 text-xs font-medium"
              aria-pressed={filter === opt.value}
              aria-label={`Filtrar vouchers: ${opt.label} (${opt.count})`}
            >
              {opt.label} ({opt.count})
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => void load()}
            disabled={isLoading}
            className="min-h-[44px] min-w-[44px] px-2"
            aria-label="Atualizar vouchers"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : error ? (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="py-8 text-center space-y-3">
            <p className="text-sm text-foreground">{error}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void load()}
              className="min-h-[44px] gap-2"
              aria-label="Tentar carregar vouchers novamente"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      ) : visibleVouchers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-3">
            <Ticket className="h-8 w-8 mx-auto text-muted-foreground/60" aria-hidden="true" />
            <p className="font-medium text-foreground">Nenhum voucher por aqui</p>
            <p className="text-xs text-muted-foreground">
              Gere um voucher em uma promoção para vê-lo aqui.
            </p>
            <Button asChild size="sm" variant="outline" className="min-h-[44px] font-medium">
              <Link to="/diretorio">Ver promoções</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleVouchers.map((v) => (
            <VoucherCard
              key={v.id}
              voucher={v}
              marking={markingId === v.id}
              onCopy={handleCopy}
              onMarkUsed={handleMarkUsed}
            />
          ))}
        </div>
      )}
      {onRetry ? null : null}
    </section>
  )
}

export default VouchersSection
