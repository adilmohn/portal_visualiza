// 0013_configure_smtp_settings.js
//
// Configura o SMTP do próprio cliente (mail.viabilizeseuconcurso.com.br, porta
// 587 STARTTLS) nas configurações do PocketBase, lendo as credenciais dos
// SEGREDS do backend ($os.getenv) — nada é hardcoded no código.
//
// Com isso, os hooks enviam e-mail com o cliente padrão do PocketBase:
//   $app.newMailClient().send(new MailerMessage({...}))
//
// Idempotente: reaplica os valores a cada execução (safe em replays).
migrate(
  (app) => {
    const host = $os.getenv('SMTP_HOST') || ''
    const port = parseInt($os.getenv('SMTP_PORT') || '587', 10) || 587
    const username = $os.getenv('SMTP_USERNAME') || ''
    const password = $os.getenv('SMTP_PASSWORD') || ''
    const senderEmail = $os.getenv('SMTP_SENDER_EMAIL') || username || ''
    const senderName = $os.getenv('SMTP_SENDER_NAME') || 'Portal Viabilize'

    if (!host || !username || !password) {
      console.log('[0013] Segredos SMTP ausentes — configurações de e-mail não alteradas.')
      return
    }

    const settings = app.settings()
    settings.smtp.enabled = true
    settings.smtp.host = host
    settings.smtp.port = port
    settings.smtp.username = username
    settings.smtp.password = password
    settings.smtp.authMethod = 'PLAIN'
    settings.meta.senderAddress = senderEmail
    settings.meta.senderName = senderName
    app.save(settings)

    console.log(
      '[0013] SMTP configurado para ' + host + ':' + port + ' (remetente ' + senderEmail + ')',
    )
  },
  (app) => {
    // down: desabilita o SMTP externo (mantém as demais configurações)
    const settings = app.settings()
    settings.smtp.enabled = false
    app.save(settings)
  },
)
