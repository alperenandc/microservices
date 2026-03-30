const { ServiceUnavailableError } = require("../errors");

function createAuthMiddleware(authService) {
  return async (req, res, next) => {
    if (req.path.includes("/health")) {
      return next();
    }

    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({
        error: true,
        message: "Yetkilendirme hatasi: Gecerli bir token bulunamadi.",
      });
    }

    try {
      const isValid = await authService.validate(token);

      if (!isValid) {
        return res.status(401).json({
          error: true,
          message: "Yetkilendirme hatasi: Gecersiz veya suresi dolmus token.",
        });
      }

      return next();
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(502).json({
          error: true,
          message: "Bad Gateway - Auth Service ulasilamiyor",
        });
      }

      return res.status(500).json({
        error: true,
        message: "Auth dogrulamasi sirasinda beklenmeyen bir hata olustu.",
      });
    }
  };
}

module.exports = { createAuthMiddleware };
