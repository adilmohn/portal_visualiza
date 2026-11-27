/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/impression — público, body { saleId } obrigatório.
// Incrementa impressions em 1. 204 silencioso se a venda não existir.
// Padrão JSVM: toda a lógica INLINE no corpo do callback (VM pool — sem helpers de nível superior).
routerAdd('POST', '/backend/v1/ads/impression', (e) => {
  const info = $apis.requestInfo(e)
  const data = info.body || {}

  const saleId = String(data.saleId || '').trim()
  if (!saleId) {
    return e.json(400, { error: 'saleId obrigatorio.' })
  }

  try {
    const sale = $app.findRecordById('sales', saleId)
    sale.set('impressions', (sale.getInt('impressions') || 0) + 1)
    $app.save(sale)
    return e.json(200, { success: true })
  } catch (err) {
    // venda inexistente ou erro: resposta silenciosa
    return e.noContent(204)
  }
})
