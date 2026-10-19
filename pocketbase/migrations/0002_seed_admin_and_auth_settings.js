migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // Ensure password auth is enabled and settings match requirements
    users.passwordAuth.enabled = true
    users.passwordAuth.identityFields = ['email']

    // Seed initial user if not exists
    try {
      app.findAuthRecordByEmail('_pb_users_auth_', 'cadastro@inovacore.com.br')
      return
    } catch (_) {}

    const record = new Record(users)
    record.setEmail('cadastro@inovacore.com.br')
    record.setPassword('Skip@Pass')
    record.setVerified(true)
    record.set('name', 'Administrador')
    record.set('role', 'admin')
    app.save(record)
  },
  (app) => {
    try {
      const record = app.findAuthRecordByEmail('_pb_users_auth_', 'cadastro@inovacore.com.br')
      app.delete(record)
    } catch (_) {}
  },
)
