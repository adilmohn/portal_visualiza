migrate(
  (app) => {
    // 1. Add aiVerdict select field to listings collection
    const listings = app.findCollectionByNameOrId('listings')
    if (!listings.fields.getByName('aiVerdict')) {
      listings.fields.add(
        new SelectField({
          name: 'aiVerdict',
          required: false,
          values: ['aprovado', 'duvidoso', 'reprovado'],
          maxSelect: 1,
        }),
      )
      app.save(listings)
    }

    // 2. Define the native Skip Cloud AI Agent for listing validation
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && $ai.agents.define) {
        $ai.agents.define(app, {
          slug: 'listing-validator',
          name: 'Validador de Anúncios',
          description:
            'Agente de IA nativo para análise de conformidade e validação de anúncios do Portal Viabilize.',
          systemPrompt:
            'Você é um auditor rigoroso de anúncios comerciais do Portal Viabilize.\n' +
            'Sua missão é analisar os dados de um anúncio (nome, tipo, descrição, contatos e fotos) e classificá-lo em uma das três categorias:\n' +
            '- aprovado: anúncio legítimo, profissional, com descrição coerente e contatos válidos.\n' +
            '- duvidoso: dados incompletos, suspeita de spam, texto vago, contatos inconsistentes ou que necessitam de conferência manual de moderador humano.\n' +
            '- reprovado: conteúdo ilícito, ofensivo, proibido, discriminatório, fraude evidente, pirâmide financeira, armas, drogas ou violação direta dos termos.\n\n' +
            'Responda ESTRITAMENTE em formato JSON com as seguintes chaves:\n' +
            '{\n' +
            '  "verdict": "aprovado" | "duvidoso" | "reprovado",\n' +
            '  "reason": "Explicação concisa e clara em português do Brasil (PT-BR) sobre a decisão."\n' +
            '}\n' +
            'Nunca inclua texto fora do bloco JSON.',
          tier: 'fast',
          tools: [
            {
              collection: 'listings',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
            {
              collection: 'photos',
              perms: { list: true, read: true },
              actAs: 'admin',
            },
          ],
        })
      }
    } catch (agentErr) {
      console.log('Aviso ao definir agente nativo de validação:', agentErr.message)
    }
  },
  (app) => {
    try {
      if (typeof $ai !== 'undefined' && $ai.agents && $ai.agents.delete) {
        $ai.agents.delete(app, 'listing-validator')
      }
    } catch (_) {}

    try {
      const listings = app.findCollectionByNameOrId('listings')
      const verdictField = listings.fields.getByName('aiVerdict')
      if (verdictField) {
        listings.fields.remove(verdictField)
        app.save(listings)
      }
    } catch (_) {}
  },
)
