import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Clock, Activity, ArrowLeft, Shield } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

Modal.setAppElement("#root");

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    padding: "24px",
    borderRadius: "8px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const formatStatKey = (key) => {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const UserDetail = () => {
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
        console.log("User data:", response.data); // For debugging
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

  const renderStats = (stats) => {
    if (!stats || typeof stats !== "object") return null;

    const statOrder = [
      "pass_rate",
      "passed_tests",
      "failed_tests",
      "total_test_files",
      "total_sprints",
      "total_projects",
    ];

    return (
      <div className="col-span-2 grid grid-cols-2 gap-4 mt-4">
        {statOrder.map((key) => {
          if (!(key in stats)) return null;

          let value = stats[key];
          // Skip if value is an object or undefined
          if (typeof value === "object" || value === undefined) {
            return null;
          }

          // Format value based on type
          if (key === "pass_rate") {
            value = `${value}%`;
          } else {
            value = String(value);
          }

          return (
            <div key={key} className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                {formatStatKey(key)}:{" "}
                <span className="font-medium">{value}</span>
              </span>
            </div>
          );
        })}
      </div>
    );
  };

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

  const handlePasswordChange = async (e) => {
    e.preventDefault(); // Prevent form submission

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

  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  const hasPermission = user.role === "Admin" || user.user_id === parseInt(id);
  if (!hasPermission) {
    return (
      <div className="text-center p-6">
        <h2 className="text-xl font-semibold">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You don't have permission to view this profile.
        </p>
      </div>
    );
  }

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!userData) return <div className="text-center p-6">User not found</div>;

  const canEdit = user.role === "Admin" || user.user_id === parseInt(id);
  const canDelete = user.role === "Admin" && user.user_id !== parseInt(id);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{userData.name}</h1>
        <div className="space-x-4">
          {canEdit && (
            <>
              <button
                onClick={() => navigate(`/users/${id}/edit`)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Change Password
              </button>
            </>
          )}
          {canDelete && (
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                Email: <span className="font-medium">{userData.email}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                Role: <span className="font-medium">{userData.role}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                Created:{" "}
                <span className="font-medium">
                  {new Date(userData.created_at).toLocaleDateString()}
                </span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">
                Last Updated:{" "}
                <span className="font-medium">
                  {new Date(userData.updated_at).toLocaleDateString()}
                </span>
              </span>
            </div>
            {userData.stats && renderStats(userData.stats)}
          </div>
        </div>
      </div>

      {userData.recent_activities && userData.recent_activities.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Activities</h2>
            <div className="space-y-4">
              {userData.recent_activities.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="font-semibold">{activity.action_type}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(activity.action_date).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    {typeof activity.details === "string"
                      ? activity.details
                      : JSON.stringify(activity.details)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        style={modalStyles}
        contentLabel="Delete User Modal"
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Delete User</h2>
          <p className="text-gray-600">
            Are you sure you want to delete this user? This action cannot be
            undone.
          </p>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete User
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPasswordModal}
        onRequestClose={() => setShowPasswordModal(false)}
        style={modalStyles}
        contentLabel="Change Password Modal"
      >
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {user.role !== "Admin" && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      current_password: e.target.value,
                    })
                  }
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-1">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  })
                }
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirm_password}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  })
                }
                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
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
                className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Change Password
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default UserDetail;
