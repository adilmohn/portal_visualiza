import { useState, useEffect, useRef } from 'react'
import { getCounters, listingClicksKey } from '@/services/counters'

interface UseListingClicksResult {
  /** Cliques do anúncio (null = ainda carregando; undefined = sem dado). */
  clicks: number | null | undefined
}

/**
 * Lê o contador de cliques de um anúncio de forma silenciosa.
 * Enquanto carrega: clicks = null (exibe skeleton). Falha: undefined (não exibe).
 */
export function useListingClicks(listingId: string | undefined): UseListingClicksResult {
  const [clicks, setClicks] = useState<number | null | undefined>(null)
  const activeIdRef = useRef<string | undefined>(listingId)
  activeIdRef.current = listingId

  useEffect(() => {
    if (!listingId) {
      setClicks(undefined)
      return
    }
    let cancelled = false
    getCounters([listingClicksKey(listingId)]).then((values) => {
      if (cancelled) return
      const v = values[listingClicksKey(listingId)]
      setClicks(typeof v === 'number' ? v : undefined)
    })
    return () => {
      cancelled = true
    }
  }, [listingId])

  return { clicks }
}
