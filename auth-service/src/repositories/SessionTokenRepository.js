class SessionTokenRepository {
  constructor(sessionTokenModel) {
    this.sessionTokenModel = sessionTokenModel;
  }

  createSession(session) {
    return this.sessionTokenModel.create(session);
  }

  findActiveToken(token) {
    return this.sessionTokenModel.findOne({ token, active: true });
  }
}

module.exports = { SessionTokenRepository };
