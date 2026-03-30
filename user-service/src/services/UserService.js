class UserService {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  createUser(payload) {
    return this.userRepository.create(payload);
  }

  listUsers() {
    return this.userRepository.findAll();
  }

  getUserById(id) {
    return this.userRepository.findById(id);
  }

  updateUser(id, payload) {
    return this.userRepository.updateById(id, payload);
  }

  deleteUser(id) {
    return this.userRepository.deleteById(id);
  }
}

module.exports = { UserService };
