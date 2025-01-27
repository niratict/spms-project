import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  AlertCircle,
  Lock,
  User,
  Mail,
  Edit,
  Trash2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

Modal.setAppElement("#root");

const modalStyles = {
  content: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    padding: "24px",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    backgroundColor: "white",
    maxWidth: "90%",
    maxHeight: "90%",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 50,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
};

const UserEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const handleBackNavigation = () => {
    navigate(`/users/${id}`);
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const userData = response.data;
        setUserData(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          role: userData.role,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchUser();
  }, [id, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError(null);
  };

  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/users/${id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setShowConfirmModal(false);
      navigate(`/users/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update user");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("New passwords do not match");
      return;
    }

    setActionLoading(true);
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
    } catch (err) {
      setPasswordError(
        err.response?.data?.message || "Failed to change password"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete user");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading)
    return <div className="text-center p-6 text-gray-500">Loading...</div>;
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      </div>
    );
  }
  if (!userData)
    return <div className="text-center p-6 text-gray-500">User not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 min-h-screen">
      <button
        onClick={handleBackNavigation}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Users</span>
      </button>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="bg-blue-50 p-6 border-b border-blue-100 flex items-center">
          <User className="w-6 h-6 text-blue-600 mr-3" />
          <h2 className="text-xl font-semibold text-blue-800">
            Edit User Profile
          </h2>
        </div>

        <form className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-6 w-6 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-gray-500" />
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div className="flex-grow">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>

            {user.role === "Admin" && (
              <div className="flex items-center space-x-3">
                <Edit className="w-5 h-5 text-gray-500" />
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                  >
                    <option value="Viewer">Viewer</option>
                    <option value="Tester">Tester</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                className="flex items-center px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </button>
              {user.role === "Admin" && user.user_id !== parseInt(id) && (
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="flex items-center px-4 py-2 text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </button>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Confirm Changes Modal */}
      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => !actionLoading && setShowConfirmModal(false)}
        style={modalStyles}
        contentLabel="Confirm Save Modal"
        className="focus:outline-none"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Confirm Changes
            </h2>
            <p className="text-gray-600">
              Are you sure you want to save these changes to the user profile?
            </p>
          </div>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Saving..." : "Confirm"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showPasswordModal}
        onRequestClose={() => !actionLoading && setShowPasswordModal(false)}
        style={modalStyles}
        contentLabel="Change Password Modal"
        className="focus:outline-none"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Change Password
            </h2>
            <p className="text-gray-600">Enter your current and new password</p>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">{passwordError}</span>
            </div>
          )}

          <div className="space-y-4 pt-2">
            {user.role !== "Admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete User Modal */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => !actionLoading && setShowDeleteModal(false)}
        style={modalStyles}
        contentLabel="Delete User Modal"
        className="focus:outline-none"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Delete User</h2>
            <p className="text-gray-600">
              Are you sure you want to delete this user? This action cannot be
              undone.
            </p>
          </div>
          <div className="flex justify-center space-x-4 pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserEdit;
