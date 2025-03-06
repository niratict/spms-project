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

// ตั้งค่า URL ของ API จาก environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

// กำหนด root element สำหรับ Modal
Modal.setAppElement("#root");

// สไตล์สำหรับ Modal ทั้งหมด
const modalStyles = {
  content: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%", // เปลี่ยนเป็น percent แทนค่าตายตัว
    maxWidth: "400px", // เพิ่ม maxWidth สำหรับหน้าจอใหญ่
    padding: "20px", // ปรับให้เล็กลงบนมือถือ
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    backgroundColor: "white",
    maxHeight: "90vh", // ปรับความสูงสูงสุดตาม viewport
    overflow: "auto", // เพิ่ม scroll เมื่อเนื้อหาเกินขนาด
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
  // --------- HOOKS & STATE ---------
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ข้อมูลผู้ใช้และสถานะการโหลด
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // สถานะการแสดง Modal
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // ข้อมูลฟอร์มสำหรับแก้ไขข้อมูลผู้ใช้
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // ข้อมูลฟอร์มสำหรับเปลี่ยนรหัสผ่าน
  const [passwordData, setPasswordData] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  // --------- EFFECTS ---------
  // ดึงข้อมูลผู้ใช้เมื่อโหลดคอมโพเนนต์
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
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchUser();
  }, [id, user]);

  // --------- EVENT HANDLERS ---------
  // จัดการการกลับไปหน้าก่อนหน้า
  const handleBackNavigation = () => {
    navigate(`/users/${id}`);
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์มแก้ไขผู้ใช้
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  // จัดการการเปลี่ยนแปลงข้อมูลในฟอร์มเปลี่ยนรหัสผ่าน
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPasswordError(null);
  };

  // --------- API ACTIONS ---------
  // บันทึกการเปลี่ยนแปลงข้อมูลผู้ใช้
  const handleSubmit = async () => {
    setActionLoading(true);
    try {
      await axios.put(`${API_BASE_URL}/api/users/${id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setShowConfirmModal(false);
      navigate(`/users/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถอัปเดตผู้ใช้ได้");
    } finally {
      setActionLoading(false);
    }
  };

  // บันทึกการเปลี่ยนแปลงรหัสผ่าน
  const handlePasswordSubmit = async () => {
    // ตรวจสอบการกรอกข้อมูลรหัสผ่าน
    if (!passwordData.new_password.trim()) {
      setPasswordError("กรุณากรอกรหัสผ่านใหม่");
      return;
    }

    if (!passwordData.confirm_password.trim()) {
      setPasswordError("กรุณายืนยันรหัสผ่านใหม่");
      return;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setPasswordError("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (user.role !== "Admin" && !passwordData.current_password.trim()) {
      setPasswordError("กรุณากรอกรหัสผ่านปัจจุบัน");
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
        err.response?.data?.message || "ไม่สามารถเปลี่ยนรหัสผ่านได้"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ลบผู้ใช้
  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถลบผู้ใช้ได้");
    } finally {
      setActionLoading(false);
    }
  };

  // --------- RENDER CONDITIONS ---------
  if (loading)
    return (
      <div
        className="text-center p-4 md:p-6 text-gray-500"
        data-cy="loading-state"
      >
        กำลังโหลด...
      </div>
    );

  if (error) {
    return (
      <div className="p-4 md:p-6" data-cy="error-state">
        <div className="bg-red-50 border border-red-200 p-3 md:p-4 rounded-lg flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500 flex-shrink-0" />
          <span className="text-red-700 text-sm md:text-base">{error}</span>
        </div>
      </div>
    );
  }

  if (!userData)
    return (
      <div
        className="text-center p-4 md:p-6 text-gray-500"
        data-cy="no-data-state"
      >
        ไม่พบข้อมูลผู้ใช้
      </div>
    );

  // --------- MAIN COMPONENT RENDER ---------
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-4 md:p-6">
        {/* ปุ่มย้อนกลับ */}
        <button
          onClick={handleBackNavigation}
          className="flex items-center gap-1 md:gap-2 text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors text-sm md:text-base"
          data-cy="back-button"
        >
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          <span>กลับไปหน้าผู้ใช้</span>
        </button>

        {/* ฟอร์มแก้ไขข้อมูลผู้ใช้ */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
          <div className="bg-blue-50 p-4 md:p-6 border-b border-blue-100 flex items-center">
            <User className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-2 md:mr-3 flex-shrink-0" />
            <h2 className="text-lg md:text-xl font-semibold text-blue-800">
              แก้ไขข้อมูลผู้ใช้
            </h2>
          </div>

          <form className="p-4 md:p-6" data-cy="user-edit-form">
            {/* แสดงข้อความแจ้งเตือนเมื่อมีข้อผิดพลาด */}
            {error && (
              <div
                className="bg-red-50 border border-red-200 p-3 md:p-4 rounded-lg flex items-center space-x-2 md:space-x-3 mb-4 md:mb-6"
                data-cy="form-error"
              >
                <AlertCircle className="h-5 w-5 md:h-6 md:w-6 text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm md:text-base">
                  {error}
                </span>
              </div>
            )}

            <div className="grid gap-4 md:gap-6 mb-4 md:mb-6">
              {/* ฟิลด์ชื่อ */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                <User className="hidden md:inline w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ชื่อ
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                    data-cy="name-input"
                  />
                </div>
              </div>

              {/* ฟิลด์อีเมล */}
              <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                <Mail className="hidden md:inline w-5 h-5 text-gray-500 flex-shrink-0" />
                <div className="flex-grow">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                    data-cy="email-input"
                  />
                </div>
              </div>

              {/* ฟิลด์บทบาท (แสดงเฉพาะ Admin) */}
              {user.role === "Admin" && (
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                  <Edit className="hidden md:inline w-5 h-5 text-gray-500 flex-shrink-0" />
                  <div className="flex-grow">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      บทบาท
                    </label>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200 transition-all"
                      data-cy="role-select"
                    >
                      <option value="Viewer">Viewer</option>
                      <option value="Tester">Tester</option>
                      <option value="Product Owner">Product Owner</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* ส่วนปุ่มการทำงาน */}
            <div className="flex flex-col md:flex-row md:justify-between pt-4 border-t border-gray-200 space-y-4 md:space-y-0">
              <div className="flex flex-wrap gap-3">
                {/* ปุ่มเปลี่ยนรหัสผ่าน */}
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="flex items-center px-3 md:px-4 py-2 text-sm md:text-base text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
                  data-cy="change-password-button"
                >
                  <Lock className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" />
                  เปลี่ยนรหัสผ่าน
                </button>

                {/* ปุ่มลบผู้ใช้ (แสดงเฉพาะกรณีที่ Admin ไม่ได้กำลังแก้ไขตัวเองหรือผู้ใช้ที่เป็น Admin) */}
                {user.role === "Admin" &&
                  user.user_id !== parseInt(id) &&
                  userData.role !== "Admin" && (
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center px-3 md:px-4 py-2 text-sm md:text-base text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors"
                      data-cy="delete-user-button"
                    >
                      <Trash2 className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" />
                      ลบผู้ใช้
                    </button>
                  )}
              </div>

              <div className="flex space-x-3 md:space-x-4">
                {/* ปุ่มยกเลิก */}
                <button
                  type="button"
                  onClick={handleBackNavigation}
                  className="flex-1 md:flex-none px-3 md:px-4 py-2 text-sm md:text-base border rounded hover:bg-gray-100 transition-colors"
                  data-cy="cancel-button"
                >
                  ยกเลิก
                </button>

                {/* ปุ่มบันทึกการเปลี่ยนแปลง */}
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center px-3 md:px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                  data-cy="save-changes-button"
                >
                  <Edit className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" />
                  บันทึกการเปลี่ยนแปลง
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* --------- MODALS --------- */}
      {/* Modal ยืนยันการบันทึกการเปลี่ยนแปลง */}
      <Modal
        isOpen={showConfirmModal}
        onRequestClose={() => !actionLoading && setShowConfirmModal(false)}
        style={modalStyles}
        contentLabel="Confirm Save Modal"
        className="focus:outline-none"
        data-cy="confirm-save-modal"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              ยืนยันการเปลี่ยนแปลง
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการบันทึกการเปลี่ยนแปลงข้อมูลผู้ใช้นี้?
            </p>
          </div>
          <div className="flex justify-center space-x-3 md:space-x-4 pt-3 md:pt-4">
            <button
              onClick={() => setShowConfirmModal(false)}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              data-cy="confirm-cancel"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSubmit}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              data-cy="confirm-save"
            >
              {actionLoading ? "กำลังบันทึก..." : "ยืนยัน"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal เปลี่ยนรหัสผ่าน */}
      <Modal
        isOpen={showPasswordModal}
        onRequestClose={() => !actionLoading && setShowPasswordModal(false)}
        style={modalStyles}
        contentLabel="Change Password Modal"
        className="focus:outline-none"
        data-cy="password-modal"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-2">
              เปลี่ยนรหัสผ่าน
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่
            </p>
          </div>

          {/* แสดงข้อความแจ้งเตือนเมื่อมีข้อผิดพลาดเกี่ยวกับรหัสผ่าน */}
          {passwordError && (
            <div
              className="bg-red-50 border border-red-200 p-3 rounded-lg flex items-center space-x-2 md:space-x-3"
              data-cy="password-error"
            >
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
              <span className="text-sm md:text-base text-red-700">
                {passwordError}
              </span>
            </div>
          )}

          <div className="space-y-3 md:space-y-4 pt-2">
            {/* ฟิลด์รหัสผ่านปัจจุบัน (แสดงเฉพาะเมื่อไม่ใช่ Admin) */}
            {user.role !== "Admin" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  รหัสผ่านปัจจุบัน
                </label>
                <input
                  type="password"
                  name="current_password"
                  value={passwordData.current_password}
                  onChange={handlePasswordChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
                  data-cy="current-password-input"
                />
              </div>
            )}

            {/* ฟิลด์รหัสผ่านใหม่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รหัสผ่านใหม่
              </label>
              <input
                type="password"
                name="new_password"
                value={passwordData.new_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
                data-cy="new-password-input"
              />
            </div>

            {/* ฟิลด์ยืนยันรหัสผ่านใหม่ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
                data-cy="confirm-password-input"
              />
            </div>
          </div>

          <div className="flex justify-center space-x-3 md:space-x-4 pt-3 md:pt-4">
            <button
              onClick={() => setShowPasswordModal(false)}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              data-cy="password-cancel"
            >
              ยกเลิก
            </button>
            <button
              onClick={handlePasswordSubmit}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
              data-cy="password-save"
            >
              {actionLoading ? "กำลังอัปเดต..." : "อัปเดตรหัสผ่าน"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal ลบผู้ใช้ */}
      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => !actionLoading && setShowDeleteModal(false)}
        style={modalStyles}
        contentLabel="Delete User Modal"
        className="focus:outline-none"
        data-cy="delete-modal"
      >
        <div className="space-y-4">
          <div className="text-center">
            <h2 className="text-lg md:text-xl font-bold text-red-600 mb-2">
              ลบผู้ใช้
            </h2>
            <p className="text-sm md:text-base text-gray-600">
              คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้นี้?
            </p>
          </div>
          <div className="flex justify-center space-x-3 md:space-x-4 pt-3 md:pt-4">
            <button
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50"
              data-cy="delete-cancel"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleDelete}
              disabled={actionLoading}
              className="px-3 md:px-4 py-2 text-sm md:text-base bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors disabled:opacity-50"
              data-cy="delete-confirm"
            >
              {actionLoading ? "กำลังลบ..." : "ลบ"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserEdit;
