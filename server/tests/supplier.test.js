import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import Supplier from '../models/Supplier.js';
import * as supplierController from '../controllers/supplierController.js';
import { connect, closeDatabase, clearDatabase } from './test-setup.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

describe('Supplier controller', () => {
  beforeAll(async () => { await connect(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  it('should add a supplier with required fields', async () => {
    const req = { body: { name: 'Acme', email: 'acme@example.com', number: '12345', address: 'Street 1' } };
    const res = mockRes();
    await supplierController.addSupplier(req, res);
    expect(res.payload.success).toBe(true);
    expect(res.payload.supplier.email).toBe('acme@example.com');
    const suppliers = await Supplier.find();
    expect(suppliers.length).toBe(1);
  });

  it('should not add supplier without required fields', async () => {
    const req = { body: { name: '', email: '', number: '' } };
    const res = mockRes();
    await supplierController.addSupplier(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.success).toBe(false);
  });

  it('should prevent duplicate supplier by email', async () => {
    await Supplier.create({ name: 'A', email: 'a@x.com', number: '1' });
    const req = { body: { name: 'B', email: 'a@x.com', number: '2' } };
    const res = mockRes();
    await supplierController.addSupplier(req, res);
    expect(res.statusCode).toBe(409);
    expect(res.payload.success).toBe(false);
  });

});
