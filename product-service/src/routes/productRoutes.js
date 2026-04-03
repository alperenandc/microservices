const express = require("express");

function createProductRoutes(productController) {
  const router = express.Router();

  router.get("/health", productController.health);
  router.post("/api/products", productController.createProduct);
  router.get("/api/products", productController.listProducts);
  router.get("/api/products/:id", productController.getProductById);
  router.put("/api/products/:id", productController.updateProduct);
  router.delete("/api/products/:id", productController.deleteProduct);

  return router;
}

module.exports = { createProductRoutes };
