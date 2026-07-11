import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerUser, addUser, getUsers, deleteUser, updateUser, getUserProfile, updateUserProfile, bulkDeleteUsers, uploadAvatar } from '../controllers/userController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
    destination: path.join(__dirname, '../uploads/avatars/'),
    filename: (req, file, cb) => {
        cb(null, `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`);
    }
});
const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images allowed'));
    }
});

const requireAdmin = (req, res, next) => {
    if (req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Admin access required' });
    }
    next();
};

// Public registration route
router.post('/register', registerUser);

router.get('/profile', authMiddleware, getUserProfile);
router.put('/profile', authMiddleware, updateUserProfile);
router.post('/profile/avatar', authMiddleware, upload.single('avatar'), uploadAvatar);

router.get('/', authMiddleware, requireAdmin, getUsers);
router.post('/add', authMiddleware, requireAdmin, addUser);
router.put('/:id', authMiddleware, requireAdmin, updateUser);
router.delete('/:id', authMiddleware, requireAdmin, deleteUser);
router.delete('/', authMiddleware, requireAdmin, bulkDeleteUsers);

export default router;