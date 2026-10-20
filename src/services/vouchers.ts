import pb from '@/lib/pocketbase/client'

export interface PromotionItem {
  id: string
  listingId: string
  title: string
  description: string
  active: boolean
  created: string
  updated: string
  expand?: {
    listingId?: {
      id: string
      name: string
      userId?: string
    }
  }
}

export interface VoucherItem {
  id: string
  code: string
  listingId: string
  promotionId: string
  used: boolean
  created: string
  updated?: string
  expand?: {
    promotionId?: {
      id: string
      title: string
      description: string
    }
  }
}

export interface GenerateVoucherParams {
  listingId: string
  promotionId: string
}

export interface GenerateVoucherResponse {
  success: boolean
  id: string
  code: string
  listingId: string
  promotionId: string
  used: boolean
  created: string
  message?: string
}

export interface CreatePromotionParams {
  listingId: string
  title: string
  description: string
  active?: boolean
}

/**
 * Fetches active promotions owned by the user (or all if admin)
 */
export async function getOwnerPromotions(
  userId?: string,
  isAdmin = false,
): Promise<PromotionItem[]> {
  try {
    let filter = 'active = true'
    if (userId && !isAdmin) {
      filter = `active = true && listingId.userId = '${userId}'`
    }

    const records = await pb.collection('promotions').getFullList({
      filter,
      sort: '-created',
      expand: 'listingId',
    })

    return records.map((r) => {
      const raw = r as unknown as {
        listingId?: string
        title?: string
        description?: string
        active?: boolean
      }
      return {
        id: r.id,
        listingId: raw.listingId || '',
        title: raw.title || '',
        description: raw.description || '',
        active: raw.active ?? true,
        created: r.created,
        updated: r.updated,
        expand: r.expand as PromotionItem['expand'],
      }
    })
  } catch (err) {
    console.error('Erro ao buscar promoções do proprietário:', err)
    return []
  }
}

/**
 * Creates a new promotion for a listing
 */
export async function createPromotion(params: CreatePromotionParams): Promise<PromotionItem> {
  const record = await pb.collection('promotions').create({
    listingId: params.listingId,
    title: params.title.trim(),
    description: params.description.trim(),
    active: params.active ?? true,
  })

  const rawCreated = record as unknown as {
    listingId?: string
    title?: string
    description?: string
    active?: boolean
  }
  return {
    id: record.id,
    listingId: rawCreated.listingId || '',
    title: rawCreated.title || '',
    description: rawCreated.description || '',
    active: rawCreated.active ?? true,
    created: record.created,
    updated: record.updated,
  }
}

/**
 * Generates a voucher code via POST /backend/v1/vouchers/generate
 */
export async function generateVoucher(
  params: GenerateVoucherParams,
): Promise<GenerateVoucherResponse> {
  return await pb.send<GenerateVoucherResponse>('/backend/v1/vouchers/generate', {
    method: 'POST',
    body: {
      listingId: params.listingId,
      promotionId: params.promotionId,
    },
  })
}

/**
 * Lists vouchers for a given listing or all user vouchers
 */
export async function getListingVouchers(listingId?: string): Promise<VoucherItem[]> {
  try {
    const filter = listingId ? `listingId = '${listingId}'` : ''
    const records = await pb.collection('vouchers').getFullList({
      filter: filter || undefined,
      sort: '-created',
      expand: 'promotionId',
    })

    return records.map((r) => {
      const raw = r as unknown as {
        code?: string
        listingId?: string
        promotionId?: string
        used?: boolean
      }
      return {
        id: r.id,
        code: raw.code || '',
        listingId: raw.listingId || '',
        promotionId: raw.promotionId || '',
        used: raw.used ?? false,
        created: r.created,
        updated: r.updated,
        expand: r.expand as VoucherItem['expand'],
      }
    })
  } catch (err) {
    console.error('Erro ao buscar vouchers:', err)
    return []
  }
}

/**
 * Fetches the active unused vouchers for a specific promotion (for visitor display)
 */
export async function getActiveVoucherForPromotion(
  promotionId: string,
): Promise<VoucherItem | null> {
  try {
    const records = await pb.collection('vouchers').getList(1, 1, {
      filter: `promotionId = '${promotionId}' && used = false`,
      sort: '-created',
    })

    if (records.items.length === 0) return null

    const r = records.items[0]
    const raw = r as unknown as {
      code?: string
      listingId?: string
      promotionId?: string
      used?: boolean
    }
    return {
      id: r.id,
      code: raw.code || '',
      listingId: raw.listingId || '',
      promotionId: raw.promotionId || '',
      used: raw.used ?? false,
      created: r.created,
      updated: r.updated,
    }
  } catch (_) {
    return null
  }
}

/**
 * Fetches active vouchers for a listing (for public detail page)
 */
export async function getListingActiveVouchers(
  listingId: string,
): Promise<Record<string, VoucherItem>> {
  try {
    const records = await pb.collection('vouchers').getFullList({
      filter: `listingId = '${listingId}' && used = false`,
      sort: '-created',
    })

    const map: Record<string, VoucherItem> = {}
    for (const r of records) {
      const raw = r as unknown as {
        code?: string
        listingId?: string
        promotionId?: string
        used?: boolean
      }
      const promoId = raw.promotionId || ''
      if (promoId && !map[promoId]) {
        map[promoId] = {
          id: r.id,
          code: raw.code || '',
          listingId: raw.listingId || '',
          promotionId: promoId,
          used: raw.used ?? false,
          created: r.created,
        }
      }
    }
    return map
  } catch (err) {
    console.error('Erro ao buscar vouchers da listing:', err)
    return {}
  }
}
