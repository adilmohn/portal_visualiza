/**
 * sales_cron.js — Cron diário de encerramento automático.
 *
 * Todo dia à 01:00 (America/Sao_Paulo, horário do servidor em UTC ajustado):
 *  1. Encerra vendas (coleção sales) cujo endDate já passou: ativa → encerrada
 *  2. Desativa promoções expiradas (campo validUntil preenchido e no passado)
 *
 * Idempotente: roda sobre registros ainda ativos, então reexecuções no mesmo
 * dia não repetem mudanças. Toda a lógica fica inline no callback do cronAdd
 * (regra da plataforma: JSVM executa callbacks em VM pool separado).
 */
cronAdd('encerrar_vendas_expiradas', '0 4 * * *', () => {
  const now = new Date().toISOString()
  let closedSales = 0
  let deactivatedPromos = 0
  const errors = []

  // 1. Vendas ativas com endDate no passado → encerrada
  try {
    const sales = $app.findRecordsByFilter(
      'sales',
      "status = 'ativa' && endDate != '' && endDate < {:now}",
      '-created',
      500,
      0,
      { now: now },
    )
    for (const sale of sales) {
      try {
        sale.set('status', 'encerrada')
        $app.save(sale)
        closedSales++
      } catch (saleErr) {
        errors.push('sale ' + sale.id + ': ' + saleErr)
      }
    }
  } catch (qErr) {
    errors.push('sales query: ' + qErr)
  }

  // 2. Promoções ativas com validUntil no passado → inativa
  try {
    const promos = $app.findRecordsByFilter(
      'promotions',
      "active = true && validUntil != '' && validUntil < {:now}",
      '-created',
      500,
      0,
      { now: now },
    )
    for (const promo of promos) {
      try {
        promo.set('active', false)
        $app.save(promo)
        deactivatedPromos++
      } catch (promoErr) {
        errors.push('promo ' + promo.id + ': ' + promoErr)
      }
    }
  } catch (qErr2) {
    errors.push('promotions query: ' + qErr2)
  }

  console.log(
    '[cron encerrar_vendas_expiradas] vendas encerradas: ' +
      closedSales +
      ', promoções desativadas: ' +
      deactivatedPromos +
      (errors.length > 0 ? ', erros: ' + errors.join('; ') : ''),
  )
})
