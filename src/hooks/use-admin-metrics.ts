import { useState, useEffect, useCallback } from 'react'
import {
  getAdminMetrics,
  getAuditTrail,
  type AdminMetrics,
  type AuditLogEntry,
} from '@/services/admin'
import { useRealtime } from '@/hooks/use-realtime'
import { toast } from 'sonner'

export interface UseAdminMetricsResult {
  metrics: AdminMetrics | null
  auditTrail: AuditLogEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useAdminMetrics(): UseAdminMetricsResult {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [auditTrail, setAuditTrail] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMetricsAndAudit = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [m, a] = await Promise.all([getAdminMetrics(), getAuditTrail(15)])
      setMetrics(m)
      setAuditTrail(a)
    } catch (err: unknown) {
      console.error('Erro ao carregar métricas administrativas:', err)
      const msg = 'Não foi possível carregar as métricas do painel.'
      setError(msg)
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetricsAndAudit()
  }, [fetchMetricsAndAudit])

  // Realtime updates: when listings change, refresh metrics
  useRealtime('listings', () => {
    fetchMetricsAndAudit()
  })

  // Realtime updates: when auditLog changes, refresh metrics & audit trail
  useRealtime('auditLog', () => {
    fetchMetricsAndAudit()
  })

  // Realtime updates: when contactEvents change, refresh metrics
  useRealtime('contactEvents', () => {
    fetchMetricsAndAudit()
  })

  return {
    metrics,
    auditTrail,
    isLoading,
    error,
    refetch: fetchMetricsAndAudit,
  }
}
