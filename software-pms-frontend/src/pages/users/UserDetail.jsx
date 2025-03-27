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
  User,
  Mail,
  Globe,
  UserCircle,
} from "lucide-react";

// Environment Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Modal Configuration
Modal.setAppElement("#root");

const UserDetail = () => {
  // ===== สถานะและค่าที่ใช้ในคอมโพเนนต์ =====
  const { id } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileImageError, setProfileImageError] = useState(false);

  // ===== สถานะสิทธิ์เข้าถึง =====
  // ตรวจสอบว่าผู้ใช้มีสิทธิ์ดูข้อมูลหรือไม่
  const hasPermission =
    user?.role === "Admin" || user?.user_id === parseInt(id);
  // สิทธิ์ในการแก้ไขข้อมูล
  const canEdit = user?.role === "Admin" || user?.user_id === parseInt(id);
  // สิทธิ์ในการลบผู้ใช้ (ต้องเป็น Admin และไม่ใช่ตัวเอง และผู้ถูกลบต้องไม่ใช่ Admin)
  const canDelete =
    user?.role === "Admin" &&
    user?.user_id !== parseInt(id) &&
    userData?.role !== "Admin";

  // ===== API ฟังก์ชั่น =====
  // ดึงข้อมูลผู้ใช้
  useEffect(() => {
    const fetchUser = async () => {
      if (!user?.token || !id) {
        setError("ไม่มีสิทธิ์เข้าถึง");
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUserData(response.data);
      } catch (err) {
        // ถ้าเซสชั่นหมดอายุให้ logout และกลับไปหน้า login
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id, user, logout, navigate]);

  // ลบผู้ใช้
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
      setError(err.response?.data?.message || "ไม่สามารถลบผู้ใช้ได้");
    }
  };

  // จัดการความล้มเหลวในการโหลดรูปภาพ
  const handleImageError = () => {
    setProfileImageError(true);
  };

  // ===== การเรนเดอร์ =====
  // ตรวจสอบการล็อกอิน
  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  // ตรวจสอบสิทธิ์การเข้าถึง
  if (!hasPermission) {
    return (
      <div
        className="text-center p-4 sm:p-6 min-h-screen bg-gray-100 flex items-center justify-center"
        data-cy="access-denied"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">
            ไม่มีสิทธิ์เข้าถึง
          </h2>
          <p className="text-gray-600">คุณไม่มีสิทธิ์ในการดูโปรไฟล์นี้</p>
        </div>
      </div>
    );
  }

  // แสดงสถานะโหลดและข้อผิดพลาด
  if (loading)
    return (
      <div
        className="text-center p-4 sm:p-6 min-h-screen bg-gray-100 flex items-center justify-center"
        data-cy="loading-state"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-blue-200 h-24 w-24 mb-4"></div>
            <div className="h-6 bg-blue-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-64"></div>
          </div>
        </div>
      </div>
    );

  if (error)
    return (
      <div
        className="text-center text-red-500 p-4 sm:p-6 min-h-screen bg-gray-100 flex items-center justify-center"
        data-cy="error-state"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-red-500 text-xl font-bold mb-2">ข้อผิดพลาด</div>
          <div>{error}</div>
        </div>
      </div>
    );

  if (!userData)
    return (
      <div
        className="text-center p-4 sm:p-6 min-h-screen bg-gray-100 flex items-center justify-center"
        data-cy="no-user-state"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="text-gray-600 text-xl font-bold">ไม่พบผู้ใช้</div>
        </div>
      </div>
    );

  // ===== รายการข้อมูลผู้ใช้ =====
  const userDetailItems = [
    {
      icon: <Mail className="text-blue-500" />,
      label: "อีเมล",
      value: userData.email,
      dataCy: "user-email",
    },
    {
      icon: <Shield className="text-green-500" />,
      label: "บทบาท",
      value: userData.role,
      dataCy: "user-role",
    },
    {
      icon: <Clock className="text-purple-500" />,
      label: "สร้างเมื่อ",
      value: new Date(userData.created_at).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      dataCy: "user-created-date",
    },
    {
      icon: <Clock className="text-indigo-500" />,
      label: "อัปเดตล่าสุด",
      value: new Date(userData.updated_at).toLocaleDateString("th-TH", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      dataCy: "user-updated-date",
    },
  ];

  return (
    <div
      className="min-h-screen bg-gray p-3 sm:p-4 md:p-6"
      data-cy="user-detail-page"
    >
      <div className="container mx-auto max-w-4xl space-y-4 sm:space-y-6">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={() => navigate("/users/")}
          className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-blue-600 mb-2 sm:mb-4 bg-white/70 backdrop-blur-sm py-2 px-4 rounded-lg shadow-sm hover:shadow-md transition-all"
          data-cy="back-button"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>ย้อนกลับ</span>
        </button>

        {/* การ์ดโปรไฟล์ผู้ใช้ */}
        <div
          className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden border border-blue-100"
          data-cy="user-profile-card"
        >
          {/* ส่วนหัวโปรไฟล์พร้อมรูปภาพ */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-500 to-blue-600 text-white flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="relative">
              {/* รูปโปรไฟล์ */}
              <div
                className="w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center"
                data-cy="user-profile-image"
              >
                {!profileImageError && userData.profile_image ? (
                  <img
                    src={userData.profile_image}
                    alt={`${userData.name} profile`}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <UserCircle className="w-20 h-20 text-gray-400" />
                  </div>
                )}
              </div>
              {/* ตัวแสดงบทบาท */}
              <div
                className="absolute -bottom-2 right-0 bg-white rounded-full px-2 py-1 text-xs font-bold shadow-md border border-blue-100"
                style={{ minWidth: "70px", textAlign: "center" }}
              >
                <span
                  className={`${
                    userData.role === "Admin"
                      ? "text-red-500"
                      : userData.role === "Product Owner"
                      ? "text-orange-500"
                      : userData.role === "Tester"
                      ? "text-green-500"
                      : "text-blue-400"
                  }`}
                >
                  {userData.role}
                </span>
              </div>
            </div>

            <div className="flex-1 text-center sm:text-left">
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold break-words mb-2"
                data-cy="user-name"
              >
                {userData.name}
              </h1>
              <p className="text-blue-100 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm sm:text-base">{userData.email}</span>
              </p>
            </div>
          </div>

          {/* ส่วนของปุ่มการทำงาน */}
          <div className="p-4 sm:p-6 border-b border-blue-100">
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4">
              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/users/${id}/edit`)}
                    className="btn-primary flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                    data-cy="edit-profile-button"
                  >
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>แก้ไขโปรไฟล์</span>
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  data-cy="delete-user-button"
                >
                  <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>ลบผู้ใช้</span>
                </button>
              )}
            </div>
          </div>

          {/* ส่วนแสดงรายละเอียดผู้ใช้ */}
          <div className="p-4 sm:p-6" data-cy="user-details-section">
            <h2 className="text-xl sm:text-2xl font-bold text-blue-800 mb-4 sm:mb-6 flex items-center">
              <Shield className="mr-2 sm:mr-3 text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              ข้อมูลผู้ใช้
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              {userDetailItems.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all border border-blue-100"
                  data-cy={detail.dataCy}
                >
                  <div className="p-2 sm:p-3 bg-white rounded-full flex-shrink-0 shadow-sm border border-blue-100">
                    {detail.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm text-gray-500">
                      {detail.label}
                    </p>
                    <p className="font-semibold text-gray-800 text-sm sm:text-base break-words">
                      {detail.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ส่วนท้าย Card */}
          <div className="p-4 sm:p-6 bg-gradient-to-b from-blue-50 to-indigo-100 border-t border-blue-100">
            <div className="flex justify-center">
              <div className="text-sm text-blue-500 font-medium flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span>ข้อมูลผู้ใช้งานระบบ</span>
              </div>
            </div>
          </div>
        </div>

        {/* ===== โมดัล ===== */}
        {/* โมดัลลบผู้ใช้ */}
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          overlayClassName="fixed inset-0"
          data-cy="delete-user-modal"
        >
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
            data-cy="delete-modal"
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6 relative">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-2 md:top-4 right-2 md:right-4 text-gray-500 hover:text-gray-800 transition-colors"
                data-cy="close-delete-modal"
              >
                <X className="w-5 h-5 md:w-6 md:h-6" />
              </button>

              <div className="text-center">
                <Trash2 className="mx-auto h-12 w-12 md:h-16 md:w-16 text-red-500 mb-3 md:mb-4" />
                <h2 className="text-xl md:text-2xl font-bold text-red-600 mb-2">
                  ลบผู้ใช้
                </h2>
                <p className="text-gray-600 mb-4 md:mb-6">
                  คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้{" "}
                  <strong>{userData.name}</strong>?
                  <br />
                  <span className="text-red-500 text-xs">
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                  </span>
                </p>
              </div>

              <div className="flex justify-center space-x-3 md:space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                  data-cy="cancel-delete"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 md:px-6 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  data-cy="confirm-delete"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                  ยืนยันการลบ
                </button>
              </div>
            </div>
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
    @apply bg-blue-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 
           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 
           transform transition-all hover:scale-105 shadow-md;
  }
  
  .btn-secondary {
    @apply bg-gray-200 text-gray-800 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-gray-300 
           focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50 
           transform transition-all hover:scale-105 shadow-md;
  }
  
  .btn-danger {
    @apply bg-red-500 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-red-600 
           focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 
           transform transition-all hover:scale-105 shadow-md;
  }
}
`;

export default UserDetail;
