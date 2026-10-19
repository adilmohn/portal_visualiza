import { useState, useEffect, useCallback } from 'react'
import {
  getAdminPendingReviews,
  approveReview as apiApproveReview,
  rejectReview as apiRejectReview,
  type AdminReviewItem,
} from '@/services/reviews'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export interface UseAdminReviewsResult {
  pendingReviews: AdminReviewItem[]
  isLoading: boolean
  isActionLoading: boolean
  actionReviewId: string | null
  refetch: () => Promise<void>
  handleApprove: (reviewId: string) => Promise<boolean>
  handleReject: (reviewId: string) => Promise<boolean>
}

export function useAdminReviews(): UseAdminReviewsResult {
  const [pendingReviews, setPendingReviews] = useState<AdminReviewItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionReviewId, setActionReviewId] = useState<string | null>(null)

  const fetchPending = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getAdminPendingReviews()
      setPendingReviews(data)
    } catch (err) {
      console.error('Falha ao carregar avaliações pendentes:', err)
      toast.error('Não foi possível carregar a fila de avaliações pendentes.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  // Realtime subscription on reviews collection
  useRealtime('reviews', () => {
    fetchPending()
  })

  const handleApprove = useCallback(async (reviewId: string): Promise<boolean> => {
    setIsActionLoading(true)
    setActionReviewId(reviewId)
    try {
      await apiApproveReview(reviewId)
      toast.success('Avaliação aprovada com sucesso!')
      setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId))
      return true
    } catch (err: unknown) {
      console.error('Erro ao aprovar avaliação:', err)
      const msg =
        (err as { message?: string })?.message || 'Falha ao aprovar avaliação. Tente novamente.'
      toast.error(msg)
      return false
    } finally {
      setIsActionLoading(false)
      setActionReviewId(null)
    }
  }, [])

  const handleReject = useCallback(async (reviewId: string): Promise<boolean> => {
    setIsActionLoading(true)
    setActionReviewId(reviewId)
    try {
      await apiRejectReview(reviewId)
      toast.success('Avaliação rejeitada com sucesso!')
      setPendingReviews((prev) => prev.filter((r) => r.id !== reviewId))
      return true
    } catch (err: unknown) {
      console.error('Erro ao rejeitar avaliação:', err)
      const msg =
        (err as { message?: string })?.message || 'Falha ao rejeitar avaliação. Tente novamente.'
      toast.error(msg)
      return false
    } finally {
      setIsActionLoading(false)
      setActionReviewId(null)
    }
  }, [])

  return {
    pendingReviews,
    isLoading,
    isActionLoading,
    actionReviewId,
    refetch: fetchPending,
    handleApprove,
    handleReject,
  }
}
