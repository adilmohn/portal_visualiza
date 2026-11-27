/// <reference path="../pb_data/types.d.ts" />
// GET /backend/v1/ads/serve — público, somente leitura.
// Lista vendas com status ativa e endDate vazio ou futuro, com dados do pacote.
// IMPORTANTE (JSVM): toda a lógica fica INLINE no callback do routerAdd —
// helpers/constantes de nível superior rodam em VM pool separado e causam
// ReferenceError, bloqueando o deploy do hook.

routerAdd('GET', '/backend/v1/ads/serve', (e) => {
  try {
    const now = new Date().toISOString().replace('T', ' ')

    let records = []
    try {
      records = $app.findRecordsByFilter(
        'sales',
        "status = 'ativa' && (endDate = '' || endDate > {:now})",
        '-created',
        50,
        0,
        { now: now },
      )
    } catch (err) {
      // lista vazia, nunca erro
      records = []
    }

    const groups = {}
    const sales = []

    for (const sale of records) {
      try {
        let pkg = null
        try {
          pkg = $app.findRecordById('packages', sale.getString('packageId'))
        } catch (_) {
          pkg = null
        }

        const mediaType = pkg ? pkg.getString('mediaType') : ''
        const packageName = pkg ? pkg.getString('name') : ''

        let creativeFileUrl = ''
        try {
          const fileField = sale.getString('creativeFile')
          if (fileField) {
            creativeFileUrl = $app.findFileByRef('sales', sale, fileField).url('')
          }
        } catch (_) {
          creativeFileUrl = ''
        }

        const item = {
          id: sale.id,
          packageName: packageName,
          mediaType: mediaType,
          creativeUrl: sale.getString('creativeUrl') || '',
          creativeFileUrl: creativeFileUrl,
          targetUrl: sale.getString('targetUrl') || '',
          advertiserName: sale.getString('advertiserName') || '',
          startDate: sale.getString('startDate') || '',
          endDate: sale.getString('endDate') || '',
          impressions: sale.getInt('impressions'),
          clicks: sale.getInt('clicks'),
          // advertiserEmail NUNCA é retornado
        }

        sales.push(item)

        const groupKey = mediaType || 'outro'
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(item)
      } catch (_) {
        // ignora venda problemática individual, segue a lista
      }
    }

    e.json(200, { sales: sales, groups: groups })
  } catch (err) {
    // nunca stack trace
    e.json(200, { sales: [], groups: {} })
  }
})
