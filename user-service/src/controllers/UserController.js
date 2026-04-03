class UserController {
  constructor(userService) {
    this.userService = userService;
  }

  health = (req, res) => {
    res.status(200).json({ status: "UP", service: "user-service" });
  };

  createUser = async (req, res) => {
    try {
      const user = await this.userService.createUser(req.body);
      return res.status(201).json(user);
    } catch (error) {
      return res.status(400).json({ error: true, message: error.message });
    }
  };

  listUsers = async (req, res) => {
    try {
      const users = await this.userService.listUsers();
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: true, message: "Sunucu hatasi" });
    }
  };

  getUserById = async (req, res) => {
    try {
      const user = await this.userService.getUserById(req.params.id);

      if (!user) {
        return res
          .status(404)
          .json({ error: true, message: "Kullanici bulunamadi" });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(400).json({ error: true, message: "Gecersiz ID formati" });
    }
  };

  updateUser = async (req, res) => {
    try {
      const updatedUser = await this.userService.updateUser(req.params.id, req.body);

      if (!updatedUser) {
        return res
          .status(404)
          .json({ error: true, message: "Kullanici bulunamadi" });
      }

      return res.status(200).json(updatedUser);
    } catch (error) {
      return res.status(400).json({ error: true, message: "Guncelleme hatasi" });
    }
  };

  deleteUser = async (req, res) => {
    try {
      const deletedUser = await this.userService.deleteUser(req.params.id);

      if (!deletedUser) {
        return res
          .status(404)
          .json({ error: true, message: "Kullanici bulunamadi" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: true, message: "Silme hatasi" });
    }
  };
}

module.exports = { UserController };
