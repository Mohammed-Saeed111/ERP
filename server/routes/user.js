import express from 'express';
import { registerUser, addUser, getUsers, deleteUser, updateUser, getUserProfile, updateUserProfile, bulkDeleteUsers } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Public registration route
router.post('/register', registerUser);

router.get('/', authMiddleware, requireAdmin, getUsers);
router.post('/add', authMiddleware, requireAdmin, addUser);
router.put('/:id', authMiddleware, requireAdmin, updateUser);
router.delete('/:id', authMiddleware, requireAdmin, deleteUser);
router.delete('/', authMiddleware, requireAdmin, bulkDeleteUsers);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

export default router;