migrate(
  (app) => {
    // 1. auditLog.manualReview (bool, opcional) — flag de revisão manual
    const auditLog = app.findCollectionByNameOrId('auditLog')
    if (!auditLog.fields.getByName('manualReview')) {
      auditLog.fields.add(
        new BoolField({
          name: 'manualReview',
          required: false,
        }),
      )
      app.save(auditLog)
    }

    // 2. listings.aiStatus (select, opcional) — por que a revisão manual foi exigida
    const listings = app.findCollectionByNameOrId('listings')
    if (!listings.fields.getByName('aiStatus')) {
      listings.fields.add(
        new SelectField({
          name: 'aiStatus',
          required: false,
          maxSelect: 1,
          values: ['manual_review_required', 'ia_indisponivel'],
        }),
      )
      app.save(listings)
    }
  },
  (app) => {
    try {
      const listings = app.findCollectionByNameOrId('listings')
      const aiStatusField = listings.fields.getByName('aiStatus')
      if (aiStatusField) {
        listings.fields.remove(aiStatusField)
        app.save(listings)
      }
    } catch (_) {}

    try {
      const auditLog = app.findCollectionByNameOrId('auditLog')
      const manualReviewField = auditLog.fields.getByName('manualReview')
      if (manualReviewField) {
        auditLog.fields.remove(manualReviewField)
        app.save(auditLog)
      }
    } catch (_) {}
  },
)
