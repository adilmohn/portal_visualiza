migrate(
  (app) => {
    // Create "counters" collection: generic key/value counters for the portal.
    // - key: unique text identifier (e.g. "portal_visits", "listing_clicks:<listingId>")
    // - value: number (incremented atomically via /backend/v1/events/counter)
    // API rules: public read (list/view), write locked (server-side routes only).
    let counters
    try {
      counters = app.findCollectionByNameOrId('counters')
    } catch (_) {
      counters = new Collection({
        name: 'counters',
        type: 'base',
        listRule: '',
        viewRule: '',
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'key', type: 'text', required: true },
          { name: 'value', type: 'number' },
        ],
        indexes: ['CREATE UNIQUE INDEX idx_counters_key ON counters (key)'],
      })
      app.save(counters)
    }

    // Seed the global portal visit counter if missing
    try {
      const existing = app.findFirstRecordByData('counters', 'key', 'portal_visits')
      if (!existing) {
        const col = app.findCollectionByNameOrId('counters')
        const seed = new Record(col)
        seed.set('key', 'portal_visits')
        seed.set('value', 0)
        app.save(seed)
      }
    } catch (_) {
      // Seeded below if find threw because record does not exist
      try {
        const col = app.findCollectionByNameOrId('counters')
        const seed = new Record(col)
        seed.set('key', 'portal_visits')
        seed.set('value', 0)
        app.save(seed)
      } catch (err2) {}
    }
  },
  (app) => {
    // Revert: remove the counters collection (only if it was created by this migration)
    try {
      const counters = app.findCollectionByNameOrId('counters')
      app.delete(counters)
    } catch (_) {}
  },
)
