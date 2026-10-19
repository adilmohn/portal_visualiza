import { useState, useEffect, useCallback, useRef } from 'react'
import { getListingDetail, ListingDetail, ListingNotFoundError } from '@/services/listing-detail'
import { toast } from '@/hooks/use-toast'

export type ListingDetailStatus = 'loading' | 'success' | 'notFound' | 'error'

export interface UseListingDetailResult {
  status: ListingDetailStatus
  data: ListingDetail | null
  isLoading: boolean
  isNotFound: boolean
  isError: boolean
  isSuccess: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Manages fetching state for a single listing detail:
 * loading, success, notFound, error.
 * Includes automated Portuguese toast notification on non-404 errors.
 */
export function useListingDetail(id: string | undefined): UseListingDetailResult {
  const [status, setStatus] = useState<ListingDetailStatus>('loading')
  const [data, setData] = useState<ListingDetail | null>(null)
  const [error, setError] = useState<Error | null>(null)

  const activeIdRef = useRef<string | undefined>(id)
  activeIdRef.current = id

  const executeFetch = useCallback(async (targetId: string | undefined) => {
    if (!targetId || !targetId.trim()) {
      setStatus('notFound')
      setData(null)
      setError(new ListingNotFoundError('Identificador do anúncio não fornecido.'))
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const result = await getListingDetail(targetId)
      // Only commit result if query matches current active target
      if (activeIdRef.current === targetId) {
        setData(result)
        setStatus('success')
      }
    } catch (err: unknown) {
      if (activeIdRef.current !== targetId) return

      if (err instanceof ListingNotFoundError) {
        setStatus('notFound')
        setData(null)
        setError(err)
      } else {
        const parsedError =
          err instanceof Error ? err : new Error('Não foi possível carregar o anúncio.')
        setError(parsedError)
        setStatus('error')
        setData(null)
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar anúncio',
          description:
            'Não foi possível carregar os detalhes do anúncio. Verifique sua conexão e tente novamente.',
        })
      }
    }
  }, [])

  useEffect(() => {
    executeFetch(id)
  }, [id, executeFetch])

  const refetch = useCallback(async () => {
    await executeFetch(activeIdRef.current)
  }, [executeFetch])

  return {
    status,
    data,
    isLoading: status === 'loading',
    isNotFound: status === 'notFound',
    isError: status === 'error',
    isSuccess: status === 'success',
    error,
    refetch,
  }
}
