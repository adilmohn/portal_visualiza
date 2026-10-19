migrate(
  (app) => {
    // 1. Create "packages" collection
    // id UUID auto
    // name Text required
    // mediaType Select with options destaque_diretorio, banner_lateral, banner_inferior, popup required
    // period Select with options semanal, mensal, impressoes, cliques required
    // price Number required
    // status Select with options ativo, inativo default ativo
    // createdAt Autodate (created & updated autodate fields)
    // Rules: List and View Public (""); Create, Update and Delete Locked to admins (@request.auth.role = "admin")
    const packages = new Collection({
      name: 'packages',
      type: 'base',
      listRule: '',
      viewRule: '',
      createRule: '@request.auth.role = "admin"',
      updateRule: '@request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'name',
          type: 'text',
          required: true,
        },
        {
          name: 'mediaType',
          type: 'select',
          required: true,
          values: ['destaque_diretorio', 'banner_lateral', 'banner_inferior', 'popup'],
          maxSelect: 1,
        },
        {
          name: 'period',
          type: 'select',
          required: true,
          values: ['semanal', 'mensal', 'impressoes', 'cliques'],
          maxSelect: 1,
        },
        {
          name: 'price',
          type: 'number',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['ativo', 'inativo'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_packages_status ON packages (status)',
        'CREATE INDEX idx_packages_mediaType ON packages (mediaType)',
      ],
    })
    app.save(packages)

    const packagesId = app.findCollectionByNameOrId('packages').id

    // 2. Create "sales" collection
    // id UUID auto
    // packageId UUID relation to packages single required
    // advertiserName Text required
    // advertiserEmail Email required
    // startDate Date required
    // endDate Date optional
    // amount Number required
    // status Select with options ativa, encerrada, cancelada default ativa
    // createdAt Autodate (created & updated autodate fields)
    // Rules: List and View Locked to admins (@request.auth.role = "admin"); Create Public (""); Update and Delete Locked to admins (@request.auth.role = "admin")
    const sales = new Collection({
      name: 'sales',
      type: 'base',
      listRule: '@request.auth.role = "admin"',
      viewRule: '@request.auth.role = "admin"',
      createRule: '',
      updateRule: '@request.auth.role = "admin"',
      deleteRule: '@request.auth.role = "admin"',
      fields: [
        {
          name: 'packageId',
          type: 'relation',
          required: true,
          collectionId: packagesId,
          cascadeDelete: false,
          maxSelect: 1,
        },
        {
          name: 'advertiserName',
          type: 'text',
          required: true,
        },
        {
          name: 'advertiserEmail',
          type: 'email',
          required: true,
        },
        {
          name: 'startDate',
          type: 'date',
          required: true,
        },
        {
          name: 'endDate',
          type: 'date',
          required: false,
        },
        {
          name: 'amount',
          type: 'number',
          required: true,
        },
        {
          name: 'status',
          type: 'select',
          values: ['ativa', 'encerrada', 'cancelada'],
          maxSelect: 1,
        },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_sales_packageId ON sales (packageId)',
        'CREATE INDEX idx_sales_status ON sales (status)',
        'CREATE INDEX idx_sales_startDate ON sales (startDate)',
      ],
    })
    app.save(sales)
  },
  (app) => {
    try {
      const sales = app.findCollectionByNameOrId('sales')
      app.delete(sales)
    } catch (_) {}

    try {
      const packages = app.findCollectionByNameOrId('packages')
      app.delete(packages)
    } catch (_) {}
  },
)
