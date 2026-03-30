class UserRepository {
  constructor(userModel) {
    this.userModel = userModel;
  }

  create(payload) {
    const user = new this.userModel(payload);
    return user.save();
  }

  findAll() {
    return this.userModel.find();
  }

  findById(id) {
    return this.userModel.findById(id);
  }

  updateById(id, payload) {
    return this.userModel.findByIdAndUpdate(id, payload, { new: true });
  }

  deleteById(id) {
    return this.userModel.findByIdAndDelete(id);
  }
}

module.exports = { UserRepository };
