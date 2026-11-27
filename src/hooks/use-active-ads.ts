import { useCallback, useEffect, useState } from 'react'

export type AdStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AdItem {
  id: string
  packageName: string
  mediaType: string
  creativeUrl: string
  creativeFileUrl: string
  targetUrl: string
  advertiserName: string
  startDate: string
  endDate: string
  impressions: number
  clicks: number
}

export type AdGroups = Record<string, AdItem[]>

export interface UseActiveAdsResult {
  status: AdStatus
  groups: AdGroups
  all: AdItem[]
  byGroup: (mediaType: string) => AdItem[]
  trackImpression: (saleId: string) => void
  trackClick: (saleId: string) => Promise<string>
}

// Cache em memória durante a navegação (module scope) — nunca polling
let cache: { groups: AdGroups; all: AdItem[] } | null = null

export function useActiveAds(): UseActiveAdsResult {
  const [status, setStatus] = useState<AdStatus>(cache ? 'success' : 'loading')
  const [data, setData] = useState<{ groups: AdGroups; all: AdItem[] } | null>(cache)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (cache) {
      setData(cache)
      setStatus('success')
      return
    }
    let cancelled = false
    setStatus('loading')
    fetch('/backend/v1/ads/serve')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return (await res.json()) as { sales?: AdItem[]; groups?: AdGroups }
      })
      .then((payload) => {
        if (cancelled) return
        const all: AdItem[] = Array.isArray(payload?.sales) ? payload.sales : []
        const groups: AdGroups =
          payload?.groups && typeof payload.groups === 'object'
            ? payload.groups
            : groupByMediaType(all)
        cache = { groups, all }
        setData(cache)
        setStatus('success')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const trackImpression = useCallback((saleId: string) => {
    if (!saleId) return
    // fire and forget, falha silenciosa
    fetch('/backend/v1/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId }),
      keepalive: true,
    }).catch(() => {})
  }, [])

  const trackClick = useCallback(async (saleId: string): Promise<string> => {
    if (!saleId) return ''
    try {
      const res = await fetch('/backend/v1/ads/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saleId }),
        keepalive: true,
      })
      if (!res.ok) return ''
      const data = (await res.json()) as { targetUrl?: string }
      return data?.targetUrl || ''
    } catch {
      return ''
    }
  }, [])

  const byGroup = useCallback(
    (mediaType: string): AdItem[] => {
      if (!data) return []
      const group = data.groups[mediaType]
      return Array.isArray(group) ? group : []
    },
    [data],
  )

  return {
    status,
    groups: data?.groups ?? {},
    all: data?.all ?? [],
    byGroup,
    trackImpression,
    trackClick,
  }
}

function groupByMediaType(all: AdItem[]): AdGroups {
  const groups: AdGroups = {}
  for (const item of all) {
    const key = item.mediaType || 'outro'
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }
  return groups
}
