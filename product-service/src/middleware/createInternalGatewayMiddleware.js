function createInternalGatewayMiddleware(internalGatewayKey) {
  return (req, res, next) => {
    if (req.path === "/health") {
      return next();
    }

    const gatewayKey = req.headers["x-internal-gateway-key"];

    if (gatewayKey !== internalGatewayKey) {
      return res.status(403).json({
        error: true,
        message: "Bu servise sadece dispatcher uzerinden erisilebilir.",
      });
    }

    return next();
  };
}

module.exports = { createInternalGatewayMiddleware };
