const { ServiceUnavailableError } = require("../errors");

function createLoginHandler(authService) {
  return async (req, res) => {
    try {
      const response = await authService.login(req.body);
      return res.status(response.status).json(response.data);
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(502).json({
          error: true,
          message: "Bad Gateway - Auth Service ulasilamiyor",
        });
      }

      return res.status(500).json({
        error: true,
        message: "Login yonlendirmesi sirasinda beklenmeyen bir hata olustu.",
      });
    }
  };
}

module.exports = { createLoginHandler };
