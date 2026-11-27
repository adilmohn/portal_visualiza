/// <reference path="../pb_data/types.d.ts" />
// Bloco 4: campos de criativo/métricas em sales
// Adiciona creativeUrl, targetUrl, creativeFile, impressions e clicks.
// Nada é renomeado, removido ou retipado.

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId('sales')

    const addField = (name, type, opts = {}) => {
      if (collection.fields.getByName(name)) return
      const field = new Field({
        type: type,
        name: name,
        ...opts,
      })
      collection.fields.add(field)
    }

    addField('creativeUrl', 'url')
    addField('targetUrl', 'url')
    addField('creativeFile', 'file', {
      maxSelect: 1,
      maxSize: 2097152,
      mimeTypes: ['image/jpeg', 'image/png'],
    })
    addField('impressions', 'number', { onlyInt: true })
    addField('clicks', 'number', { onlyInt: true })

    app.save(collection)
  },
  (app) => {
    // Down: remove apenas os campos adicionados
    const collection = app.findCollectionByNameOrId('sales')
    for (const name of ['creativeUrl', 'targetUrl', 'creativeFile', 'impressions', 'clicks']) {
      const field = collection.fields.getByName(name)
      if (field) collection.fields.removeByName(name)
    }
    app.save(collection)
  },
)
