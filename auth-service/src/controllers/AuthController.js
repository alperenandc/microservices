class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  login = async (req, res) => {
    try {
      const result = await this.authService.login(
        req.body.username,
        req.body.password
      );
      return res.status(result.status).json(result.body);
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Auth servisinde beklenmeyen bir hata olustu.",
      });
    }
  };

  validate = async (req, res) => {
    try {
      const result = await this.authService.validate(req.headers.authorization);
      return res.status(result.status).json(result.body);
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Token dogrulanirken hata olustu.",
      });
    }
  };

  health = (req, res) => {
    res.status(200).json({ status: "UP", service: "auth-service" });
  };
}

module.exports = { AuthController };
