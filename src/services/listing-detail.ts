import pb from '@/lib/pocketbase/client'
import { ListingType, ListingStatus } from '@/services/listings'

export interface ListingPhoto {
  id: string
  filename: string
  url: string
  isMain?: boolean
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
      const rawListing = record as unknown as {
        name?: string
        type?: ListingType
        description?: string
        email?: string
        phone?: string
        whatsapp?: string
        website?: string
        cep?: string
        address?: string
        city?: string
        state?: string
        country?: string
        zone?: string
        neighborhood?: string
        status?: ListingStatus
        pinEnabled?: boolean
        pinLat?: number
        pinLng?: number
      }

      const listingStatus = (rawListing.status || 'pendente') as ListingStatus

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
          sort: '-isMain,created',
        })
        photos = photoList
          .map((p) => {
            const rawP = p as unknown as { url?: string; isMain?: boolean }
            const filename = rawP.url || ''
            return {
              id: p.id,
              filename,
              url: filename ? pb.files.getURL(p, filename) : '',
              isMain: Boolean(rawP.isMain),
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
            const rawV = v as unknown as { promotionId?: string; code?: string }
            const promoId = rawV.promotionId || ''
            const code = rawV.code || ''
            if (promoId && code && !vouchersMap[promoId]) {
              vouchersMap[promoId] = code
            }
          }
        } catch (_) {
          vouchersMap = {}
        }

        promotions = promoList.map((pr) => {
          const rawPr = pr as unknown as {
            title?: string
            description?: string
            active?: boolean
          }
          return {
            id: pr.id,
            title: rawPr.title || '',
            description: rawPr.description || '',
            active: rawPr.active ?? true,
            created: pr.created,
            voucherCode: vouchersMap[pr.id] || null,
          }
        })
      } catch (_) {
        promotions = []
      }

      return {
        id: record.id,
        name: rawListing.name || '',
        type: (rawListing.type || 'empresa') as ListingType,
        description: rawListing.description || '',
        email: rawListing.email || '',
        phone: rawListing.phone,
        whatsapp: rawListing.whatsapp,
        website: rawListing.website,
        cep: rawListing.cep || '',
        address: rawListing.address || '',
        city: rawListing.city || '',
        state: rawListing.state || '',
        country: rawListing.country || 'Brasil',
        zone: rawListing.zone,
        neighborhood: rawListing.neighborhood,
        status: listingStatus,
        pinEnabled: rawListing.pinEnabled,
        pinLat: rawListing.pinLat,
        pinLng: rawListing.pinLng,
        created: record.created,
        updated: record.updated,
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
