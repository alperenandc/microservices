class ProductService {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  createProduct(payload) {
    return this.productRepository.create(payload);
  }

  listProducts() {
    return this.productRepository.findAll();
  }

  getProductById(id) {
    return this.productRepository.findById(id);
  }

  updateProduct(id, payload) {
    return this.productRepository.updateById(id, payload);
  }

  deleteProduct(id) {
    return this.productRepository.deleteById(id);
  }
}

module.exports = { ProductService };
