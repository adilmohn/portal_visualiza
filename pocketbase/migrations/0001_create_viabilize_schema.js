migrate(
  (app) => {
    // 1. Update "users" collection with role field and updated API rules
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          required: false,
          values: ['cadastrado', 'anunciante', 'admin'],
          maxSelect: 1,
        }),
      )
    }

    // API rules for users:
    // List = Locked (null)
    // View = Filtered to owner (id = @request.auth.id)
    // Update = Filtered to owner (id = @request.auth.id && @request.body.role:changed = false)
    // Create = Public ("")
    // Delete = Locked (null)
    users.listRule = null
    users.viewRule = 'id = @request.auth.id'
    users.updateRule = 'id = @request.auth.id && @request.body.role:changed = false'
    users.createRule = ''
    users.deleteRule = null

    app.save(users)

    // 2. Create "listings" collection
    // Indexes: city, state, type
    // Fields:
    // userId: Relation to users single required
    // name: Text required
    // type: Select ["empresa", "negocio", "solucao", "produto"] required
    // description: Text required max 1000
    // email: Email required
    // phone: Text optional
    // whatsapp: Text optional
    // website: URL optional
    // cep: Text required
    // address: Text required
    // city: Text required
    // state: Text required
    // country: Text required default "Brasil"
    // zone: Text optional
    // neighborhood: Text optional
    // status: Select ["pendente", "aprovado", "rejeitado", "inativo"] default "pendente"
    // pinEnabled: Bool default false
    // pinLat: Number optional
    // pinLng: Number optional
    // created: autodate
    // updated: autodate
    const listings = new Collection({
      name: 'listings',
      type: 'base',
      listRule:
        'status = "aprovado" || @request.auth.role = "admin" || (@request.auth.id != "" && userId = @request.auth.id)',
      viewRule:
        'status = "aprovado" || @request.auth.role = "admin" || (@request.auth.id != "" && userId = @request.auth.id)',
      createRule: '@request.auth.id != "" && userId = @request.auth.id',
      updateRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && userId = @request.auth.id)',
      deleteRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && userId = @request.auth.id)',
      fields: [
        {
          name: 'userId',
          type: 'relation',
          required: true,
          collectionId: '_pb_users_auth_',
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'name', type: 'text', required: true },
        {
          name: 'type',
          type: 'select',
          required: true,
          values: ['empresa', 'negocio', 'solucao', 'produto'],
          maxSelect: 1,
        },
        { name: 'description', type: 'text', required: true, max: 1000 },
        { name: 'email', type: 'email', required: true },
        { name: 'phone', type: 'text' },
        { name: 'whatsapp', type: 'text' },
        { name: 'website', type: 'url' },
        { name: 'cep', type: 'text', required: true },
        { name: 'address', type: 'text', required: true },
        { name: 'city', type: 'text', required: true },
        { name: 'state', type: 'text', required: true },
        { name: 'country', type: 'text', required: true },
        { name: 'zone', type: 'text' },
        { name: 'neighborhood', type: 'text' },
        {
          name: 'status',
          type: 'select',
          values: ['pendente', 'aprovado', 'rejeitado', 'inativo'],
          maxSelect: 1,
        },
        { name: 'pinEnabled', type: 'bool' },
        { name: 'pinLat', type: 'number' },
        { name: 'pinLng', type: 'number' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_listings_city ON listings (city)',
        'CREATE INDEX idx_listings_state ON listings (state)',
        'CREATE INDEX idx_listings_type ON listings (type)',
      ],
    })
    app.save(listings)

    const listingsId = app.findCollectionByNameOrId('listings').id

    // 3. Create "photos" collection
    // listingId: relation to listings, many
    // url: File, required, only image/jpeg and image/png, max 5MB (5242880 bytes)
    const photos = new Collection({
      name: 'photos',
      type: 'base',
      listRule:
        'listingId.status = "aprovado" || @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      viewRule:
        'listingId.status = "aprovado" || @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      createRule:
        '@request.auth.id != "" && (listingId.userId = @request.auth.id || @request.auth.role = "admin")',
      updateRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      deleteRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      fields: [
        {
          name: 'listingId',
          type: 'relation',
          required: true,
          collectionId: listingsId,
          cascadeDelete: true,
          maxSelect: 99,
        },
        {
          name: 'url',
          type: 'file',
          required: true,
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ['image/jpeg', 'image/png'],
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(photos)

    // 4. Create "contactEvents" collection
    // listingId: relation to listings, single, required
    // channel: select ["whatsapp", "telefone", "email", "site"]
    // API rules: Create = Public (""), List = Locked (admin only), View = Locked (admin only), no Update or Delete for public (admin only)
    const contactEvents = new Collection({
      name: 'contactEvents',
      type: 'base',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: '',
      updateRule: '@request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'listingId',
          type: 'relation',
          required: true,
          collectionId: listingsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        {
          name: 'channel',
          type: 'select',
          required: true,
          values: ['whatsapp', 'telefone', 'email', 'site'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(contactEvents)

    // 5. Create "promotions" collection
    // listingId: relation to listings, single
    // title: Text required
    // description: Text required
    // active: Bool default true
    const promotions = new Collection({
      name: 'promotions',
      type: 'base',
      listRule:
        '(listingId.status = "aprovado" && active = true) || @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      viewRule:
        '(listingId.status = "aprovado" && active = true) || @request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      createRule:
        '@request.auth.id != "" && (listingId.userId = @request.auth.id || @request.auth.role = "admin")',
      updateRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      deleteRule:
        '@request.auth.role = "admin" || (@request.auth.id != "" && listingId.userId = @request.auth.id)',
      fields: [
        {
          name: 'listingId',
          type: 'relation',
          collectionId: listingsId,
          cascadeDelete: true,
          maxSelect: 1,
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'text', required: true },
        { name: 'active', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
    })
    app.save(promotions)
  },
  (app) => {
    try {
      const promotions = app.findCollectionByNameOrId('promotions')
      app.delete(promotions)
    } catch (_) {}

    try {
      const contactEvents = app.findCollectionByNameOrId('contactEvents')
      app.delete(contactEvents)
    } catch (_) {}

    try {
      const photos = app.findCollectionByNameOrId('photos')
      app.delete(photos)
    } catch (_) {}

    try {
      const listings = app.findCollectionByNameOrId('listings')
      app.delete(listings)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      const roleField = users.fields.getByName('role')
      if (roleField) {
        users.fields.remove(roleField)
        app.save(users)
      }
    } catch (_) {}
  },
)
