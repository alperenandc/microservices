class ProductRepository {
  constructor(productModel) {
    this.productModel = productModel;
  }

  create(payload) {
    const product = new this.productModel(payload);
    return product.save();
  }

  findAll() {
    return this.productModel.find();
  }

  findById(id) {
    return this.productModel.findById(id);
  }

  updateById(id, payload) {
    return this.productModel.findByIdAndUpdate(id, payload, { new: true });
  }

  deleteById(id) {
    return this.productModel.findByIdAndDelete(id);
  }
}

module.exports = { ProductRepository };
