migrate(
  (app) => {
    const listingsCol = app.findCollectionByNameOrId('listings')
    const promotionsCol = app.findCollectionByNameOrId('promotions')

    // Create "vouchers" collection
    // Fields:
    // - code: text, required
    // - promotionId: relation to promotions single, required
    // - listingId: relation to listings single, required
    // - used: bool, default false
    // - created: autodate
    // - updated: autodate
    //
    // Rules:
    // - createRule: null (Create via API only - pb_hooks generates with admin/app context)
    // - listRule: @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id) || (used = false && listingId.status = "aprovado")
    // - viewRule: @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id) || (used = false && listingId.status = "aprovado")
    // - updateRule: @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)
    // - deleteRule: @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)
    const vouchers = new Collection({
      name: 'vouchers',
      type: 'base',
      listRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id) || (used = false && listingId.status = "aprovado")',
      viewRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id) || (used = false && listingId.status = "aprovado")',
      createRule: null,
      updateRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      deleteRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      fields: [
        {
          name: 'code',
          type: 'text',
          required: true,
        },
        {
          name: 'promotionId',
          type: 'relation',
          required: true,
          collectionId: promotionsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'listingId',
          type: 'relation',
          required: true,
          collectionId: listingsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'used',
          type: 'bool',
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_vouchers_code ON vouchers (code)',
        'CREATE INDEX idx_vouchers_listingId ON vouchers (listingId)',
        'CREATE INDEX idx_vouchers_promotionId ON vouchers (promotionId)',
      ],
    })
    app.save(vouchers)
  },
  (app) => {
    try {
      const vouchers = app.findCollectionByNameOrId('vouchers')
      app.delete(vouchers)
    } catch (_) {}
  },
)
