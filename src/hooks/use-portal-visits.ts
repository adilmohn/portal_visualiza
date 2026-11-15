import { useState, useEffect } from 'react'
import { getPortalVisits, formatCounterValue } from '@/services/counters'

interface UsePortalVisitsResult {
  /** Total de visitas do portal (null = ainda carregando; undefined = falha silenciosa). */
  visits: number | null | undefined
}

/**
 * Lê o total global de visitas ao portal. Nenhum erro propaga — o header
 * nunca deve quebrar por causa do contador.
 */
export function usePortalVisits(): UsePortalVisitsResult {
  const [visits, setVisits] = useState<number | null | undefined>(null)

  useEffect(() => {
    let cancelled = false
    getPortalVisits().then((total) => {
      if (!cancelled && total > 0) setVisits(total)
      else if (!cancelled && total === 0) setVisits(0)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { visits }
}
