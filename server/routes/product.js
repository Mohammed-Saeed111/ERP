import express from 'express';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct 
} from '../controllers/productController.js';

import authMiddleware from '../middleware/authMiddleware.js'; 

const router = express.Router();

// GET: Fetch all products
router.get('/', authMiddleware, getProducts);

// POST: Add new product
router.post('/add', authMiddleware, addProduct);

// PUT: Update product by ID
router.put('/:id', authMiddleware, updateProduct);

// DELETE: Soft delete product
router.delete('/:id', authMiddleware, deleteProduct);

export default router;