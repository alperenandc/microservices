const express = require("express");

function createUserRoutes(userController) {
  const router = express.Router();

  router.get("/health", userController.health);
  router.post("/api/users", userController.createUser);
  router.get("/api/users", userController.listUsers);
  router.get("/api/users/:id", userController.getUserById);
  router.put("/api/users/:id", userController.updateUser);
  router.delete("/api/users/:id", userController.deleteUser);

  return router;
}

module.exports = { createUserRoutes };
