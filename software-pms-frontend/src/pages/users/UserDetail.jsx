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
  // ===== สถานะและค่าที่ใช้ในคอมโพเนนต์ =====
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

  // เปลี่ยนรหัสผ่าน
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // ตรวจสอบความถูกต้องของรหัสผ่าน
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
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
      alert("เปลี่ยนรหัสผ่านสำเร็จ");
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login");
        return;
      }
      alert(err.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    }
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
        className="text-center p-6 min-h-screen bg-gray-100 flex items-center justify-center"
        data-cy="access-denied"
      >
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
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
      <div className="text-center p-6" data-cy="loading-state">
        กำลังโหลด...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 p-6" data-cy="error-state">
        {error}
      </div>
    );
  if (!userData)
    return (
      <div className="text-center p-6" data-cy="no-user-state">
        ไม่พบผู้ใช้
      </div>
    );

  // ===== รายการข้อมูลผู้ใช้ =====
  const userDetailItems = [
    {
      icon: <Calendar className="text-blue-500" />,
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
    <div className="min-h-screen bg-gray-100 p-6" data-cy="user-detail-page">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={() => navigate("/users/")}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-4"
          data-cy="back-button"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>ย้อนกลับ</span>
        </button>

        {/* การ์ดโปรไฟล์ผู้ใช้ */}
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          data-cy="user-profile-card"
        >
          {/* ส่วนหัวโปรไฟล์ */}
          <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <h1 className="text-3xl font-bold" data-cy="user-name">
              {userData.name}
            </h1>
          </div>

          {/* ส่วนของปุ่มการทำงาน */}
          <div className="p-6">
            <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
              {canEdit && (
                <>
                  <button
                    onClick={() => navigate(`/users/${id}/edit`)}
                    className="btn-primary flex items-center space-x-2"
                    data-cy="edit-profile-button"
                  >
                    <Edit className="w-5 h-5" />
                    <span>แก้ไขโปรไฟล์</span>
                  </button>
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="btn-secondary flex items-center space-x-2"
                    data-cy="change-password-button"
                  >
                    <KeyRound className="w-5 h-5" />
                    <span>เปลี่ยนรหัสผ่าน</span>
                  </button>
                </>
              )}
              {canDelete && (
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="btn-danger flex items-center space-x-2"
                  data-cy="delete-user-button"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>ลบผู้ใช้</span>
                </button>
              )}
            </div>

            {/* ส่วนแสดงรายละเอียดผู้ใช้ */}
            <div
              className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl shadow-lg overflow-hidden"
              data-cy="user-details-section"
            >
              <div className="p-6 bg-white/70 backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-blue-800 mb-6 flex items-center">
                  <Shield className="mr-3 text-blue-600" />
                  ข้อมูลผู้ใช้
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {userDetailItems.map((detail, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                      data-cy={detail.dataCy}
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

        {/* ===== โมดัล ===== */}
        {/* โมดัลลบผู้ใช้ */}
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black/50"
          data-cy="delete-user-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              data-cy="close-delete-modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-red-600 mb-4">ลบผู้ใช้</h2>
            <p className="text-gray-600 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-opacity-50"
                data-cy="cancel-delete"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                data-cy="confirm-delete"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </Modal>

        {/* โมดัลเปลี่ยนรหัสผ่าน */}
        <Modal
          isOpen={showPasswordModal}
          onRequestClose={() => setShowPasswordModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center"
          overlayClassName="fixed inset-0 bg-black/50"
          data-cy="change-password-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              data-cy="close-password-modal"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold text-blue-600 mb-4">
              เปลี่ยนรหัสผ่าน
            </h2>
            <form
              onSubmit={handlePasswordChange}
              className="space-y-4"
              data-cy="password-form"
            >
              {/* รหัสผ่านปัจจุบันต้องกรอกเฉพาะผู้ใช้ทั่วไป (Admin ไม่ต้องกรอก) */}
              {user.role !== "Admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รหัสผ่านปัจจุบัน
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
                    data-cy="current-password-input"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  รหัสผ่านใหม่
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
                  data-cy="new-password-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ยืนยันรหัสผ่านใหม่
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
                  data-cy="confirm-password-input"
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
                  data-cy="cancel-password-change"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                  data-cy="submit-password-change"
                >
                  เปลี่ยนรหัสผ่าน
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
