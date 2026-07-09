import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig.js';

const Profile = () => {
    const [user, setUser] = useState({
        name: '',
        email: '',
        address: '',
        password: ''
    });
    const [initialUser, setInitialUser] = useState({
        name: '',
        email: '',
        address: '',
        password: ''
    });
    const [edit, setEdit] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchUserProfile();
    }, []);

    useEffect(() => {
        if (!toast) return undefined;
        const timer = window.setTimeout(() => setToast(null), 3500);
        return () => window.clearTimeout(timer);
    }, [toast]);

    const fetchUserProfile = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/users/profile');

            if (response.data.success) {
                const profile = {
                    name: response.data.user.name || '',
                    email: response.data.user.email || '',
                    address: response.data.user.address || '',
                    password: ''
                };
                setUser(profile);
                setInitialUser(profile);
            }
        } catch (error) {
            console.log('Error fetching user profile', error);
            setToast({ type: 'error', message: error.response?.data?.message || 'Unable to load profile.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    const handleEditClick = () => {
        setEdit(true);
    };

    const handleCancelClick = () => {
        setEdit(false);
        setUser(initialUser);
    };

    const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user.name.trim()) {
            setToast({ type: 'error', message: 'Name is required.' });
            return;
        }

        if (!validateEmail(user.email)) {
            setToast({ type: 'error', message: 'Enter a valid email address.' });
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                name: user.name,
                email: user.email,
                address: user.address
            };

            if (user.password.trim()) {
                payload.password = user.password;
            }

            const response = await api.put('/api/users/profile', payload);

            if (response.data.success) {
                const updatedUser = {
                    name: response.data.user?.name || user.name,
                    email: response.data.user?.email || user.email,
                    address: response.data.user?.address || user.address,
                    password: ''
                };
                setUser(updatedUser);
                setInitialUser(updatedUser);
                setToast({ type: 'success', message: 'Profile updated successfully.' });
                setEdit(false);
            } else {
                setToast({ type: 'error', message: response.data.message || 'Failed to update profile.' });
            }
        } catch (error) {
            console.log('Failed to update profile', error);
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to update profile.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="p-4">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Profile</h1>
                    <p className="text-sm text-slate-500">Manage your account details and password.</p>
                </div>
                {!edit && (
                    <button
                        type="button"
                        onClick={handleEditClick}
                        className="rounded-3xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 transition"
                    >
                        Edit profile
                    </button>
                )}
            </div>

            {toast && (
                <div className={`mb-6 rounded-3xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                    {toast.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-sm space-y-4">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                        Loading profile...
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={user.name}
                                    onChange={handleChange}
                                    disabled={!edit}
                                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={user.email}
                                    onChange={handleChange}
                                    disabled={!edit}
                                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-slate-700">Address</label>
                            <input
                                type="text"
                                name="address"
                                value={user.address}
                                onChange={handleChange}
                                disabled={!edit}
                                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {edit && (
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={user.password}
                                    onChange={handleChange}
                                    placeholder="Leave blank to keep current password"
                                    className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>
                        )}

                        {edit && (
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-3xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {submitting ? 'Saving...' : 'Save changes'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleCancelClick}
                                    className="rounded-3xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </>
                )}
            </form>
        </div>
    );
};

export default Profile;
