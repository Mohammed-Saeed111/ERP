import { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../utils/axiosConfig';

const PAGE_SIZE = 5;

const Categories = () => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [toast, setToast] = useState(null);

  const showToast = (type, text) => {
    setToast({ type, text });
  };

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 3000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoryResponse, productResponse] = await Promise.all([
        api.get('/api/category'),
        api.get('/api/products')
      ]);

      if (categoryResponse.data.success) {
        setCategories(categoryResponse.data.categories || []);
      } else {
        setCategories([]);
        showToast('error', categoryResponse.data.message || 'Unable to load categories.');
      }

      if (productResponse.data.success) {
        setProducts(productResponse.data.products || []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error(error);
      setCategories([]);
      setProducts([]);
      showToast('error', error?.response?.data?.message || 'Unable to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetForm = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
  };

  const stats = useMemo(() => {
    const productCountMap = products.reduce((acc, product) => {
      const categoryId = product.categoryId?._id || product.categoryId;
      if (categoryId) {
        acc[categoryId] = (acc[categoryId] || 0) + 1;
      }
      return acc;
    }, {});

    const enriched = categories.map((category) => ({
      ...category,
      productCount: productCountMap[category._id] || 0,
      isActive: !category.isHidden && (productCountMap[category._id] || 0) > 0,
      isEmpty: (productCountMap[category._id] || 0) === 0
    }));

    const totalProducts = products.length;
    const usedCategories = enriched.filter((category) => category.productCount > 0).length;
    const emptyCategories = enriched.filter((category) => category.productCount === 0).length;
    const mostUsed = enriched.reduce((current, category) => {
      if (!current) return category;
      return category.productCount > current.productCount ? category : current;
    }, null);

    return {
      totalCategories: enriched.length,
      usedCategories,
      emptyCategories,
      mostUsed,
      totalProducts,
      enriched
    };
  }, [categories, products]);

  const filteredCategories = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const list = stats.enriched.filter((category) => {
      const matchesText =
        category.categoryName?.toLowerCase().includes(term) ||
        category.categoryDescription?.toLowerCase().includes(term) ||
        String(category.productCount).includes(term);
      return matchesText;
    });

    list.sort((a, b) => {
      if (sortBy === 'products') {
        return b.productCount - a.productCount;
      }
      return a.categoryName.localeCompare(b.categoryName);
    });

    return list;
  }, [searchTerm, sortBy, stats.enriched]);

  const totalPages = Math.max(1, Math.ceil(filteredCategories.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortBy]);

  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredCategories.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredCategories]);

  const toggleSelection = (id) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentIds = paginatedCategories.map((category) => category._id);
    const allSelected = currentIds.every((id) => selectedCategoryIds.includes(id));
    setSelectedCategoryIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !currentIds.includes(id));
      }
      return Array.from(new Set([...prev, ...currentIds]));
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedName = categoryName.trim();
    const trimmedDescription = categoryDescription.trim();

    if (!trimmedName) {
      showToast('error', 'Category name is required.');
      return;
    }

    const duplicateCategory = stats.enriched.some(
      (category) =>
        category.categoryName?.toLowerCase() === trimmedName.toLowerCase() &&
        category._id !== editingCategory
    );

    if (duplicateCategory) {
      showToast('error', 'This category already exists.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        categoryName: trimmedName,
        categoryDescription: trimmedDescription,
        isHidden: false
      };

      const response = editingCategory
        ? await api.put(`/api/category/update/${editingCategory}`, payload)
        : await api.post('/api/category/add', payload);

      if (response.data.success) {
        showToast('success', editingCategory ? 'Category updated successfully.' : 'Category added successfully.');
        resetForm();
        await fetchData();
      } else {
        showToast('error', response.data.message || 'Operation failed.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', error?.response?.data?.message || 'An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category._id);
    setCategoryName(category.categoryName || '');
    setCategoryDescription(category.categoryDescription || '');
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;

    try {
      const response = await api.delete(`/api/category/${id}`);

      if (response.data.success) {
        showToast('success', 'Category deleted successfully.');
        await fetchData();
        setSelectedCategoryIds((prev) => prev.filter((item) => item !== id));
      } else {
        showToast('error', response.data.message || 'Failed to delete category.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', error?.response?.data?.message || 'An error occurred while deleting category.');
    }
  };

  const handleToggleVisibility = async (category) => {
    try {
      const response = await api.put(`/api/category/update/${category._id}`, {
        categoryName: category.categoryName,
        categoryDescription: category.categoryDescription,
        isHidden: !category.isHidden
      });

      if (response.data.success) {
        showToast('success', category.isHidden ? 'Category is now visible.' : 'Category hidden successfully.');
        await fetchData();
      } else {
        showToast('error', response.data.message || 'Unable to update visibility.');
      }
    } catch (error) {
      console.error(error);
      showToast('error', error?.response?.data?.message || 'Unable to update visibility.');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCategoryIds.length) {
      showToast('error', 'Select at least one category.');
      return;
    }

    const selected = stats.enriched.filter((category) => selectedCategoryIds.includes(category._id));
    const deletable = selected.filter((category) => category.productCount === 0);
    const blocked = selected.filter((category) => category.productCount > 0);

    if (!deletable.length) {
      showToast('error', 'Selected categories cannot be deleted because they are linked to products.');
      return;
    }

    try {
      setSubmitting(true);
      await Promise.all(deletable.map((category) => api.delete(`/api/category/${category._id}`)));
      await fetchData();
      setSelectedCategoryIds([]);
      showToast(
        'success',
        blocked.length
          ? `Deleted ${deletable.length} empty categories. ${blocked.length} selected categories were skipped because they still have products.`
          : `Deleted ${deletable.length} categories successfully.`
      );
    } catch (error) {
      console.error(error);
      showToast('error', error?.response?.data?.message || 'Unable to delete selected categories.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-4xl bg-white p-6 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold text-slate-900">Category Management</h2>
              <p className="mt-2 text-sm text-slate-500">Track category usage, hide unused groups, and manage them efficiently.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-96 sm:flex-row">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-700 shadow-sm transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="name">Sort by name</option>
                <option value="products">Sort by products</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Total categories</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{stats.totalCategories}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Used categories</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{stats.usedCategories}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Empty categories</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{stats.emptyCategories}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-lg shadow-slate-200/50 ring-1 ring-slate-200">
            <p className="text-sm font-medium text-slate-500">Most used</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">{stats.mostUsed?.categoryName || 'None'}</p>
            <p className="text-sm text-slate-500">{stats.mostUsed?.productCount || 0} products</p>
          </div>
        </div>

        {toast ? (
          <div className={`mb-6 rounded-2xl border px-4 py-3 text-sm ${toast.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
            {toast.text}
          </div>
        ) : null}

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="w-full lg:w-1/3 rounded-4xl bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            <p className="mt-2 text-sm text-slate-500">Fill in the details and save the category record.</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Category Name
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                />
              </label>

              <label className="block space-y-2 text-sm font-medium text-slate-700">
                Category Description
                <input
                  type="text"
                  placeholder="Category Description"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200"
                  value={categoryDescription}
                  onChange={(e) => setCategoryDescription(e.target.value)}
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  {submitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Add Category'}
                </button>

                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className="w-full lg:w-2/3 rounded-4xl bg-white p-6 shadow-xl shadow-slate-200/50 ring-1 ring-slate-200">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Category List</h3>
                <p className="text-sm text-slate-500">{filteredCategories.length} categories matched your search</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {paginatedCategories.every((category) => selectedCategoryIds.includes(category._id)) ? 'Unselect all' : 'Select all'}
                </button>
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  disabled={submitting || !selectedCategoryIds.length}
                  className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-300"
                >
                  Delete selected
                </button>
              </div>
            </div>

            {loading ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">Loading categories...</div>
            ) : paginatedCategories.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-8 text-center text-slate-500">No categories found. Add one to get started.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-600">
                    <tr>
                      <th className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={paginatedCategories.every((category) => selectedCategoryIds.includes(category._id))}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300"
                        />
                      </th>
                      <th className="px-4 py-4">Category</th>
                      <th className="px-4 py-4">Products</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {paginatedCategories.map((category) => {
                      const badgeClass = category.productCount === 0
                        ? 'bg-slate-100 text-slate-700'
                        : category.productCount < 3
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-700';

                      return (
                        <tr key={category._id} className="hover:bg-slate-50">
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={selectedCategoryIds.includes(category._id)}
                              onChange={() => toggleSelection(category._id)}
                              className="h-4 w-4 rounded border-slate-300"
                            />
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">{category.categoryName}</div>
                            <div className="text-xs text-slate-500">{category.categoryDescription || 'No description'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                              {category.productCount}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${category.isHidden ? 'bg-slate-200 text-slate-700' : category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {category.isHidden ? 'Hidden' : category.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="space-x-2 px-4 py-4">
                            <button
                              type="button"
                              onClick={() => handleEdit(category)}
                              className="rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-600"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(category)}
                              className="rounded-full bg-slate-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                            >
                              {category.isHidden ? 'Show' : 'Hide'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category._id)}
                              className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;