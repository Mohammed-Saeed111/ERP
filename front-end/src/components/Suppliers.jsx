import { useState, useEffect } from 'react';
import api from '../utils/axiosConfig';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [addModel, setAddModel] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', number: '', address: '' });

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/supplier');
      const data = Array.isArray(response.data?.suppliers) ? response.data.suppliers : [];
      setSuppliers(data);
      setFilteredSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers', error.message);
      setSuppliers([]); setFilteredSuppliers([]);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchSuppliers(); }, []);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setFilteredSuppliers(suppliers.filter((s) => s.name.toLowerCase().includes(value)));
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const closeModel = () => {
    setAddModel(false); setEditSupplier(null);
    setFormData({ name: '', email: '', number: '', address: '' });
  };

  const handleEdit = (supplier) => {
    setFormData({ name: supplier.name, email: supplier.email, number: supplier.number, address: supplier.address });
    setEditSupplier(supplier._id);
    setAddModel(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editSupplier) {
        await api.put(`/api/supplier/${editSupplier}`, formData);
        alert('Supplier edited successfully');
      } else {
        await api.post('/api/supplier/add', formData);
        alert('Supplier added successfully');
      }
      fetchSuppliers(); closeModel();
    } catch (error) {
      alert('Error adding/updating supplier', error.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    try {
      await api.delete(`/api/supplier/${id}`);
      alert('Supplier deleted successfully');
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier', error.message);
    }
  };

  const inputClass = "w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-900 dark:text-slate-100 outline-none transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 focus:ring-2 focus:ring-blue-200";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-4xl bg-white dark:bg-slate-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Supplier Management</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Supplier management, data display, and easy search, addition, and editing of records.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input type="text" placeholder="Search suppliers..." onChange={handleSearch} className="w-full rounded-2xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 px-4 py-3 text-slate-700 dark:text-slate-200 shadow-sm transition focus:border-blue-500 focus:bg-white dark:focus:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-200 sm:w-72" />
              <button type="button" onClick={() => setAddModel(true)} className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700">
                Add Supplier
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-4xl bg-white dark:bg-slate-800 shadow-xl ring-1 ring-slate-200 dark:ring-slate-700">
          {loading ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">Loading suppliers...</div>
          ) : !Array.isArray(filteredSuppliers) || filteredSuppliers.length === 0 ? (
            <div className="p-10 text-center text-slate-500 dark:text-slate-400">No supplier records available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700 text-left text-xs uppercase tracking-wide text-slate-600 dark:text-slate-300">
                  <tr>
                    {['#', 'Supplier Name', 'Email', 'Phone', 'Address', 'Action'].map((h) => (
                      <th key={h} className="px-6 py-4">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-800">
                  {filteredSuppliers.map((supplier, index) => (
                    <tr key={supplier._id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="whitespace-nowrap px-6 py-4 text-slate-600 dark:text-slate-400">{index + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-slate-100">{supplier.name}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplier.email}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplier.number}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{supplier.address}</td>
                      <td className="px-6 py-4 space-x-2">
                        <button type="button" onClick={() => handleEdit(supplier)} className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600">Edit</button>
                        <button type="button" onClick={() => handleDelete(supplier._id)} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {addModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
          <div className="w-full max-w-2xl rounded-4xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-4">
              <div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">{editSupplier ? 'Edit Supplier' : 'Add Supplier'}</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Fill in the supplier details and save.</p>
              </div>
              <button type="button" onClick={closeModel} className="rounded-full bg-slate-100 dark:bg-slate-700 p-2 text-slate-600 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-slate-600">×</button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                {[{ name: 'name', label: 'Name', placeholder: 'Supplier name' },
                  { name: 'email', label: 'Email', placeholder: 'Supplier email', type: 'email' },
                  { name: 'number', label: 'Phone', placeholder: 'Phone number' },
                  { name: 'address', label: 'Address', placeholder: 'Supplier address' }].map(({ name, label, placeholder, type = 'text' }) => (
                  <label key={name} className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    {label}
                    <input name={name} value={formData[name]} onChange={handleChange} placeholder={placeholder} type={type} className={inputClass} required />
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button type="button" onClick={closeModel} className="rounded-2xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-50 dark:hover:bg-slate-600">Cancel</button>
                <button type="submit" className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">{editSupplier ? 'Save Changes' : 'Add Supplier'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
