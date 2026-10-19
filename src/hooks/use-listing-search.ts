import { useState, useEffect, useCallback, useRef } from 'react'
import {
  searchListings,
  SearchListingsParams,
  SearchListingsResponse,
  ListingItem,
} from '@/services/listings'
import { toast } from '@/hooks/use-toast'

export type ListingSearchStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseListingSearchResult {
  status: ListingSearchStatus
  data: SearchListingsResponse | null
  items: ListingItem[]
  total: number
  page: number
  totalPages: number
  error: Error | null
  refetch: () => Promise<void>
}

export function useListingSearch(params: SearchListingsParams): UseListingSearchResult {
  const [status, setStatus] = useState<ListingSearchStatus>('idle')
  const [data, setData] = useState<SearchListingsResponse | null>(null)
  const [error, setError] = useState<Error | null>(null)

  // Keep a reference to latest params to prevent stale responses
  const activeParamsRef = useRef<SearchListingsParams>(params)
  activeParamsRef.current = params

  const queryKey = JSON.stringify({
    state: params.state || '',
    city: params.city || '',
    neighborhood: params.neighborhood || '',
    type: params.type || '',
    keyword: params.keyword || '',
    page: params.page || 1,
  })

  const executeSearch = useCallback(async (searchParams: SearchListingsParams) => {
    setStatus('loading')
    setError(null)
    try {
      const response = await searchListings(searchParams)
      // Check if current search matches active params
      if (
        (searchParams.state || '') === (activeParamsRef.current.state || '') &&
        (searchParams.city || '') === (activeParamsRef.current.city || '') &&
        (searchParams.neighborhood || '') === (activeParamsRef.current.neighborhood || '') &&
        (searchParams.type || '') === (activeParamsRef.current.type || '') &&
        (searchParams.keyword || '') === (activeParamsRef.current.keyword || '') &&
        (searchParams.page || 1) === (activeParamsRef.current.page || 1)
      ) {
        setData(response)
        setStatus('success')
      }
    } catch (err) {
      const parsedError = err instanceof Error ? err : new Error('Erro desconhecido')
      setError(parsedError)
      setStatus('error')
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar o diretório',
        description: 'Verifique sua conexão ou tente novamente mais tarde.',
      })
    }
  }, [])

  useEffect(() => {
    executeSearch(params)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey, executeSearch])

  const refetch = useCallback(async () => {
    await executeSearch(activeParamsRef.current)
  }, [executeSearch])

  return {
    status,
    data,
    items: data?.items ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? (params.page || 1),
    totalPages: data?.totalPages ?? 1,
    error,
    refetch,
  }
}
