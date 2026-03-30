class AuthUserRepository {
  constructor(authUserModel) {
    this.authUserModel = authUserModel;
  }

  findByCredentials(username, password) {
    return this.authUserModel.findOne({ username, password });
  }

  seedDefaultUser(username, password) {
    return this.authUserModel.updateOne(
      { username },
      { $setOnInsert: { username, password } },
      { upsert: true }
    );
  }
}

module.exports = { AuthUserRepository };
