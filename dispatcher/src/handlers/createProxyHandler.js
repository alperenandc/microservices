const { ServiceUnavailableError } = require("../errors");

function createProxyHandler(routeProxyService, unavailableMessage) {
  return async (req, res) => {
    try {
      const response = await routeProxyService.forward(req);
      return res.status(response.status).json(response.data);
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        return res.status(502).json({
          error: true,
          message: unavailableMessage,
        });
      }

      return res.status(500).json({
        error: true,
        message: "Istek yonlendirilirken beklenmeyen bir hata olustu.",
      });
    }
  };
}

module.exports = { createProxyHandler };
