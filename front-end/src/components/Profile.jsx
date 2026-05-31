import { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        address: '',
        password: ''
    });

    const [edit, setEdit] = useState(false);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const response = await axios.get('/api/users/profile', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('POS_token')}`
                }
            });

            if (response.data.success) {
                setUser((prev) => ({
                    ...prev,
                    name: response.data.user.name,
                    email: response.data.user.email,
                    address: response.data.user.address
                }));
            }
        } catch (error) {
            console.log("Error fetching user profile", error);
        }
    };

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        setEdit(true);
    };

    const handleCancelClick = (e) => {
        e.preventDefault();
        setEdit(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.put('/api/users/profile', user, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('POS_token')}`
                }
            });

            if (response.data.success) {
                alert("Profile updated successfully");
                setEdit(false);
            }
        } catch (error) {
            console.log("Failed to update profile", error);
            alert("Failed to update profile");
        }
    };

    return (
        <div className="p-4">

            {/* Header */}
            <div className="font-bold text-xl mb-4">
                Profile
            </div>

            {/* Form Container */}
            <form
                onSubmit={handleSubmit}
                className="bg-white p-6 rounded shadow space-y-4"
            >

                {/* Name */}
                <div>
                    <label className="block mb-1 font-medium">
                        Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={user.name}
                        onChange={handleChange}
                        disabled={!edit}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Email */}
                <div>
                    <label className="block mb-1 font-medium">
                        Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={user.email}
                        onChange={handleChange}
                        disabled={!edit}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Address */}
                <div>
                    <label className="block mb-1 font-medium">
                        Address
                    </label>
                    <input
                        type="text"
                        name="address"
                        value={user.address}
                        onChange={handleChange}
                        disabled={!edit}
                        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                </div>

                {/* Password */}
                {edit && (
                    <div>
                        <label className="block mb-1 font-medium">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={user.password}
                            onChange={handleChange}
                            placeholder="Optional"
                            className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 pt-2">

                    {!edit ? (
                        <button
                            type="button"
                            onClick={handleEditClick}
                            className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                        >
                            Edit Profile
                        </button>
                    ) : (
                        <>
                            <button
                                type="submit"
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                            >
                                Save
                            </button>

                            <button
                                type="button"
                                onClick={handleCancelClick}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Cancel
                            </button>
                        </>
                    )}

                </div>

            </form>
        </div>
    );
};

export default Profile;