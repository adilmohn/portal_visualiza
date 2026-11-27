/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/click — público, body { saleId } obrigatório.
// Incrementa clicks em 1 e retorna targetUrl quando houver, senão string vazia.
// 204 silencioso se a venda não existir. Nunca retorna advertiserEmail.
// IMPORTANTE (PocketBase JSVM): $apis.requestInfo NÃO existe na v0.23+ —
// usar e.requestInfo() no callback, com toda a lógica INLINE (VM pool).
routerAdd('POST', '/backend/v1/ads/click', (e) => {
  try {
    const info = e.requestInfo()
    const data = (info && info.body) || {}

    const saleId = String(data.saleId || '').trim()
    if (!saleId) {
      return e.json(400, { error: 'Informe o saleId para registrar o clique.' })
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

    sale.set('clicks', (sale.getInt('clicks') || 0) + 1)
    $app.save(sale)
    return e.json(200, { targetUrl: String(sale.getString('targetUrl') || '') })
  } catch (err) {
    return e.json(500, { error: 'Falha ao registrar o clique. Tente novamente.' })
  }
})
