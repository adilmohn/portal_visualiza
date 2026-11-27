/// <reference path="../pb_data/types.d.ts" />
// POST /backend/v1/ads/click — público. body {saleId} obrigatório.
// Incrementa clicks em 1 e retorna targetUrl (string vazia se não houver).
// 204 silencioso se a venda não existir. Lógica INLINE no callback (JSVM).

routerAdd('POST', '/backend/v1/ads/click', (e) => {
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

    const current = sale.getInt('clicks')
    sale.set('clicks', current + 1)
    $app.save(sale)

    e.json(200, {
      success: true,
      clicks: current + 1,
      targetUrl: sale.getString('targetUrl') || '',
    })
  } catch (err) {
    e.json(500, { error: 'Não foi possível registrar o clique.' })
  }
})
