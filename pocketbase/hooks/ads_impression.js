/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/impression — público. body {saleId} obrigatório.
// Incrementa impressions em 1. 204 silencioso se a venda não existir.
// Lógica INLINE no callback (JSVM roda em VM pool separado).

routerAdd('POST', '/backend/v1/ads/impression', (e) => {
  try {
    const body = $apis.requestInfo(e).body
    const saleId = (body && body.saleId ? String(body.saleId) : '').trim()

    if (!saleId) {
      e.json(400, { error: 'saleId é obrigatório.' })
      return
    }

    let sale = null
    try {
      sale = $app.findRecordById('sales', saleId)
    } catch (_) {
      sale = null
    }

    if (!sale) {
      e.json(204, {})
      return
    }

    const current = sale.getInt('impressions')
    sale.set('impressions', current + 1)
    $app.save(sale)

    e.json(200, { success: true, impressions: current + 1 })
  } catch (err) {
    e.json(500, { error: 'Não foi possível registrar a impressão.' })
  }
})
