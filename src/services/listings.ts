import pb from '@/lib/pocketbase/client'

export type ListingType = 'empresa' | 'negocio' | 'solucao' | 'produto'
export type ListingStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'inativo'

export interface ListingItem {
  id: string
  userId?: string
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
  rejectedReason?: string
  pinEnabled?: boolean
  pinLat?: number
  pinLng?: number
  created: string
  updated: string
  photo?: string | null
  photoId?: string | null
  photoFilename?: string | null
}

export interface SearchListingsParams {
  state?: string
  city?: string
  neighborhood?: string
  type?: ListingType | ''
  keyword?: string
  page?: number
}

export interface SearchListingsResponse {
  items: ListingItem[]
  page: number
  perPage: number
  total: number
  totalPages: number
}

export interface GeoLocationOption {
  state: string
  city: string
  neighborhood: string
}

/**
 * Searches approved listings using the server-side Skip Cloud endpoint.
 * Fallback to PocketBase SDK client-side filter if the custom hook route is temporarily unavailable.
 */
export async function searchListings(
  params: SearchListingsParams = {},
): Promise<SearchListingsResponse> {
  const query: Record<string, string | number> = {}

  if (params.state) query.state = params.state
  if (params.city) query.city = params.city
  if (params.neighborhood) query.neighborhood = params.neighborhood
  if (params.type) query.type = params.type
  if (params.keyword) query.keyword = params.keyword
  if (params.page && params.page > 0) query.page = params.page

  try {
    const res = await pb.send<SearchListingsResponse>('/backend/v1/listings/search', {
      method: 'GET',
      query,
    })
    return res
  } catch (error) {
    // If custom route fails (e.g. 404 or network error), fallback to direct collection query
    const perPage = 20
    const page = params.page && params.page > 0 ? params.page : 1
    const filters: string[] = ['status = "aprovado"']

    if (params.state) {
      const safeState = params.state.replace(/'/g, "\\'")
      filters.push(`state = '${safeState}'`)
    }
    if (params.city) {
      const safeCity = params.city.replace(/'/g, "\\'")
      filters.push(`city = '${safeCity}'`)
    }
    if (params.neighborhood) {
      const safeNeighborhood = params.neighborhood.replace(/'/g, "\\'")
      filters.push(`neighborhood = '${safeNeighborhood}'`)
    }
    if (params.type) {
      const safeType = params.type.replace(/'/g, "\\'")
      filters.push(`type = '${safeType}'`)
    }
    if (params.keyword) {
      const safeKeyword = params.keyword.replace(/'/g, "\\'")
      filters.push(`(name ~ '${safeKeyword}' || description ~ '${safeKeyword}')`)
    }

    try {
      const resultList = await pb.collection('listings').getList(page, perPage, {
        filter: filters.join(' && '),
        sort: '-created',
      })

      // Try to fetch first photo for each listing in parallel
      const items: ListingItem[] = await Promise.all(
        resultList.items.map(async (rec) => {
          let photoUrl: string | null = null
          let photoId: string | null = null
          let photoFilename: string | null = null

          try {
            const photoList = await pb.collection('photos').getList(1, 1, {
              filter: `listingId = '${rec.id}'`,
              sort: 'created',
            })
            if (photoList.items.length > 0) {
              const photoRec = photoList.items[0]
              const filename =
                photoRec.getStringValue('url') || (photoRec as unknown as { url?: string }).url
              if (filename) {
                photoId = photoRec.id
                photoFilename = filename
                photoUrl = pb.files.getURL(photoRec, filename)
              }
            }
          } catch (_) {
            // best effort photo retrieval
          }

          return {
            id: rec.id,
            name: rec.getStringValue('name') || (rec as unknown as { name?: string }).name || '',
            type: (rec.getStringValue('type') ||
              (rec as unknown as { type?: ListingType }).type ||
              'empresa') as ListingType,
            description:
              rec.getStringValue('description') ||
              (rec as unknown as { description?: string }).description ||
              '',
            email:
              rec.getStringValue('email') || (rec as unknown as { email?: string }).email || '',
            phone: rec.getStringValue('phone') || (rec as unknown as { phone?: string }).phone,
            whatsapp:
              rec.getStringValue('whatsapp') || (rec as unknown as { whatsapp?: string }).whatsapp,
            website:
              rec.getStringValue('website') || (rec as unknown as { website?: string }).website,
            cep: rec.getStringValue('cep') || (rec as unknown as { cep?: string }).cep || '',
            address:
              rec.getStringValue('address') ||
              (rec as unknown as { address?: string }).address ||
              '',
            city: rec.getStringValue('city') || (rec as unknown as { city?: string }).city || '',
            state:
              rec.getStringValue('state') || (rec as unknown as { state?: string }).state || '',
            country:
              rec.getStringValue('country') ||
              (rec as unknown as { country?: string }).country ||
              'Brasil',
            zone: rec.getStringValue('zone') || (rec as unknown as { zone?: string }).zone,
            neighborhood:
              rec.getStringValue('neighborhood') ||
              (rec as unknown as { neighborhood?: string }).neighborhood,
            status: (rec.getStringValue('status') ||
              (rec as unknown as { status?: ListingStatus }).status ||
              'aprovado') as ListingStatus,
            pinEnabled:
              rec.getBoolValue?.('pinEnabled') ??
              (rec as unknown as { pinEnabled?: boolean }).pinEnabled,
            pinLat: rec.getFloatValue?.('pinLat') ?? (rec as unknown as { pinLat?: number }).pinLat,
            pinLng: rec.getFloatValue?.('pinLng') ?? (rec as unknown as { pinLng?: number }).pinLng,
            created: rec.getStringValue('created') || rec.created,
            updated: rec.getStringValue('updated') || rec.updated,
            photo: photoUrl,
            photoId,
            photoFilename,
          }
        }),
      )

      return {
        items,
        page: resultList.page,
        perPage: resultList.perPage,
        total: resultList.totalItems,
        totalPages: resultList.totalPages,
      }
    } catch (_) {
      throw error
    }
  }
}

/**
 * Loads distinct approved geographic locations (states, cities, neighborhoods)
 * for populating cascading filter dropdowns without loading all listings details.
 */
export async function getDirectoryLocations(): Promise<GeoLocationOption[]> {
  try {
    const records = await pb.collection('listings').getFullList({
      filter: 'status = "aprovado"',
      fields: 'state,city,neighborhood',
    })
    return records
      .map((r) => ({
        state: (
          r.getStringValue('state') ||
          (r as unknown as { state?: string }).state ||
          ''
        ).trim(),
        city: (r.getStringValue('city') || (r as unknown as { city?: string }).city || '').trim(),
        neighborhood: (
          r.getStringValue('neighborhood') ||
          (r as unknown as { neighborhood?: string }).neighborhood ||
          ''
        ).trim(),
      }))
      .filter((loc) => loc.state && loc.city)
  } catch (err) {
    console.error('Falha ao carregar opções de localização:', err)
    return []
  }
}
