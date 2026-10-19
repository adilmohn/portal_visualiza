migrate(
  (app) => {
    // 1. Enable map pin for the first sample listing (InovaTech Soluções Digitais) if pinEnabled is false
    try {
      const listing = app.findFirstRecordByData('listings', 'name', 'InovaTech Soluções Digitais')
      if (listing) {
        listing.set('pinEnabled', true)
        listing.set('pinLat', -23.561414)
        listing.set('pinLng', -46.655881)
        app.save(listing)

        // Seed a sample promotion for InovaTech if none exists
        const promoCol = app.findCollectionByNameOrId('promotions')
        const existingPromos = app.findRecordsByFilter(
          'promotions',
          `listingId = '${listing.id}'`,
          '',
          1,
          0,
        )
        if (!existingPromos || existingPromos.length === 0) {
          const promo = new Record(promoCol)
          promo.set('listingId', listing.id)
          promo.set('title', 'Consultoria Gratuita em Nuvem e IA')
          promo.set(
            'description',
            'Agende uma sessão estratégica de 1 hora com nossos especialistas e receba um diagnóstico completo da infraestrutura de TI da sua empresa.',
          )
          promo.set('active', true)
          app.save(promo)

          const promo2 = new Record(promoCol)
          promo2.set('listingId', listing.id)
          promo2.set('title', '15% de Desconto no Primeiro Contrato Anual')
          promo2.set(
            'description',
            'Condição especial exclusiva para contatos iniciados pelo Portal Viabilize na contratação de desenvolvimento ágil de software corporativo.',
          )
          promo2.set('active', true)
          app.save(promo2)
        }
      }
    } catch (_) {}

    // 2. Enable pin and seed promotion for Café & Co. Confeitaria Artesanal
    try {
      const cafe = app.findFirstRecordByData('listings', 'name', 'Café & Co. Confeitaria Artesanal')
      if (cafe) {
        cafe.set('pinEnabled', true)
        cafe.set('pinLat', -23.585542)
        cafe.set('pinLng', -46.683362)
        app.save(cafe)

        const promoCol = app.findCollectionByNameOrId('promotions')
        const existingCafePromos = app.findRecordsByFilter(
          'promotions',
          `listingId = '${cafe.id}'`,
          '',
          1,
          0,
        )
        if (!existingCafePromos || existingCafePromos.length === 0) {
          const promo = new Record(promoCol)
          promo.set('listingId', cafe.id)
          promo.set('title', 'Combo Degustação Especial: Café Filtrado + Torta Artesanal')
          promo.set(
            'description',
            'Na compra de qualquer método de preparo especial de café arábica do Sul de Minas, ganhe 30% de desconto na fatia de torta do dia.',
          )
          promo.set('active', true)
          app.save(promo)
        }
      }
    } catch (_) {}
  },
  (app) => {
    // Revert seed promotions created
    try {
      const listing = app.findFirstRecordByData('listings', 'name', 'InovaTech Soluções Digitais')
      if (listing) {
        const promos = app.findRecordsByFilter(
          'promotions',
          `listingId = '${listing.id}'`,
          '',
          10,
          0,
        )
        for (let p of promos) {
          app.delete(p)
        }
        listing.set('pinEnabled', false)
        app.save(listing)
      }
    } catch (_) {}
  },
)
