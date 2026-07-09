import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, address } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist" });
        }

        const hashPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            name,
            email,
            password: hashPassword,
            address,
            role: 'customer',
            status: 'active'
        });

        await newUser.save();
        
        res.status(200).json({ message: "User registered successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const addUser = async (req, res) => {
    try {
        const { name, email, password, address, role, status } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist" });
        }

        const hashPassword = await bcrypt.hash(password, 10);
        const roleValue = role === 'admin' ? 'admin' : 'customer';
        const statusValue = status === 'disabled' ? 'disabled' : 'active';

        const newUser = new User({
            name,
            email,
            password: hashPassword,
            address,
            role: roleValue,
            status: statusValue
        });

        await newUser.save();
        
        res.status(200).json({ message: "User added successfully" });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getUsers = async (req, res) => {
    try {
        const { search, role, status, sortBy, order } = req.query;
        const query = {};

        if (search) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [
                { name: regex },
                { email: regex },
                { address: regex },
                { role: regex }
            ];
        }

        if (role) {
            query.role = role;
        }

        if (status) {
            query.status = status;
        }

        const sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = order === 'desc' ? -1 : 1;
        }

        const users = await User.find(query)
            .select('-password')
            .sort(Object.keys(sortOptions).length ? sortOptions : { createdAt: -1 });

        res.status(200).json({ success: true, users });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        
        await User.findByIdAndDelete(id);
        
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

export const bulkDeleteUsers = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: "No users selected for deletion" });
        }

        await User.deleteMany({ _id: { $in: ids } });

        res.status(200).json({ message: "Users deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, address, role, status, password } = req.body;

        const updateData = { name, email, address, role, status };

        if (password && password.trim() !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        return res.status(200).json({ success: true, user });
    } catch (error) {
        console.error("Error fetching user profile", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const { name, email, address, password } = req.body;

        const updateData = { name, email, address };

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            updateData, 
            { new: true }
        ).select('-password');

        return res.status(200).json({ success: true, user: updatedUser, message: "Profile updated successfully" });
    } catch (error) {
        console.error("Error updating user profile", error);
        return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
};