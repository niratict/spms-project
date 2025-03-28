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
  Camera,
  Image,
  Briefcase,
  Clock,
  Check,
  Activity,
  Pencil,
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
    zIndex: 1000,
  },
};

// กำหนดสไตล์สำหรับ Modal แสดงรูปภาพ - ปรับให้ responsive
const imagePreviewModalStyles = {
  ...modalStyles,
  content: {
    ...modalStyles.content,
    width: "auto",
    maxWidth: "min(800px, 90vw)", // เพิ่มความกว้างเป็น 90% ของหน้าจอเพื่อรองรับภาพขนาดใหญ่บนมือถือ
    maxHeight: "80vh", // เพิ่มความสูงเป็น 80% ของความสูงหน้าจอ
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
  const [showUploadImageModal, setShowUploadImageModal] = useState(false);
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
  const [uploadError, setUploadError] = useState("");

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
        setImagePreview(profileData.profile_image);
      } else {
        setImagePreview(null);
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
    } else {
      // ตรวจสอบเงื่อนไขรหัสผ่านทั้งหมด
      if (passwordData.new_password.length < 8) {
        errors.new_password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
      }
      if (!/[A-Z]/.test(passwordData.new_password)) {
        errors.new_password = "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว";
      }
      if (!/[a-z]/.test(passwordData.new_password)) {
        errors.new_password = "รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว";
      }
      if (!/[0-9]/.test(passwordData.new_password)) {
        errors.new_password = "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว";
      }
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password)) {
        errors.new_password = "รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว";
      }
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

    setUploadError("");
    setActionLoading(true);

    const formData = new FormData();
    formData.append("profile_image", selectedImage);

    try {
      await axios.put(`${API_BASE_URL}/api/profile/update-image`, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      await fetchProfile();
      setSelectedImage(null);
      setShowUploadImageModal(false);
    } catch (err) {
      setUploadError(err.response?.data?.message || "Failed to upload image");
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
      setPasswordErrors({});
      setError(null);
    } catch (err) {
      console.log("Error:", err.response?.data);
      
      // จัดการกับข้อผิดพลาดเกี่ยวกับรหัสผ่านปัจจุบันไม่ถูกต้อง
      if (err.response?.data?.message.includes('current password') || 
          err.response?.data?.message.includes('Current password')) {
        setPasswordErrors({
          ...passwordErrors,
          current_password: "รหัสผ่านปัจจุบันไม่ถูกต้อง"
        });
      } else {
        // ข้อผิดพลาดอื่นๆ
        setError(err.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // จัดรูปแบบวันที่ให้เป็นภาษาไทย
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    // ดึงค่าวัน เดือน ปี
    const day = date.getDate();
    const month = date.getMonth() + 1; // เดือนใน JavaScript เริ่มจาก 0
    const year = date.getFullYear() + 543; // แปลงเป็นปีพุทธศักราช

    // เพิ่ม 0 ข้างหน้าวันและเดือนที่มีเพียงหลักเดียว
    const paddedDay = day.toString().padStart(2, "0");
    const paddedMonth = month.toString().padStart(2, "0");

    // รูปแบบ วัน/เดือน/ปี
    return `${paddedDay}/${paddedMonth}/${year}`;
  };

  // เพิ่มการแปลงสถานะเป็นภาษาไทย
  const statusTranslation = {
    Active: "กำลังดำเนินการ",
    Completed: "เสร็จสิ้น",
    "On Hold": "ระงับชั่วคราว",
  };

  // ฟังก์ชันกำหนดสีตามสถานะโปรเจกต์
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "Completed":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // ฟังก์ชันแสดงไอคอนตามสถานะโปรเจกต์
  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <Activity className="w-4 h-4" />;
      case "Completed":
        return <Check className="w-4 h-4" />;
      case "Pending":
        return <Clock className="w-4 h-4" />;
      case "Cancelled":
        return <X className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  // แสดงการโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
        data-cy="profile-loading"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 py-8 px-4 sm:py-12"
      data-cy="profile-page"
    >
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 px-6 sm:px-8 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                ตั้งค่าโปรไฟล์
              </h1>
              <div
                className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg self-start shadow-sm"
                data-cy="profile-role"
              >
                <span className="text-sm sm:text-base text-indigo-800 font-medium capitalize">
                  {profile?.role || "User"}
                </span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div
              className="mx-6 sm:mx-8 mt-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3"
              data-cy="profile-error"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm sm:text-base text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto hover:bg-red-100 p-1 rounded-full transition-colors"
                data-cy="close-error"
              >
                <X className="h-4 w-4 text-red-500" />
              </button>
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* Profile Info Section */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              {/* Profile Image */}
              <div className="flex flex-col items-center space-y-4">
                <div className="relative group">
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg transition-transform group-hover:scale-102"
                    data-cy="profile-image"
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setShowImagePreviewModal(true)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <UserCircle className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setShowUploadImageModal(true)}
                    className="absolute bottom-1 right-1 bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors shadow-md"
                    data-cy="change-image-btn"
                    aria-label="เปลี่ยนรูปโปรไฟล์"
                    title="เปลี่ยนรูปโปรไฟล์"
                  >
                    <Camera className="w-5 h-5 text-white" />
                  </button>
                </div>
                <div className="text-sm text-gray-500 text-center">
                  คลิกที่ไอคอนกล้องเพื่อเปลี่ยนรูปโปรไฟล์
                </div>
              </div>

              {/* User Info */}
              <div className="flex flex-col space-y-3 text-center md:text-left flex-grow">
                <h2
                  className="text-2xl font-semibold text-gray-800"
                  data-cy="profile-name"
                >
                  {profile?.name}
                </h2>
                <div
                  className="flex items-center justify-center md:justify-start space-x-2 text-gray-600"
                  data-cy="profile-email"
                >
                  <Mail className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <span className="text-base break-all">{profile?.email}</span>
                </div>
                <div
                  className="flex items-center justify-center md:justify-start space-x-2 text-gray-600"
                  data-cy="profile-created-at"
                >
                  <Calendar className="w-5 h-5 flex-shrink-0 text-blue-600" />
                  <span className="text-base">
                    เริ่มใช้งาน {formatDate(profile?.created_at)}
                  </span>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-3 mt-4 justify-center md:justify-start">
                  <button
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    data-cy="edit-profile-btn"
                  >
                    <User className="w-4 h-4" />
                    แก้ไขโปรไฟล์
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordModal(true);
                      setPasswordData({
                        current_password: "",
                        new_password: "",
                        confirm_password: "",
                      });
                      setPasswordErrors({});
                      setError(null);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                    data-cy="change-password-btn"
                  >
                    <Lock className="h-4 w-4" />
                    เปลี่ยนรหัสผ่าน
                  </button>
                </div>
              </div>
            </div>

            {/* Edit Profile Form - Conditional Rendering */}
            {editMode && (
              <div className="bg-blue-50 p-6 rounded-xl shadow-sm mb-8 border border-blue-100">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-blue-600" />
                  แก้ไขข้อมูลส่วนตัว
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name field */}
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
                        className={`w-full px-4 py-2 text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          formErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                        data-cy="name-input"
                        placeholder="ชื่อของคุณ"
                      />
                      <User className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    {formErrors.name && (
                      <p
                        className="mt-1 text-sm text-red-500"
                        data-cy="name-error"
                      >
                        {formErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Email field (disabled) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      อีเมล
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={formData.email}
                        disabled={true}
                        className="w-full px-4 py-2 text-base border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                        data-cy="email-input"
                        placeholder="youremail@example.com"
                      />
                      <Mail className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      ไม่สามารถเปลี่ยนอีเมลได้ โปรดติดต่อผู้ดูแลระบบ
                    </p>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 mt-4 md:mt-0">
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        ...formData,
                        name: profile?.name || "",
                      });
                      setFormErrors({});
                    }}
                    className="px-5 py-2 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors shadow-sm"
                    data-cy="cancel-edit-btn"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={actionLoading}
                    className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
                    data-cy="save-profile-btn"
                  >
                    {actionLoading ? (
                      <span className="animate-pulse">กำลังบันทึก...</span>
                    ) : (
                      "บันทึก"
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Projects Section */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-800">
                    โปรเจกต์ที่ได้รับมอบหมาย
                  </h2>
                </div>
              </div>

              <div className="p-6">
                {profile?.projects && profile.projects.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg">
                    <table
                      className="min-w-full divide-y divide-gray-200"
                      data-cy="projects-table"
                    >
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            ชื่อโปรเจกต์
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            ระยะเวลา
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            ตำแหน่ง
                          </th>
                          <th
                            scope="col"
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            สถานะ
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {profile.projects.map((project) => (
                          <tr
                            key={project.project_id}
                            className="hover:bg-indigo-50/50 transition-colors"
                            data-cy={`project-row-${project.project_id}`}
                          >
                            <td className="px-4 py-4">
                              <div className="font-medium text-gray-900">
                                {project.project_name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                ได้รับมอบหมายเมื่อ{" "}
                                {formatDate(project.assigned_at)}
                              </div>
                              <div className="text-xs text-gray-500">
                                โดย {project.assigned_by_name}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {formatDate(project.project_start_date)} -{" "}
                                {formatDate(project.project_end_date)}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {project.user_role}
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  project.project_status
                                )}`}
                              >
                                {getStatusIcon(project.project_status)}
                                <span className="ml-1">
                                  {statusTranslation[project.project_status] ||
                                    project.project_status}
                                </span>
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div
                    className="bg-indigo-50/50 rounded-lg p-8 text-center"
                    data-cy="no-projects-message"
                  >
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="bg-indigo-100 p-4 rounded-full">
                        <Briefcase className="w-8 h-8 text-indigo-500" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-700">
                        ยังไม่มีโปรเจกต์ที่ได้รับมอบหมาย
                      </h3>
                      <p className="text-gray-500 max-w-md">
                        ขณะนี้คุณยังไม่ได้รับมอบหมายให้ทำงานในโปรเจกต์ใด ๆ
                        <br></br>เมื่อคุณได้รับมอบหมายให้ทำงานในโปรเจกต์
                        ข้อมูลจะปรากฏที่นี่
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* โมดัลอัปโหลดรูปภาพ */}
      <Modal
        isOpen={showUploadImageModal}
        onRequestClose={() => {
          setShowUploadImageModal(false);
          setSelectedImage(null);
          setUploadError("");
        }}
        style={modalStyles}
        data-cy="upload-image-modal"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              เปลี่ยนรูปโปรไฟล์
            </h2>
            <button
              onClick={() => {
                setShowUploadImageModal(false);
                setSelectedImage(null);
                setUploadError("");
              }}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              data-cy="close-upload-modal"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* โมดัลยืนยันการลบรูปภาพ */}
          <Modal
            isOpen={showDeleteImageConfirmModal}
            onRequestClose={() => setShowDeleteImageConfirmModal(false)}
            style={modalStyles}
            data-cy="delete-image-confirm-modal"
          >
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center mb-4">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                  ยืนยันการลบรูปภาพ
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mt-2">
                  คุณต้องการลบรูปโปรไฟล์นี้ใช่หรือไม่?
                </p>
              </div>

              {/* ปุ่มดำเนินการ */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteImageConfirmModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  data-cy="cancel-delete-btn"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDeleteImage}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  data-cy="confirm-delete-btn"
                >
                  <Trash2 className="h-4 w-4" />
                  {actionLoading ? "กำลังลบ..." : "ยืนยันการลบ"}
                </button>
              </div>
            </div>
          </Modal>

          {/* แสดงข้อความแจ้งเตือนความผิดพลาดในการอัปโหลด */}
          {uploadError && (
            <div
              className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2"
              data-cy="upload-error"
            >
              <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{uploadError}</span>
            </div>
          )}

          {/* ส่วนแสดงรูปภาพที่เลือก */}
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
              {selectedImage ? (
                <img
                  src={URL.createObjectURL(selectedImage)}
                  alt="Selected Preview"
                  className="w-full h-full object-cover"
                  data-cy="new-image-preview"
                />
              ) : imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Current Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-50">
                  <UserCircle className="w-20 h-20 text-gray-400" />
                </div>
              )}
            </div>

            {/* ส่วนเลือกและอัปโหลดรูปภาพ */}
            <div className="w-full space-y-4">
              <label
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors cursor-pointer"
                data-cy="choose-image-btn"
              >
                <Image className="h-5 w-5" />
                เลือกรูปภาพ
                <input
                  type="file"
                  className="hidden"
                  accept="image/jpeg,image/png"
                  data-cy="image-input"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size <= 5 * 1024 * 1024) {
                        setSelectedImage(file);
                        setUploadError("");
                      } else {
                        setUploadError("ขนาดไฟล์ต้องไม่เกิน 5MB");
                      }
                    }
                  }}
                />
              </label>

              <div className="text-sm text-gray-500 text-center">
                อัปโหลดรูปภาพขนาดไม่เกิน 5MB (.jpg, .png)
              </div>

              <div className="flex gap-3">
                {/* ปุ่มลบรูปภาพ (แสดงเฉพาะเมื่อมีรูปภาพอยู่แล้ว) */}
                {imagePreview && (
                  <button
                    onClick={() => {
                      setShowDeleteImageConfirmModal(true);
                      setShowUploadImageModal(true);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    data-cy="delete-image-from-modal-btn"
                  >
                    ลบรูปภาพ
                  </button>
                )}
                {/* ปุ่มบันทึกการเปลี่ยนรูปภาพ */}
                <button
                  onClick={handleImageUpload}
                  disabled={!selectedImage || actionLoading}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  data-cy="confirm-upload-btn"
                >
                  {actionLoading ? "กำลังอัปโหลด..." : "บันทึกรูปภาพ"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

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
          setError(null);
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
                setError(null);
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
                placeholder="รหัสผ่านปัจจุบัน"
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
                placeholder="รหัสผ่านใหม่"
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
                placeholder="ยืนยันรหัสผ่านใหม่"
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

          {/* เงื่อนไขการตั้งรหัสผ่าน */}
          <div className="mt-3 space-y-2 text-sm text-gray-600">
            <p className="font-medium">มีเงื่อนไขในการตั้งค่ารหัสผ่านดังนี้</p>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${passwordData.new_password.length >= 8 ? 'bg-green-500' : 'bg-gray-200'}`}>
                {passwordData.new_password.length >= 8 && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={passwordData.new_password.length >= 8 ? 'text-green-600' : ''}>ต้องมีตัวอักษรอย่างน้อย 8 ตัวอักษร</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${/[A-Z]/.test(passwordData.new_password) ? 'bg-green-500' : 'bg-gray-200'}`}>
                {/[A-Z]/.test(passwordData.new_password) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={/[A-Z]/.test(passwordData.new_password) ? 'text-green-600' : ''}>ต้องมีตัวอักษรพิมพ์ใหญ่ (A-Z)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${/[a-z]/.test(passwordData.new_password) ? 'bg-green-500' : 'bg-gray-200'}`}>
                {/[a-z]/.test(passwordData.new_password) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={/[a-z]/.test(passwordData.new_password) ? 'text-green-600' : ''}>ต้องมีตัวอักษรพิมพ์เล็ก (a-z)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${/[0-9]/.test(passwordData.new_password) ? 'bg-green-500' : 'bg-gray-200'}`}>
                {/[0-9]/.test(passwordData.new_password) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={/[0-9]/.test(passwordData.new_password) ? 'text-green-600' : ''}>ต้องมีตัวเลข (0-9)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 flex items-center justify-center rounded-full ${/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password) ? 'bg-green-500' : 'bg-gray-200'}`}>
                {/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className={/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password) ? 'text-green-600' : ''}>ต้องมีอักษรพิเศษ เช่น @!& เป็นต้น</span>
            </div>
          </div>

          {/* ปุ่มในโมดัลเปลี่ยนรหัสผ่าน */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordData({
                  current_password: "",
                  new_password: "",
                  confirm_password: "",
                });
                setPasswordErrors({});
                setError(null);
              }}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              data-cy="cancel-password-change"
            >
              ยกเลิก
            </button>
            <button
              onClick={() => {
                handlePasswordChange();
              }}
              disabled={actionLoading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              data-cy="confirm-password-change"
            >
              {actionLoading ? "กำลังเปลี่ยน..." : "ยืนยัน"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;
