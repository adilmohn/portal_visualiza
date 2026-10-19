// GET /backend/v1/listings/detail?id=<id>
// Loads a single listing by id ONLY if status = "aprovado"
// Returns listing fields + photos + active promotions + contact info

routerAdd('GET', '/backend/v1/listings/detail', (e) => {
  try {
    const query = e.requestInfo().query || {}
    const id = (query.id || '').trim()

    if (!id) {
      return e.json(400, {
        message: 'Identificador do anúncio não fornecido.',
      })
    }

    let listing
    try {
      listing = $app.findRecordById('listings', id)
    } catch (_) {
      return e.json(404, {
        message: 'Perfil não encontrado.',
      })
    }

    // Only approved listings can be accessed publicly
    const status = listing.getString('status')
    if (status !== 'aprovado') {
      return e.json(404, {
        message: 'Perfil não encontrado ou não está disponível para visualização pública.',
      })
    }

    // Fetch associated photos (order by created ASC)
    let photos = []
    try {
      const photoRecords = $app.findRecordsByFilter(
        'photos',
        `listingId = '${listing.id}'`,
        'created',
        50,
        0,
      )
      photos = photoRecords
        .map((p) => {
          const filename = p.getString('url')
          return {
            id: p.id,
            filename: filename,
            url: filename ? `/api/files/photos/${p.id}/${filename}` : '',
            created: p.getString('created'),
          }
        })
        .filter((p) => p.url !== '')
    } catch (_) {
      photos = []
    }

    // Fetch active promotions (order by created DESC)
    let promotions = []
    try {
      const promoRecords = $app.findRecordsByFilter(
        'promotions',
        `listingId = '${listing.id}' && active = true`,
        '-created',
        50,
        0,
      )
      promotions = promoRecords.map((pr) => ({
        id: pr.id,
        title: pr.getString('title'),
        description: pr.getString('description'),
        active: pr.getBool('active'),
        created: pr.getString('created'),
      }))
    } catch (_) {
      promotions = []
    }

    const detail = {
      id: listing.id,
      name: listing.getString('name'),
      type: listing.getString('type'),
      description: listing.getString('description'),
      email: listing.getString('email'),
      phone: listing.getString('phone'),
      whatsapp: listing.getString('whatsapp'),
      website: listing.getString('website'),
      cep: listing.getString('cep'),
      address: listing.getString('address'),
      city: listing.getString('city'),
      state: listing.getString('state'),
      country: listing.getString('country') || 'Brasil',
      zone: listing.getString('zone'),
      neighborhood: listing.getString('neighborhood'),
      status: listing.getString('status'),
      pinEnabled: listing.getBool('pinEnabled'),
      pinLat: listing.getFloat('pinLat'),
      pinLng: listing.getFloat('pinLng'),
      created: listing.getString('created'),
      updated: listing.getString('updated'),
      photos,
      promotions,
    }

    return e.json(200, detail)
  } catch (err) {
    return e.json(500, {
      message: 'Não foi possível carregar os detalhes do anúncio.',
      error: err ? err.message : 'Erro interno do servidor',
    })
  }
})
