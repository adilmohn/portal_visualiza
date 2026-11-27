import pb from '@/lib/pocketbase/client'

export interface AdminAuditEntry {
  id: string
  adminId: string
  action: string
  listingId: string
  manualReview?: boolean
  created: string
}

/**
 * Registra ação de auditoria no collection auditLog existente.
 * Helper de nível superior é seguro aqui (roda no browser, não no JSVM).
 */
export async function recordAuditEntry(params: {
  adminId: string
  action: string
  listingId: string
  manualReview?: boolean
}): Promise<void> {
  try {
    await pb.collection('auditLog').create({
      adminId: params.adminId,
      action: params.action,
      listingId: params.listingId,
      manualReview: params.manualReview ?? false,
    })
  } catch (err) {
    console.error('Erro ao registrar log de auditoria:', err)
  }
}

export async function listAuditEntries(): Promise<AdminAuditEntry[]> {
  try {
    const records = await pb.collection('auditLog').getFullList({
      sort: '-created',
    })
    return records.map((r) => {
      const raw = r as unknown as {
        adminId?: string
        action?: string
        listingId?: string
        manualReview?: boolean
      }
      return {
        id: r.id,
        adminId: raw.adminId || '',
        action: raw.action || '',
        listingId: raw.listingId || '',
        manualReview: raw.manualReview ?? false,
        created: r.created,
      }
    })
  } catch (err) {
    console.error('Erro ao listar logs de auditoria:', err)
    return []
  }
}
