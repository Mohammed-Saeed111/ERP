import { useState, useEffect, useRef } from 'react';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import api from '../utils/axiosConfig.js';

const Profile = () => {
    const [user, setUser] = useState({ name: '', email: '', address: '', password: '', avatar: null });
    const [initialUser, setInitialUser] = useState({ name: '', email: '', address: '', password: '', avatar: null });
    const [edit, setEdit] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [toast, setToast] = useState(null);
    const avatarInputRef = useRef(null);

    useEffect(() => { fetchUserProfile(); }, []);

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
                const profile = { name: response.data.user.name || '', email: response.data.user.email || '', address: response.data.user.address || '', password: '', avatar: response.data.user.avatar || null };
                setUser(profile); setInitialUser(profile);
            }
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Unable to load profile.' });
        } finally { setLoading(false); }
    };

    const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            setUploadingAvatar(true);
            const response = await api.post('/api/users/profile/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (response.data.success) {
                const newAvatar = response.data.user.avatar;
                setUser((prev) => ({ ...prev, avatar: newAvatar }));
                setInitialUser((prev) => ({ ...prev, avatar: newAvatar }));
                setToast({ type: 'success', message: 'Profile picture updated.' });
            }
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to upload image.' });
        } finally { setUploadingAvatar(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user.name.trim()) { setToast({ type: 'error', message: 'Name is required.' }); return; }
        if (!/\S+@\S+\.\S+/.test(user.email)) { setToast({ type: 'error', message: 'Enter a valid email address.' }); return; }
        try {
            setSubmitting(true);
            const payload = { name: user.name, email: user.email, address: user.address };
            if (user.password.trim()) payload.password = user.password;
            const response = await api.put('/api/users/profile', payload);
            if (response.data.success) {
                const updatedUser = { name: response.data.user?.name || user.name, email: response.data.user?.email || user.email, address: response.data.user?.address || user.address, password: '', avatar: response.data.user?.avatar || user.avatar };
                setUser(updatedUser); setInitialUser(updatedUser);
                setToast({ type: 'success', message: 'Profile updated successfully.' });
                setEdit(false);
            } else {
                setToast({ type: 'error', message: response.data.message || 'Failed to update profile.' });
            }
        } catch (error) {
            setToast({ type: 'error', message: error.response?.data?.message || 'Failed to update profile.' });
        } finally { setSubmitting(false); }
    };

    const avatarSrc = user.avatar
        ? (user.avatar.startsWith('http') ? user.avatar : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${user.avatar}`)
        : null;

    const inputClass = "w-full rounded-3xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60";

    return (
        <div className="p-4 min-h-screen bg-slate-50 dark:bg-slate-900">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                            {avatarSrc ? <img src={avatarSrc} alt="avatar" className="w-full h-full object-cover" /> : <span className="text-2xl text-slate-400">👤</span>}
                        </div>
                        <button type="button" onClick={() => avatarInputRef.current.click()} disabled={uploadingAvatar} className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center hover:bg-yellow-600 transition disabled:opacity-60" title="Change photo">
                            {uploadingAvatar ? '…' : '✎'}
                        </button>
                        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Profile</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account details and password.</p>
                    </div>
                </div>
                {!edit && (
                    <button type="button" onClick={() => setEdit(true)} className="rounded-3xl bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 transition">
                        Edit profile
                    </button>
                )}
            </div>

            {toast && (
                <div className={`mb-6 rounded-3xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-300' : 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:border-rose-800 dark:text-rose-300'}`}>
                    {toast.message}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-3xl shadow-sm space-y-4">
                {loading ? (
                    <div className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700 p-6 text-center text-slate-500 dark:text-slate-400">
                        Loading profile...
                    </div>
                ) : (
                    <>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Name</label>
                                <input type="text" name="name" value={user.name} onChange={handleChange} disabled={!edit} className={inputClass} />
                            </div>
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Email</label>
                                <input type="email" name="email" value={user.email} onChange={handleChange} disabled={!edit} className={inputClass} />
                            </div>
                        </div>
                        <div>
                            <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
                            <input type="text" name="address" value={user.address} onChange={handleChange} disabled={!edit} className={inputClass} />
                        </div>
                        {edit && (
                            <div>
                                <label className="block mb-1 text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="password"
                                        value={user.password}
                                        onChange={handleChange}
                                        placeholder="Leave blank to keep current password"
                                        className={inputClass + ' pr-12'}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((p) => !p)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                        )}
                        {edit && (
                            <div className="flex flex-wrap items-center gap-3 pt-2">
                                <button type="submit" disabled={submitting} className="rounded-3xl bg-green-600 px-5 py-3 text-sm font-semibold text-white hover:bg-green-700 transition disabled:cursor-not-allowed disabled:opacity-60">
                                    {submitting ? 'Saving...' : 'Save changes'}
                                </button>
                                <button type="button" onClick={() => { setEdit(false); setUser(initialUser); }} className="rounded-3xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600 transition">
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
