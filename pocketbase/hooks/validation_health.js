/// <reference path="../pb_data/types.d.ts" />
// GET /backend/v1/validation/health — público, somente leitura.
// Retorna {configured: boolean, status: ok|missing} conforme a chave AI_VALIDATION_KEY
// existir nos Secrets. Nunca retorna a chave, prefixo, tamanho ou parte do valor.
// Lógica INLINE no callback (JSVM roda em VM pool separado).

routerAdd('GET', '/backend/v1/validation/health', (e) => {
  try {
    const raw = $os.getenv('AI_VALIDATION_KEY')
    const configured = typeof raw === 'string' && raw.trim() !== ''
    e.json(200, {
      configured: configured,
      status: configured ? 'ok' : 'missing',
    })
  } catch (err) {
    e.json(200, { configured: false, status: 'missing' })
  }
})
