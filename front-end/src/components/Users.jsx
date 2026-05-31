import { useState, useEffect } from 'react';
import axios from 'axios';

const Users = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    address: '',
    role: 'customer'
  });

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('POS_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchUsers = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await axios.get('http://localhost:5000/api/users', { headers });
      setUsers(res.data.user);
      setFilteredUsers(res.data.user);
    } catch (error) {
      console.log(error);
      alert(error?.response?.data?.message || 'Failed to fetch users');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const headers = getAuthHeaders();
      await axios.post('http://localhost:5000/api/users/add', formData, { headers });

      alert('User added successfully');

      fetchUsers();

      setFormData({
        name: '',
        email: '',
        password: '',
        address: '',
        role: 'customer'
      });
    } catch (error) {
      console.log(error);
      alert(error?.response?.data?.message || 'Failed to add user');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure?')) return;

    try {
      const headers = getAuthHeaders();
      await axios.delete(`http://localhost:5000/api/users/${id}`, { headers });
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.log(error);
      alert(error?.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();

    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(value)
    );

    setFilteredUsers(filtered);
  };

  return (
    <div className="p-4">

      {/* Header */}
      <div className="font-bold text-xl mb-4">
        Users Management
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search users..."
        onChange={handleSearch}
        className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

        {/* Form */}
        <div className="bg-white p-5 rounded shadow col-span-1">

          <h2 className="font-semibold mb-4">Add User</h2>

          <form onSubmit={handleSubmit} className="space-y-3">

            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Name"
              className="w-full border p-2 rounded"
            />

            <input
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              className="w-full border p-2 rounded"
            />

            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full border p-2 rounded"
            />

            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Address"
              className="w-full border p-2 rounded"
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full border p-2 rounded"
            >
              <option value="admin">admin</option>
              <option value="customer">customer</option>
            </select>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Add User
            </button>

          </form>
        </div>

        {/* Table */}
        <div className="col-span-1 lg:col-span-3">

          <div className="bg-white rounded shadow overflow-hidden">

            <table className="w-full text-left">

              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id} className="border-t hover:bg-gray-50">

                      <td className="p-3">{index + 1}</td>
                      <td className="p-3">{user.name}</td>
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">{user.address}</td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 text-xs rounded text-white ${
                            user.role === 'admin'
                              ? 'bg-purple-500'
                              : 'bg-green-500'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="p-3">
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>

                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>

            </table>

          </div>

        </div>

      </div>
    </div>
  );
};

export default Users;