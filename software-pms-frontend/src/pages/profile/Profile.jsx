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
  AlertTriangle,
} from "lucide-react";
import Modal from "react-modal";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

Modal.setAppElement("#root");

// กำหนดสไตล์สำหรับ Modal ปกติ - ปรับให้ responsive
const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "400px",
    padding: "20px",
    borderRadius: "12px",
    border: "none",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

// กำหนดสไตล์สำหรับ Modal แสดงรูปภาพ - ปรับให้ responsive
const imagePreviewModalStyles = {
  ...modalStyles,
  content: {
    ...modalStyles.content,
    width: "auto",
    maxWidth: "min(800px, 70vw)", // จำกัดความกว้างสูงสุดเป็น 800px หรือ 70% ของความกว้างหน้าจอ (แล้วแต่ว่าค่าไหนน้อยกว่า)
    maxHeight: "70vh",
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
  const [showDeleteImageConfirmModal, setShowDeleteImageConfirmModal] =
    useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // ข้อมูลฟอร์มสำหรับแก้ไขโปรไฟล์
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // ข้อความแสดงข้อผิดพลาดในฟอร์มแก้ไขโปรไฟล์
  const [formErrors, setFormErrors] = useState({
    name: "",
  });

  // ข้อมูลฟอร์มสำหรับเปลี่ยนรหัสผ่าน
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // ข้อความแสดงข้อผิดพลาดในฟอร์มเปลี่ยนรหัสผ่าน
  const [passwordErrors, setPasswordErrors] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ดึงข้อมูลโปรไฟล์เมื่อโหลดหน้า
  useEffect(() => {
    fetchProfile();
  }, []);

  // ฟังก์ชันดึงข้อมูลโปรไฟล์จาก API
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

  // ตรวจสอบความถูกต้องของข้อมูลในฟอร์มแก้ไขโปรไฟล์
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = "โปรดระบุชื่อ";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ตรวจสอบความถูกต้องของข้อมูลในฟอร์มเปลี่ยนรหัสผ่าน
  const validatePassword = () => {
    const errors = {};
    if (!passwordData.current_password) {
      errors.current_password = "โปรดระบุรหัสผ่านปัจจุบัน";
    }
    if (!passwordData.new_password) {
      errors.new_password = "โปรดระบุรหัสผ่าน";
    } else if (passwordData.new_password.length < 8) {
      errors.new_password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordData.new_password)
    ) {
      errors.new_password =
        "รหัสผ่านจะต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก และตัวเลข";
    }
    if (passwordData.new_password !== passwordData.confirm_password) {
      errors.confirm_password = "รหัสผ่านไม่ตรงกัน";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // อัปโหลดรูปภาพโปรไฟล์
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

  // ลบรูปภาพโปรไฟล์
  const handleDeleteImage = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/profile/delete-image`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setImagePreview(null);
      await fetchProfile();
      setShowDeleteImageConfirmModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete image");
    } finally {
      setActionLoading(false);
    }
  };

  // บันทึกข้อมูลโปรไฟล์ที่แก้ไข
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

  // เปลี่ยนรหัสผ่าน
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

  // จัดรูปแบบวันที่ให้เป็นภาษาไทย
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
  };

  // แสดงการโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        data-cy="profile-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 px-4 sm:py-12"
      data-cy="profile-page"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ส่วนหัวของหน้าโปรไฟล์ */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                ตั้งค่าโปรไฟล์
              </h1>
              <div
                className="px-3 py-1 sm:px-4 sm:py-2 bg-white rounded-lg self-start"
                data-cy="profile-role"
              >
                <span className="text-sm sm:text-base text-black font-medium capitalize">
                  {profile?.role || "User"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 md:p-8">
            {/* แสดงข้อความแจ้งเตือนความผิดพลาด */}
            {error && (
              <div
                className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 flex items-center gap-2"
                data-cy="profile-error"
              >
                <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                <span className="text-sm sm:text-base text-red-700">
                  {error}
                </span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto hover:bg-red-100 p-1 rounded-full transition-colors"
                  data-cy="close-error"
                >
                  <X className="h-4 w-4 text-red-500" />
                </button>
              </div>
            )}

            {/* ส่วนรูปภาพโปรไฟล์และข้อมูลพื้นฐาน */}
            <div className="flex flex-col items-center md:flex-row md:items-start gap-6 mb-6 sm:mb-8">
              {/* ส่วนรูปภาพโปรไฟล์ */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer"
                    onClick={() =>
                      imagePreview && setShowImagePreviewModal(true)
                    }
                    data-cy="profile-image"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <UserCircle className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>

                {/* ปุ่มจัดการรูปภาพโปรไฟล์ */}
                <div className="flex gap-2">
                  <label
                    className="bg-blue-500 p-2 sm:p-3 rounded-full cursor-pointer hover:bg-blue-600 transition-colors shadow-lg"
                    data-cy="upload-image-btn"
                  >
                    <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/jpeg,image/png"
                      data-cy="image-input"
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
                      onClick={() => setShowDeleteImageConfirmModal(true)}
                      className="bg-red-500 p-2 sm:p-3 rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      data-cy="delete-image-btn"
                    >
                      <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                  )}
                </div>

                {/* ปุ่มอัปโหลดรูปภาพใหม่ */}
                {selectedImage && (
                  <button
                    onClick={handleImageUpload}
                    disabled={actionLoading}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 shadow-md w-full max-w-[200px]"
                    data-cy="confirm-upload-btn"
                  >
                    {actionLoading ? "Uploading..." : "Upload New Image"}
                  </button>
                )}
              </div>

              {/* โมดัลยืนยันการลบรูปภาพ */}
              <Modal
                isOpen={showDeleteImageConfirmModal}
                onRequestClose={() => setShowDeleteImageConfirmModal(false)}
                style={modalStyles}
                data-cy="delete-image-confirm-modal"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-center mb-4">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mr-4" />
                    <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                      ต้องการลบรูปภาพใช่หรือไม่?
                    </h2>
                  </div>

                  <p className="text-center text-sm sm:text-base text-gray-600 mb-4">
                    คุณแน่ใจหรือว่าต้องการลบรูปภาพโปรไฟล์?
                  </p>

                  <div className="flex gap-4 pt-4">
                    <button
                      onClick={handleDeleteImage}
                      disabled={actionLoading}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      data-cy="confirm-delete-image"
                    >
                      {actionLoading ? "กำลังลบ..." : "ลบ"}
                    </button>
                    <button
                      onClick={() => setShowDeleteImageConfirmModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                      data-cy="cancel-delete-image"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </Modal>

              {/* ข้อมูลพื้นฐานของผู้ใช้ */}
              <div className="flex flex-col space-y-2 sm:space-y-3 text-center md:text-left md:pt-2">
                <h2
                  className="text-xl sm:text-2xl font-semibold text-gray-800"
                  data-cy="profile-name"
                >
                  {profile?.name}
                </h2>
                <div
                  className="flex items-center justify-center md:justify-start space-x-2 text-gray-600"
                  data-cy="profile-email"
                >
                  <Mail className="w-4 h-4" />
                  <span className="text-sm sm:text-base break-all">
                    {profile?.email}
                  </span>
                </div>
                <div
                  className="flex items-center justify-center md:justify-start space-x-2 text-gray-600"
                  data-cy="profile-created-at"
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm sm:text-base">
                    เริ่มใช้งาน {formatDate(profile?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {/* ส่วนฟอร์มแก้ไขข้อมูล */}
            <div className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {/* ช่องกรอกชื่อ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ
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
                      className={`w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500 ${
                        formErrors.name ? "border-red-500" : ""
                      }`}
                      data-cy="name-input"
                    />
                    <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                  {formErrors.name && (
                    <p
                      className="mt-1 text-xs sm:text-sm text-red-500"
                      data-cy="name-error"
                    >
                      {formErrors.name}
                    </p>
                  )}
                </div>

                {/* ช่องแสดงอีเมล (ไม่สามารถแก้ไขได้) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={formData.email}
                      disabled={true}
                      className="w-full px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base border rounded-lg bg-gray-50 text-gray-500"
                      data-cy="email-input"
                    />
                    <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  </div>
                </div>
              </div>

              {/* ปุ่มดำเนินการต่างๆ */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 sm:gap-4 pt-4 sm:pt-6">
                {!editMode ? (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md w-full sm:w-auto"
                    data-cy="edit-profile-btn"
                  >
                    แก้ไขโปรไฟล์
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSubmit}
                      disabled={actionLoading}
                      className="px-4 py-2 sm:px-6 sm:py-2.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors shadow-md disabled:opacity-50 w-full sm:w-auto"
                      data-cy="save-profile-btn"
                    >
                      {actionLoading ? "Saving..." : "บันทึก"}
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
                      className="px-4 py-2 sm:px-6 sm:py-2.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-md w-full sm:w-auto"
                      data-cy="cancel-edit-btn"
                    >
                      ยกเลิก
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors shadow-md w-full sm:w-auto sm:ml-auto"
                  data-cy="change-password-btn"
                >
                  <Lock className="h-4 w-4" />
                  เปลี่ยนรหัสผ่าน
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* โมดัลแสดงรูปภาพขนาดใหญ่ */}
      <Modal
        isOpen={showImagePreviewModal}
        onRequestClose={() => setShowImagePreviewModal(false)}
        style={imagePreviewModalStyles}
        data-cy="image-preview-modal"
      >
        <div className="relative">
          <button
            onClick={() => setShowImagePreviewModal(false)}
            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10"
            data-cy="close-preview-btn"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </button>
          <img
            src={imagePreview}
            alt="Profile Preview"
            className="max-w-full max-h-[80vh] object-contain"
          />
        </div>
      </Modal>

      {/* โมดัลเปลี่ยนรหัสผ่าน */}
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
        data-cy="password-modal"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              เปลี่ยนรหัสผ่าน
            </h2>
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
              data-cy="close-password-modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* ช่องกรอกรหัสผ่านปัจจุบัน */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่านปัจจุบัน
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
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.current_password ? "border-red-500" : ""
                }`}
                data-cy="current-password-input"
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
                data-cy="toggle-current-password"
              >
                {showPassword.current ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.current_password && (
              <p
                className="mt-1 text-xs sm:text-sm text-red-500"
                data-cy="current-password-error"
              >
                {passwordErrors.current_password}
              </p>
            )}
          </div>

          {/* ช่องกรอกรหัสผ่านใหม่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รหัสผ่านใหม่
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
                className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  passwordErrors.new_password ? "border-red-500" : ""
                }`}
                data-cy="new-password-input"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPassword({ ...showPassword, new: !showPassword.new })
                }
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                data-cy="toggle-new-password"
              >
                {showPassword.new ? (
                  <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.new_password && (
              <p
                className="mt-1 text-xs sm:text-sm text-red-500"
                data-cy="new-password-error"
              >
                {passwordErrors.new_password}
              </p>
            )}
          </div>

          {/* ช่องกรอกยืนยันรหัสผ่านใหม่ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ยืนยันรหัสผ่านใหม่
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
                data-cy="confirm-password-input"
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
                data-cy="toggle-confirm-password"
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {passwordErrors.confirm_password && (
              <p
                className="mt-1 text-sm text-red-500"
                data-cy="confirm-password-error"
              >
                {passwordErrors.confirm_password}
              </p>
            )}
          </div>

          {/* ปุ่มในโมดัลเปลี่ยนรหัสผ่าน */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={handlePasswordChange}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              data-cy="confirm-password-change"
            >
              {actionLoading ? "Changing..." : "ยืนยัน"}
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
              data-cy="cancel-password-change"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
