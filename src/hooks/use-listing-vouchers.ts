import { useCallback, useEffect, useState } from 'react'
import { toast } from '@/hooks/use-toast'
import { VoucherItem } from '@/services/vouchers'

interface UseListingVouchersResult {
  vouchersByPromo: Record<string, VoucherItem[]>
  isLoading: boolean
  isError: boolean
  load: () => void
  markingId: string | null
  markUsed: (voucher: VoucherItem) => Promise<boolean>
  copyCode: (code: string) => Promise<void>
}

/**
 * Carrega os vouchers de um anúncio (agrupados por promoção) usando o
 * serviço existente getListingVouchers, e permite copiar o código e
 * marcar um voucher como utilizado via POST /backend/v1/vouchers/validate.
 */
export function useListingVouchers(listingId: string | undefined): UseListingVouchersResult {
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!listingId) {
      setVouchers([])
      setIsLoading(false)
      return
    }
    let cancelled = false
    setIsLoading(true)
    setIsError(false)
    import('@/services/vouchers').then(({ getListingVouchers }) =>
      getListingVouchers(listingId)
        .then((items) => {
          if (cancelled) return
          setVouchers(items ?? [])
          setIsLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setIsError(true)
          setIsLoading(false)
        }),
    )
    return () => {
      cancelled = true
    }
  }, [listingId])

  useEffect(() => {
    const cleanup = load()
    return cleanup
  }, [load])

  const markUsed = useCallback(async (voucher: VoucherItem): Promise<boolean> => {
    setMarkingId(voucher.id)
    try {
      const { validateVoucher } = await import('@/services/vouchers')
      const result = await validateVoucher(voucher.code)
      if (result.success) {
        setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? { ...v, used: true } : v)))
        toast({ title: 'Voucher marcado como utilizado' })
        return true
      }
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar o voucher',
        description: result.message || result.error || 'Tente novamente.',
      })
      return false
    } catch {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar o voucher',
        description: 'Verifique sua conexão e tente novamente.',
      })
      return false
    } finally {
      setMarkingId(null)
    }
  }, [])

  const copyCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast({ title: 'Código copiado' })
    } catch {
      toast({
        variant: 'destructive',
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código. Tente manualmente.',
      })
    }
  }, [])

  const vouchersByPromo = vouchers.reduce<Record<string, VoucherItem[]>>((acc, v) => {
    const key = (v as { promotionId?: string }).promotionId ?? 'sem-promocao'
    if (!acc[key]) acc[key] = []
    acc[key].push(v)
    return acc
  }, {})

  return { vouchersByPromo, isLoading, isError, load, markingId, markUsed, copyCode }
}

export default useListingVouchers
