import express from 'express';
import { addUser, getUsers, deleteUser, getUserProfile, updateUserProfile } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';


const router = express.Router();

// Public registration route
router.post('/register', addUser);

router.get('/', authMiddleware , getUsers);

// Admin-only add (keeps existing behavior)
router.post('/add', authMiddleware, addUser);

router.delete('/:id', authMiddleware, deleteUser);
router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);

export default router;