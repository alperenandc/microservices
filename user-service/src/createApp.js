const express = require("express");
const morgan = require("morgan");
const { createConfig } = require("./config");
const { User } = require("./models/User");
const { UserRepository } = require("./repositories/UserRepository");
const { UserService } = require("./services/UserService");
const { UserController } = require("./controllers/UserController");
const { createInternalGatewayMiddleware } = require("./middleware/createInternalGatewayMiddleware");
const { createUserRoutes } = require("./routes/userRoutes");

function createApp(options = {}) {
  const config = options.config || createConfig();
  const userRepository = options.userRepository || new UserRepository(User);
  const userService = options.userService || new UserService(userRepository);
  const userController = options.userController || new UserController(userService);

  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(createInternalGatewayMiddleware(config.internalGatewayKey));
  app.use(createUserRoutes(userController));

  return { app };
}

module.exports = { createApp };
