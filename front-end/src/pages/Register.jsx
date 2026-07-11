import { useState } from 'react';
import { FiClipboard, FiEye, FiEyeOff, FiLayers, FiShield, FiUserPlus } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', address: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim() || !form.password) {
      setError('Please fill required fields');
      return;
    }

    try {
      setLoading(true);
      const payload = { ...form, role: 'customer' };
      const res = await api.post('/api/users/register', payload);
      if (res.status === 200 || res.data?.message) {
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="relative overflow-hidden rounded-3xl bg-white p-10 shadow-xl border border-slate-200">
          <div className="absolute inset-0 bg-linear-to-br from-blue-100 via-slate-100 to-white opacity-80" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                  <FiUserPlus className="h-4 w-4" />
                </div>
                Link ERP
              </div>
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-slate-900">Create Your Account</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">
                Register now to centralize orders, inventory, and supplier workflows in one ERP platform.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                  <FiClipboard className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Quick setup</p>
                  <p className="mt-3 font-semibold text-slate-900">Register quickly and start managing operations.</p>
                </div>
              </div>
              <div className="flex gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
                  <FiLayers className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Connected ERP</p>
                  <p className="mt-3 font-semibold text-slate-900">One platform for orders, products, and customers.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="pointer-events-none absolute -right-6 top-8 hidden h-44 w-44 items-center justify-center rounded-full bg-blue-200/40 blur-3xl sm:flex">
            <FiShield className="h-10 w-10 text-white/90" />
          </div>
        </div>

        <div className="rounded-4xl bg-white p-10 shadow-xl border border-slate-200">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-slate-900">Register</h2>
            <p className="mt-2 text-slate-500">Fill in your details to create a new account.</p>
          </div>

          {error && (
            <div className="mb-5 rounded-3xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Full Name</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="jane.doe@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <input
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Company address (optional)"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-3xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
