// POST /backend/v1/events/counter  — atomic increment of a counter by key
// GET  /backend/v1/counters?key=... — public read of one or more counter values
//
// Counter keys used by the portal:
//   - "portal_visits"                  : total visits to the site
//   - "listing_clicks:<listingId>"     : clicks/opens per listing (ad frames)
//
// IMPORTANT (PocketBase JSVM): callbacks execute in a separate VM pool, so ALL
// logic lives inline inside each callback body — no top-level helper functions
// or constants referenced from within a callback.
//
// Writes happen ONLY here (server-side); the "counters" collection has no
// public create/update rules. Frontend calls are fire-and-forget and silent.

// ---- POST /backend/v1/events/counter --------------------------------------
routerAdd('POST', '/backend/v1/events/counter', (e) => {
  const PORTAL_VISITS_KEY = 'portal_visits'
  const LISTING_CLICKS_PREFIX = 'listing_clicks:'

  // Find an existing counter record by key; null when it does not exist yet
  const findCounterByKey = (key) => {
    try {
      return $app.findFirstRecordByData('counters', 'key', key)
    } catch (_) {
      return null
    }
  }

  // Ensure the counter record exists (idempotent; unique index guards races)
  const ensureCounter = (key) => {
    let record = findCounterByKey(key)
    if (record) return record

    try {
      const col = $app.findCollectionByNameOrId('counters')
      record = new Record(col)
      record.set('key', key)
      record.set('value', 0)
      $app.save(record)
      return record
    } catch (_) {
      // Lost a creation race: re-read the winner's record
      const winner = findCounterByKey(key)
      if (!winner) throw new Error('Falha ao criar contador.')
      return winner
    }
  }

  // Atomic SQL increment, then re-read the authoritative value
  const incrementCounter = (key) => {
    ensureCounter(key)
    $app
      .db()
      .newQuery(
        'UPDATE counters SET value = COALESCE(value, 0) + 1, updated = {:now} WHERE key = {:key}',
      )
      .bind({ key: key, now: new Date().toISOString() })
      .execute()
    const fresh = findCounterByKey(key)
    return fresh ? fresh.getInt('value', 0) : 0
  }

  try {
    const body = e.requestInfo().body || {}
    const scope = (body.scope || '').trim()

    if (scope === 'portal') {
      const total = incrementCounter(PORTAL_VISITS_KEY)
      return e.json(200, { success: true, key: PORTAL_VISITS_KEY, value: total })
    }

    if (scope === 'listing') {
      const listingId = (body.listingId || '').trim()
      if (!listingId) {
        return e.json(400, { message: 'O campo listingId é obrigatório.' })
      }
      try {
        $app.findRecordById('listings', listingId)
      } catch (_) {
        return e.json(404, { message: 'Anúncio não encontrado.' })
      }
      const key = LISTING_CLICKS_PREFIX + listingId
      const total = incrementCounter(key)
      return e.json(200, { success: true, key: key, value: total })
    }

    return e.json(400, { message: 'Escopo inválido. Valores aceitos: portal, listing.' })
  } catch (err) {
    return e.json(500, { message: 'Falha ao registrar a visita.' })
  }
})

// ---- GET /backend/v1/counters ---------------------------------------------
routerAdd('GET', '/backend/v1/counters', (e) => {
  const PORTAL_VISITS_KEY = 'portal_visits'

  const loadValue = (key) => {
    try {
      const record = $app.findFirstRecordByData('counters', 'key', key)
      return record ? record.getInt('value', 0) : 0
    } catch (_) {
      return 0
    }
  }

  try {
    const q = e.requestInfo().query || {}
    const keysParam = (q.key || '').trim()

    if (keysParam) {
      // Single key or comma-separated list (max 20 keys per request)
      const keys = keysParam
        .split(',')
        .map((k) => k.trim())
        .filter(Boolean)
        .slice(0, 20)
      const values = {}
      keys.forEach((k) => {
        values[k] = loadValue(k)
      })
      return e.json(200, { values: values })
    }

    // No key: return the global portal visits total
    return e.json(200, {
      values: (() => {
        const v = {}
        v[PORTAL_VISITS_KEY] = loadValue(PORTAL_VISITS_KEY)
        return v
      })(),
    })
  } catch (err) {
    return e.json(500, { message: 'Falha ao carregar os contadores.' })
  }
})
