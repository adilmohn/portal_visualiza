// POST /backend/v1/events/contact
// Records a contact click event (whatsapp, telefone, email, site)
// Publicly accessible, fire-and-forget compatible

routerAdd('POST', '/backend/v1/events/contact', (e) => {
  try {
    const body = e.requestInfo().body || {}
    const listingId = (body.listingId || '').trim()
    const channel = (body.channel || '').trim()

    if (!listingId) {
      return e.json(400, {
        message: 'O campo listingId é obrigatório.',
      })
    }

    const allowedChannels = ['whatsapp', 'telefone', 'email', 'site']
    if (!allowedChannels.includes(channel)) {
      return e.json(400, {
        message: 'Canal de contato inválido. Valores aceitos: whatsapp, telefone, email, site.',
      })
    }

    // Verify listing exists
    let listing
    try {
      listing = $app.findRecordById('listings', listingId)
    } catch (_) {
      return e.json(404, {
        message: 'Anúncio não encontrado.',
      })
    }

    const contactEventsCol = $app.findCollectionByNameOrId('contactEvents')
    const record = new Record(contactEventsCol)
    record.set('listingId', listing.id)
    record.set('channel', channel)
    $app.save(record)

    return e.json(201, {
      success: true,
      id: record.id,
      channel,
      listingId: listing.id,
      created: record.getString('created'),
    })
  } catch (err) {
    return e.json(500, {
      message: 'Falha ao registrar evento de contato.',
      error: err ? err.message : 'Erro interno do servidor',
    })
  }
})
