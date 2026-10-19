migrate(
  (app) => {
    // 1. Add rejectedReason field to listings collection so rejection reason can be stored and shown to owner
    const listings = app.findCollectionByNameOrId('listings')
    if (!listings.fields.getByName('rejectedReason')) {
      listings.fields.add(
        new TextField({
          name: 'rejectedReason',
          required: false,
          max: 1000,
        }),
      )
      app.save(listings)
    }

    // 2. Create "auditLog" collection
    // Fields:
    // adminId: relation to users (single, required)
    // action: text (required) e.g. "approve", "reject", "deactivate"
    // targetId: text (required) e.g. listingId
    // reason: text (optional)
    // created: autodate triggers onCreate
    // updated: autodate triggers onCreate,onUpdate
    // Rules: List and Create locked to admins only (@request.auth.role = "admin")
    const auditLog = new Collection({
      name: 'auditLog',
      type: 'base',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: '@request.auth.role = "admin"',
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'adminId',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'action',
          type: 'text',
          required: true,
        },
        {
          name: 'targetId',
          type: 'text',
          required: true,
        },
        {
          name: 'reason',
          type: 'text',
          required: false,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_auditLog_adminId ON auditLog (adminId)',
        'CREATE INDEX idx_auditLog_targetId ON auditLog (targetId)',
      ],
    })
    app.save(auditLog)
  },
  (app) => {
    try {
      const auditLog = app.findCollectionByNameOrId('auditLog')
      app.delete(auditLog)
    } catch (_) {}

    try {
      const listings = app.findCollectionByNameOrId('listings')
      const rejectedReasonField = listings.fields.getByName('rejectedReason')
      if (rejectedReasonField) {
        listings.fields.remove(rejectedReasonField)
        app.save(listings)
      }
    } catch (_) {}
  },
)
