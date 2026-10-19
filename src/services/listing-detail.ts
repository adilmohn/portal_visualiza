import pb from '@/lib/pocketbase/client'
import { ListingType, ListingStatus } from '@/services/listings'

export interface ListingPhoto {
  id: string
  filename: string
  url: string
  created?: string
}

export interface ListingPromotion {
  id: string
  title: string
  description: string
  active: boolean
  created: string
  voucherCode?: string | null
}

export interface ListingDetail {
  id: string
  name: string
  type: ListingType
  description: string
  email: string
  phone?: string
  whatsapp?: string
  website?: string
  cep: string
  address: string
  city: string
  state: string
  country: string
  zone?: string
  neighborhood?: string
  status: ListingStatus
  pinEnabled?: boolean
  pinLat?: number
  pinLng?: number
  created: string
  updated: string
  userId?: string
  rejectedReason?: string
  photos: ListingPhoto[]
  promotions: ListingPromotion[]
}

export type ContactChannel = 'whatsapp' | 'telefone' | 'email' | 'site'

export interface RecordContactEventParams {
  listingId: string
  channel: ContactChannel
}

export interface RecordContactEventResponse {
  success: boolean
  id?: string
  channel: ContactChannel
  listingId: string
  created?: string
}

export class ListingNotFoundError extends Error {
  constructor(message = 'Perfil não encontrado') {
    super(message)
    this.name = 'ListingNotFoundError'
  }
}

/**
 * Fetches a single approved listing by its unique id from Skip Cloud.
 * Uses the custom endpoint GET /backend/v1/listings/detail?id=<id>
 * with a fallback to direct PocketBase SDK query if needed.
 */
export async function getListingDetail(id: string): Promise<ListingDetail> {
  if (!id || !id.trim()) {
    throw new ListingNotFoundError('Identificador do anúncio não fornecido.')
  }

  const cleanId = id.trim()

  try {
    const res = await pb.send<ListingDetail>('/backend/v1/listings/detail', {
      method: 'GET',
      query: { id: cleanId },
    })
    return res
  } catch (err: unknown) {
    // Check if error status is 404
    const status = (err as { status?: number })?.status
    if (status === 404) {
      throw new ListingNotFoundError('Perfil não encontrado')
    }

    // Direct SDK fallback
    try {
      const record = await pb.collection('listings').getOne(cleanId)

      const listingStatus = (record.getStringValue('status') ||
        (record as unknown as { status?: ListingStatus }).status ||
        'pendente') as ListingStatus

      if (listingStatus !== 'aprovado') {
        throw new ListingNotFoundError(
          'Perfil não encontrado ou não está disponível para visualização pública.',
        )
      }

      // Fetch photos
      let photos: ListingPhoto[] = []
      try {
        const photoList = await pb.collection('photos').getFullList({
          filter: `listingId = '${cleanId}'`,
          sort: 'created',
        })
        photos = photoList
          .map((p) => {
            const filename = p.getStringValue('url') || (p as unknown as { url?: string }).url || ''
            return {
              id: p.id,
              filename,
              url: filename ? pb.files.getURL(p, filename) : '',
              created: p.created,
            }
          })
          .filter((p) => Boolean(p.url))
      } catch (_) {
        photos = []
      }

      // Fetch active promotions and vouchers
      let promotions: ListingPromotion[] = []
      try {
        const promoList = await pb.collection('promotions').getFullList({
          filter: `listingId = '${cleanId}' && active = true`,
          sort: '-created',
        })

        // Fetch active vouchers for this listing
        let vouchersMap: Record<string, string> = {}
        try {
          const voucherList = await pb.collection('vouchers').getFullList({
            filter: `listingId = '${cleanId}' && used = false`,
            sort: '-created',
          })
          for (const v of voucherList) {
            const promoId =
              v.getStringValue('promotionId') ||
              (v as unknown as { promotionId?: string }).promotionId ||
              ''
            const code = v.getStringValue('code') || (v as unknown as { code?: string }).code || ''
            if (promoId && code && !vouchersMap[promoId]) {
              vouchersMap[promoId] = code
            }
          }
        } catch (_) {
          vouchersMap = {}
        }

        promotions = promoList.map((pr) => ({
          id: pr.id,
          title: pr.getStringValue('title') || (pr as unknown as { title?: string }).title || '',
          description:
            pr.getStringValue('description') ||
            (pr as unknown as { description?: string }).description ||
            '',
          active:
            pr.getBoolValue?.('active') ?? (pr as unknown as { active?: boolean }).active ?? true,
          created: pr.created,
          voucherCode: vouchersMap[pr.id] || null,
        }))
      } catch (_) {
        promotions = []
      }

      return {
        id: record.id,
        name: record.getStringValue('name') || (record as unknown as { name?: string }).name || '',
        type: (record.getStringValue('type') ||
          (record as unknown as { type?: ListingType }).type ||
          'empresa') as ListingType,
        description:
          record.getStringValue('description') ||
          (record as unknown as { description?: string }).description ||
          '',
        email:
          record.getStringValue('email') || (record as unknown as { email?: string }).email || '',
        phone: record.getStringValue('phone') || (record as unknown as { phone?: string }).phone,
        whatsapp:
          record.getStringValue('whatsapp') ||
          (record as unknown as { whatsapp?: string }).whatsapp,
        website:
          record.getStringValue('website') || (record as unknown as { website?: string }).website,
        cep: record.getStringValue('cep') || (record as unknown as { cep?: string }).cep || '',
        address:
          record.getStringValue('address') ||
          (record as unknown as { address?: string }).address ||
          '',
        city: record.getStringValue('city') || (record as unknown as { city?: string }).city || '',
        state:
          record.getStringValue('state') || (record as unknown as { state?: string }).state || '',
        country:
          record.getStringValue('country') ||
          (record as unknown as { country?: string }).country ||
          'Brasil',
        zone: record.getStringValue('zone') || (record as unknown as { zone?: string }).zone,
        neighborhood:
          record.getStringValue('neighborhood') ||
          (record as unknown as { neighborhood?: string }).neighborhood,
        status: listingStatus,
        pinEnabled:
          record.getBoolValue?.('pinEnabled') ??
          (record as unknown as { pinEnabled?: boolean }).pinEnabled,
        pinLat:
          record.getFloatValue?.('pinLat') ?? (record as unknown as { pinLat?: number }).pinLat,
        pinLng:
          record.getFloatValue?.('pinLng') ?? (record as unknown as { pinLng?: number }).pinLng,
        created: record.getStringValue('created') || record.created,
        updated: record.getStringValue('updated') || record.updated,
        photos,
        promotions,
      }
    } catch (fallbackErr: unknown) {
      const fbStatus = (fallbackErr as { status?: number })?.status
      if (fbStatus === 404 || fallbackErr instanceof ListingNotFoundError) {
        throw new ListingNotFoundError('Perfil não encontrado')
      }
      throw new Error('Não foi possível carregar o anúncio. Tente novamente mais tarde.')
    }
  }
}

/**
 * Records a contact click event (fire-and-forget).
 * Attempts custom endpoint POST /backend/v1/events/contact,
 * then falls back to direct PocketBase collection create if necessary.
 * Never throws outside to ensure user action is never blocked.
 */
export async function recordContactEvent(params: RecordContactEventParams): Promise<void> {
  try {
    await pb.send<RecordContactEventResponse>('/backend/v1/events/contact', {
      method: 'POST',
      body: params,
    })
  } catch (_) {
    try {
      // Fallback: direct create in contactEvents collection
      await pb.collection('contactEvents').create({
        listingId: params.listingId,
        channel: params.channel,
      })
    } catch (innerErr) {
      // Silent failure: contact event tracking should never block navigation or disrupt UX
      console.warn('Falha silenciosa no registro de evento de contato:', innerErr)
    }
  }
}
