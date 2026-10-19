// BEFORE create hook on "reviews" collection
// Enforces one review per user per listing
// Enforces default status = "pendente" for non-superusers/regular creates
// Rejects duplicate submission with PT-BR error: "Você já avaliou este anúncio."

onRecordCreateRequest((e) => {
  // Superusers can bypass if necessary (or keep consistent)
  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next()
  }

  const authRecord = e.auth || (e.requestInfo && e.requestInfo().auth)
  const userId = authRecord ? authRecord.id : e.record.getString('userId')
  const listingId = e.record.getString('listingId')

  if (!userId) {
    throw new BadRequestError('Usuário não autenticado.')
  }

  if (!listingId) {
    throw new BadRequestError('O anúncio a ser avaliado é obrigatório.')
  }

  // Force userId to match the authenticated user
  e.record.set('userId', userId)

  // Enforce status starts as pendente
  e.record.set('status', 'pendente')

  // Validate stars
  const stars = e.record.getInt('stars')
  if (!stars || stars < 1 || stars > 5) {
    throw new BadRequestError('A quantidade de estrelas deve ser entre 1 e 5.')
  }

  // Check duplicate review: one review per user per listing
  try {
    const existing = $app.findFirstRecordByFilter(
      'reviews',
      'listingId = {:listingId} && userId = {:userId}',
      { listingId: listingId, userId: userId },
    )
    if (existing) {
      throw new BadRequestError('Você já avaliou este anúncio.')
    }
  } catch (err) {
    // If it's already BadRequestError, rethrow it
    if (err && err.name === 'BadRequestError') {
      throw err
    }
    // If findFirstRecordByFilter threw "no rows in result set", that means no duplicate exists -> proceed
  }

  e.next()
}, 'reviews')

// Administrative moderation endpoints for reviews (since updateRule is locked null)
// POST /backend/v1/admin/reviews/:id/approve
routerAdd(
  'POST',
  '/backend/v1/admin/reviews/{id}/approve',
  (e) => {
    try {
      const authRecord = e.auth || e.requestInfo().auth
      if (!authRecord || authRecord.getString('role') !== 'admin') {
        return e.json(403, { message: 'Acesso negado. Apenas administradores.' })
      }

      const reviewId = e.request.pathValue('id')
      if (!reviewId) {
        return e.json(400, { message: 'ID da avaliação é obrigatório.' })
      }

      let review
      try {
        review = $app.findRecordById('reviews', reviewId)
      } catch (_) {
        return e.json(404, { message: 'Avaliação não encontrada.' })
      }

      review.set('status', 'aprovado')
      $app.save(review)

      // Audit log
      try {
        const auditCol = $app.findCollectionByNameOrId('auditLog')
        const log = new Record(auditCol)
        log.set('adminId', authRecord.id)
        log.set('action', 'approve_review')
        log.set('targetId', reviewId)
        log.set('reason', 'Avaliação aprovada pelo moderador')
        $app.save(log)
      } catch (logErr) {
        console.warn('Falha ao registrar auditoria de aprovação de review:', logErr)
      }

      return e.json(200, {
        success: true,
        id: review.id,
        status: review.getString('status'),
      })
    } catch (err) {
      return e.json(500, {
        message: 'Erro interno ao aprovar avaliação.',
        error: err ? err.message : '',
      })
    }
  },
  $apis.requireAuth(),
)

// POST /backend/v1/admin/reviews/:id/reject
routerAdd(
  'POST',
  '/backend/v1/admin/reviews/{id}/reject',
  (e) => {
    try {
      const authRecord = e.auth || e.requestInfo().auth
      if (!authRecord || authRecord.getString('role') !== 'admin') {
        return e.json(403, { message: 'Acesso negado. Apenas administradores.' })
      }

      const reviewId = e.request.pathValue('id')
      if (!reviewId) {
        return e.json(400, { message: 'ID da avaliação é obrigatório.' })
      }

      let review
      try {
        review = $app.findRecordById('reviews', reviewId)
      } catch (_) {
        return e.json(404, { message: 'Avaliação não encontrada.' })
      }

      review.set('status', 'rejeitado')
      $app.save(review)

      // Audit log
      try {
        const auditCol = $app.findCollectionByNameOrId('auditLog')
        const log = new Record(auditCol)
        log.set('adminId', authRecord.id)
        log.set('action', 'reject_review')
        log.set('targetId', reviewId)
        log.set('reason', 'Avaliação rejeitada pelo moderador')
        $app.save(log)
      } catch (logErr) {
        console.warn('Falha ao registrar auditoria de rejeição de review:', logErr)
      }

      return e.json(200, {
        success: true,
        id: review.id,
        status: review.getString('status'),
      })
    } catch (err) {
      return e.json(500, {
        message: 'Erro interno ao rejeitar avaliação.',
        error: err ? err.message : '',
      })
    }
  },
  $apis.requireAuth(),
)

// GET /backend/v1/admin/reviews/pending
// Returns pending reviews with expanded user and listing information
routerAdd(
  'GET',
  '/backend/v1/admin/reviews/pending',
  (e) => {
    try {
      const authRecord = e.auth || e.requestInfo().auth
      if (!authRecord || authRecord.getString('role') !== 'admin') {
        return e.json(403, { message: 'Acesso negado. Apenas administradores.' })
      }

      const records = $app.findRecordsByFilter('reviews', 'status = "pendente"', '-created', 100, 0)

      const result = []
      for (let i = 0; i < records.length; i++) {
        const r = records[i]
        let userName = 'Usuário anônimo'
        let userEmail = ''
        try {
          const u = $app.findRecordById('users', r.getString('userId'))
          userName = u.getString('name') || u.getString('email') || 'Usuário'
          userEmail = u.getString('email') || ''
        } catch (_) {}

        let listingName = 'Anúncio'
        try {
          const l = $app.findRecordById('listings', r.getString('listingId'))
          listingName = l.getString('name') || 'Anúncio'
        } catch (_) {}

        result.push({
          id: r.id,
          listingId: r.getString('listingId'),
          listingName: listingName,
          userId: r.getString('userId'),
          userName: userName,
          userEmail: userEmail,
          stars: r.getInt('stars'),
          comment: r.getString('comment'),
          status: r.getString('status'),
          created: r.getString('created'),
          updated: r.getString('updated'),
        })
      }

      return e.json(200, {
        items: result,
        total: result.length,
      })
    } catch (err) {
      return e.json(500, {
        message: 'Erro ao buscar avaliações pendentes.',
        error: err ? err.message : '',
      })
    }
  },
  $apis.requireAuth(),
)
