migrate(
  (app) => {
    const listingsCol = app.findCollectionByNameOrId('listings')

    // Create "reviews" collection
    // Fields:
    // - listingId: relation to listings single required
    // - userId: relation to users single required
    // - stars: Number required min 1 max 5
    // - comment: Text max 500 optional
    // - status: Select with options pendente, aprovado, rejeitado default pendente
    // - created: autodate
    // - updated: autodate
    //
    // Rules:
    // - Create: Public for authenticated users ("@request.auth.id != ''")
    // - List: Public where status is aprovado ("status = 'aprovado'")
    // - View: Public where status is aprovado ("status = 'aprovado'")
    // - Update: Locked (null)
    // - Delete: Locked (null)
    const reviews = new Collection({
      name: 'reviews',
      type: 'base',
      listRule: "status = 'aprovado'",
      viewRule: "status = 'aprovado'",
      createRule: "@request.auth.id != ''",
      updateRule: null,
      deleteRule: null,
      fields: [
        {
          name: 'listingId',
          type: 'relation',
          required: true,
          collectionId: listingsCol.id,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'userId',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'stars',
          type: 'number',
          required: true,
          min: 1,
          max: 5,
          onlyInt: true,
        },
        {
          name: 'comment',
          type: 'text',
          max: 500,
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: ['pendente', 'aprovado', 'rejeitado'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_reviews_listingId ON reviews (listingId)',
        'CREATE INDEX idx_reviews_userId ON reviews (userId)',
        'CREATE INDEX idx_reviews_status ON reviews (status)',
        'CREATE INDEX idx_reviews_listing_status ON reviews (listingId, status)',
      ],
    })
    app.save(reviews)
  },
  (app) => {
    try {
      const reviews = app.findCollectionByNameOrId('reviews')
      app.delete(reviews)
    } catch (_) {}
  },
)
