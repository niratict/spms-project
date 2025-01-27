import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  UserCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const USERS_PER_PAGE = 9;

// Role color mapping
const ROLE_COLORS = {
  Admin: "bg-red-100 text-red-800",
  Tester: "bg-green-100 text-green-800",
  Viewer: "bg-blue-100 text-blue-800",
};

const Users = () => {
  const { user, logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setUsers(response.data);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchUsers();
    }
  }, [user, logout, navigate]);

  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      logout();
      navigate("/login");
    } else {
      setError(err.response?.data?.message || "Failed to fetch users");
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (searchTerm === "" ||
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roleFilter === "" || u.role === roleFilter)
    );
  }, [users, searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const roleOptions = ["Admin", "Tester", "Viewer"];

  if (!user?.token) return <Navigate to="/login" />;
  if (user?.role !== "Admin")
    return (
      <div className="text-center p-6 bg-gray-100 min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow-md">
          <h2 className="text-2xl font-bold text-red-500">Access Denied</h2>
          <p className="text-gray-600 mt-2">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-red-500 text-lg p-6 bg-red-50 min-h-screen">
        Error: {error}
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800">
            User Management
          </h1>
          <button
            onClick={() => navigate("/users/create")}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <UserCircle className="w-5 h-5" /> Create User
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex space-x-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search users by name or email"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400" />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Roles</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {paginatedUsers.map((userData) => (
            <div
              key={userData.user_id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  {userData.name}
                </h3>
                <span
                  className={`text-sm ${
                    ROLE_COLORS[userData.role]
                  } px-2 py-1 rounded-full`}
                >
                  {userData.role}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-gray-600 flex items-center gap-2">
                  <UserCircle className="w-4 h-4" /> {userData.email}
                </p>
                <p className="text-gray-600">
                  Created: {new Date(userData.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-start">
                <button
                  onClick={() => navigate(`/users/${userData.user_id}`)}
                  className="flex items-center gap-2 text-blue-500 hover:text-blue-700"
                >
                  <Eye className="w-5 h-5" /> View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            No users found matching your search criteria.
          </div>
        )}

        {filteredUsers.length > USERS_PER_PAGE && (
          <div className="flex justify-center items-center space-x-4 mt-6">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-5 h-5" /> Previous
            </button>
            <span className="text-gray-600">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg disabled:opacity-50"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
