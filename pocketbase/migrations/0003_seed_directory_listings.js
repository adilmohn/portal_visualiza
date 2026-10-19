migrate(
  (app) => {
    // Check if any listing exists
    try {
      const existing = app.findRecordsByFilter('listings', '', '', 1, 0)
      if (existing && existing.length > 0) return
    } catch (_) {}

    // Find the admin user to associate listings with
    let adminUser
    try {
      adminUser = app.findAuthRecordByEmail('_pb_users_auth_', 'cadastro@inovacore.com.br')
    } catch (_) {
      try {
        const users = app.findRecordsByFilter('_pb_users_auth_', '', '', 1, 0)
        if (users && users.length > 0) {
          adminUser = users[0]
        }
      } catch (_) {}
    }

    if (!adminUser) return

    const listingsCol = app.findCollectionByNameOrId('listings')

    const seedListings = [
      {
        name: 'InovaTech Soluções Digitais',
        type: 'empresa',
        description:
          'Desenvolvimento de software corporativo, consultoria em nuvem e transformação digital para médias e grandes empresas.',
        email: 'contato@inovatech.com.br',
        phone: '(11) 3214-5500',
        whatsapp: '(11) 98765-4321',
        website: 'https://inovatech.com.br',
        cep: '01310-100',
        address: 'Av. Paulista, 1000, Bela Vista',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zone: 'Centro',
        neighborhood: 'Bela Vista',
        status: 'aprovado',
      },
      {
        name: 'Café & Co. Confeitaria Artesanal',
        type: 'negocio',
        description:
          'Cafeteria de cafés especiais com grãos selecionados do sul de Minas e confeitaria artesanal fresca diariamente.',
        email: 'ola@cafecoartesanal.com.br',
        phone: '(11) 3045-8822',
        whatsapp: '(11) 99123-4567',
        website: 'https://cafeco.com.br',
        cep: '04538-132',
        address: 'Rua Amauri, 240, Itaim Bibi',
        city: 'São Paulo',
        state: 'SP',
        country: 'Brasil',
        zone: 'Zona Sul',
        neighborhood: 'Itaim Bibi',
        status: 'aprovado',
      },
      {
        name: 'AgroData Sensorização Inteligente',
        type: 'solucao',
        description:
          'Plataforma IoT de monitoramento do solo, umidade e previsão de colheita com inteligência artificial para o agronegócio.',
        email: 'comercial@agrodata.io',
        phone: '(19) 3785-1100',
        whatsapp: '(19) 98111-2233',
        website: 'https://agrodata.io',
        cep: '13083-852',
        address: 'Rua Saturnino de Brito, 55, Barão Geraldo',
        city: 'Campinas',
        state: 'SP',
        country: 'Brasil',
        zone: 'Norte',
        neighborhood: 'Barão Geraldo',
        status: 'aprovado',
      },
      {
        name: 'BioEco Embalagens Sustentáveis',
        type: 'produto',
        description:
          'Embalagens 100% biodegradáveis e compostáveis produzidas a partir de mandioca e fibras naturais para delivery e e-commerce.',
        email: 'vendas@bioeco.com.br',
        phone: '(21) 2234-9000',
        whatsapp: '(21) 97654-3210',
        website: 'https://bioecoembalagens.com.br',
        cep: '20040-002',
        address: 'Av. Rio Branco, 156, Centro',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        zone: 'Centro',
        neighborhood: 'Centro',
        status: 'aprovado',
      },
      {
        name: 'Studio Carioca Arquitetura & Design',
        type: 'empresa',
        description:
          'Projetos residenciais e corporativos focados em sustentabilidade, ventilação natural e design biofílico.',
        email: 'contato@studiocarioca.arq.br',
        phone: '(21) 3322-7711',
        whatsapp: '(21) 98888-4444',
        website: 'https://studiocarioca.arq.br',
        cep: '22410-001',
        address: 'Rua Visconde de Pirajá, 414, Ipanema',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brasil',
        zone: 'Zona Sul',
        neighborhood: 'Ipanema',
        status: 'aprovado',
      },
      {
        name: 'Belo Horizonte HealthTech Hub',
        type: 'solucao',
        description:
          'Sistema integrado de prontuário eletrônico interoperável e telemedicina para clínicas e consultórios médicos.',
        email: 'contato@bhhealthtech.com.br',
        phone: '(31) 3220-4400',
        whatsapp: '(31) 99444-5555',
        website: 'https://bhhealthtech.com.br',
        cep: '30130-110',
        address: 'Av. Afonso Pena, 1500, Funcionários',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        zone: 'Centro-Sul',
        neighborhood: 'Funcionários',
        status: 'aprovado',
      },
      {
        name: 'Doces de Minas Tradicionais',
        type: 'produto',
        description:
          'Doce de leite artesanal em tacho de cobre, goiabadas cascão e queijos canastra curados com registro de Indicação Geográfica.',
        email: 'contato@docesdeminastradicionais.com.br',
        phone: '(31) 3450-8900',
        whatsapp: '(31) 98777-6655',
        website: 'https://docesdeminastradicionais.com.br',
        cep: '30111-010',
        address: 'Av. Contorno, 6000, Savassi',
        city: 'Belo Horizonte',
        state: 'MG',
        country: 'Brasil',
        zone: 'Centro-Sul',
        neighborhood: 'Savassi',
        status: 'aprovado',
      },
      {
        name: 'SulLog Logística Integrada',
        type: 'empresa',
        description:
          'Soluções em transporte fracionado, armazenagem inteligente e distribuição multimodal no sul do Brasil.',
        email: 'contato@sullog.com.br',
        phone: '(41) 3300-8800',
        whatsapp: '(41) 99222-3344',
        website: 'https://sullog.com.br',
        cep: '80010-000',
        address: 'Rua XV de Novembro, 800, Centro',
        city: 'Curitiba',
        state: 'PR',
        country: 'Brasil',
        zone: 'Centro',
        neighborhood: 'Centro',
        status: 'aprovado',
      },
      {
        name: 'EcoVerde Cosméticos Naturais',
        type: 'produto',
        description:
          'Linha de cosméticos botânicos veganos, livres de parabenos e cruelty-free desenvolvidos com ativos da flora brasileira.',
        email: 'contato@ecoverde.eco.br',
        phone: '(41) 3244-1234',
        whatsapp: '(41) 98444-7788',
        website: 'https://ecoverde.eco.br',
        cep: '80240-000',
        address: 'Av. Batel, 1200, Batel',
        city: 'Curitiba',
        state: 'PR',
        country: 'Brasil',
        zone: 'Oeste',
        neighborhood: 'Batel',
        status: 'aprovado',
      },
      {
        name: 'Nordeste Solar Energia Limpa',
        type: 'negocio',
        description:
          'Instalação de painéis solares fotovoltaicos residenciais e comerciais com redução de até 95% na conta de luz.',
        email: 'contato@nordestesolar.com.br',
        phone: '(85) 3400-5000',
        whatsapp: '(85) 98666-1212',
        website: 'https://nordestesolar.com.br',
        cep: '60165-080',
        address: 'Av. Beira Mar, 2100, Meireles',
        city: 'Fortaleza',
        state: 'CE',
        country: 'Brasil',
        zone: 'Leste',
        neighborhood: 'Meireles',
        status: 'aprovado',
      },
    ]

    for (let data of seedListings) {
      const rec = new Record(listingsCol)
      rec.set('userId', adminUser.id)
      rec.set('name', data.name)
      rec.set('type', data.type)
      rec.set('description', data.description)
      rec.set('email', data.email)
      rec.set('phone', data.phone)
      rec.set('whatsapp', data.whatsapp)
      rec.set('website', data.website)
      rec.set('cep', data.cep)
      rec.set('address', data.address)
      rec.set('city', data.city)
      rec.set('state', data.state)
      rec.set('country', data.country)
      rec.set('zone', data.zone)
      rec.set('neighborhood', data.neighborhood)
      rec.set('status', data.status)
      rec.set('pinEnabled', false)
      app.save(rec)
    }
  },
  (app) => {
    try {
      const listings = app.findRecordsByFilter('listings', 'country = "Brasil"', '', 100, 0)
      for (let l of listings) {
        app.delete(l)
      }
    } catch (_) {}
  },
)
