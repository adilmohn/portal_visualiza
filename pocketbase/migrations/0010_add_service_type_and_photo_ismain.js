migrate(
  (app) => {
    // 1. Update listings.type select field to include "servico"
    const listings = app.findCollectionByNameOrId('listings')
    const typeField = listings.fields.getByName('type')
    if (typeField) {
      const currentValues = typeField.values || []
      if (!currentValues.includes('servico')) {
        typeField.values = [...currentValues, 'servico']
        typeField.maxSelect = 1
        app.save(listings)
      }
    }

    // 2. Add isMain bool field to photos collection
    const photos = app.findCollectionByNameOrId('photos')
    if (!photos.fields.getByName('isMain')) {
      photos.fields.add(
        new BoolField({
          name: 'isMain',
          required: false,
        }),
      )
      app.save(photos)
    }
  },
  (app) => {
    try {
      const photos = app.findCollectionByNameOrId('photos')
      const isMainField = photos.fields.getByName('isMain')
      if (isMainField) {
        photos.fields.remove(isMainField)
        app.save(photos)
      }
    } catch (_) {}

    try {
      const listings = app.findCollectionByNameOrId('listings')
      const typeField = listings.fields.getByName('type')
      if (typeField) {
        typeField.values = (typeField.values || []).filter((v) => v !== 'servico')
        app.save(listings)
      }
    } catch (_) {}
  },
)
