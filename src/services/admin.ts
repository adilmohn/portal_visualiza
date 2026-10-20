import pb from '@/lib/pocketbase/client'
import type { ListingItem, ListingType, ListingStatus, AiVerdict } from '@/services/listings'
import type { ListingPhoto } from '@/services/listing-detail'

export type AdminActionType = 'approve' | 'reject' | 'deactivate'

export interface AdminListingItem extends ListingItem {
  userId: string
  rejectedReason?: string
  aiVerdict?: AiVerdict
  aiReason?: string
  photos: ListingPhoto[]
}

export interface AdminMetrics {
  totalApproved: number
  totalPending: number
  contactEvents30d: {
    total: number
    byChannel: {
      whatsapp: number
      telefone: number
      email: number
      site: number
    }
  }
}

export interface AuditLogEntry {
  id: string
  adminId: string
  action: AdminActionType | string
  targetId: string
  reason?: string
  created: string
  updated: string
  adminEmail?: string
  adminName?: string
}

/**
 * Maps raw PocketBase record to typed AdminListingItem
 */
function mapRecordToAdminListing(
  rec: Record<string, unknown>,
  photos: ListingPhoto[] = [],
): AdminListingItem {
  const getString = (key: string): string => {
    const val = rec[key]
    return typeof val === 'string' ? val : ''
  }

  const getNumber = (key: string): number | undefined => {
    const val = rec[key]
    return typeof val === 'number' ? val : undefined
  }

  const getBool = (key: string): boolean | undefined => {
    const val = rec[key]
    return typeof val === 'boolean' ? val : undefined
  }

  const firstPhotoUrl = photos.length > 0 ? photos[0].url : null

  return {
    id: getString('id'),
    userId: getString('userId'),
    name: getString('name'),
    type: (getString('type') || 'empresa') as ListingType,
    description: getString('description'),
    email: getString('email'),
    phone: getString('phone') || undefined,
    whatsapp: getString('whatsapp') || undefined,
    website: getString('website') || undefined,
    cep: getString('cep'),
    address: getString('address'),
    city: getString('city'),
    state: getString('state'),
    country: getString('country') || 'Brasil',
    zone: getString('zone') || undefined,
    neighborhood: getString('neighborhood') || undefined,
    status: (getString('status') || 'pendente') as ListingStatus,
    rejectedReason: getString('rejectedReason') || undefined,
    aiVerdict: (getString('aiVerdict') as AiVerdict) || undefined,
    aiReason: getString('rejectedReason') || undefined,
    pinEnabled: getBool('pinEnabled'),
    pinLat: getNumber('pinLat'),
    pinLng: getNumber('pinLng'),
    created: getString('created'),
    updated: getString('updated'),
    photo: firstPhotoUrl,
    photos,
  }
}

/**
 * Loads photos for a given list of listing IDs in parallel
 */
async function loadPhotosForListings(listingIds: string[]): Promise<Map<string, ListingPhoto[]>> {
  const photoMap = new Map<string, ListingPhoto[]>()
  if (listingIds.length === 0) return photoMap

  try {
    // PocketBase filter with OR
    const filterParts = listingIds.map((id) => `listingId = '${id.replace(/'/g, "\\'")}'`)
    const filter = filterParts.join(' || ')

    const records = await pb.collection('photos').getFullList({
      filter,
      sort: 'created',
    })

    for (const p of records) {
      const rawP = p as unknown as { listingId?: string; url?: string }
      const listingId = rawP.listingId || ''
      const filename = rawP.url || ''
      if (listingId && filename) {
        const photoObj: ListingPhoto = {
          id: p.id,
          filename,
          url: pb.files.getURL(p, filename),
          created: p.created,
        }
        const existing = photoMap.get(listingId) || []
        existing.push(photoObj)
        photoMap.set(listingId, existing)
      }
    }
  } catch (err) {
    console.warn('Falha ao carregar fotos para anúncios administrativos:', err)
  }

  return photoMap
}

/**
 * Fetches all pending listings awaiting approval
 */
export async function getPendingListings(): Promise<AdminListingItem[]> {
  const records = await pb.collection('listings').getFullList({
    filter: 'status = "pendente"',
    sort: '-created',
  })

  const ids = records.map((r) => r.id)
  const photoMap = await loadPhotosForListings(ids)

  return records.map((r) =>
    mapRecordToAdminListing(r as unknown as Record<string, unknown>, photoMap.get(r.id) || []),
  )
}

/**
 * Triggers or requests AI validation for a listing via POST /backend/v1/validation
 */
export async function validateListingWithAi(listingId: string): Promise<{
  success: boolean
  listingId: string
  verdict: AiVerdict
  reason: string
}> {
  if (!listingId) throw new Error('ID do anúncio é obrigatório.')

  const res = await pb.send<{
    success: boolean
    listingId: string
    verdict: AiVerdict
    reason: string
  }>('/backend/v1/validation', {
    method: 'POST',
    body: { listingId },
  })

  return res
}

/**
 * Fetches all approved listings with pagination/filter
 */
export async function getApprovedListings(
  page = 1,
  perPage = 20,
  search?: string,
): Promise<{
  items: AdminListingItem[]
  total: number
  totalPages: number
  page: number
}> {
  const filters: string[] = ['status = "aprovado"']
  if (search && search.trim()) {
    const clean = search.trim().replace(/'/g, "\\'")
    filters.push(`(name ~ '${clean}' || city ~ '${clean}' || state ~ '${clean}')`)
  }

  const result = await pb.collection('listings').getList(page, perPage, {
    filter: filters.join(' && '),
    sort: '-created',
  })

  const ids = result.items.map((r) => r.id)
  const photoMap = await loadPhotosForListings(ids)

  const items = result.items.map((r) =>
    mapRecordToAdminListing(r as unknown as Record<string, unknown>, photoMap.get(r.id) || []),
  )

  return {
    items,
    total: result.totalItems,
    totalPages: result.totalPages,
    page: result.page,
  }
}

/**
 * Writes an entry to the auditLog collection
 */
export async function recordAuditAction(params: {
  action: AdminActionType | string
  targetId: string
  reason?: string
}): Promise<void> {
  const adminId = pb.authStore.record?.id
  if (!adminId) {
    throw new Error('Usuário administrador não autenticado.')
  }

  await pb.collection('auditLog').create({
    adminId,
    action: params.action,
    targetId: params.targetId,
    reason: params.reason || '',
  })
}

/**
 * Approves a listing: sets status to 'aprovado' and clears any prior rejection reason.
 * Logs the action to auditLog.
 */
export async function approveListing(listingId: string): Promise<void> {
  if (!listingId) throw new Error('ID do anúncio é obrigatório.')

  await pb.collection('listings').update(listingId, {
    status: 'aprovado',
    rejectedReason: '',
  })

  try {
    await recordAuditAction({
      action: 'approve',
      targetId: listingId,
    })
  } catch (auditErr) {
    console.error('Falha ao registrar auditoria de aprovação:', auditErr)
  }
}

/**
 * Rejects a listing: sets status to 'rejeitado' and records rejectedReason.
 * Logs the action to auditLog with the reason.
 */
export async function rejectListing(listingId: string, reason: string): Promise<void> {
  if (!listingId) throw new Error('ID do anúncio é obrigatório.')
  const cleanReason = (reason || '').trim()
  if (!cleanReason) {
    throw new Error('O motivo da rejeição é obrigatório.')
  }

  await pb.collection('listings').update(listingId, {
    status: 'rejeitado',
    rejectedReason: cleanReason,
  })

  try {
    await recordAuditAction({
      action: 'reject',
      targetId: listingId,
      reason: cleanReason,
    })
  } catch (auditErr) {
    console.error('Falha ao registrar auditoria de rejeição:', auditErr)
  }
}

/**
 * Deactivates an approved listing: sets status to 'inativo'.
 * Logs the action to auditLog.
 */
export async function deactivateListing(listingId: string, reason?: string): Promise<void> {
  if (!listingId) throw new Error('ID do anúncio é obrigatório.')

  await pb.collection('listings').update(listingId, {
    status: 'inativo',
  })

  try {
    await recordAuditAction({
      action: 'deactivate',
      targetId: listingId,
      reason: reason || undefined,
    })
  } catch (auditErr) {
    console.error('Falha ao registrar auditoria de desativação:', auditErr)
  }
}

/**
 * Fetches metrics for the admin dashboard:
 * - total approved listings
 * - pending count
 * - contact events in the last 30 days grouped by channel
 */
export async function getAdminMetrics(): Promise<AdminMetrics> {
  // 1. Total approved count
  const approvedRes = await pb.collection('listings').getList(1, 1, {
    filter: 'status = "aprovado"',
  })
  const totalApproved = approvedRes.totalItems

  // 2. Pending count
  const pendingRes = await pb.collection('listings').getList(1, 1, {
    filter: 'status = "pendente"',
  })
  const totalPending = pendingRes.totalItems

  // 3. Contact events last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const isoDate = thirtyDaysAgo.toISOString().replace('T', ' ').substring(0, 19)

  let events: Array<{ channel?: string }> = []
  try {
    events = await pb.collection('contactEvents').getFullList({
      filter: `created >= '${isoDate}'`,
      fields: 'channel,created',
    })
  } catch (err) {
    console.warn('Falha ao buscar eventos de contato para métricas:', err)
  }

  const byChannel = {
    whatsapp: 0,
    telefone: 0,
    email: 0,
    site: 0,
  }

  for (const ev of events) {
    const ch = ev.channel as keyof typeof byChannel
    if (ch && typeof byChannel[ch] === 'number') {
      byChannel[ch] += 1
    }
  }

  const totalEvents = events.length

  return {
    totalApproved,
    totalPending,
    contactEvents30d: {
      total: totalEvents,
      byChannel,
    },
  }
}

/**
 * Fetches the recent audit log trail
 */
export async function getAuditTrail(limit = 20): Promise<AuditLogEntry[]> {
  try {
    const res = await pb.collection('auditLog').getList(1, limit, {
      sort: '-created',
      expand: 'adminId',
    })

    return res.items.map((item) => {
      const rawItem = item as unknown as {
        adminId?: string
        action?: string
        targetId?: string
        reason?: string
        expand?: { adminId?: { email?: string; name?: string } }
      }
      const expandAdmin = rawItem.expand?.adminId
      return {
        id: item.id,
        adminId: rawItem.adminId || '',
        action: rawItem.action || '',
        targetId: rawItem.targetId || '',
        reason: rawItem.reason || undefined,
        created: item.created,
        updated: item.updated,
        adminEmail: expandAdmin?.email,
        adminName: expandAdmin?.name,
      }
    })
  } catch (err) {
    console.warn('Falha ao buscar trilha de auditoria:', err)
    return []
  }
}
