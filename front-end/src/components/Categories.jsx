
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Categories = () => {
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);

  const navigate = useNavigate();

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);

      const token = localStorage.getItem('POS_token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(
        'http://localhost:5000/api/category',
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setCategories(response.data.categories);
      }

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem('POS_token');

      if (!token) {
        navigate('/login');
        return;
      }

      if (editingCategory) {
        const response = await axios.put(
          `http://localhost:5000/api/category/update/${editingCategory}`,
          { categoryName, categoryDescription },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          alert('Category updated successfully');
          fetchCategories();
          setEditingCategory(null);
          setCategoryName('');
          setCategoryDescription('');
        }

      } else {
        const response = await axios.post(
          'http://localhost:5000/api/category/add',
          { categoryName, categoryDescription },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        if (response.data.success) {
          alert('Category added successfully');
          fetchCategories();
          setCategoryName('');
          setCategoryDescription('');
        }
      }

    } catch (error) {
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        console.error(error);
        alert('An error occurred. Please try again.');
      }
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category._id);
    setCategoryName(category.categoryName);
    setCategoryDescription(category.categoryDescription);
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryDescription('');
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('POS_token');

      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.delete(
        `http://localhost:5000/api/category/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        alert('Category deleted successfully');
        fetchCategories();
      } else {
        alert(response.data.message || 'Failed to delete category');
      }

    } catch (error) {
      console.error(error);
      if (error?.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('An error occurred while deleting category. Please try again.');
      }
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">

      <h1 className="text-2xl font-bold mb-6">
        Category Management
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* Form */}
        <div className="w-full lg:w-1/3 bg-white p-5 rounded-lg shadow">

          <h2 className="text-xl font-semibold mb-4">
            {editingCategory ? 'Edit Category' : 'Add Category'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <input
              type="text"
              placeholder="Category Name"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Category Description"
              className="w-full border p-3 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={categoryDescription}
              onChange={(e) => setCategoryDescription(e.target.value)}
            />

            <div className="flex gap-3">

              <button
                type="submit"
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
              >
                {editingCategory ? 'Save Changes' : 'Add Category'}
              </button>

              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                >
                  Cancel
                </button>
              )}

            </div>

          </form>
        </div>

        {/* Table */}
        <div className="w-full lg:w-2/3 bg-white p-5 rounded-lg shadow">

          {loading ? (
            <p className="text-gray-500">Loading...</p>
          ) : (
            <table className="w-full">

              <thead>
                <tr className="bg-gray-200 text-left">
                  <th className="p-3">S No</th>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {categories.map((category, index) => (
                  <tr key={category._id} className="border-b">

                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{category.categoryName}</td>

                    <td className="p-3 flex gap-2">

                      <button
                        onClick={() => handleEdit(category)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => handleDelete(category._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>

                    </td>

                  </tr>
                ))}
              </tbody>

            </table>
          )}

        </div>

      </div>

    </div>
  );
};

export default Categories;