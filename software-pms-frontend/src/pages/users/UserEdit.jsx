import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  AlertCircle,
  Lock,
  User,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  Save,
  Check,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react";
import DropdownSelect from "../../components/ui/DropdownSelect";

// ตั้งค่า URL ของ API จาก environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

// Component Modal ที่ใช้ร่วมกัน
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  icon,
  confirmText,
  confirmIcon,
  isLoading,
  color = "blue",
  dataCy,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      data-cy={dataCy || "confirm-modal"}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="text-center">
          {icon}
          <h2 className={`text-xl md:text-2xl font-bold text-gray-800 mb-2`}>
            {title}
          </h2>
          <p className="text-gray-600 mb-4 md:mb-6">{message}</p>
        </div>
        <div className="flex justify-center space-x-3 md:space-x-4">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            data-cy="confirm-cancel"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 md:px-6 md:py-2 bg-${color}-500 text-white rounded-lg hover:bg-${color}-600 flex items-center gap-2 transition-colors disabled:opacity-50`}
            data-cy="confirm-save"
          >
            {confirmIcon}
            {isLoading ? "กำลังดำเนินการ..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Component ฟอร์มเปลี่ยนรหัสผ่าน
const PasswordForm = ({
  passwordData,
  handlePasswordChange,
  passwordError,
}) => {
  const { user } = useAuth();
  const [showPassword, setShowPassword] = useState({
    new: false,
    confirm: false,
  });

  return (
    <div className="space-y-3 md:space-y-4 pt-2">
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

      {/* ฟิลด์รหัสผ่านใหม่ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          รหัสผ่านใหม่
        </label>
        <div className="relative">
          <input
            type={showPassword.new ? "text" : "password"}
            name="new_password"
            value={passwordData.new_password}
            onChange={handlePasswordChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
            data-cy="new-password-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword({...showPassword, new: !showPassword.new})}
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
      </div>

      {/* ฟิลด์ยืนยันรหัสผ่านใหม่ */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          ยืนยันรหัสผ่านใหม่
        </label>
        <div className="relative">
          <input
            type={showPassword.confirm ? "text" : "password"}
            name="confirm_password"
            value={passwordData.confirm_password}
            onChange={handlePasswordChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-200"
            data-cy="confirm-password-input"
          />
          <button
            type="button"
            onClick={() => setShowPassword({...showPassword, confirm: !showPassword.confirm})}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            data-cy="toggle-confirm-password"
          >
            {showPassword.confirm ? (
              <EyeOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            ) : (
              <Eye className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
            )}
          </button>
        </div>
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
    </div>
  );
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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [passwordError, setPasswordError] = useState(null);

  // สถานะการแก้ไขข้อมูล
  const [isDataChanged, setIsDataChanged] = useState(false);

  // ข้อมูลฟอร์มสำหรับแก้ไขข้อมูลผู้ใช้
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
  });

  // ข้อมูลออริจินัลสำหรับตรวจสอบการเปลี่ยนแปลง
  const [originalFormData, setOriginalFormData] = useState({
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

  // ตัวเลือกสำหรับบทบาท
  const roleOptions = [
    { value: "Viewer", label: "Viewer" },
    { value: "Tester", label: "Tester" },
    { value: "Product Owner", label: "Product Owner" },
    { value: "Admin", label: "Admin" }
  ];

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

        const initialData = {
          name: userData.name,
          email: userData.email,
          role: userData.role,
        };

        setFormData(initialData);
        setOriginalFormData(initialData);
      } catch (err) {
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchUser();
  }, [id, user]);

  // ตรวจสอบการเปลี่ยนแปลงข้อมูล
  useEffect(() => {
    const hasChanges =
      JSON.stringify(formData) !== JSON.stringify(originalFormData);
    setIsDataChanged(hasChanges);
  }, [formData, originalFormData]);

  // --------- EVENT HANDLERS ---------
  // จัดการการกลับไปหน้าก่อนหน้า
  const handleBackNavigation = () => {
    if (isDataChanged) {
      setShowCancelModal(true);
    } else {
      navigate(`/users/${id}`);
    }
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

    // ตรวจสอบเงื่อนไขรหัสผ่านตามที่กำหนด
    if (passwordData.new_password.length < 8) {
      setPasswordError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (!/[A-Z]/.test(passwordData.new_password)) {
      setPasswordError("รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว");
      return;
    }

    if (!/[a-z]/.test(passwordData.new_password)) {
      setPasswordError("รหัสผ่านต้องมีตัวอักษรพิมพ์เล็กอย่างน้อย 1 ตัว");
      return;
    }

    if (!/[0-9]/.test(passwordData.new_password)) {
      setPasswordError("รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว");
      return;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(passwordData.new_password)) {
      setPasswordError("รหัสผ่านต้องมีอักษรพิเศษอย่างน้อย 1 ตัว");
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
                    <DropdownSelect
                      label="บทบาท"
                      value={formData.role}
                      onChange={handleChange}
                      options={roleOptions}
                      dataCy="role-select"
                      icon={<ShieldCheck className="h-4 w-4" />}
                    />
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
                  disabled={!isDataChanged}
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
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => !actionLoading && setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title="ยืนยันการเปลี่ยนแปลง"
        message="คุณแน่ใจหรือไม่ว่าต้องการบันทึกการเปลี่ยนแปลงนี้?"
        icon={
          <CheckCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
        }
        confirmText="บันทึก"
        confirmIcon={<Save className="w-4 h-4 md:w-5 md:h-5" />}
        isLoading={actionLoading}
        dataCy="confirm-save-modal"
      />

      {/* Modal เปลี่ยนรหัสผ่าน */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-cy="password-modal"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="text-center">
              <Lock className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                เปลี่ยนรหัสผ่าน
              </h2>
              <p className="text-gray-600 mb-4 md:mb-6">
                กรุณากรอกข้อมูลเพื่อเปลี่ยนรหัสผ่านของผู้ใช้
              </p>
            </div>

            <PasswordForm
              passwordData={passwordData}
              handlePasswordChange={handlePasswordChange}
              passwordError={passwordError}
            />

            <div className="flex justify-center space-x-3 md:space-x-4">
              <button
                onClick={() => setShowPasswordModal(false)}
                disabled={actionLoading}
                className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                data-cy="password-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={handlePasswordSubmit}
                disabled={actionLoading}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors disabled:opacity-50"
                data-cy="password-save"
              >
                <Lock className="w-4 h-4 md:w-5 md:h-5" />
                {actionLoading ? "กำลังอัปเดต..." : "อัปเดต"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยกเลิกการแก้ไข */}
      <ConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => {
          setShowCancelModal(false);
          navigate(`/users/${id}`);
        }}
        title="ยกเลิกการแก้ไข"
        message={
          <>
            ข้อมูลที่คุณแก้ไขจะไม่ถูกบันทึก
            <br />
            คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการแก้ไข?
          </>
        }
        icon={
          <AlertCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-yellow-500 mb-3 md:mb-4" />
        }
        confirmText="ยกเลิกการแก้ไข"
        confirmIcon={<ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />}
        color="yellow"
        dataCy="cancel-confirm-modal"
      />
    </div>
  );
};

export default UserEdit;
