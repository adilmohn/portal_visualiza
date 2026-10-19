// pocketbase/hooks/listing_validation.js
// POST /backend/v1/validation
// Hooks:
// - onRecordAfterCreateSuccess on "listings"
// - onRecordAfterUpdateSuccess on "listings"
// - onRecordAfterCreateSuccess on "photos"

routerAdd('POST', '/backend/v1/validation', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const listingId = (body.listingId || '').trim()

    if (!listingId) {
      return e.json(400, {
        message: 'O campo listingId é obrigatório.',
      })
    }

    // 1. Fetch listing
    let listing
    try {
      listing = $app.findRecordById('listings', listingId)
    } catch (_) {
      return e.json(404, {
        message: 'Anúncio não encontrado.',
      })
    }

    // 2. Check AI_VALIDATION_KEY secret existence
    // Reads AI_VALIDATION_KEY from Skip Cloud Secrets (check with list_secrets whether it exists; if not, the endpoint must still work and return the "duvidoso" fallback path — do not crash).
    let hasValidationKey = false
    try {
      if (typeof $secrets !== 'undefined' && typeof $secrets.has === 'function') {
        hasValidationKey = $secrets.has('AI_VALIDATION_KEY')
      }
      if (!hasValidationKey && typeof $os !== 'undefined' && typeof $os.getenv === 'function') {
        hasValidationKey = !!$os.getenv('AI_VALIDATION_KEY')
      }
    } catch (_) {}

    if (!hasValidationKey) {
      console.log(
        '[AI Validation] AI_VALIDATION_KEY ausente nos segredos. Retornando fallback duvidoso.',
      )
      try {
        listing.set('aiVerdict', 'duvidoso')
        $app.save(listing)
      } catch (saveErr) {
        console.log('[AI Validation] Erro ao salvar fallback:', saveErr.message)
      }

      return e.json(200, {
        success: true,
        listingId: listing.id,
        verdict: 'duvidoso',
        reason: 'Chave de validação não configurada, revisão humana necessária',
      })
    }

    // 3. Fetch photos related to listing
    let photoUrls = []
    try {
      const photos = $app.findRecordsByFilter('photos', 'listingId = {:id}', 'created', 20, 0, {
        id: listing.id,
      })
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i]
        const filename = p.getString('url')
        if (filename) {
          photoUrls.push('/api/files/photos/' + p.id + '/' + filename)
        }
      }
    } catch (photoErr) {
      console.log('[AI Validation] Aviso ao listar fotos:', photoErr.message)
    }

    // Construct prompt payload
    const promptData = {
      nome: listing.getString('name'),
      tipo: listing.getString('type'),
      descricao: listing.getString('description'),
      email: listing.getString('email'),
      telefone: listing.getString('phone'),
      whatsapp: listing.getString('whatsapp'),
      site: listing.getString('website'),
      endereco: listing.getString('address'),
      cidade: listing.getString('city'),
      estado: listing.getString('state'),
      bairro: listing.getString('neighborhood'),
      fotos: photoUrls,
    }

    const userPrompt =
      'Analise os dados deste anúncio do Portal Viabilize:\n' +
      JSON.stringify(promptData, null, 2) +
      '\n\nClassifique em "aprovado", "duvidoso" ou "reprovado" com o respectivo motivo em PT-BR.'

    let verdict = 'duvidoso'
    let reason = 'Serviço de IA indisponível, revisão humana necessária'

    // AI Call with timeout handling, retry once on 503 after 2s, NO retry on 400 or 401
    const runAi = () => {
      // Native agent first
      try {
        if (typeof $ai !== 'undefined' && typeof $ai.agent === 'function') {
          const agentRes = $ai.agent('listing-validator').chat({
            message: userPrompt,
          })
          if (agentRes && agentRes.content) {
            return agentRes.content
          }
        }
      } catch (agentErr) {
        const errStatus = agentErr.status || 0
        if (errStatus === 503 || errStatus === 400 || errStatus === 401) {
          throw agentErr
        }
        console.log('[AI Validation] Agente nativo falhou:', agentErr.message)
      }

      // Fallback: $ai.chat
      if (typeof $ai !== 'undefined' && typeof $ai.chat === 'function') {
        const chatRes = $ai.chat({
          model: 'fast',
          messages: [
            {
              role: 'system',
              content:
                'Você é um auditor rigoroso de anúncios comerciais do Portal Viabilize.\n' +
                'Sua missão é analisar os dados de um anúncio (nome, tipo, descrição, contatos e fotos) e classificá-lo em uma das três categorias:\n' +
                '- aprovado: anúncio legítimo, profissional, com descrição coerente e contatos válidos.\n' +
                '- duvidoso: dados incompletos, suspeita de spam, texto vago, contatos inconsistentes ou que necessitam de conferência manual de moderador humano.\n' +
                '- reprovado: conteúdo ilícito, ofensivo, proibido, discriminatório, fraude evidente, pirâmide financeira, armas, drogas ou violação direta dos termos.\n\n' +
                'Responda ESTRITAMENTE em formato JSON com as seguintes chaves:\n' +
                '{\n' +
                '  "verdict": "aprovado" | "duvidoso" | "reprovado",\n' +
                '  "reason": "Explicação concisa e clara em português do Brasil (PT-BR) sobre a decisão."\n' +
                '}\n' +
                'Nunca inclua texto fora do bloco JSON.',
            },
            {
              role: 'user',
              content: userPrompt,
            },
          ],
        })
        if (chatRes && chatRes.choices && chatRes.choices[0] && chatRes.choices[0].message) {
          return chatRes.choices[0].message.content
        }
      }

      throw new Error('Serviço de IA não disponível.')
    }

    let rawOutput = null
    try {
      try {
        rawOutput = runAi()
      } catch (firstErr) {
        const st = firstErr.status || 0
        if (st === 400 || st === 401) {
          console.log('[AI Validation] Erro 400/401: sem retentativa:', firstErr.message)
        } else if (st === 503) {
          console.log('[AI Validation] 503 recebido: retentando em 2s...')
          if (typeof sleep === 'function') {
            sleep(2000)
          }
          try {
            rawOutput = runAi()
          } catch (retryErr) {
            console.log('[AI Validation] Retentativa 503 falhou:', retryErr.message)
          }
        } else {
          console.log('[AI Validation] Erro primeira chamada:', firstErr.message)
        }
      }

      if (rawOutput) {
        try {
          let cleanStr = rawOutput.trim()
          const jsonMatch = cleanStr.match(/\{[\s\S]*\}/)
          if (jsonMatch) cleanStr = jsonMatch[0]
          const parsed = JSON.parse(cleanStr)
          if (
            parsed.verdict === 'aprovado' ||
            parsed.verdict === 'duvidoso' ||
            parsed.verdict === 'reprovado'
          ) {
            verdict = parsed.verdict
            reason = parsed.reason || ''
          } else {
            const lower = rawOutput.toLowerCase()
            if (lower.includes('reprovado')) verdict = 'reprovado'
            else if (lower.includes('aprovado')) verdict = 'aprovado'
            else verdict = 'duvidoso'
            reason = parsed.reason || 'Classificação realizada pelo modelo.'
          }
        } catch (_) {
          const lower = rawOutput.toLowerCase()
          if (lower.includes('reprovado')) verdict = 'reprovado'
          else if (lower.includes('aprovado')) verdict = 'aprovado'
          else verdict = 'duvidoso'
          reason = 'Classificação automática realizada pela IA.'
        }
      }
    } catch (aiExc) {
      console.log('[AI Validation] Exceção geral:', aiExc.message)
      verdict = 'duvidoso'
      reason = 'Serviço de IA indisponível, revisão humana necessária'
    }

    // Apply effects:
    // - aprovado: set listing status to pendente with aiVerdict = aprovado
    // - duvidoso: set aiVerdict = duvidoso
    // - reprovado: set listing status to rejeitado and save reason in rejectedReason
    try {
      const freshListing = $app.findRecordById('listings', listing.id)
      freshListing.set('aiVerdict', verdict)

      if (verdict === 'aprovado') {
        freshListing.set('status', 'pendente')
      } else if (verdict === 'duvidoso') {
        if (!freshListing.getString('status')) {
          freshListing.set('status', 'pendente')
        }
      } else if (verdict === 'reprovado') {
        freshListing.set('status', 'rejeitado')
        freshListing.set('rejectedReason', reason)
      }

      $app.save(freshListing)
    } catch (saveErr) {
      console.log('[AI Validation] Erro ao gravar veredito:', saveErr.message)
    }

    return e.json(200, {
      success: true,
      listingId: listing.id,
      verdict: verdict,
      reason: reason,
    })
  } catch (err) {
    // Never expose stack traces (generic PT-BR error message only)
    console.log('[POST /backend/v1/validation] Erro inesperado:', err ? err.message : '')
    return e.json(500, {
      message: 'Ocorreu um erro ao processar a validação do anúncio. Tente novamente mais tarde.',
    })
  }
})

// AFTER-CREATE hook on collection listings: calls validation asynchronously
// without blocking the create (fire-and-forget / async).
onRecordAfterCreateSuccess((e) => {
  const listingId = e.record.id
  try {
    let baseUrl = $os.getenv('PB_INSTANCE_URL') || ''
    if (!baseUrl) {
      baseUrl = 'http://127.0.0.1:8090'
    }
    // Make asynchronous or fire-and-forget HTTP request
    if (typeof $http !== 'undefined' && typeof $http.send === 'function') {
      try {
        $http.send({
          url: baseUrl + '/backend/v1/validation',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listingId: listingId }),
          timeout: 28,
        })
      } catch (httpErr) {
        console.log('[onRecordAfterCreateSuccess] Erro ao chamar validação:', httpErr.message)
      }
    }
  } catch (err) {
    console.log('[onRecordAfterCreateSuccess] Falha no disparo assíncrono:', err.message)
  }
  return e.next()
}, 'listings')

// AFTER-UPDATE hook that re-triggers validation ONLY when sensitive fields change:
// name, type, address, contacts (email, phone, whatsapp, website), description.
onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const orig = rec.original()

    const nameChanged = rec.getString('name') !== orig.getString('name')
    const typeChanged = rec.getString('type') !== orig.getString('type')
    const addressChanged =
      rec.getString('address') !== orig.getString('address') ||
      rec.getString('city') !== orig.getString('city') ||
      rec.getString('state') !== orig.getString('state') ||
      rec.getString('cep') !== orig.getString('cep') ||
      rec.getString('neighborhood') !== orig.getString('neighborhood')
    const emailChanged = rec.getString('email') !== orig.getString('email')
    const phoneChanged = rec.getString('phone') !== orig.getString('phone')
    const whatsappChanged = rec.getString('whatsapp') !== orig.getString('whatsapp')
    const websiteChanged = rec.getString('website') !== orig.getString('website')
    const descriptionChanged = rec.getString('description') !== orig.getString('description')

    const sensitiveFieldsChanged =
      nameChanged ||
      typeChanged ||
      addressChanged ||
      emailChanged ||
      phoneChanged ||
      whatsappChanged ||
      websiteChanged ||
      descriptionChanged

    if (sensitiveFieldsChanged) {
      let baseUrl = $os.getenv('PB_INSTANCE_URL') || ''
      if (!baseUrl) {
        baseUrl = 'http://127.0.0.1:8090'
      }
      if (typeof $http !== 'undefined' && typeof $http.send === 'function') {
        try {
          $http.send({
            url: baseUrl + '/backend/v1/validation',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId: rec.id }),
            timeout: 28,
          })
        } catch (httpErr) {
          console.log('[onRecordAfterUpdateSuccess] Erro ao chamar validação:', httpErr.message)
        }
      }
    }
  } catch (err) {
    console.log('[onRecordAfterUpdateSuccess] Falha no hook:', err.message)
  }
  return e.next()
}, 'listings')

// Photos change also counts as sensitive field change:
onRecordAfterCreateSuccess((e) => {
  try {
    const listingId = e.record.getString('listingId')
    if (listingId) {
      let baseUrl = $os.getenv('PB_INSTANCE_URL') || ''
      if (!baseUrl) {
        baseUrl = 'http://127.0.0.1:8090'
      }
      if (typeof $http !== 'undefined' && typeof $http.send === 'function') {
        try {
          $http.send({
            url: baseUrl + '/backend/v1/validation',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listingId: listingId }),
            timeout: 28,
          })
        } catch (httpErr) {
          console.log('[photos afterCreate] Erro ao chamar validação:', httpErr.message)
        }
      }
    }
  } catch (err) {
    console.log('[photos afterCreate] Falha no hook:', err.message)
  }
  return e.next()
}, 'photos')
