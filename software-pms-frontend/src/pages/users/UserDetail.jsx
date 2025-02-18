import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  ArrowLeft,
  Shield,
  Edit,
  KeyRound,
  Trash2,
  X,
} from "lucide-react";

// Environment Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Modal Configuration
Modal.setAppElement("#root");

const UserDetail = () => {
  // State Management
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // Fetch User Data
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.token || !id) {
        setError("Unauthorized access");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUserData(response.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(err.response?.data?.message || "Failed to fetch user details");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, user, logout, navigate]);

  // Delete User Handler
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/users");
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      setError(err.response?.data?.message || "Failed to delete user");
    }
  };

  // Change Password Handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("New passwords don't match");
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert("New password must be at least 6 characters long");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/api/users/${id}/password`,
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setShowPasswordModal(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      alert("Password changed successfully");
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      alert(err.response?.data?.message || "Failed to change password");
    }
  };

  // Access Control
  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  const hasPermission = user.role === "Admin" || user.user_id === parseInt(id);
  if (!hasPermission) {
    return (
      <div className="text-center p-6 min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Access Denied
          </h2>
          <p className="text-gray-600">
            You don't have permission to view this profile.
          </p>
        </div>
      </div>
    );
  }

  // Loading and Error States
  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!userData) return <div className="text-center p-6">User not found</div>;

  // Permission Flags
  const canEdit = user.role === "Admin" || user.user_id === parseInt(id);
  const canDelete = user.role === "Admin" && user.user_id !== parseInt(id);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/users/")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        {/* User Profile Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Profile Header */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h1 className="text-3xl font-bold">{userData.name}</h1>
          </div>

          {/* Profile Actions */}
          <div className="p-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/users/${id}/edit`)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Edit className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <KeyRound className="w-5 h-5" />
                    <span>Change Password</span>
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger flex items-center space-x-2"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete User</span>
                </button>
              )}
            </div>

            {/* User Details Section */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 bg-white/70 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                  <Shield className="mr-3 text-blue-600" />
                  User Details
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      icon: <Calendar className="text-blue-500" />,
                      label: "Email",
                      value: userData.email,
                    },
                    {
                      icon: <Shield className="text-green-500" />,
                      label: "Role",
                      value: userData.role,
                    },
                    {
                      icon: <Clock className="text-purple-500" />,
                      label: "Created",
                      value: new Date(userData.created_at).toLocaleDateString(
                        "th-TH",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      ),
                    },
                    {
                      icon: <Clock className="text-indigo-500" />,
                      label: "Last Updated",
                      value: new Date(userData.updated_at).toLocaleDateString(
                        "th-TH",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      ),
                    },
                  ].map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                    >
                      <div className="p-3 bg-blue-50 rounded-full">
                        {detail.icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">{detail.label}</p>
                        <p className="font-semibold text-gray-800">
                          {detail.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete User Modal */}
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black/50"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Delete User
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>

        {/* Change Password Modal */}
        <Modal
          isOpen={showPasswordModal}
          onRequestClose={() => setShowPasswordModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black/50"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              Change Password
            </h2>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {user.role !== "Admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    value={passwordData.current_password}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        current_password: e.target.value,
                      })
                    }
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                  value={passwordData.new_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      new_password: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  minLength={6}
                  value={passwordData.confirm_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirm_password: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({
                      current_password: "",
                      new_password: "",
                      confirm_password: "",
                    });
                  }}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </Modal>
      </div>
    </div>
  );
};

// Global Tailwind CSS Classes
const globalTailwindClasses = `
@layer components {
  .btn-primary {
    @apply bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
           transform transition-all hover:scale-105;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 
           focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 
           transform transition-all hover:scale-105;
  }
  
  .btn-danger {
    @apply bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 
           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 
           transform transition-all hover:scale-105;
  }
}
`;

export default UserDetail;
