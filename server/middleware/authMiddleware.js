import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const authMiddleware = async (request, response, next) => {
    try {
        const authHeader = request.headers.authorization || request.headers.Authorization;

        if (!authHeader) {
            return response.status(401).json({
                success: false,
                message: 'no token provided'
            });
        }

        const parts = authHeader.split(' ');
        const token = parts.length === 2 ? parts[1] : null;

        if (!token) {
            return response.status(401).json({
                success: false,
                message: 'no token provided'
            });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            return response.status(401).json({
                success: false,
                message: 'invalid or expired token'
            });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return response.status(404).json({
                success: false,
                message: 'user not found'
            });
        }

        request.user = user;
        next();

    } catch (error) {
        console.error('authMiddleware error:', error);
        return response.status(500).json({
            success: false,
            message: 'internal server error'
        });
    }
};

export default authMiddleware;