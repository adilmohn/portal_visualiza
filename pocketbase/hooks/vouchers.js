// POST /backend/v1/vouchers/generate
// Receives listingId and promotionId
// Validates authenticated user is the owner of the listing or admin
// Generates unique alphanumeric code like VIAB-XXXXXX (6 alphanumeric chars)
// Stores in vouchers collection and returns voucher data

routerAdd(
  'POST',
  '/backend/v1/vouchers/generate',
  (e) => {
    try {
      const authRecord = e.auth || e.requestInfo().auth
      if (!authRecord) {
        return e.json(401, {
          message: 'Autenticação necessária para gerar vouchers.',
        })
      }

      const body = e.requestInfo().body || {}
      const listingId = (body.listingId || '').trim()
      const promotionId = (body.promotionId || '').trim()

      if (!listingId) {
        return e.json(400, {
          message: 'O campo listingId é obrigatório.',
        })
      }

      if (!promotionId) {
        return e.json(400, {
          message: 'O campo promotionId é obrigatório.',
        })
      }

      // 1. Verify listing exists
      let listing
      try {
        listing = $app.findRecordById('listings', listingId)
      } catch (_) {
        return e.json(404, {
          message: 'Anúncio não encontrado.',
        })
      }

      // 2. Validate ownership or admin
      const isOwner = listing.getString('userId') === authRecord.id
      const isAdmin = authRecord.getString('role') === 'admin'
      if (!isOwner && !isAdmin) {
        return e.json(403, {
          message: 'Você não tem permissão para gerar vouchers para este anúncio.',
        })
      }

      // 3. Verify promotion exists and belongs to listing
      let promotion
      try {
        promotion = $app.findRecordById('promotions', promotionId)
      } catch (_) {
        return e.json(404, {
          message: 'Promoção não encontrada.',
        })
      }

      if (promotion.getString('listingId') !== listing.id) {
        return e.json(400, {
          message: 'A promoção informada não pertence ao anúncio indicado.',
        })
      }

      // 4. Generate unique alphanumeric code like VIAB-XXXXXX inline
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let attempt = 0; attempt < 10; attempt++) {
        let rand = ''
        for (let i = 0; i < 6; i++) {
          const idx = Math.floor(Math.random() * chars.length)
          rand += chars.charAt(idx)
        }
        const candidate = 'VIAB-' + rand
        try {
          const existing = $app.findFirstRecordByData('vouchers', 'code', candidate)
          if (!existing) {
            code = candidate
            break
          }
        } catch (_) {
          code = candidate
          break
        }
      }

      if (!code) {
        code = 'VIAB-' + Date.now().toString(36).toUpperCase().slice(-6)
      }

      // 5. Save voucher in vouchers collection
      const vouchersCol = $app.findCollectionByNameOrId('vouchers')
      const voucher = new Record(vouchersCol)
      voucher.set('code', code)
      voucher.set('listingId', listing.id)
      voucher.set('promotionId', promotion.id)
      voucher.set('used', false)
      $app.save(voucher)

      return e.json(201, {
        success: true,
        id: voucher.id,
        code: voucher.getString('code'),
        listingId: voucher.getString('listingId'),
        promotionId: voucher.getString('promotionId'),
        used: voucher.getBool('used'),
        created: voucher.getString('created'),
      })
    } catch (err) {
      return e.json(500, {
        message: 'Falha ao gerar código de voucher.',
        error: err ? err.message : 'Erro interno do servidor',
      })
    }
  },
  $apis.requireAuth(),
)
