// 0012 — Correções de dados: pin do anúncio "Inova Core" (CEP 03186-020) e
// padronização de CEPs com hífen.
//
// - Inova Core: pinEnabled=true mas pinLat=0/pinLng=0 (pin inválido). Este
//   migration grava as coordenadas corretas do endereço (Rua Ibitinga, Vila
//   Bertioga, São Paulo/SP — obtidas via Nominatim/OpenStreetMap) e padroniza
//   o CEP para o formato XXXXX-XXX.
// - Padroniza o CEP de todos os anúncios para "99999-999" (idempotente).
// - Nenhuma coleção nova; apenas correção de dados.

migrate(
  (app) => {
    const digitsOnly = (cep) => (cep || '').replace(/\D/g, '')
    const formatCep = (cep) => {
      const digits = digitsOnly(cep)
      if (digits.length !== 8) return (cep || '').trim()
      return digits.slice(0, 5) + '-' + digits.slice(5)
    }

    // 1. Corrige o anúncio Inova Core (pin e CEP) — idempotente
    try {
      const listings = app.findRecordsByFilter(
        'listings',
        "cep ~ '03186020' || cep ~ '03186-020' || name ~ 'Inova Core'",
        '-created',
        20,
        0,
      )
      for (let i = 0; i < listings.length; i++) {
        const rec = listings[i]
        if (
          rec.getString('name') !== 'Inova Core' &&
          digitsOnly(rec.getString('cep')) !== '03186020'
        ) {
          continue
        }
        rec.set('cep', '03186-020')
        rec.set('pinEnabled', true)
        rec.set('pinLat', -23.563861)
        rec.set('pinLng', -46.58103)
        app.save(rec)
      }
    } catch (err) {
      console.warn('0012: falha ao corrigir pin do Inova Core:', err)
    }

    // 2. Padroniza todos os CEPs para o formato com hífen — idempotente
    try {
      const all = app.findRecordsByFilter('listings', 'cep != ""', '-created', 0, 0)
      for (let i = 0; i < all.length; i++) {
        const rec = all[i]
        const raw = rec.getString('cep') || ''
        const formatted = formatCep(raw)
        if (formatted && formatted !== raw) {
          rec.set('cep', formatted)
          app.save(rec)
        }
      }
    } catch (err) {
      console.warn('0012: falha ao padronizar CEPs:', err)
    }
  },
  (app) => {
    // Revert: não há retorno aos dados antigos (0,0 era inválido); no-op.
  },
)
