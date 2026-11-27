import { useCallback, useEffect, useState } from 'react'

export type ValidationHealthStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseValidationHealthResult {
  status: ValidationHealthStatus
  configured: boolean | null
  /** true quando a chave de validação da IA está ausente */
  missing: boolean
  revalidate: () => void
}

// Cache em memória durante a visita (module scope) — nunca polling
let cachedConfigured: boolean | null = null

export function useValidationHealth(): UseValidationHealthResult {
  const [status, setStatus] = useState<ValidationHealthStatus>(
    cachedConfigured === null ? 'loading' : 'success',
  )
  const [configured, setConfigured] = useState<boolean | null>(cachedConfigured)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (cachedConfigured !== null) {
      setStatus('success')
      setConfigured(cachedConfigured)
      return
    }
    let cancelled = false
    setStatus('loading')
    fetch('/backend/v1/validation/health')
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as { configured?: boolean }
        return data
      })
      .then((data) => {
        if (cancelled) return
        cachedConfigured = data.configured === true
        setConfigured(cachedConfigured)
        setStatus('success')
      })
      .catch(() => {
        if (cancelled) return
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  const revalidate = useCallback(() => {
    cachedConfigured = null
    setAttempt((a) => a + 1)
  }, [])

  return { status, configured, missing: status === 'success' && configured === false, revalidate }
}
