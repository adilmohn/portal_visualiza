// pocketbase/hooks/mailer.js
//
// E-mails transacionais (PT-BR) do Portal Viabilize, enviados pelo cliente de
// e-mail padrão do PocketBase ($app.newMailClient().send(new MailerMessage(...))).
// O SMTP (mail.viabilizeseuconcurso.com.br, porta 587 STARTTLS, conta
// cadastro@viabilizeseuconcurso.com.br) é configurado na migration
// 0013_configure_smtp_settings.js, lendo as credenciais dos SEGREDS do backend
// (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_SENDER_EMAIL,
// SMTP_SENDER_NAME) — nada é hardcoded em código.
//
// REGRA DA PLATAFORMA (PocketBase JSVM): callbacks em routerAdd/cronAdd e hooks
// de coleção executam em VM pool separado — lógica de nível superior NÃO pode
// ser chamada dentro dos callbacks. Por isso todo o código de envio é escrito
// inline dentro de cada callback (padrão dos demais hooks do projeto).
//
// Envio NUNCA quebra a operação principal: cada envio está em try/catch e uma
// falha SMTP é apenas logada (console.error/warn), sem interromper aprovação,
// rejeição ou geração de voucher.
//
// Textos de referência dos templates (PT-BR, assinados "Portal Viabilize"):
//   Aprovação: "Seu anúncio foi aprovado!" / corpo com nome do anúncio.
//   Rejeição:  "Seu anúncio foi rejeitado" / corpo inclui o motivo.
//   Avaliação: "Sua avaliação foi publicada!" / corpo com o nome do anúncio.
//   Voucher:   "Seu voucher foi gerado!" / corpo com o código VIAB-XXXXXX.
