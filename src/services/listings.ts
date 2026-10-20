import pb from '@/lib/pocketbase/client'

export type ListingType = 'empresa' | 'negocio' | 'solucao' | 'produto' | 'servico'
export type ListingStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'inativo'
export type AiVerdict = 'aprovado' | 'duvidoso' | 'reprovado'

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
  aiVerdict?: AiVerdict
  aiReason?: string
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
              sort: '-isMain,created',
            })
            if (photoList.items.length > 0) {
              const photoRec = photoList.items[0]
              const filename = (photoRec as unknown as { url?: string }).url
              if (filename) {
                photoId = photoRec.id
                photoFilename = filename
                photoUrl = pb.files.getURL(photoRec, filename)
              }
            }
          } catch (_) {
            // best effort photo retrieval
          }

          const rawRec = rec as unknown as {
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
            aiVerdict?: AiVerdict
            rejectedReason?: string
            pinEnabled?: boolean
            pinLat?: number
            pinLng?: number
          }

          return {
            id: rec.id,
            name: rawRec.name || '',
            type: (rawRec.type || 'empresa') as ListingType,
            description: rawRec.description || '',
            email: rawRec.email || '',
            phone: rawRec.phone,
            whatsapp: rawRec.whatsapp,
            website: rawRec.website,
            cep: rawRec.cep || '',
            address: rawRec.address || '',
            city: rawRec.city || '',
            state: rawRec.state || '',
            country: rawRec.country || 'Brasil',
            zone: rawRec.zone,
            neighborhood: rawRec.neighborhood,
            status: (rawRec.status || 'aprovado') as ListingStatus,
            aiVerdict: rawRec.aiVerdict ?? undefined,
            rejectedReason: rawRec.rejectedReason || undefined,
            pinEnabled: rawRec.pinEnabled,
            pinLat: rawRec.pinLat,
            pinLng: rawRec.pinLng,
            created: rec.created,
            updated: rec.updated,
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
      .map((r) => {
        const raw = r as unknown as {
          state?: string
          city?: string
          neighborhood?: string
        }
        return {
          state: (raw.state || '').trim(),
          city: (raw.city || '').trim(),
          neighborhood: (raw.neighborhood || '').trim(),
        }
      })
      .filter((loc) => loc.state && loc.city)
  } catch (err) {
    console.error('Falha ao carregar opções de localização:', err)
    return []
  }
}
