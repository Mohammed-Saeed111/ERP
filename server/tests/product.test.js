import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Supplier from '../models/Supplier.js';
import * as productController from '../controllers/productController.js';
import { connect, closeDatabase, clearDatabase } from './test-setup.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

const mockReq = (data = {}) => ({ body: data, params: data });

describe('Product controller', () => {
  beforeAll(async () => { await connect(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  it('should add a product', async () => {
    const category = await Category.create({ categoryName: 'Cat', categoryDescription: 'd' });
    const supplier = await Supplier.create({ name: 'Sup', email: 's@x.com', number: '123' });

    const req = mockReq({ name: 'P1', description: 'desc', price: 10, stock: 5, categoryId: category._id, supplierId: supplier._id });
    const res = mockRes();
    await productController.addProduct(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    const products = await Product.find();
    expect(products.length).toBe(1);
  });

  it('should get products with populated relations', async () => {
    const category = await Category.create({ categoryName: 'Cat2', categoryDescription: 'd' });
    const supplier = await Supplier.create({ name: 'Sup2', email: 's2@x.com', number: '123' });
    await Product.create({ name: 'P2', price: 5, stock: 1, categoryId: category._id, supplierId: supplier._id });

    const req = {};
    const res = mockRes();
    await productController.getProducts(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(Array.isArray(res.payload.products)).toBe(true);
    expect(res.payload.products.length).toBe(1);
    expect(res.payload.products[0].categoryId).toBeDefined();
  });

  it('should update a product', async () => {
    const category = await Category.create({ categoryName: 'C3', categoryDescription: 'd' });
    const product = await Product.create({ name: 'Old', price: 1, stock: 1, categoryId: category._id });
    const req = { params: { id: product._id }, body: { name: 'New', price: 2, stock: 3, categoryId: category._id } };
    const res = mockRes();
    await productController.updateProduct(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.success).toBe(true);
    expect(res.payload.product.name).toBe('New');
  });

  it('should delete (soft) a product', async () => {
    const category = await Category.create({ categoryName: 'C4', categoryDescription: 'd' });
    const product = await Product.create({ name: 'ToDel', price: 1, stock: 1, categoryId: category._id });
    const req = { params: { id: product._id } };
    const res = mockRes();
    await productController.deleteProduct(req, res);
    expect(res.statusCode).toBe(200);
    const p = await Product.findById(product._id);
    expect(p.isDeleted).toBe(true);
  });

});
