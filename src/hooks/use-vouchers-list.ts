import { useCallback, useEffect, useState } from 'react'
import { createElement } from 'react'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import type { VoucherItem } from '@/services/vouchers'
import { getListingVouchers, validateVoucher } from '@/services/vouchers'

export type VoucherFilter = 'all' | 'available' | 'used'

export interface UseUserVouchersResult {
  vouchers: VoucherItem[]
  visibleVouchers: VoucherItem[]
  filter: VoucherFilter
  setFilter: (f: VoucherFilter) => void
  counts: { all: number; available: number; used: number }
  isLoading: boolean
  error: string | null
  load: () => Promise<void>
  markAsUsed: (voucher: VoucherItem) => Promise<boolean>
  markingId: string | null
}

export function useUserVouchers(): UseUserVouchersResult {
  const { toast } = useToast()
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<VoucherFilter>('all')
  const [markingId, setMarkingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const records = await pb.collection('vouchers').getFullList({
        filter: '',
        sort: '-created',
        expand: 'promotionId,listingId',
      })
      const mapped = records.map((r) => {
        const raw = r as unknown as {
          code?: string
          listingId?: string
          promotionId?: string
          used?: boolean
        }
        const expand = r.expand as
          | {
              promotionId?: { id: string; title: string; description?: string }
              listingId?: { id: string; name: string }
            }
          | undefined
        return {
          id: r.id,
          code: raw.code || '',
          listingId: raw.listingId || '',
          promotionId: raw.promotionId || '',
          used: raw.used ?? false,
          created: r.created,
          updated: r.updated,
          expand: {
            promotionId: expand?.promotionId,
            listingId: expand?.listingId,
          } as VoucherItem['expand'],
        } satisfies VoucherItem
      })
      setVouchers(mapped)
    } catch (err) {
      console.error('Erro ao carregar vouchers:', err)
      setError('Não foi possível carregar seus vouchers.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const markAsUsed = useCallback(
    async (voucher: VoucherItem): Promise<boolean> => {
      setMarkingId(voucher.id)
      try {
        const res = await validateVoucher(voucher.code)
        if (res?.success) {
          setVouchers((prev) => prev.map((v) => (v.id === voucher.id ? { ...v, used: true } : v)))
          toast({
            title: 'Voucher marcado como utilizado',
            description: res.alreadyUsed ? 'Este código já havia sido utilizado.' : undefined,
          })
          return true
        }
        throw new Error(res?.error || 'Falha desconhecida')
      } catch (err) {
        console.error('Erro ao marcar voucher como utilizado:', err)
        toast({
          variant: 'destructive',
          title: 'Não foi possível atualizar o voucher',
          description: 'Tente novamente em instantes.',
          action: createElement(
            ToastAction,
            {
              altText: 'Tentar novamente',
              onClick: () => {
                void markAsUsed(voucher)
              },
            },
            'Tentar novamente',
          ),
        })
        return false
      } finally {
        setMarkingId(null)
      }
    },
    [toast],
  )

  const counts = {
    all: vouchers.length,
    available: vouchers.filter((v) => !v.used).length,
    used: vouchers.filter((v) => v.used).length,
  }

  const visibleVouchers =
    filter === 'all' ? vouchers : vouchers.filter((v) => (filter === 'used' ? v.used : !v.used))

  return {
    vouchers,
    visibleVouchers,
    filter,
    setFilter,
    counts,
    isLoading,
    error,
    load,
    markAsUsed,
    markingId,
  }
}

// Reexportado para conveniência das páginas
export { getListingVouchers }
