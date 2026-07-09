import express from 'express';
import { addOrder, getOrders, updateOrderStatus, cancelOrder, restoreOrder } from '../controllers/orderController.js';
import authMiddleware from '../middleware/authMiddleware.js';
const router = express.Router();

router.post('/add', authMiddleware, addOrder);
router.get('/', authMiddleware, getOrders);
router.patch('/:id/status', authMiddleware, updateOrderStatus);
router.patch('/:id/cancel', authMiddleware, cancelOrder);
router.patch('/:id/restore', authMiddleware, restoreOrder);

export default router;