import { useState, useEffect, useCallback } from 'react'
import {
  getPendingListings,
  getApprovedListings,
  approveListing as apiApproveListing,
  rejectListing as apiRejectListing,
  deactivateListing as apiDeactivateListing,
  type AdminListingItem,
} from '@/services/admin'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export interface UseAdminQueueResult {
  pendingListings: AdminListingItem[]
  approvedListings: AdminListingItem[]
  approvedTotal: number
  approvedPage: number
  approvedTotalPages: number
  isLoadingPending: boolean
  isLoadingApproved: boolean
  isActionLoading: boolean
  actionListingId: string | null
  errorPending: string | null
  errorApproved: string | null
  refetchPending: () => Promise<void>
  refetchApproved: (page?: number, search?: string) => Promise<void>
  handleApprove: (listingId: string) => Promise<boolean>
  handleReject: (listingId: string, reason: string) => Promise<boolean>
  handleDeactivate: (listingId: string, reason?: string) => Promise<boolean>
}

export function useAdminQueue(): UseAdminQueueResult {
  const [pendingListings, setPendingListings] = useState<AdminListingItem[]>([])
  const [approvedListings, setApprovedListings] = useState<AdminListingItem[]>([])
  const [approvedTotal, setApprovedTotal] = useState(0)
  const [approvedPage, setApprovedPage] = useState(1)
  const [approvedTotalPages, setApprovedTotalPages] = useState(1)
  const [approvedSearch, setApprovedSearch] = useState('')

  const [isLoadingPending, setIsLoadingPending] = useState(true)
  const [isLoadingApproved, setIsLoadingApproved] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [actionListingId, setActionListingId] = useState<string | null>(null)

  const [errorPending, setErrorPending] = useState<string | null>(null)
  const [errorApproved, setErrorApproved] = useState<string | null>(null)

  // Fetch pending listings
  const fetchPending = useCallback(async () => {
    setIsLoadingPending(true)
    setErrorPending(null)
    try {
      const data = await getPendingListings()
      setPendingListings(data)
    } catch (err: unknown) {
      console.error('Erro ao carregar fila de pendentes:', err)
      const msg = 'Não foi possível carregar a fila de anúncios pendentes.'
      setErrorPending(msg)
      toast.error(msg)
    } finally {
      setIsLoadingPending(false)
    }
  }, [])

  // Fetch approved listings
  const fetchApproved = useCallback(
    async (page = 1, search?: string) => {
      setIsLoadingApproved(true)
      setErrorApproved(null)
      const searchQuery = search !== undefined ? search : approvedSearch
      if (search !== undefined) {
        setApprovedSearch(search)
      }
      setApprovedPage(page)

      try {
        const result = await getApprovedListings(page, 20, searchQuery)
        setApprovedListings(result.items)
        setApprovedTotal(result.total)
        setApprovedTotalPages(result.totalPages)
      } catch (err: unknown) {
        console.error('Erro ao carregar anúncios aprovados:', err)
        const msg = 'Não foi possível carregar a lista de anúncios aprovados.'
        setErrorApproved(msg)
        toast.error(msg)
      } finally {
        setIsLoadingApproved(false)
      }
    },
    [approvedSearch],
  )

  // Initial load
  useEffect(() => {
    fetchPending()
    fetchApproved(1, '')
  }, [fetchPending, fetchApproved])

  // Realtime hook on listings collection: updates live, unsubs on unmount, NO polling
  useRealtime('listings', () => {
    // Whenever a listing is created, updated, or deleted, reload pending & approved lists
    fetchPending()
    fetchApproved(approvedPage)
  })

  // Action: Approve
  const handleApprove = useCallback(
    async (listingId: string): Promise<boolean> => {
      setIsActionLoading(true)
      setActionListingId(listingId)
      try {
        await apiApproveListing(listingId)
        toast.success('Anúncio aprovado com sucesso!')
        // Optimistically remove from pending
        setPendingListings((prev) => prev.filter((item) => item.id !== listingId))
        fetchApproved(approvedPage)
        return true
      } catch (err: unknown) {
        console.error('Erro ao aprovar anúncio:', err)
        const msg =
          (err as { message?: string })?.message || 'Falha ao aprovar o anúncio. Tente novamente.'
        toast.error(msg)
        return false
      } finally {
        setIsActionLoading(false)
        setActionListingId(null)
      }
    },
    [approvedPage, fetchApproved],
  )

  // Action: Reject with reason
  const handleReject = useCallback(async (listingId: string, reason: string): Promise<boolean> => {
    if (!reason.trim()) {
      toast.error('Informe o motivo da rejeição do anúncio.')
      return false
    }

    setIsActionLoading(true)
    setActionListingId(listingId)
    try {
      await apiRejectListing(listingId, reason)
      toast.success('Anúncio rejeitado com sucesso!')
      // Optimistically remove from pending
      setPendingListings((prev) => prev.filter((item) => item.id !== listingId))
      return true
    } catch (err: unknown) {
      console.error('Erro ao rejeitar anúncio:', err)
      const msg =
        (err as { message?: string })?.message || 'Falha ao rejeitar o anúncio. Tente novamente.'
      toast.error(msg)
      return false
    } finally {
      setIsActionLoading(false)
      setActionListingId(null)
    }
  }, [])

  // Action: Deactivate
  const handleDeactivate = useCallback(
    async (listingId: string, reason?: string): Promise<boolean> => {
      setIsActionLoading(true)
      setActionListingId(listingId)
      try {
        await apiDeactivateListing(listingId, reason)
        toast.success('Anúncio desativado com sucesso!')
        fetchApproved(approvedPage)
        return true
      } catch (err: unknown) {
        console.error('Erro ao desativar anúncio:', err)
        const msg =
          (err as { message?: string })?.message || 'Falha ao desativar o anúncio. Tente novamente.'
        toast.error(msg)
        return false
      } finally {
        setIsActionLoading(false)
        setActionListingId(null)
      }
    },
    [approvedPage, fetchApproved],
  )

  return {
    pendingListings,
    approvedListings,
    approvedTotal,
    approvedPage,
    approvedTotalPages,
    isLoadingPending,
    isLoadingApproved,
    isActionLoading,
    actionListingId,
    errorPending,
    errorApproved,
    refetchPending: fetchPending,
    refetchApproved: fetchApproved,
    handleApprove,
    handleReject,
    handleDeactivate,
  }
}
