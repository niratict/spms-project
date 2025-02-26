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
  X,
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
  const formatCaption = (date, options) => {
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      data-cy="date-range-modal"
    >
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4">
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

        <div className="flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            locale={th}
            numberOfMonths={2}
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
              months: { display: "flex", gap: "1rem" },
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
            className="border border-gray-200 rounded-lg p-4"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            data-cy="date-modal-cancel"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleConfirm}
            disabled={!range?.from || !range?.to}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      data-cy="confirm-modal"
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-blue-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
          <p className="text-gray-600 mb-6">{message}</p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            data-cy="confirm-cancel"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
            data-cy="confirm-save"
          >
            <Save className="w-5 h-5" />
            บันทึก
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

  // ===== STATE MANAGEMENT =====

  // ข้อมูลโปรเจกต์และสถานะต่างๆ
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // การจัดการรูปภาพ
  const [previewImage, setPreviewImage] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);

  // ข้อมูลฟอร์ม
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "",
    photo: null,
  });

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

        setFormData({
          name: projectData.name,
          description: projectData.description,
          start_date: format(startDate, "yyyy-MM-dd"),
          end_date: format(endDate, "yyyy-MM-dd"),
          status: projectData.status,
          photo: null,
        });

        // ตั้งค่ารูปภาพถ้ามี
        if (projectData.photo) {
          setCurrentImage(projectData.photo);
          setPreviewImage(
            `${API_BASE_URL}/api/uploads/projects/${projectData.photo}`
          );
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch project");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchProject();
  }, [id, user]);

  // ===== EVENT HANDLERS =====

  // อัพเดตฟอร์มเมื่อมีการเปลี่ยนแปลงใน input
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // จัดการเมื่อมีการอัพโหลดรูปภาพ
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // ตรวจสอบขนาดไฟล์
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      // ตรวจสอบประเภทไฟล์
      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      const newPreviewUrl = URL.createObjectURL(file);
      setPreviewImage(newPreviewUrl);
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
    setCurrentImage(null);

    // รีเซ็ตค่า input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) {
      fileInput.value = "";
    }
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  // แสดงข้อความเมื่อมีข้อผิดพลาดในการดึงข้อมูล
  if (error)
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg text-center"
        data-cy="error-message"
      >
        {error}
      </div>
    );

  // แสดงข้อความเมื่อไม่พบโปรเจกต์
  if (!project)
    return (
      <div
        className="text-center p-6 bg-gray-100 rounded-lg"
        data-cy="project-not-found"
      >
        Project not found
      </div>
    );

  // แสดงฟอร์มแก้ไขโปรเจกต์
  return (
    <div
      className="container mx-auto px-4 py-8 max-w-2xl"
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
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        data-cy="back-button"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        กลับไปหน้ารายละเอียด
      </button>

      {/* ฟอร์มแก้ไขโปรเจกต์ */}
      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        {/* ส่วนหัวของฟอร์ม */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <h1
            className="text-3xl font-bold text-gray-800 flex items-center gap-3"
            data-cy="form-title"
          >
            <Edit className="w-8 h-8 text-blue-500" />
            แก้ไขโปรเจกต์
          </h1>
        </div>

        {/* ฟอร์มสำหรับกรอกข้อมูล */}
        <form className="p-6 space-y-6">
          {/* แสดงข้อความแจ้งเตือนถ้ามีข้อผิดพลาด */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3"
              data-cy="form-error"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
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

          <div className="space-y-6">
            {/* ส่วนอัพโหลดรูปภาพ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Image className="w-5 h-5 text-blue-500" />
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
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                      data-cy="image-upload-area"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
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
            </div>

            {/* ชื่อโปรเจกต์ */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 font-medium text-gray-700"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                ชื่อโปรเจกต์
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                data-cy="project-name"
              />
            </div>

            {/* รายละเอียดโปรเจกต์ */}
            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 font-medium text-gray-700"
              >
                <FileText className="w-5 h-5 text-green-500" />
                รายละเอียดโปรเจกต์
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-200 transition-all"
                data-cy="project-description"
              />
            </div>

            {/* ส่วนเลือกช่วงวันที่ */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Calendar className="w-5 h-5 text-purple-500" />
                ระยะเวลาของโปรเจกต์
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={displayDateRange()}
                  onClick={() => setShowDatePicker(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                  placeholder="Select project duration"
                  data-cy="date-range-input"
                />
              </div>
            </div>

            {/* สถานะโปรเจกต์ */}
            <div className="space-y-2">
              <label
                htmlFor="status"
                className="flex items-center gap-2 font-medium text-gray-700"
              >
                <Activity className="w-5 h-5 text-indigo-500" />
                สถานะ
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                data-cy="project-status"
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>
            </div>
          </div>

          {/* ปุ่มการทำงาน */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/projects/${id}`)}
              className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              data-cy="cancel-button"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
              data-cy="save-button"
            >
              <Save className="w-5 h-5" />
              บันทึกการแก้ไข
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectEdit;
