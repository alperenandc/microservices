class ProductController {
  constructor(productService) {
    this.productService = productService;
  }

  health = (req, res) => {
    res.status(200).json({ status: "UP", service: "product-service" });
  };

  createProduct = async (req, res) => {
    try {
      const product = await this.productService.createProduct(req.body);
      return res.status(201).json(product);
    } catch (error) {
      return res.status(400).json({ error: true, message: error.message });
    }
  };

  listProducts = async (req, res) => {
    try {
      const products = await this.productService.listProducts();
      return res.status(200).json(products);
    } catch (error) {
      return res.status(500).json({ error: true, message: "Sunucu hatasi" });
    }
  };

  getProductById = async (req, res) => {
    try {
      const product = await this.productService.getProductById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: true, message: "Urun bulunamadi" });
      }

      return res.status(200).json(product);
    } catch (error) {
      return res.status(400).json({ error: true, message: "Gecersiz ID formati" });
    }
  };

  updateProduct = async (req, res) => {
    try {
      const updatedProduct = await this.productService.updateProduct(
        req.params.id,
        req.body
      );

      if (!updatedProduct) {
        return res.status(404).json({ error: true, message: "Urun bulunamadi" });
      }

      return res.status(200).json(updatedProduct);
    } catch (error) {
      return res.status(400).json({ error: true, message: "Guncelleme hatasi" });
    }
  };

  deleteProduct = async (req, res) => {
    try {
      const deletedProduct = await this.productService.deleteProduct(req.params.id);

      if (!deletedProduct) {
        return res.status(404).json({ error: true, message: "Urun bulunamadi" });
      }

      return res.status(204).send();
    } catch (error) {
      return res.status(400).json({ error: true, message: "Silme hatasi" });
    }
  };
}

module.exports = { ProductController };
