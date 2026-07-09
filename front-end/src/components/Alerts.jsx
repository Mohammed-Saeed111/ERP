import { useEffect, useState } from 'react';
import api from '../utils/axiosConfig';
import toast, { Toaster } from 'react-hot-toast';

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/orders?status=Pending');
      if (response.data.success) {
        const orders = response.data.orders || [];
        const formatted = orders.map((order) => ({
          id: order._id,
          title: `طلب جديد - ${order._id.slice(-6)}`,
          description: `العميل: ${order.customer?.name || order.customer?.email || 'غير معروف'}. الحالة: ${order.status}.`,
          date: order.orderDate ? new Date(order.orderDate).toLocaleString('ar-EG') : 'غير محدد',
          status: order.status
        }));
        setAlerts(formatted);
      } else {
        toast.error(response.data.message || 'فشل تحميل التنبيهات');
      }
    } catch (error) {
      console.error(error);
      toast.error('فشل تحميل التنبيهات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return (
    <div className="min-h-screen p-4 bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300">
      <Toaster position="top-right" />
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">التنبيهات</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">عرض الطلبات المعلقة وأحدث التنبيهات في النظام.</p>
        </div>
        {loading && <span className="text-sm text-slate-500 dark:text-slate-400">جاري التحميل...</span>}
      </div>

      <div className="space-y-4">
        {alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{alert.title}</h2>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{alert.description}</p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-200">{alert.status}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{alert.date}</p>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            لا توجد تنبيهات حالياً.
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
