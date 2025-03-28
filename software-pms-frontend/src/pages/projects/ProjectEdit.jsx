import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Edit,
  Save,
  ArrowLeft,
  Calendar,
  FileText,
  CheckCircle,
  Activity,
  Image,
  Upload,
  AlertTriangle,
  X,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import "react-day-picker/dist/style.css";

// ค่า URL ที่ใช้เชื่อมต่อกับ API
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ===== MODAL COMPONENTS =====

// โมดัลสำหรับเลือกช่วงวันที่โปรเจกต์
const DateRangePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  startDate,
  endDate,
}) => {
  // state สำหรับเก็บช่วงวันที่ที่เลือก
  const [range, setRange] = useState({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });

  // อัพเดต state เมื่อ modal เปิดหรือค่า props เปลี่ยน
  useEffect(() => {
    if (isOpen) {
      setRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      });
    }
  }, [isOpen, startDate, endDate]);

  // สร้าง formatter สำหรับแสดงปี พ.ศ.
  const formatCaption = (date) => {
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const month = format(date, "LLLL", { locale: th }); // แสดงชื่อเดือนภาษาไทย
    return `${month} ${year}`;
  };

  // บันทึกช่วงวันที่ที่เลือก
  const handleConfirm = () => {
    if (range?.from && range?.to) {
      onConfirm(range.from, range.to);
      onClose();
    }
  };

  // จัดการการเลือกวันที่และยกเลิกการเลือก
  const handleRangeSelect = (newRange) => {
    if (
      newRange?.from &&
      range?.from &&
      newRange.from.getTime() === range.from.getTime() &&
      !newRange.to
    ) {
      setRange({ from: undefined, to: undefined });
      return;
    }

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
      <div className="bg-white rounded-xl shadow-xl p-4 md:p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            เลือกช่วงวันที่
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            data-cy="date-modal-close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center overflow-x-auto">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            locale={th}
            numberOfMonths={window.innerWidth >= 768 ? 2 : 1}
            disabled={[
              { dayOfWeek: [0, 6] }, // ไม่อนุญาตให้เลือกวันเสาร์-อาทิตย์
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
                flexDirection: window.innerWidth >= 768 ? "row" : "column",
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
            className="border border-gray-200 rounded-lg p-2 md:p-4"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-3 py-2 md:px-4 md:py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            data-cy="date-modal-cancel"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!range?.from || !range?.to}
            className="px-3 py-2 md:px-4 md:py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
            data-cy="date-modal-confirm"
          >
            ยืนยัน
          </button>
        </div>
      </div>
    </div>
  );
};

// โมดัลสำหรับยืนยันการบันทึกข้อมูลโปรเจกต์
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
            บันทึก
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

// ===== MAIN COMPONENT =====

const ProjectEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // ===== STATE MANAGEMENT =====

  // ข้อมูลโปรเจกต์และสถานะต่างๆ
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageError, setImageError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // การจัดการรูปภาพ
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  // เพิ่มตัวแปร originalData เพื่อเก็บข้อมูลดั้งเดิม
  const [originalData, setOriginalData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    photo: null,
  });

  // ข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "",
    photo: null,
  });

  // ติดตามขนาดหน้าจอเพื่อปรับ UI
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // ===== DATA FETCHING =====

  // ดึงข้อมูลโปรเจกต์เมื่อ component โหลด
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        const projectData = response.data;
        setProject(projectData);

        // แปลงวันที่เป็นรูปแบบที่ถูกต้อง
        const startDate = new Date(projectData.start_date);
        const endDate = new Date(projectData.end_date);

        const formattedData = {
          name: projectData.name,
          description: projectData.description,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: projectData.status,
          photo: null,
        };

        setFormData(formattedData);

        // ตั้งค่า originalData พร้อมกับข้อมูลเดิมของโปรเจกต์
        setOriginalData({
          ...formattedData,
          photo: projectData.photo || null,
        });

        // ตั้งค่ารูปภาพถ้ามี
        if (projectData.photo) {
          setCurrentImage(projectData.photo);
          setPreviewImage(projectData.photo); // ใช้ URL โดยตรงแทนการเติม path นำหน้า
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchProject();
  }, [id, user]);

  // เพิ่มตัวแปรเหล่านี้ใน state management section:
  const [errors, setErrors] = useState({
    name: "",
    dateRange: "",
    status: "",
  });

  // เพิ่มฟังก์ชันตรวจสอบความถูกต้องที่จะเรียกก่อนบันทึก
  const validateForm = () => {
    let valid = true;
    const newErrors = {
      name: "",
      dateRange: "",
      status: "",
    };

    // ตรวจสอบชื่อโปรเจกต์
    if (!formData.name.trim()) {
      newErrors.name = "กรุณาระบุชื่อโปรเจกต์";
      valid = false;
    }

    // ตรวจสอบระยะเวลาโปรเจกต์
    if (!formData.start_date || !formData.end_date) {
      newErrors.dateRange = "กรุณาระบุระยะเวลาโปรเจกต์";
      valid = false;
    }

    // ตรวจสอบสถานะ
    if (!formData.status) {
      newErrors.status = "กรุณาระบุสถานะโปรเจกต์";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSaveClick = () => {
    if (validateForm()) {
      setShowConfirmModal(true);
    }
  };

  // ===== EVENT HANDLERS =====

  // อัพเดตฟอร์มเมื่อมีการเปลี่ยนแปลงใน input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // ลบข้อความแจ้งเตือนเมื่อผู้ใช้แก้ไขฟิลด์
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // จัดการการอัปโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์ต้องไม่เกิน 5MB
      if (file.size > 5 * 1024 * 1024) {
        setImageError("ขนาดไฟล์ภาพต้องไม่เกิน 5MB");
        return;
      }

      // ตรวจสอบประเภทไฟล์ต้องเป็นรูปภาพเท่านั้น
      if (!file.type.startsWith("image/")) {
        setImageError("อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
      setImageError(null); // ล้างข้อผิดพลาดเมื่อสำเร็จ
    }
  };

  // ลบรูปภาพที่เลือกไว้
  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
    setPreviewImage(null);
    setCurrentImage(null);
    setImageError(null); // ล้างข้อผิดพลาดเมื่อลบรูปภาพ

    // รีเซ็ตค่า input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
  };

  // ส่วน handleCancelClick ที่ใช้ hasDataChanged
  const handleCancelClick = () => {
    if (hasDataChanged()) {
      setShowCancelModal(true);
    } else {
      navigate(`/projects/${id}`);
    }
  };

  // ฟังก์ชัน hasDataChanged ที่ถูกต้อง
  const hasDataChanged = () => {
    // เปรียบเทียบข้อมูลปัจจุบันกับข้อมูลเดิม
    return (
      formData.name !== originalData.name ||
      formData.description !== originalData.description ||
      formData.start_date !== originalData.start_date ||
      formData.end_date !== originalData.end_date ||
      formData.status !== originalData.status ||
      isPhotoChanged()
    );
  };

  // ฟังก์ชัน isPhotoChanged ที่ถูกต้อง
  const isPhotoChanged = () => {
    // กรณีที่เดิมมีรูป แต่ตอนนี้ไม่มีรูป (ลบรูปออก)
    if (originalData.photo && !currentImage) {
      return true;
    }

    // กรณีที่เดิมไม่มีรูป แต่ตอนนี้มีรูป
    if (!originalData.photo && formData.photo) {
      return true;
    }

    // กรณีที่มีการอัปโหลดรูปภาพใหม่
    if (formData.photo instanceof File) {
      return true;
    }

    return false;
  };

  // แสดงผลช่วงวันที่เป็นรูปแบบพุทธศักราช
  const displayDateRange = () => {
    if (!formData.start_date || !formData.end_date) return "";

    // แปลงวันที่เป็นรูปแบบ วัน/เดือน/ปี พ.ศ.
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

  // บันทึกช่วงวันที่ที่เลือกจากโมดัล
  const handleDateConfirm = (start, end) => {
    setFormData((prev) => ({
      ...prev,
      start_date: format(start, "yyyy-MM-dd"),
      end_date: format(end, "yyyy-MM-dd"),
    }));

    // ลบข้อความแจ้งเตือนเมื่อผู้ใช้เลือกวันที่
    if (errors.dateRange) {
      setErrors({ ...errors, dateRange: "" });
    }
  };

  // บันทึกข้อมูลโปรเจกต์
  const handleSubmit = async () => {
    try {
      // สร้าง FormData สำหรับการส่งข้อมูลแบบมีไฟล์
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      // ส่งข้อมูลไปยัง API
      await axios.put(`${API_BASE_URL}/api/projects/${id}`, submitData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // นำทางกลับไปยังหน้ารายละเอียดโปรเจกต์
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update project");
    }
  };

  // ===== RENDER LOGIC =====

  // แสดงตัวโหลดขณะกำลังดึงข้อมูล
  if (loading)
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  // แสดงข้อความเมื่อมีข้อผิดพลาดในการดึงข้อมูล
  if (error)
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 md:px-6 md:py-4 rounded-lg text-center mx-4 my-4 md:mx-auto md:my-8 max-w-2xl"
        data-cy="error-message"
      >
        {error}
      </div>
    );

  // แสดงข้อความเมื่อไม่พบโปรเจกต์
  if (!project)
    return (
      <div
        className="text-center p-4 md:p-6 bg-gray-100 rounded-lg mx-4 my-4 md:mx-auto md:my-8 max-w-2xl"
        data-cy="project-not-found"
      >
        ไม่พบโปรเจกต์
      </div>
    );

  // ===== COMPONENT: DropdownSelect =====

  // คอมโพเนนต์ dropdown แบบปรับแต่ง
  const DropdownSelect = ({
    label,
    value,
    onChange,
    options,
    disabled = false,
    placeholder,
    dataCy,
    icon,
    required = false,
    error = "",
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const handleSelect = (optionValue) => {
      onChange({ target: { value: optionValue, name: 'status' } });
      setIsOpen(false);
    };

    return (
      <div className="space-y-1 md:space-y-2">
        {label && (
          <label className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-gray-700">
            {icon}
            {label} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={`flex items-center justify-between w-full p-2 md:p-3 text-sm md:text-base rounded-lg border transition duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-200 ${
              error 
                ? "border-red-500" 
                : disabled
                  ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                  : "bg-white text-gray-800 cursor-pointer border-gray-300 hover:border-blue-300"
            }`}
            data-cy={dataCy}
            aria-haspopup="listbox"
            aria-expanded={isOpen}
          >
            <span className="block truncate text-left pr-8">
              {options.find(opt => opt.value === value)?.label || placeholder || "-- เลือกสถานะ --"}
            </span>
            <div
              className={`absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none`}
            >
              <div
                className={`rounded-lg p-1 transition-all duration-300 ${
                  disabled
                    ? "bg-gray-100 text-gray-400"
                    : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                }`}
              >
                {icon ? icon : <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
              </div>
            </div>
          </button>
          
          {isOpen && !disabled && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setIsOpen(false)}
              ></div>
              <div 
                className="absolute z-20 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
                style={{ scrollbarWidth: 'thin' }}
                data-cy={`${dataCy}-dropdown`}
              >
                <ul role="listbox">
                  {options.map((option) => (
                    <li
                      key={option.value}
                      className={`py-2 px-4 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center ${
                        option.value === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"
                      }`}
                      onClick={() => handleSelect(option.value)}
                      data-cy={`${dataCy}-option-${option.value}`}
                      role="option"
                      aria-selected={option.value === value}
                    >
                      {option.value === value && (
                        <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                      )}
                      <span className={option.value === value ? "ml-0" : "ml-6"}>
                        {option.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
        {error && (
          <p
            className="text-red-500 text-xs sm:text-sm mt-1"
            data-cy="status-error"
          >
            {error}
          </p>
        )}
      </div>
    );
  };

  // แสดงฟอร์มแก้ไขโปรเจกต์
  return (
    <div
      className="container mx-auto px-4 py-4 md:py-8 max-w-2xl"
      data-cy="project-edit-container"
    >
      {/* โมดัลยืนยันการบันทึก */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleSubmit}
        title="บันทึกการแก้ไขโปรเจกต์"
        message="คุณแน่ใจหรือไม่ว่าต้องการบันทึกการแก้ไขนี้ในโปรเจกต์?"
      />

      {/* โมดัลเลือกช่วงวันที่ */}
      <DateRangePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        startDate={formData.start_date}
        endDate={formData.end_date}
        onConfirm={handleDateConfirm}
      />

      {/* ปุ่มกลับไปหน้ารายละเอียด */}
      <button
        type="button"
        onClick={() => navigate(`/projects/${id}`)}
        className="group flex items-center gap-1 md:gap-2 text-sm md:text-base text-gray-600 hover:text-gray-900 mb-4 md:mb-6 transition-colors"
        data-cy="back-button"
      >
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
        กลับไปหน้ารายละเอียดโปรเจกต์
      </button>

      {/* ฟอร์มแก้ไขโปรเจกต์ */}
      <div className="bg-white shadow-md md:shadow-lg rounded-xl overflow-hidden">
        {/* ส่วนหัวของฟอร์ม */}
        <div className="p-4 md:p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <h1
            className="text-xl md:text-3xl font-bold text-gray-800 flex items-center gap-2 md:gap-3"
            data-cy="form-title"
          >
            <Edit className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
            แก้ไขโปรเจกต์
          </h1>
        </div>

        {/* ฟอร์มสำหรับกรอกข้อมูล */}
        <form className="p-4 md:p-6 space-y-4 md:space-y-6">
          {/* เพิ่มส่วนแสดงข้อผิดพลาดของรูปภาพ */}
          {imageError && (
            <div
              className="bg-red-50 border border-red-200 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
              data-cy="image-error-message"
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
              <span className="text-red-800">{imageError}</span>
            </div>
          )}

          {/* ส่วนอัพโหลดรูปภาพ */}
          <div className="space-y-4 sm:space-y-6">
            <label className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-gray-700">
              <Image className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
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
                      alt="Project"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      data-cy="remove-image"
                    >
                      <X className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : (
                  <label
                    className="flex flex-col items-center justify-center w-full h-40 md:h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                    data-cy="image-upload-area"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 md:w-12 md:h-12 text-gray-400 mb-2 md:mb-3" />
                      <p className="mb-1 md:mb-2 text-xs md:text-sm text-gray-500">
                        <span className="font-semibold">
                          คลิกเพื่ออัปโหลดรูปภาพ
                        </span>{" "}
                        หรือลากและวาง
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
                      data-cy="image-input"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* ชื่อโปรเจกต์ */}
            <div className="space-y-1 md:space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-gray-700"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
                ชื่อโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 md:p-3 text-sm md:text-base border ${
                  errors.name ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:ring-2 focus:ring-blue-200 transition-all`}
                data-cy="project-name"
              />
              {errors.name && (
                <p
                  className="text-red-500 text-xs sm:text-sm mt-1"
                  data-cy="name-error"
                >
                  {errors.name}
                </p>
              )}
            </div>

            {/* รายละเอียดโปรเจกต์ */}
            <div className="space-y-1 md:space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-gray-700"
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                รายละเอียดโปรเจกต์
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 md:p-3 text-sm md:text-base border border-gray-300 rounded-lg h-24 md:h-32 focus:ring-2 focus:ring-blue-200 transition-all"
                data-cy="project-description"
              />
            </div>

            {/* ส่วนเลือกช่วงวันที่ */}
            <div className="space-y-1 md:space-y-2">
              <label className="flex items-center gap-1.5 md:gap-2 text-sm md:text-base font-medium text-gray-700">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
                ระยะเวลาของโปรเจกต์ <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={displayDateRange()}
                  onClick={() => setShowDatePicker(true)}
                  className={`w-full p-2 md:p-3 text-sm md:text-base border ${
                    errors.dateRange ? "border-red-500" : "border-gray-300"
                  } rounded-lg focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer`}
                  placeholder="Select project duration"
                  data-cy="date-range-input"
                />
              </div>
              {errors.dateRange && (
                <p
                  className="text-red-500 text-xs sm:text-sm mt-1"
                  data-cy="date-error"
                >
                  {errors.dateRange}
                </p>
              )}
            </div>

            {/* สถานะโปรเจกต์ */}
            <DropdownSelect
              label="สถานะ"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: "Active", label: "กำลังดำเนินการ" },
                { value: "Completed", label: "เสร็จสิ้น" },
                { value: "On Hold", label: "ระงับชั่วคราว" }
              ]}
              placeholder="-- เลือกสถานะ --"
              icon={<Activity className="w-4 h-4 md:w-5 md:h-5 text-indigo-500" />}
              required={true}
              error={errors.status}
              dataCy="project-status"
            />
          </div>

          {/* ปุ่มการทำงาน */}
          <div className="flex flex-col sm:flex-row gap-3 sm:space-x-4 pt-4 md:pt-6">
            <button
              type="button"
              onClick={handleCancelClick}
              className="flex-1 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              data-cy="cancel-button"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSaveClick}
              className="flex-1 flex items-center justify-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-3 text-sm md:text-base text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              data-cy="save-button"
            >
              <Save className="w-4 h-4 md:w-5 md:h-5" />
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>

      {/* โมดอลยืนยันการยกเลิก */}
      <CancelConfirmModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={() => navigate(`/projects/${id}`)}
      />
    </div>
  );
};

export default ProjectEdit;
