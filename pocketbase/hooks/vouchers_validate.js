/**
 * vouchers_validate.js — POST /backend/v1/vouchers/validate
 *
 * Fecha o ciclo do voucher: valida o código informado e marca o voucher como
 * usado (used=true) de forma idempotente. Regras:
 *  - body: { code }
 *  - 200: voucher válido e marcado como usado agora (usedAt preenchido)
 *  - 200 com { alreadyUsed: true }: voucher já estava usado (idempotente)
 *  - 404: código inexistente; 400: código ausente — mensagens em PT-BR
 *
 * Regra da plataforma: toda a lógica fica INLINE no callback do routerAdd
 * (a VM pool do JSVM não enxerga helpers de nível superior).
 */
routerAdd('POST', '/backend/v1/vouchers/validate', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const rawCode = String(body.code || '')
      .trim()
      .toUpperCase()

    if (!rawCode) {
      return e.json(400, {
        success: false,
        error: 'Informe o código do voucher para validar.',
      })
    }

    let records
    try {
      records = $app.findRecordsByFilter('vouchers', 'code = {:code}', '-created', 1, 0, {
        code: rawCode,
      })
    } catch (findErr) {
      console.error('[vouchers/validate] erro ao buscar voucher:', findErr)
      return e.json(500, {
        success: false,
        error: 'Erro interno ao validar o voucher. Tente novamente.',
      })
    }

    if (!records || records.length === 0) {
      return e.json(404, {
        success: false,
        error: 'Voucher não encontrado. Verifique o código informado.',
      })
    }

    const voucher = records[0]
    const wasUsed = voucher.getBool('used')

    if (wasUsed) {
      // Idempotente: responder que já foi utilizado, sem alterar dados
      return e.json(200, {
        success: true,
        alreadyUsed: true,
        message: 'Este voucher já foi utilizado anteriormente.',
        voucher: {
          id: voucher.id,
          code: voucher.getString('code'),
          used: true,
          usedAt: voucher.getString('usedAt'),
        },
      })
    }

    // Marca como usado (idempotente em nível de dado: used só passa a true)
    voucher.set('used', true)
    try {
      voucher.set('usedAt', new Date().toISOString())
    } catch (usedAtErr) {
      // Campo usedAt pode não existir no schema — não bloqueia a validação
      console.warn('[vouchers/validate] usedAt indisponível:', usedAtErr)
    }

    try {
      $app.save(voucher)
    } catch (saveErr) {
      console.error('[vouchers/validate] erro ao salvar voucher:', saveErr)
      return e.json(500, {
        success: false,
        error: 'Erro interno ao registrar o uso do voucher. Tente novamente.',
      })
    }

    return e.json(200, {
      success: true,
      alreadyUsed: false,
      message: 'Voucher validado e marcado como utilizado com sucesso.',
      voucher: {
        id: voucher.id,
        code: voucher.getString('code'),
        used: true,
        usedAt: voucher.getString('usedAt'),
      },
    })
  } catch (outerErr) {
    console.error('[vouchers/validate] erro inesperado:', outerErr)
    return e.json(500, {
      success: false,
      error: 'Erro inesperado ao validar o voucher. Tente novamente.',
    })
  }
})
