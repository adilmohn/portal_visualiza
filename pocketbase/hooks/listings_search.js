// GET /backend/v1/listings/search
// Custom endpoint for Portal Viabilize listing directory search

routerAdd('GET', '/backend/v1/listings/search', (e) => {
  try {
    const query = e.requestInfo().query || {}
    const state = (query.state || '').trim()
    const city = (query.city || '').trim()
    const neighborhood = (query.neighborhood || '').trim()
    const type = (query.type || '').trim()
    const keyword = (query.keyword || '').trim()
    const pageRaw = parseInt(query.page || '1', 10)
    const page = isNaN(pageRaw) || pageRaw < 1 ? 1 : pageRaw
    const perPage = 20

    // Build filter expressions
    // Only approved listings are exposed to the public directory
    const filters = ['status = "aprovado"']

    if (state) {
      const safeState = state.replace(/'/g, "\\'")
      filters.push(`state = '${safeState}'`)
    }

    if (city) {
      const safeCity = city.replace(/'/g, "\\'")
      filters.push(`city = '${safeCity}'`)
    }

    if (neighborhood) {
      const safeNeighborhood = neighborhood.replace(/'/g, "\\'")
      filters.push(`neighborhood = '${safeNeighborhood}'`)
    }

    if (type) {
      const safeType = type.replace(/'/g, "\\'")
      filters.push(`type = '${safeType}'`)
    }

    if (keyword) {
      const safeKeyword = keyword.replace(/'/g, "\\'")
      filters.push(`(name ~ '${safeKeyword}' || description ~ '${safeKeyword}')`)
    }

    const filterExpr = filters.join(' && ')

    // Count total matching records
    let total = 0
    try {
      total = $app.countRecords('listings', $dbx.exp(filterExpr))
    } catch (_) {
      // Fallback if countRecords with expression fails: query all ids with filter
      try {
        const allMatching = $app.findRecordsByFilter('listings', filterExpr, '-created', 0, 0)
        total = allMatching.length
      } catch (errCount) {
        total = 0
      }
    }

    const totalPages = Math.ceil(total / perPage) || 1
    const offset = (page - 1) * perPage

    // Retrieve page records
    const listings = $app.findRecordsByFilter('listings', filterExpr, '-created', perPage, offset)

    // Format items and fetch main photo (or first photo) for each listing
    const items = listings.map((item) => {
      let firstPhotoUrl = null
      let photoId = null
      let photoFilename = null

      try {
        // Prioritize photo with isMain = true, fallback to first created photo
        const photos = $app.findRecordsByFilter(
          'photos',
          `listingId = '${item.id}'`,
          '-isMain,created',
          1,
          0,
        )
        if (photos && photos.length > 0) {
          const photo = photos[0]
          const filename = photo.getString('url')
          if (filename) {
            photoId = photo.id
            photoFilename = filename
            firstPhotoUrl = `/api/files/photos/${photo.id}/${filename}`
          }
        }
      } catch (_) {
        // Best effort photo retrieval
      }

      return {
        id: item.id,
        name: item.getString('name'),
        type: item.getString('type'),
        description: item.getString('description'),
        email: item.getString('email'),
        phone: item.getString('phone'),
        whatsapp: item.getString('whatsapp'),
        website: item.getString('website'),
        cep: item.getString('cep'),
        address: item.getString('address'),
        city: item.getString('city'),
        state: item.getString('state'),
        country: item.getString('country'),
        zone: item.getString('zone'),
        neighborhood: item.getString('neighborhood'),
        status: item.getString('status'),
        pinEnabled: item.getBool('pinEnabled'),
        pinLat: item.getFloat('pinLat'),
        pinLng: item.getFloat('pinLng'),
        created: item.getString('created'),
        updated: item.getString('updated'),
        photo: firstPhotoUrl,
        photoId: photoId,
        photoFilename: photoFilename,
      }
    })

    return e.json(200, {
      items,
      page,
      perPage,
      total,
      totalPages,
    })
  } catch (err) {
    return e.json(500, {
      message: 'Não foi possível buscar as empresas cadastradas no diretório.',
      error: err ? err.message : 'Erro interno',
    })
  }
})
