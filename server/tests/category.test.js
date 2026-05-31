import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import Category from '../models/Category.js';
import * as categoryController from '../controllers/categoryController.js';
import { connect, closeDatabase, clearDatabase } from './test-setup.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

describe('Category controller', () => {
  beforeAll(async () => { await connect(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  it('should add a new category', async () => {
    const req = { body: { categoryName: 'Food', categoryDescription: 'Edible items' } };
    const res = mockRes();
    await categoryController.addCategory(req, res);
    expect(res.payload.success).toBe(true);
    expect(res.payload.message).toMatch(/added successfully/i);
    const categories = await Category.find();
    expect(categories.length).toBe(1);
  });

  it('should not add duplicate category', async () => {
    await Category.create({ categoryName: 'Food', categoryDescription: 'x' });
    const req = { body: { categoryName: 'Food', categoryDescription: 'Edible' } };
    const res = mockRes();
    await categoryController.addCategory(req, res);
    expect(res.payload.success).toBe(false);
    expect(res.payload.message).toMatch(/already exist/i);
  });

  it('should get categories', async () => {
    await Category.create({ categoryName: 'Beverages', categoryDescription: 'Drinks' });
    const req = {};
    const res = mockRes();
    await categoryController.getCategories(req, res);
    expect(res.payload.success).toBe(true);
    expect(Array.isArray(res.payload.categories)).toBe(true);
    expect(res.payload.categories.length).toBe(1);
  });

});
