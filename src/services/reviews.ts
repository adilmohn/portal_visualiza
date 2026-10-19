import pb from '@/lib/pocketbase/client'

export type ReviewStatus = 'pendente' | 'aprovado' | 'rejeitado'

export interface ReviewItem {
  id: string
  listingId: string
  userId: string
  userName?: string
  userAvatar?: string
  stars: number
  comment?: string
  status: ReviewStatus
  created: string
  updated: string
}

export interface ReviewListResponse {
  items: ReviewItem[]
  totalItems: number
  totalPages: number
  page: number
  perPage: number
  averageStars: number
}

export interface CreateReviewParams {
  listingId: string
  stars: number
  comment?: string
}

export interface AdminReviewItem extends ReviewItem {
  listingName?: string
  userEmail?: string
}

/**
 * Maps a PocketBase record to a typed ReviewItem.
 */
function mapRecordToReview(rec: Record<string, unknown>): ReviewItem {
  const getString = (key: string): string => {
    const val = rec[key]
    return typeof val === 'string' ? val : ''
  }

  const getNumber = (key: string): number => {
    const val = rec[key]
    return typeof val === 'number' ? val : 0
  }

  const expand = (rec.expand as Record<string, unknown>) || {}
  const userExpand = (expand.userId as Record<string, unknown>) || {}
  const userName = (userExpand.name as string) || (userExpand.email as string) || 'Usuário'

  const userAvatarFilename = (userExpand.avatar as string) || ''
  const userAvatar = userAvatarFilename
    ? pb.files.getURL(userExpand as Record<string, unknown>, userAvatarFilename)
    : undefined

  return {
    id: getString('id'),
    listingId: getString('listingId'),
    userId: getString('userId'),
    userName,
    userAvatar,
    stars: getNumber('stars'),
    comment: getString('comment') || undefined,
    status: (getString('status') || 'pendente') as ReviewStatus,
    created: getString('created'),
    updated: getString('updated'),
  }
}

/**
 * Fetches approved reviews for a given listing, paginated (10 per page),
 * plus calculates the overall average stars for all approved reviews.
 */
export async function getListingApprovedReviews(
  listingId: string,
  page = 1,
  perPage = 10,
): Promise<ReviewListResponse> {
  if (!listingId) {
    return {
      items: [],
      totalItems: 0,
      totalPages: 1,
      page: 1,
      perPage,
      averageStars: 0,
    }
  }

  const cleanId = listingId.replace(/'/g, "\\'")
  const filter = `listingId = '${cleanId}' && status = 'aprovado'`

  // 1. Fetch paginated list with expanded user info
  const listRes = await pb.collection('reviews').getList(page, perPage, {
    filter,
    sort: '-created',
    expand: 'userId',
  })

  const items = listRes.items.map((r) => mapRecordToReview(r as unknown as Record<string, unknown>))

  // 2. Fetch all approved stars to calculate accurate average
  let averageStars = 0
  try {
    const allApproved = await pb.collection('reviews').getFullList({
      filter,
      fields: 'stars',
    })

    if (allApproved.length > 0) {
      const sum = allApproved.reduce((acc, curr) => {
        const s = typeof curr.stars === 'number' ? curr.stars : Number(curr.stars) || 0
        return acc + s
      }, 0)
      averageStars = Number((sum / allApproved.length).toFixed(1))
    }
  } catch (err) {
    console.warn('Falha ao calcular média de estrelas:', err)
    if (items.length > 0) {
      const sum = items.reduce((acc, curr) => acc + curr.stars, 0)
      averageStars = Number((sum / items.length).toFixed(1))
    }
  }

  return {
    items,
    totalItems: listRes.totalItems,
    totalPages: listRes.totalPages || 1,
    page: listRes.page,
    perPage: listRes.perPage,
    averageStars,
  }
}

/**
 * Checks if current authenticated user has already reviewed the given listing.
 * (Returns true if any review exists, pending or approved).
 */
export async function hasUserReviewedListing(listingId: string, userId?: string): Promise<boolean> {
  const currentUserId = userId || pb.authStore.record?.id
  if (!currentUserId || !listingId) return false

  try {
    // Note: If user created a review, they might not be able to list it if rule is status='aprovado'
    // and status is 'pendente'. But if it's approved, this will return it.
    // If not approved, let's also query via try-catch or assume false until submit.
    const res = await pb.collection('reviews').getList(1, 1, {
      filter: `listingId = '${listingId.replace(/'/g, "\\'")}' && userId = '${currentUserId.replace(/'/g, "\\'")}'`,
    })
    return res.totalItems > 0
  } catch (_) {
    return false
  }
}

/**
 * Submits a new review.
 * Submits with stars and optional comment.
 * Hook enforces one review per user per listing and status = 'pendente'.
 */
export async function createReview(params: CreateReviewParams): Promise<ReviewItem> {
  const authId = pb.authStore.record?.id
  if (!authId) {
    throw new Error('Você precisa estar conectado para avaliar.')
  }

  const { listingId, stars, comment } = params
  if (!listingId) {
    throw new Error('ID do anúncio é obrigatório.')
  }
  if (!stars || stars < 1 || stars > 5) {
    throw new Error('A nota deve ser entre 1 e 5 estrelas.')
  }

  try {
    const record = await pb.collection('reviews').create({
      listingId,
      userId: authId,
      stars: Math.round(stars),
      comment: (comment || '').trim().slice(0, 500) || undefined,
      status: 'pendente',
    })

    return mapRecordToReview(record as unknown as Record<string, unknown>)
  } catch (err: unknown) {
    const errorObj = err as {
      message?: string
      response?: { message?: string; data?: Record<string, { message?: string }> }
    }
    const responseMsg = errorObj.response?.message || errorObj.message || ''

    if (
      responseMsg.includes('Você já avaliou') ||
      responseMsg.includes('duplicated') ||
      responseMsg.includes('duplicate')
    ) {
      throw new Error('Você já avaliou este anúncio.')
    }

    throw new Error(responseMsg || 'Não foi possível enviar sua avaliação. Tente novamente.')
  }
}

/**
 * Admin: fetches pending reviews awaiting moderation.
 * Uses custom endpoint /backend/v1/admin/reviews/pending with admin authentication.
 */
export async function getAdminPendingReviews(): Promise<AdminReviewItem[]> {
  const token = pb.authStore.token
  if (!token) {
    throw new Error('Administrador não autenticado.')
  }

  const res = await pb.send<{ items: AdminReviewItem[]; total: number }>(
    '/backend/v1/admin/reviews/pending',
    {
      method: 'GET',
      headers: {
        Authorization: token,
      },
    },
  )

  return res.items || []
}

/**
 * Admin: approves a pending review.
 */
export async function approveReview(reviewId: string): Promise<void> {
  const token = pb.authStore.token
  if (!token) {
    throw new Error('Administrador não autenticado.')
  }

  await pb.send(`/backend/v1/admin/reviews/${reviewId}/approve`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })
}

/**
 * Admin: rejects a review.
 */
export async function rejectReview(reviewId: string): Promise<void> {
  const token = pb.authStore.token
  if (!token) {
    throw new Error('Administrador não autenticado.')
  }

  await pb.send(`/backend/v1/admin/reviews/${reviewId}/reject`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })
}
