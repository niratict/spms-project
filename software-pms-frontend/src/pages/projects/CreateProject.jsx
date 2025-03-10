import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { format, setHours } from "date-fns";
import { th } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import axios from "axios";
import {
  ArrowLeft,
  Plus,
  Calendar,
  FileText,
  Upload,
  X,
  Image,
  AlertTriangle,
  Save,
  CheckCircle,
} from "lucide-react";
import { DayPicker } from "react-day-picker";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// =====================================
// DateRangePickerModal Component
// =====================================

const DateRangePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  startDate,
  endDate,
}) => {
  // สถานะสำหรับเก็บค่าช่วงวันที่ได้เลือกไว้
  const [range, setRange] = useState({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });

  // รีเซ็ตค่าช่วงวันที่เมื่อเปิด modal
  useEffect(() => {
    if (isOpen) {
      setRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      });
    }
  }, [isOpen, startDate, endDate]);

  // จัดการการยืนยันการเลือกวันที่และปรับเวลาให้เป็น timezone ของไทย
  const handleConfirm = () => {
    if (range?.from && range?.to) {
      // แปลงเป็นเวลาของไทย (UTC+7)
      const adjustedFrom = setHours(range.from, 7);
      const adjustedTo = setHours(range.to, 7);
      onConfirm(adjustedFrom, adjustedTo);
      onClose();
    }
  };

  // สร้าง formatter สำหรับแสดงปี พ.ศ.
  const formatCaption = (date, options) => {
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const month = format(date, "LLLL", { locale: th }); // แสดงชื่อเดือนภาษาไทย
    return `${month} ${year}`;
  };

  // จัดการเมื่อมีการเลือกวันที่
  const handleRangeSelect = (newRange) => {
    // ถ้าคลิกวันเดียวกับ from ที่เลือกไว้ ให้ล้างค่า range
    if (
      newRange?.from &&
      range?.from &&
      newRange.from.getTime() === range.from.getTime() &&
      !newRange.to
    ) {
      setRange({ from: undefined, to: undefined });
      return;
    }

    // ถ้าคลิกวันเดียวกับ to ที่เลือกไว้ ให้ล้างค่า to
    if (
      newRange?.to &&
      range?.to &&
      newRange.to.getTime() === range.to.getTime()
    ) {
      setRange({ ...range, to: undefined });
      return;
    }

    setRange(newRange || { from: undefined, to: undefined });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      data-cy="date-range-modal"
    >
      <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-4xl overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800">
            เลือกช่วงวันที่
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            data-cy="close-date-picker"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            locale={th}
            numberOfMonths={window.innerWidth < 768 ? 1 : 2}
            disabled={[
              { dayOfWeek: [0, 6] }, // ปิดให้เลือกวันเสาร์-อาทิตย์
            ]}
            modifiers={{
              disabled: { dayOfWeek: [0, 6] },
            }}
            formatters={{
              formatCaption: formatCaption, // ใช้ formatter ที่สร้างขึ้น
            }}
            styles={{
              months: {
                display: "flex",
                flexDirection: window.innerWidth < 768 ? "column" : "row",
                gap: "1rem",
              },
              caption: { color: "#3B82F6" },
              head_cell: { color: "#6B7280" },
              day_selected: {
                backgroundColor: "#3B82F6 !important",
                color: "white !important",
                fontWeight: "bold",
              },
              day_today: {
                color: "#3B82F6 !important",
                fontWeight: "bold",
              },
              day: { margin: "0.2rem" },
            }}
            className="border border-gray-200 rounded-lg p-2 sm:p-4 overflow-auto"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            data-cy="cancel-date-select"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!range?.from || !range?.to}
            className="px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            data-cy="confirm-date-select"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// โมดัลสำหรับยืนยันการสร้างข้อมูลโปรเจกต์
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      data-cy="confirm-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
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
            <Save className="w-4 h-4 md:w-5 md:h-5" />
            สร้าง
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================
// CancelConfirmModal Component
// =====================================

const CancelConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      data-cy="cancel-confirm-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-yellow-500 mb-3 md:mb-4" />
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
            ยืนยันการยกเลิก
          </h2>
          <p className="text-gray-600 mb-4 md:mb-6">
            คุณมีข้อมูลที่ยังไม่ได้บันทึก การยกเลิกจะทำให้ข้อมูล<br></br>
            ทั้งหมดหายไปต้องการยกเลิกหรือไม่?
          </p>
        </div>
        <div className="flex justify-center space-x-3 md:space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            data-cy="cancel-confirmation-no"
          >
            ไม่ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 md:px-6 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            data-cy="cancel-confirmation-yes"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

// =====================================
// Main CreateProject Component
// =====================================

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // สถานะต่างๆ สำหรับจัดการแบบฟอร์ม
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    name: false,
    dateRange: false,
  });

  // เพิ่มสถานะเพื่อตรวจสอบขนาดหน้าจอ
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  // ตรวจสอบขนาดหน้าจอเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ข้อมูลฟอร์มทั้งหมดของโปรเจกต์
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    photo: null,
  });

  // ตรวจสอบว่ามีการกรอกข้อมูลบางส่วนหรือไม่
  const hasAnyData = () => {
    return (
      formData.name !== "" ||
      formData.description !== "" ||
      formData.start_date !== "" ||
      formData.end_date !== "" ||
      formData.photo !== null
    );
  };

  // ======== ฟังก์ชันสำหรับแสดงผลช่วงวันที่ ========
  const displayDateRange = () => {
    if (!formData.start_date || !formData.end_date) return "";

    // แสดงผลเป็นวันที่ เดือน และปีพุทธศักราช (พ.ศ.)
    const formatToBuddhistYear = (date) => {
      const formattedDate = format(new Date(date), "dd/MM/yyyy");
      const [day, month, year] = formattedDate.split("/");
      const buddhistYear = parseInt(year) + 543;
      return `${day}/${month}/${buddhistYear}`;
    };

    return `${formatToBuddhistYear(
      formData.start_date
    )} - ${formatToBuddhistYear(formData.end_date)}`;
  };

  // ======== ฟังก์ชันสำหรับจัดการการกรอกข้อมูล ========

  // อัปเดตข้อมูลในฟอร์มเมื่อมีการเปลี่ยนแปลง
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // ลบข้อความแจ้งเตือน validation error เมื่อผู้ใช้แก้ไขข้อมูล
    if (name === "name" && value.trim() !== "") {
      setValidationErrors((prev) => ({ ...prev, name: false }));
    }
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ต้องไม่เกิน 5MB
      if (file.size > 5 * 1024 * 1024) {
        setError("ขนาดไฟล์ภาพต้องไม่เกิน 5MB");
        return;
      }

      // ตรวจสอบประเภทไฟล์ต้องเป็นรูปภาพเท่านั้น
      if (!file.type.startsWith("image/")) {
        setError("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
      setError(null);
    }
  };

  // ลบรูปภาพที่เลือกไว้
  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
    setPreviewImage(null);
  };

  // จัดการการยกเลิก
  const handleCancelClick = () => {
    if (hasAnyData()) {
      setShowCancelModal(true);
    } else {
      navigate("/projects");
    }
  };

  // ตรวจสอบความถูกต้องของข้อมูล
  const validateForm = () => {
    const errors = {
      name: formData.name.trim() === "",
      dateRange: !formData.start_date || !formData.end_date,
    };

    setValidationErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  // บันทึกข้อมูลโปรเจกต์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // ตรวจสอบข้อมูลก่อนส่ง
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // สร้าง FormData สำหรับส่งข้อมูลพร้อมไฟล์
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // ส่งข้อมูลไปยัง API
      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // นำทางไปยังหน้าโปรเจกต์ที่สร้างขึ้น
      navigate(`/projects/${response.data.project_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  // ======== UI ของคอมโพเนนต์ ========
  return (
    <div
      className="container mx-auto px-4 py-4 sm:py-8 max-w-2xl"
      data-cy="create-project-container"
    >
      {/* ปุ่มย้อนกลับ */}
      <button
        onClick={handleCancelClick}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        data-cy="back-button"
      >
        <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm sm:text-base">กลับไปหน้าเลือกโปรเจกต์</span>
      </button>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* ส่วนหัวของแบบฟอร์ม */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <h1
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 sm:gap-3"
            data-cy="form-title"
          >
            <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />
            สร้างโปรเจกต์ใหม่
          </h1>
        </div>

        {/* แบบฟอร์มสร้างโปรเจกต์ */}
        <form
          onSubmit={handleSubmit}
          className="p-4 sm:p-6 space-y-4 sm:space-y-6"
          data-cy="create-project-form"
        >
          {/* แสดงข้อความผิดพลาด (ถ้ามี) */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
              data-cy="error-message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 sm:h-6 sm:w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {/* ส่วนอัปโหลดรูปภาพ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700 text-sm sm:text-base">
                <Image className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                รูปภาพโปรเจกต์
              </label>
              <div className="flex items-center justify-center w-full">
                <div className="w-full">
                  {previewImage ? (
                    <div
                      className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100"
                      data-cy="image-preview"
                    >
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1 sm:p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        data-cy="remove-image"
                      >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full h-40 sm:h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      data-cy="image-upload-area"
                    >
                      <div className="flex flex-col items-center justify-center pt-3 pb-4 sm:pt-5 sm:pb-6 px-2">
                        <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2 sm:mb-3" />
                        <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 text-center">
                          <span className="font-semibold">
                            คลิกเพื่ออัปโหลดรูปภาพ
                          </span>{" "}
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                        data-cy="image-upload-input"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* ชื่อโปรเจกต์ */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 font-medium text-gray-700 text-sm sm:text-base"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                ชื่อโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 sm:p-3 border ${
                  validationErrors.name ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base`}
                placeholder="ระบุชื่อโปรเจกต์"
                data-cy="project-name-input"
              />
              {validationErrors.name && (
                <p
                  className="text-red-500 text-xs sm:text-sm mt-1"
                  data-cy="name-validation-error"
                >
                  กรุณาระบุชื่อโปรเจกต์
                </p>
              )}
            </div>

            {/* รายละเอียดโปรเจกต์ */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 font-medium text-gray-700 text-sm sm:text-base"
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                รายละเอียด
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg h-24 sm:h-32 focus:ring-2 focus:ring-blue-200 transition-all text-sm sm:text-base"
                placeholder="ระบุรายละเอียดโปรเจกต์"
                data-cy="project-description-input"
              />
            </div>

            {/* ตัวเลือกช่วงเวลาโปรเจกต์ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700 text-sm sm:text-base">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                ระยะเวลาของโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={displayDateRange()}
                  onClick={() => setShowDatePicker(true)}
                  className={`w-full p-2 sm:p-3 border ${
                    validationErrors.dateRange
                      ? "border-red-500"
                      : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer text-sm sm:text-base`}
                  placeholder="เลือกระยะเวลาโปรเจกต์"
                  data-cy="date-range-input"
                />
                {validationErrors.dateRange && (
                  <p
                    className="text-red-500 text-xs sm:text-sm mt-1"
                    data-cy="date-validation-error"
                  >
                    กรุณาระบุระยะเวลาโปรเจกต์
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ปุ่มสร้างและยกเลิก */}
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 pt-4 sm:pt-6">
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
              data-cy="cancel-button"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => {
                // ตรงนี้ควรตรวจสอบ validation ก่อนเปิด modal
                if (validateForm()) {
                  setShowConfirmModal(true);
                }
              }}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors text-sm sm:text-base"
              data-cy="submit-button"
            >
              {loading ? (
                <svg
                  className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
              {loading ? "Creating..." : "สร้างโปรเจกต์"}
            </button>
          </div>
        </form>
      </div>

      {/* โมดอลเลือกช่วงวันที่ */}
      <DateRangePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        startDate={formData.start_date}
        endDate={formData.end_date}
        onConfirm={(start, end) => {
          setFormData((prev) => ({
            ...prev,
            start_date: format(start, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
          }));
          // ลบ validation error เมื่อเลือกวันที่แล้ว
          setValidationErrors((prev) => ({ ...prev, dateRange: false }));
        }}
      />

      {/* โมดัลยืนยันการบันทึก */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title="ยืนยันการสร้างโปรเจกต์" // แก้ข้อความ
        message="คุณแน่ใจหรือไม่ว่าต้องการสร้างโปรเจกต์นี้?" // แก้ข้อความ
      />

      {/* โมดอลยืนยันการยกเลิก */}
      <CancelConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate("/projects")}
      />
    </div>
  );
};

export default CreateProject;
