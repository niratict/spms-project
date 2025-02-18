import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  AlertCircle,
  User,
  Mail,
  Lock,
  Upload,
  Eye,
  EyeOff,
  X,
  Calendar,
  UserCircle,
  Trash2,
} from "lucide-react";
import Modal from "react-modal";
import axios from "axios";

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
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

const imagePreviewModalStyles = {
  ...modalStyles,
  content: {
    ...modalStyles.content,
    width: "auto",
    maxWidth: "90vw",
    maxHeight: "90vh",
    padding: "16px",
  },
};

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const [formErrors, setFormErrors] = useState({
    name: "",
  });

  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [passwordErrors, setPasswordErrors] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      const profileData = response.data;
      setProfile(profileData);
      setFormData({
        name: profileData.name,
        email: profileData.email,
      });
      if (profileData.profile_image) {
        setImagePreview(
          `${API_BASE_URL}/api/uploads/profiles/${profileData.profile_image}`
        );
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "Name is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordData.current_password) {
      errors.current_password = "Current password is required";
    }
    if (!passwordData.new_password) {
      errors.new_password = "New password is required";
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = "Password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)
    ) {
      errors.new_password =
        "Password must contain uppercase, lowercase and numbers";
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return;

    const formData = new FormData();
    formData.append("profile_image", selectedImage);

    setActionLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/profile/update-image`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchProfile();
      setSelectedImage(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/profile/delete-image`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setImagePreview(null);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete image");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setActionLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/profile/update`,
        { name: formData.name },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setEditMode(false);
      await fetchProfile();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!validatePassword()) return;

    setActionLoading(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/profile/change-password`,
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
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-white">
                Profile Settings
              </h1>
              <div className="px-4 py-2 bg-white rounded-lg">
                <span className="text-black font-medium capitalize">
                  {profile?.role || "User"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto hover:bg-red-100 p-1 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            )}

            {/* Profile Image Section */}
            <div className="flex flex-col md:flex-row md:items-start gap-8 mb-8">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div
                    className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer"
                    onClick={() =>
                      imagePreview && setShowImagePreviewModal(true)
                    }
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <UserCircle className="w-20 h-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <label className="bg-blue-500 p-3 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg">
                    <Upload className="w-5 h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file && file.size <= 5 * 1024 * 1024) {
                          setSelectedImage(file);
                          setImagePreview(URL.createObjectURL(file));
                        } else {
                          setError("File size must be less than 5MB");
                        }
                      }}
                    />
                  </label>
                  {imagePreview && (
                    <button
                      onClick={handleDeleteImage}
                      className="bg-red-500 p-3 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                  )}
                </div>

                {selectedImage && (
                  <button
                    onClick={handleImageUpload}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md w-full max-w-[200px]"
                  >
                    {actionLoading ? "Uploading..." : "Upload New Image"}
                  </button>
                )}
              </div>

              <div className="flex flex-col space-y-3 md:pt-2">
                <h2 className="text-2xl font-semibold text-gray-800">
                  {profile?.name}
                </h2>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Mail className="w-4 h-4" />
                  <span>{profile?.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatDate(profile?.created_at)}</span>
                </div>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        if (formErrors.name)
                          setFormErrors({ ...formErrors, name: "" });
                      }}
                      disabled={!editMode}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                        formErrors.name ? "border-red-500" : ""
                      }`}
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-500">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 pt-6">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={actionLoading}
                      className="px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md disabled:opacity-50"
                    >
                      {actionLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setFormData({
                          ...formData,
                          name: profile?.name || "",
                        });
                        setFormErrors({});
                      }}
                      className="px-6 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md"
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-md ml-auto"
                >
                  <Lock className="h-4 w-4" />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={showImagePreviewModal}
        onRequestClose={() => setShowImagePreviewModal(false)}
        style={imagePreviewModalStyles}
      >
        <div className="relative">
          <button
            onClick={() => setShowImagePreviewModal(false)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={imagePreview}
            alt="Profile Preview"
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </Modal>

      {/* Password Change Modal */}
      <Modal
        isOpen={showPasswordModal}
        onRequestClose={() => {
          setShowPasswordModal(false);
          setPasswordData({
            current_password: "",
            new_password: "",
            confirm_password: "",
          });
          setPasswordErrors({});
        }}
        style={modalStyles}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Change Password</h2>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  current_password: "",
                  new_password: "",
                  confirm_password: "",
                });
                setPasswordErrors({});
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPassword.current ? "text" : "password"}
                value={passwordData.current_password}
                onChange={(e) => {
                  setPasswordData({
                    ...passwordData,
                    current_password: e.target.value,
                  });
                  if (passwordErrors.current_password) {
                    setPasswordErrors({
                      ...passwordErrors,
                      current_password: "",
                    });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.current_password ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    current: !showPassword.current,
                  })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword.current ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.current_password && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.current_password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.new ? "text" : "password"}
                value={passwordData.new_password}
                onChange={(e) => {
                  setPasswordData({
                    ...passwordData,
                    new_password: e.target.value,
                  });
                  if (passwordErrors.new_password) {
                    setPasswordErrors({
                      ...passwordErrors,
                      new_password: "",
                    });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.new_password ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword.new ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.new_password && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.new_password}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={showPassword.confirm ? "text" : "password"}
                value={passwordData.confirm_password}
                onChange={(e) => {
                  setPasswordData({
                    ...passwordData,
                    confirm_password: e.target.value,
                  });
                  if (passwordErrors.confirm_password) {
                    setPasswordErrors({
                      ...passwordErrors,
                      confirm_password: "",
                    });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.confirm_password ? "border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({
                    ...showPassword,
                    confirm: !showPassword.confirm,
                  })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.confirm_password && (
              <p className="mt-1 text-sm text-red-500">
                {passwordErrors.confirm_password}
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handlePasswordChange}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {actionLoading ? "Changing..." : "Change Password"}
            </button>
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  current_password: "",
                  new_password: "",
                  confirm_password: "",
                });
                setPasswordErrors({});
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
