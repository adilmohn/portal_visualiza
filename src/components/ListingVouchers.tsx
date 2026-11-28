import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Check, Copy, Loader2, Ticket } from 'lucide-react'
import { VoucherItem } from '@/services/vouchers'
import { useListingVouchers } from '@/hooks/use-listing-vouchers'

interface ListingVouchersProps {
  listingId: string
  isOwner: boolean
}

function VoucherRow({
  voucher,
  isOwner,
  marking,
  onCopy,
  onMarkUsed,
}: {
  voucher: VoucherItem
  isOwner: boolean
  marking: boolean
  onCopy: (code: string) => void
  onMarkUsed: (voucher: VoucherItem) => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    onCopy(voucher.code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg border transition-opacity duration-300 motion-reduce:transition-none ${
        voucher.used
          ? 'border-border bg-muted/40 opacity-80'
          : 'border-emerald-300 bg-emerald-500/5'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <Ticket
          className={`h-5 w-5 shrink-0 ${voucher.used ? 'text-muted-foreground' : 'text-emerald-600 dark:text-emerald-400'}`}
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-mono font-bold text-sm text-foreground tracking-wide truncate">
            {voucher.code}
          </p>
          <p className="text-xs text-muted-foreground">
            {voucher.used ? 'Voucher utilizado' : 'Voucher disponível para uso'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {voucher.used ? (
          <Badge
            variant="outline"
            className="text-xs font-semibold bg-muted text-muted-foreground border-border"
          >
            Utilizado
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-400"
          >
            Disponível
          </Badge>
        )}

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          className="min-h-[44px] gap-1.5 text-xs font-medium focus-visible:ring-2"
          aria-label={`Copiar código ${voucher.code}`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          ) : (
            <Copy className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{copied ? 'Copiado' : 'Copiar código'}</span>
        </Button>

        {isOwner && !voucher.used && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onMarkUsed(voucher)}
            disabled={marking}
            className="min-h-[44px] gap-1.5 text-xs font-medium focus-visible:ring-2"
            aria-label={`Marcar voucher ${voucher.code} como utilizado`}
          >
            {marking ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4" aria-hidden="true" />
            )}
            <span>{marking ? 'Atualizando...' : 'Marcar como utilizado'}</span>
          </Button>
        )}
      </div>
    </div>
  )
}

/**
 * Bloco de vouchers exibido dentro da seção de promoções da página de detalhe.
 * Mostra código, badge Disponível/Utilizado, copiar código e — para o dono
 * autenticado — marcar como utilizado (POST /backend/v1/vouchers/validate).
 */
export function ListingVouchers({ listingId, isOwner }: ListingVouchersProps) {
  const { vouchersByPromo, isLoading, isError, load, markingId, markUsed, copyCode } =
    useListingVouchers(listingId)

  if (isLoading) {
    return (
      <div className="space-y-2 mt-2" aria-busy="true" aria-label="Carregando vouchers">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-16 w-5/6 rounded-lg" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mt-2 flex flex-col items-start gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
        <p className="text-sm text-foreground">Não foi possível carregar os vouchers.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={load}
          className="min-h-[44px] gap-2 focus-visible:ring-2"
          aria-label="Tentar carregar vouchers novamente"
        >
          Tentar novamente
        </Button>
      </div>
    )
  }

  const promos = Object.entries(vouchersByPromo)
  if (promos.length === 0) return null

  return (
    <div className="mt-2 space-y-2 animate-in fade-in duration-300 motion-reduce:animate-none">
      {promos.map(([promoId, list]) => (
        <div key={promoId} className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {promoId === 'sem-promocao' ? 'Vouchers do anúncio' : 'Vouchers da promoção'}
          </p>
          {list.map((v) => (
            <VoucherRow
              key={v.id}
              voucher={v}
              isOwner={isOwner}
              marking={markingId === v.id}
              onCopy={(code) => void copyCode(code)}
              onMarkUsed={(voucher) => void markUsed(voucher)}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export default ListingVouchers
