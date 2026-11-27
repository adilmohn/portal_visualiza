/**
 * mailer.js — helper de envio de e-mails transacionais (PT-BR).
 *
 * IMPORTANTE (regra da plataforma): callbacks em routerAdd/cronAdd executam em
 * VM pool separado no PocketBase JSVM — helpers de nível superior NÃO podem ser
 * chamados dentro dos callbacks. Por isso, cada hook que envia e-mail copia o
 * corpo de `sendListingStatusEmail`/`sendReviewApprovedEmail`/`sendVoucherEmail`
 * inline no seu callback (padrão já usado pelos demais hooks do projeto).
 *
 * Este arquivo existe apenas como REFERÊNCIA do template dos e-mails.
 * Os textos abaixo são a fonte usada nos hooks:
 *
 * Aprovação:  "Seu anúncio foi aprovado!" / corpo com nome do anúncio.
 * Rejeição:   "Seu anúncio foi rejeitado" / corpo inclui o motivo da rejeição.
 * Avaliação:  "Sua avaliação foi publicada!" / corpo com o nome do anúncio.
 * Voucher:    "Seu voucher foi gerado!" / corpo com o código VIAB-XXXXXX.
 *
 * Envio (não-bloqueante, dentro do callback):
 *   try {
 *     const mail = $app.newMailClient()
 *     mail.send({
 *       from: { address: $app.settings().meta.senderAddress, name: $app.settings().meta.senderName },
 *       to: [{ address: ownerEmail }],
 *       subject: '...',
 *       html: '<p>...</p>',
 *     })
 *   } catch (mailErr) {
 *     console.error('[mailer] falha ao enviar e-mail:', mailErr)
 *   }
 *
 * Se o SMTP não estiver configurado, $app.newMailClient().send falha e o catch
 * registra o motivo no log sem interromper o fluxo principal do hook.
 */
