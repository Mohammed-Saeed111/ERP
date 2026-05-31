import express from 'express';
import { addOrder, getOrders } from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/add', authMiddleware, addOrder);

router.get('/', authMiddleware, getOrders);

export default router;