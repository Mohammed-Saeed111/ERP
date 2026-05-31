import { describe, beforeAll, afterAll, beforeEach, it, expect } from '@jest/globals';
import User from '../models/User.js';
import * as userController from '../controllers/userController.js';
import { connect, closeDatabase, clearDatabase } from './test-setup.js';

const mockRes = () => {
  const res = {};
  res.status = (code) => { res.statusCode = code; return res; };
  res.json = (payload) => { res.payload = payload; return res; };
  return res;
};

describe('User controller', () => {
  beforeAll(async () => { await connect(); });
  afterAll(async () => { await closeDatabase(); });
  beforeEach(async () => { await clearDatabase(); });

  it('should add a user with required fields', async () => {
    const req = { body: { name: 'Alice', email: 'alice@example.com', password: 'secret123', address: 'Street 1', role: 'customer' } };
    const res = mockRes();
    await userController.addUser(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.message).toMatch(/added successfully/i);
    const users = await User.find();
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('alice@example.com');
  });

  it('should not add a user with duplicate email', async () => {
    await User.create({ name: 'Bob', email: 'bob@example.com', password: 'hashed', role: 'customer' });
    const req = { body: { name: 'Bob2', email: 'bob@example.com', password: 'secret123', role: 'customer' } };
    const res = mockRes();
    await userController.addUser(req, res);
    expect(res.statusCode).toBe(400);
    expect(res.payload.message).toMatch(/already exist/i);
  });

  it('should get users', async () => {
    await User.create({ name: 'C', email: 'c@example.com', password: 'secret1', role: 'customer' });
    const req = {};
    const res = mockRes();
    await userController.getUsers(req, res);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.payload.user)).toBe(true);
    expect(res.payload.user.length).toBe(1);
  });

  it('should delete a user by id', async () => {
    const u = await User.create({ name: 'D', email: 'd@example.com', password: 'secret1', role: 'customer' });
    const req = { params: { id: u._id.toString() } };
    const res = mockRes();
    await userController.deleteUser(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.payload.message).toMatch(/deleted successfully/i);
    const users = await User.find();
    expect(users.length).toBe(0);
  });

});
