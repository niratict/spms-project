import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  ArrowLeft,
  User,
  Mail,
  Lock,
  ShieldCheck,
  CheckCircle,
  Save,
  AlertCircle,
} from "lucide-react";

// สร้างตัวแปรสำหรับ API จากไฟล์การตั้งค่า
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * คอมโพเนนต์ Modal สำหรับยืนยันการดำเนินการ
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon: Icon,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      data-cy="confirm-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="text-center">
          <Icon className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            {title}
          </h2>
          <p className="text-gray-600 mb-4 md:mb-6">{message}</p>
        </div>
        <div className="flex justify-center space-x-3 md:space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            data-cy="confirm-cancel"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
            data-cy="confirm-save"
          >
            {title.includes("ยกเลิก") ? (
              "ยืนยันการยกเลิก"
            ) : (
              <>
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                ยืนยันการสร้าง
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์สำหรับสร้างผู้ใช้ใหม่
 */
const CreateUser = () => {
  // -------------------- Hooks และตัวแปรสถานะ --------------------
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFormDirty, setIsFormDirty] = useState(false);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // ข้อมูลฟอร์มสำหรับการสร้างผู้ใช้
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer",
  });

  // ตรวจสอบว่าฟอร์มมีการเปลี่ยนแปลงหรือไม่
  useEffect(() => {
    const isAnyFieldFilled = Object.values(formData).some((value, index) => {
      // ไม่นับค่าเริ่มต้นของ role ว่าเป็นการเปลี่ยนแปลง
      if (index === 3 && value === "Viewer") return false;
      return value !== "";
    });
    setIsFormDirty(isAnyFieldFilled);
  }, [formData]);

  // -------------------- ฟังก์ชันจัดการข้อมูลและเหตุการณ์ --------------------

  // จัดการเปลี่ยนแปลงข้อมูลในฟอร์ม
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // จัดการการส่งฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowCreateConfirm(true);
  };

  // ดำเนินการสร้างผู้ใช้
  const handleConfirmCreate = async () => {
    setShowCreateConfirm(false);
    setError(null);
    setLoading(true);

    try {
      // ส่งข้อมูลไปยัง API เพื่อสร้างผู้ใช้ใหม่
      const response = await axios.post(`${API_BASE_URL}/api/users`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // นำทางกลับไปยังหน้าแสดงรายชื่อผู้ใช้
      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถสร้างผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดการการคลิกปุ่มยกเลิก
  const handleCancel = () => {
    // ถ้าฟอร์มมีการเปลี่ยนแปลง ให้แสดง Modal ยืนยัน
    if (isFormDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate("/users");
    }
  };

  // ฟังก์ชันยืนยันการยกเลิก
  const handleConfirmCancel = () => {
    setShowCancelConfirm(false);
    navigate("/users");
  };

  // -------------------- ส่วนแสดงผล UI --------------------
  return (
    <div
      className="min-h-screen pt-16 bg-gray-50"
      data-cy="create-user-container"
    >
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg md:rounded-2xl shadow-lg md:shadow-2xl overflow-hidden">
        {/* ส่วนหัวของฟอร์ม */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 sm:p-6 text-white flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold flex items-center">
            <User className="mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6" />
            สร้างผู้ใช้ใหม่
          </h2>
          <button
            onClick={handleCancel}
            className="text-white hover:bg-blue-700 p-1.5 sm:p-2 rounded-full transition-colors"
            data-cy="back-button"
            aria-label="ย้อนกลับ"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* ฟอร์มสำหรับกรอกข้อมูล */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
          data-cy="create-user-form"
        >
          {/* แสดงข้อความผิดพลาด (ถ้ามี) */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-600 p-3 sm:p-4 rounded-lg flex items-center text-sm sm:text-base"
              data-cy="error-message"
            >
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* ช่องกรอกชื่อ-นามสกุล */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ระบุชื่อ-นามสกุล"
                  className="w-full pl-9 sm:pl-10 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-cy="input-name"
                />
              </div>
            </div>

            {/* ช่องกรอกอีเมล */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ระบุอีเมล"
                  className="w-full pl-9 sm:pl-10 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-cy="input-email"
                />
              </div>
            </div>

            {/* ช่องกรอกรหัสผ่าน */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="สร้างรหัสผ่านที่รัดกุม"
                  className="w-full pl-9 sm:pl-10 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-cy="input-password"
                />
              </div>
            </div>

            {/* ช่องเลือกบทบาทผู้ใช้ */}
            <div className="space-y-1 sm:space-y-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-700">
                บทบาทผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-9 sm:pl-10 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  data-cy="select-role"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Tester">Tester</option>
                  <option value="Product Owner">Product Owner</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* ปุ่มดำเนินการ */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full sm:flex-1 py-2.5 sm:py-3 bg-gray-100 text-gray-700 text-sm sm:text-base rounded-lg 
                         hover:bg-gray-200 focus:outline-none focus:ring-2 
                         focus:ring-gray-300 focus:ring-opacity-50
                         transition-all transform active:scale-95"
              data-cy="cancel-button"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 py-2.5 sm:py-3 bg-blue-500 text-white text-sm sm:text-base rounded-lg hover:bg-blue-600 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                         transition-all transform active:scale-95 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
              data-cy="submit-button"
            >
              {loading ? (
                <span className="animate-pulse">กำลังสร้าง...</span>
              ) : (
                "สร้างผู้ใช้"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal ยืนยันการสร้างผู้ใช้ */}
      <ConfirmModal
        isOpen={showCreateConfirm}
        onClose={() => setShowCreateConfirm(false)}
        onConfirm={handleConfirmCreate}
        title="ยืนยันการสร้างผู้ใช้"
        message="คุณต้องการสร้างผู้ใช้ใหม่ตามข้อมูลที่กรอกหรือไม่?"
        icon={CheckCircle}
      />
      {/* Modal ยืนยันการยกเลิก */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleConfirmCancel}
        title="ยืนยันการยกเลิก"
        message={
          <>
            คุณได้กรอกข้อมูลบางส่วนแล้ว
            <br />
            ต้องการยกเลิกการสร้างผู้ใช้ใหม่หรือไม่?
          </>
        }
        icon={AlertCircle}
      />
    </div>
  );
};

export default CreateUser;
