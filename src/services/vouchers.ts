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

    return records.map((r) => ({
      id: r.id,
      listingId:
        r.getStringValue('listingId') || (r as unknown as { listingId?: string }).listingId || '',
      title: r.getStringValue('title') || (r as unknown as { title?: string }).title || '',
      description:
        r.getStringValue('description') ||
        (r as unknown as { description?: string }).description ||
        '',
      active: r.getBoolValue?.('active') ?? (r as unknown as { active?: boolean }).active ?? true,
      created: r.getStringValue('created') || r.created,
      updated: r.getStringValue('updated') || r.updated,
      expand: r.expand as PromotionItem['expand'],
    }))
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

  return {
    id: record.id,
    listingId:
      record.getStringValue('listingId') ||
      (record as unknown as { listingId?: string }).listingId ||
      '',
    title: record.getStringValue('title') || (record as unknown as { title?: string }).title || '',
    description:
      record.getStringValue('description') ||
      (record as unknown as { description?: string }).description ||
      '',
    active:
      record.getBoolValue?.('active') ?? (record as unknown as { active?: boolean }).active ?? true,
    created: record.getStringValue('created') || record.created,
    updated: record.getStringValue('updated') || record.updated,
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

    return records.map((r) => ({
      id: r.id,
      code: r.getStringValue('code') || (r as unknown as { code?: string }).code || '',
      listingId:
        r.getStringValue('listingId') || (r as unknown as { listingId?: string }).listingId || '',
      promotionId:
        r.getStringValue('promotionId') ||
        (r as unknown as { promotionId?: string }).promotionId ||
        '',
      used: r.getBoolValue?.('used') ?? (r as unknown as { used?: boolean }).used ?? false,
      created: r.getStringValue('created') || r.created,
      updated: r.getStringValue('updated') || r.updated,
      expand: r.expand as VoucherItem['expand'],
    }))
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
    return {
      id: r.id,
      code: r.getStringValue('code') || (r as unknown as { code?: string }).code || '',
      listingId:
        r.getStringValue('listingId') || (r as unknown as { listingId?: string }).listingId || '',
      promotionId:
        r.getStringValue('promotionId') ||
        (r as unknown as { promotionId?: string }).promotionId ||
        '',
      used: r.getBoolValue?.('used') ?? (r as unknown as { used?: boolean }).used ?? false,
      created: r.getStringValue('created') || r.created,
      updated: r.getStringValue('updated') || r.updated,
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
      const promoId =
        r.getStringValue('promotionId') ||
        (r as unknown as { promotionId?: string }).promotionId ||
        ''
      if (promoId && !map[promoId]) {
        map[promoId] = {
          id: r.id,
          code: r.getStringValue('code') || (r as unknown as { code?: string }).code || '',
          listingId:
            r.getStringValue('listingId') ||
            (r as unknown as { listingId?: string }).listingId ||
            '',
          promotionId: promoId,
          used: r.getBoolValue?.('used') ?? (r as unknown as { used?: boolean }).used ?? false,
          created: r.getStringValue('created') || r.created,
        }
      }
    }
    return map
  } catch (err) {
    console.error('Erro ao buscar vouchers da listing:', err)
    return {}
  }
}
