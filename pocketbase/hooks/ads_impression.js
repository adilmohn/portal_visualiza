/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/impression — público, body { saleId } obrigatório.
// Incrementa impressions em 1. 204 silencioso se a venda não existir.
// IMPORTANTE (PocketBase JSVM): $apis.requestInfo NÃO existe na v0.23+ —
// usar e.requestInfo() no callback, com toda a lógica INLINE (VM pool).
routerAdd('POST', '/backend/v1/ads/impression', (e) => {
  try {
    const info = e.requestInfo()
    const data = (info && info.body) || {}

    const saleId = String(data.saleId || '').trim()
    if (!saleId) {
      return e.json(400, { error: 'Informe o saleId para registrar a impressão.' })
    }

    let sale = null
    try {
      sale = $app.findRecordById('sales', saleId)
    } catch (_) {
      sale = null
    }

    if (!sale) {
      // venda inexistente: resposta silenciosa
      return e.noContent(204)
    }

    sale.set('impressions', (sale.getInt('impressions') || 0) + 1)
    $app.save(sale)
    return e.json(200, { success: true })
  } catch (err) {
    return e.json(500, { error: 'Falha ao registrar a impressão. Tente novamente.' })
  }
})
