const express = require("express");

function createAuthRoutes(authController) {
  const router = express.Router();

  router.get("/health", authController.health);
  router.post("/api/auth/login", authController.login);
  router.post("/api/auth/validate", authController.validate);

  return router;
}

module.exports = { createAuthRoutes };
