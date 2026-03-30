const express = require("express");
const morgan = require("morgan");
const { createConfig } = require("./config");
const { Product } = require("./models/Product");
const { ProductRepository } = require("./repositories/ProductRepository");
const { ProductService } = require("./services/ProductService");
const { ProductController } = require("./controllers/ProductController");
const { createInternalGatewayMiddleware } = require("./middleware/createInternalGatewayMiddleware");
const { createProductRoutes } = require("./routes/productRoutes");

function createApp(options = {}) {
  const config = options.config || createConfig();
  const productRepository =
    options.productRepository || new ProductRepository(Product);
  const productService =
    options.productService || new ProductService(productRepository);
  const productController =
    options.productController || new ProductController(productService);

  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(createInternalGatewayMiddleware(config.internalGatewayKey));
  app.use(createProductRoutes(productController));

  return { app };
}

module.exports = { createApp };
