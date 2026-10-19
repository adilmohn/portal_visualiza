import { useState, useEffect, useCallback } from 'react'
import pb from '@/lib/pocketbase/client'
import {
  PromotionItem,
  VoucherItem,
  getOwnerPromotions,
  createPromotion,
  generateVoucher,
  getListingVouchers,
} from '@/services/vouchers'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

export interface UserListingOption {
  id: string
  name: string
  status: string
}

export function usePromotionsAndVouchers() {
  const { user } = useAuth()
  const [promotions, setPromotions] = useState<PromotionItem[]>([])
  const [vouchers, setVouchers] = useState<VoucherItem[]>([])
  const [listings, setListings] = useState<UserListingOption[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const isAdmin = user.role === 'admin'
      const listingFilter = isAdmin ? '' : `userId = '${user.id}'`

      // 1. Fetch user's listings
      const listingRecords = await pb.collection('listings').getFullList({
        filter: listingFilter || undefined,
        sort: 'name',
      })

      const loadedListings: UserListingOption[] = listingRecords.map((l) => ({
        id: l.id,
        name:
          l.getStringValue('name') ||
          (l as unknown as { name?: string }).name ||
          'Anúncio sem nome',
        status: l.getStringValue('status') || 'pendente',
      }))
      setListings(loadedListings)

      // 2. Fetch active promotions
      const promos = await getOwnerPromotions(user.id, isAdmin)
      setPromotions(promos)

      // 3. Fetch vouchers
      const loadedVouchers = await getListingVouchers()
      setVouchers(loadedVouchers)
    } catch (err) {
      console.error('Erro ao carregar promoções e vouchers:', err)
      toast({
        title: 'Erro ao carregar dados',
        description:
          'Não foi possível carregar suas promoções e vouchers. Tente recarregar a página.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCreatePromotion = async (data: {
    listingId: string
    title: string
    description: string
  }): Promise<boolean> => {
    setIsSubmitting(true)
    try {
      await createPromotion({
        listingId: data.listingId,
        title: data.title,
        description: data.description,
        active: true,
      })

      toast({
        title: 'Promoção criada!',
        description: 'Sua promoção ativa foi cadastrada com sucesso.',
      })

      await loadData()
      return true
    } catch (err: unknown) {
      console.error('Erro ao criar promoção:', err)
      const message =
        (err as { message?: string })?.message ||
        'Não foi possível cadastrar a promoção. Verifique os dados.'
      toast({
        title: 'Erro ao criar promoção',
        description: message,
        variant: 'destructive',
      })
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateVoucher = async (
    listingId: string,
    promotionId: string,
  ): Promise<string | null> => {
    setIsGenerating(promotionId)
    try {
      const res = await generateVoucher({ listingId, promotionId })
      if (res && res.code) {
        toast({
          title: 'Voucher gerado com sucesso',
          description: `Código criado: ${res.code}. Disponível para clientes utilizarem.`,
        })

        // Refresh vouchers and promotions
        const updatedVouchers = await getListingVouchers()
        setVouchers(updatedVouchers)
        return res.code
      } else {
        throw new Error(res.message || 'Código não retornado pelo servidor')
      }
    } catch (err: unknown) {
      console.error('Erro ao gerar voucher:', err)
      const message =
        (err as { data?: { message?: string }; message?: string })?.data?.message ||
        (err as { message?: string })?.message ||
        'Erro ao gerar código de voucher.'
      toast({
        title: 'Erro ao gerar voucher',
        description: message,
        variant: 'destructive',
      })
      return null
    } finally {
      setIsGenerating(null)
    }
  }

  return {
    promotions,
    vouchers,
    listings,
    isLoading,
    isSubmitting,
    isGenerating,
    createPromotion: handleCreatePromotion,
    generateVoucher: handleGenerateVoucher,
    reload: loadData,
  }
}
