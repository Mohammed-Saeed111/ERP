import { useNavigate } from 'react-router-dom';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
      <p className="text-8xl font-bold text-slate-200 dark:text-slate-800">403</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-slate-100">Access denied</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view this page.</p>
      <button
        type="button"
        onClick={() => navigate('/login', { replace: true })}
        className="mt-6 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Back to login
      </button>
    </div>
  );
};

export default Unauthorized;
