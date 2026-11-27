// pocketbase/hooks/moderation_emails.js
//
// E-mails automáticos de moderação (PT-BR), todos enviados pelo cliente de
// e-mail padrão do PocketBase ($app.newMailClient().send(new MailerMessage(...))).
// O SMTP do próprio cliente (mail.viabilizeseuconcurso.com.br, porta 587
// STARTTLS) é configurado na migration 0013_configure_smtp_settings.js, com as
// credenciais lidas dos SEGREDS do backend — nada é hardcoded em código.
//
// 1. Anúncio APROVADO  -> e-mail ao dono (usuário do listing) com nome do anúncio.
// 2. Anúncio REJEITADO -> e-mail ao dono incluindo o MOTIVO salvo na rejeição.
// 3. Avaliação APROVADA -> e-mail ao autor da avaliação (rota de moderação /admin).
//
// REGRA DA PLATAFORMA (PocketBase JSVM): callbacks em routerAdd/onRecord*Success
// executam em VM pool separado — toda a lógica fica INLINE no corpo de cada
// callback (helpers de nível superior causam ReferenceError e bloqueiam o deploy).
//
// Envio NUNCA quebra a operação principal: cada envio está em try/catch e uma
// falha SMTP é apenas logada, sem impedir aprovação/rejeição.

// ---------------------------------------------------------------------------
// 1) e 2) Moderação de anúncios (coleção "listings"): aprovado / rejeitado
// ---------------------------------------------------------------------------
onRecordAfterUpdateSuccess((e) => {
  try {
    const rec = e.record
    const orig = rec.original()
    const newStatus = rec.getString('status')
    const oldStatus = orig.getString('status')

    // Só envia quando o status realmente muda para aprovado/rejeitado
    if (newStatus === oldStatus) {
      return e.next()
    }
    if (newStatus !== 'aprovado' && newStatus !== 'rejeitado') {
      return e.next()
    }

    const subject =
      newStatus === 'aprovado' ? 'Seu anúncio foi aprovado!' : 'Seu anúncio foi rejeitado'

    const listingName = rec.getString('name') || 'seu anúncio'
    const rejectReason = rec.getString('rejectedReason')

    let ownerEmail = ''
    try {
      const owner = $app.findRecordById('users', rec.getString('userId'))
      ownerEmail = owner.email()
    } catch (ownerErr) {
      console.warn('[moderation emails] Não foi possível carregar o dono do anúncio:', ownerErr)
    }

    if (!ownerEmail) {
      console.warn(
        '[moderation emails] E-mail do dono ausente — e-mail de ' + newStatus + ' não enviado.',
      )
      return e.next()
    }

    let html = ''
    let text = ''
    if (newStatus === 'aprovado') {
      html =
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">' +
        '<h2 style="margin:0 0 12px;">Seu anúncio foi aprovado! 🎉</h2>' +
        '<p>Olá!</p>' +
        '<p>Boas notícias: o anúncio <strong>' +
        listingName +
        '</strong> foi aprovado pela moderação do Portal Viabilize e <strong>já está visível no diretório</strong>.</p>' +
        '<p>Agora novos clientes podem encontrar o seu negócio e entrar em contato.</p>' +
        '<p>Atenciosamente,<br/><strong>Portal Viabilize</strong></p>' +
        '</div>'
      text =
        'Seu anúncio foi aprovado!\n\n' +
        'Boas notícias: o anúncio ' +
        listingName +
        ' foi aprovado pela moderação do Portal Viabilize e já está visível no diretório.\n' +
        'Agora novos clientes podem encontrar o seu negócio e entrar em contato.\n\n' +
        'Atenciosamente,\nPortal Viabilize'
    } else {
      html =
        '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">' +
        '<h2 style="margin:0 0 12px;">Seu anúncio foi rejeitado</h2>' +
        '<p>Olá!</p>' +
        '<p>Infelizmente o anúncio <strong>' +
        listingName +
        '</strong> não foi aprovado pela moderação do Portal Viabilize.</p>' +
        '<p><strong>Motivo:</strong> ' +
        (rejectReason || 'não informado') +
        '</p>' +
        '<p>Você pode editar as informações do anúncio e reenviá-lo para aprovação pela sua <strong>Minha Área</strong>.</p>' +
        '<p>Atenciosamente,<br/><strong>Portal Viabilize</strong></p>' +
        '</div>'
      text =
        'Seu anúncio foi rejeitado\n\n' +
        'Infelizmente o anúncio ' +
        listingName +
        ' não foi aprovado pela moderação do Portal Viabilize.\n' +
        'Motivo: ' +
        (rejectReason || 'não informado') +
        '\n' +
        'Você pode editar as informações do anúncio e reenviá-lo para aprovação pela sua Minha Área.\n\n' +
        'Atenciosamente,\nPortal Viabilize'
    }

    try {
      const settings = $app.settings()
      $app.newMailClient().send(
        new MailerMessage({
          from: {
            address: settings.meta.senderAddress || 'cadastro@viabilizeseuconcurso.com.br',
            name: settings.meta.senderName || 'Portal Viabilize',
          },
          to: [{ address: ownerEmail }],
          subject: subject,
          html: html,
          text: text,
        }),
      )
      console.log('[moderation emails] E-mail de ' + newStatus + ' enviado para ' + ownerEmail)
    } catch (mailErr) {
      // Falha de SMTP NÃO impede a aprovação/rejeição — apenas loga.
      console.error(
        '[moderation emails] Falha ao enviar e-mail de ' + newStatus + ' (operação não afetada):',
        mailErr,
      )
    }
  } catch (err) {
    console.error('[moderation emails] Erro no hook de listings (operação não afetada):', err)
  }
  return e.next()
}, 'listings')

// ---------------------------------------------------------------------------
// 3) Avaliação APROVADA (rota de moderação de reviews no /admin)
// ---------------------------------------------------------------------------
routerAdd(
  'POST',
  '/backend/v1/admin/reviews/{id}/approve',
  (e) => {
    try {
      const authRecord = e.auth || e.requestInfo().auth
      if (!authRecord || authRecord.getString('role') !== 'admin') {
        return e.json(403, { message: 'Acesso negado. Apenas administradores.' })
      }

      const reviewId = e.request.pathValue('id')
      if (!reviewId) {
        return e.json(400, { message: 'ID da avaliação é obrigatório.' })
      }

      let review
      try {
        review = $app.findRecordById('reviews', reviewId)
      } catch (_) {
        return e.json(404, { message: 'Avaliação não encontrada.' })
      }

      review.set('status', 'aprovado')
      $app.save(review)

      // E-mail ao autor da avaliação (não-bloqueante, tudo inline neste callback)
      try {
        let authorEmail = ''
        let listingName = 'o anúncio'
        try {
          const author = $app.findRecordById('users', review.getString('userId'))
          authorEmail = author.email()
        } catch (_) {}
        try {
          const listing = $app.findRecordById('listings', review.getString('listingId'))
          listingName = listing.getString('name') || 'o anúncio'
        } catch (_) {}

        if (authorEmail) {
          const settings = $app.settings()
          $app.newMailClient().send(
            new MailerMessage({
              from: {
                address: settings.meta.senderAddress || 'cadastro@viabilizeseuconcurso.com.br',
                name: settings.meta.senderName || 'Portal Viabilize',
              },
              to: [{ address: authorEmail }],
              subject: 'Sua avaliação foi publicada!',
              html:
                '<div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.6;">' +
                '<h2 style="margin:0 0 12px;">Sua avaliação foi publicada!</h2>' +
                '<p>Olá!</p>' +
                '<p>A sua avaliação do anúncio <strong>' +
                listingName +
                '</strong> foi aprovada pela moderação e <strong>já está publicada</strong> no Portal Viabilize.</p>' +
                '<p>Obrigado por ajudar outros usuários a escolherem melhor!</p>' +
                '<p>Atenciosamente,<br/><strong>Portal Viabilize</strong></p>' +
                '</div>',
              text:
                'Sua avaliação foi publicada!\n\n' +
                'A sua avaliação do anúncio ' +
                listingName +
                ' foi aprovada pela moderação e já está publicada no Portal Viabilize.\n' +
                'Obrigado por ajudar outros usuários a escolherem melhor!\n\n' +
                'Atenciosamente,\nPortal Viabilize',
            }),
          )
          console.log(
            '[moderation emails] E-mail de avaliação aprovada enviado para ' + authorEmail,
          )
        } else {
          console.warn(
            '[moderation emails] E-mail do autor da avaliação ausente — e-mail não enviado.',
          )
        }
      } catch (mailErr) {
        // Falha de SMTP NÃO impede a aprovação da avaliação — apenas loga.
        console.error(
          '[moderation emails] Falha ao enviar e-mail de avaliação aprovada (operação não afetada):',
          mailErr,
        )
      }

      // Audit log
      try {
        const auditCol = $app.findCollectionByNameOrId('auditLog')
        const log = new Record(auditCol)
        log.set('adminId', authRecord.id)
        log.set('action', 'approve_review')
        log.set('targetId', reviewId)
        log.set('reason', 'Avaliação aprovada pelo moderador')
        $app.save(log)
      } catch (logErr) {
        console.warn('Falha ao registrar auditoria de aprovação de review:', logErr)
      }

      return e.json(200, {
        success: true,
        id: review.id,
        status: review.getString('status'),
      })
    } catch (err) {
      return e.json(500, {
        message: 'Erro interno ao aprovar avaliação.',
        error: err ? err.message : '',
      })
    }
  },
  $apis.requireAuth(),
)
