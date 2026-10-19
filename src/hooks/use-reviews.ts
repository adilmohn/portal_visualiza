import { useState, useEffect, useCallback } from 'react'
import {
  getListingApprovedReviews,
  hasUserReviewedListing,
  createReview,
  type ReviewItem,
  type CreateReviewParams,
} from '@/services/reviews'
import { toast } from 'sonner'
import pb from '@/lib/pocketbase/client'

export interface UseListingReviewsResult {
  reviews: ReviewItem[]
  totalReviews: number
  totalPages: number
  page: number
  averageStars: number
  isLoading: boolean
  isSubmitting: boolean
  hasUserReviewed: boolean
  fetchPage: (targetPage: number) => Promise<void>
  submitReview: (params: Omit<CreateReviewParams, 'listingId'>) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useListingReviews(listingId?: string): UseListingReviewsResult {
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [totalReviews, setTotalReviews] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [averageStars, setAverageStars] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasUserReviewed, setHasUserReviewed] = useState(false)

  const currentUserId = pb.authStore.record?.id

  // Check if current user already submitted / reviewed
  const checkUserReviewed = useCallback(async () => {
    if (!listingId || !currentUserId) {
      setHasUserReviewed(false)
      return
    }
    const reviewed = await hasUserReviewedListing(listingId, currentUserId)
    if (reviewed) {
      setHasUserReviewed(true)
    }
  }, [listingId, currentUserId])

  // Fetch approved reviews page
  const fetchPage = useCallback(
    async (targetPage = 1) => {
      if (!listingId) {
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await getListingApprovedReviews(listingId, targetPage, 10)
        setReviews(res.items)
        setTotalReviews(res.totalItems)
        setTotalPages(res.totalPages)
        setPage(res.page)
        setAverageStars(res.averageStars)
      } catch (err) {
        console.error('Falha ao carregar avaliações:', err)
        toast.error('Não foi possível carregar as avaliações deste anúncio.')
      } finally {
        setIsLoading(false)
      }
    },
    [listingId],
  )

  useEffect(() => {
    fetchPage(1)
    checkUserReviewed()
  }, [fetchPage, checkUserReviewed])

  // Submit review
  const submitReview = useCallback(
    async (params: Omit<CreateReviewParams, 'listingId'>): Promise<boolean> => {
      if (!listingId) return false

      if (!pb.authStore.isValid || !pb.authStore.record) {
        toast.error('Você precisa fazer login para avaliar este anúncio.')
        return false
      }

      setIsSubmitting(true)
      try {
        await createReview({
          listingId,
          stars: params.stars,
          comment: params.comment,
        })

        // Success state per prompt:
        toast.success('Avaliação enviada! Ela aparecerá após aprovação.')
        setHasUserReviewed(true)
        return true
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : 'Erro ao enviar avaliação. Tente novamente.'
        toast.error(msg)
        if (msg.includes('já avaliou')) {
          setHasUserReviewed(true)
        }
        return false
      } finally {
        setIsSubmitting(false)
      }
    },
    [listingId],
  )

  const refetch = useCallback(async () => {
    await fetchPage(page)
    await checkUserReviewed()
  }, [fetchPage, checkUserReviewed, page])

  return {
    reviews,
    totalReviews,
    totalPages,
    page,
    averageStars,
    isLoading,
    isSubmitting,
    hasUserReviewed,
    fetchPage,
    submitReview,
    refetch,
  }
}
