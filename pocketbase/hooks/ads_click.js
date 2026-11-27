/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/click — público, body { saleId } obrigatório.
// Incrementa clicks em 1 e retorna targetUrl quando houver, senão string vazia.
// 204 silencioso se a venda não existir. Nunca retorna advertiserEmail.
// Padrão JSVM: toda a lógica INLINE no corpo do callback (VM pool — sem helpers de nível superior).
routerAdd('POST', '/backend/v1/ads/click', (e) => {
  const info = $apis.requestInfo(e)
  const data = info.body || {}

  const saleId = String(data.saleId || '').trim()
  if (!saleId) {
    return e.json(400, { error: 'saleId obrigatorio.' })
  }

  try {
    const sale = $app.findRecordById('sales', saleId)
    sale.set('clicks', (sale.getInt('clicks') || 0) + 1)
    $app.save(sale)
    return e.json(200, { targetUrl: String(sale.getString('targetUrl') || '') })
  } catch (err) {
    // venda inexistente ou erro: resposta silenciosa
    return e.noContent(204)
  }
})
