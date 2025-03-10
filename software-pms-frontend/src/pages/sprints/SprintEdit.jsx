import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Edit,
  X,
  Save,
  Calendar,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import ExistingSprintsList from "./ExistingSprintsList";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// โมดัลสำหรับยืนยันการสร้างหรือยกเลิก
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
            {title.includes("ยกเลิก") ? "ยกเลิก" : "สร้าง"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SprintEdit = () => {
  // ------------- ตัวแปรพื้นฐาน -------------
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // ------------- สถานะข้อมูล -------------
  const [sprint, setSprint] = useState(null); // ข้อมูลสปรินต์ที่กำลังแก้ไข
  const [existingSprints, setExistingSprints] = useState([]); // ข้อมูลสปรินต์ทั้งหมดของโปรเจค
  const [isLatestSprint, setIsLatestSprint] = useState(false); // เช็คว่าเป็นสปรินต์ล่าสุดหรือไม่
  const [originalDateRange, setOriginalDateRange] = useState({
    from: undefined,
    to: undefined,
  }); // เก็บวันที่เดิมไว้เพื่อตรวจสอบการเปลี่ยนแปลง

  // ------------- สถานะการแสดงผล -------------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelConfirmModal, setShowCancelConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // ------------- สถานะข้อมูลวันที่ -------------
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // ------------- ดึงข้อมูลเมื่อโหลดหน้า -------------
  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // ดึงข้อมูลสปรินต์ปัจจุบัน
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        // ดึงข้อมูลสปรินต์ทั้งหมดของโปรเจค เพื่อตรวจสอบว่าสปรินต์นี้เป็นสปรินต์ล่าสุดหรือไม่
        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;
        setExistingSprints(sprints);

        // ตรวจสอบว่าเป็นสปรินต์ล่าสุดหรือไม่
        const currentSprintNumber = parseInt(sprintData.name.split(" ")[1]);
        const latestSprintNumber = Math.max(
          ...sprints.map((s) => parseInt(s.name.split(" ")[1]))
        );
        setIsLatestSprint(currentSprintNumber === latestSprintNumber);

        // ตั้งค่าช่วงวันที่เริ่มต้น
        const initialDateRange = {
          from: new Date(sprintData.start_date),
          to: new Date(sprintData.end_date),
        };
        setDateRange(initialDateRange);
        setOriginalDateRange(initialDateRange); // เก็บค่าเริ่มต้นไว้เพื่อตรวจสอบการเปลี่ยนแปลง
      } catch (err) {
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลสปรินต์ได้");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchSprintData();
  }, [id, user]);

  // ------------- การจัดการเลือกช่วงวันที่ -------------
  const handleRangeSelect = (range) => {
    // กรณีไม่ได้เลือกช่วงวันที่
    if (!range) {
      setDateRange({
        from: undefined,
        to: undefined,
      });
      return;
    }

    // กำหนดช่วงวันที่ที่เลือก
    setDateRange({
      from: range.from,
      to: range.to,
    });
  };

  // ------------- ตรวจสอบว่ามีการเปลี่ยนแปลงวันที่หรือไม่ -------------
  const hasDateChanged = () => {
    if (
      !dateRange.from ||
      !dateRange.to ||
      !originalDateRange.from ||
      !originalDateRange.to
    ) {
      return false;
    }

    return (
      dateRange.from.getTime() !== originalDateRange.from.getTime() ||
      dateRange.to.getTime() !== originalDateRange.to.getTime()
    );
  };

  // ------------- การจัดการยกเลิกฟอร์ม -------------
  const handleCancel = () => {
    if (hasDateChanged()) {
      setShowCancelConfirmModal(true);
    } else {
      navigate(`/sprints/${id}`);
    }
  };

  // ------------- การยืนยันการยกเลิกการแก้ไข -------------
  const confirmCancel = () => {
    setShowCancelConfirmModal(false);
    navigate(`/sprints/${id}`);
  };

  // ------------- การบันทึกข้อมูล -------------
  const handleSubmit = async () => {
    // ตรวจสอบว่าเลือกวันที่ครบถ้วนหรือไม่
    if (!dateRange.from || !dateRange.to) {
      setError("กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุด");
      return;
    }

    try {
      // แก้ไขปัญหา timezone offset โดยกำหนดเวลาเป็นเที่ยงวัน
      const startDate = new Date(dateRange.from);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(dateRange.to);
      endDate.setHours(12, 0, 0, 0);

      // เตรียมข้อมูลสำหรับส่งไปอัพเดต
      const formData = {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      // ส่งคำขอ API เพื่ออัพเดตข้อมูล
      await axios.put(`${API_BASE_URL}/api/sprints/${id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // นำทางกลับไปหน้ารายละเอียดสปรินต์
      navigate(`/sprints/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถอัพเดตสปรินต์ได้");
    }
  };

  // ------------- การกำหนดวันที่ไม่สามารถเลือกได้ -------------
  // ปิดการเลือกวันที่ที่ทับซ้อนกับสปรินต์อื่น (ยกเว้นสปรินต์ปัจจุบัน) และวันหยุดสุดสัปดาห์
  const disabledDays = [
    ...existingSprints
      .filter((s) => s.name !== sprint?.name) // กรองเอาเฉพาะ sprints ที่ไม่ใช่ sprint ปัจจุบัน
      .map((sprint) => ({
        from: new Date(sprint.start_date),
        to: new Date(sprint.end_date),
      })),
    // ปิดการเลือกวันหยุดสุดสัปดาห์
    (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 = วันอาทิตย์, 6 = วันเสาร์
    },
  ];

  // ------------- การกำหนด CSS classes สำหรับ DayPicker -------------
  const dayPickerClassNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
    day_selected:
      "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
    day_today: "bg-accent text-accent-foreground",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
    day_range_middle:
      "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  };

  // ------------- การจัดรูปแบบวันที่ในปฏิทิน -------------
  // กำหนดฟอร์แมตการแสดงผลให้เป็นภาษาไทย และเป็นปี พ.ศ.
  const formatCaption = (date, options) => {
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const month = format(date, "LLLL", { locale: th }); // แสดงชื่อเดือนภาษาไทย
    return `${month} ${year}`;
  };

  // ------------- การแสดงผลหน้าโหลดข้อมูล -------------
  if (loading)
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  // ------------- การแสดงผลกรณีไม่ใช่สปรินต์ล่าสุด -------------
  if (!isLatestSprint)
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-red-50 px-4"
        data-cy="not-latest-sprint-error"
      >
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <AlertCircle className="mx-auto w-12 sm:w-16 h-12 sm:h-16 text-red-500 mb-4" />
          <p className="text-red-600 text-base sm:text-lg">
            สามารถแก้ไขได้เฉพาะสปรินต์ล่าสุดเท่านั้น
          </p>
          <button
            onClick={() => navigate(`/sprints/${id}`)}
            className="mt-4 px-4 py-2 sm:px-6 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 w-full sm:w-auto"
            data-cy="back-to-sprint-details-btn"
          >
            กลับสู่รายละเอียดสปรินต์
          </button>
        </div>
      </div>
    );

  // ------------- การแสดงผลกรณีเกิดข้อผิดพลาด -------------
  if (error)
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-red-50 px-4"
        data-cy="error-message"
      >
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center max-w-md w-full">
          <AlertCircle className="mx-auto w-12 sm:w-16 h-12 sm:h-16 text-red-500 mb-4" />
          <p className="text-red-600 text-base sm:text-lg">{error}</p>
        </div>
      </div>
    );

  // ------------- การแสดงผลกรณีไม่พบข้อมูลสปรินต์ -------------
  if (!sprint)
    return (
      <div
        className="flex justify-center items-center min-h-screen px-4"
        data-cy="sprint-not-found"
      >
        <p className="text-gray-600">ไม่พบสปรินต์</p>
      </div>
    );

  // ------------- การแสดงผลหลักของหน้าแก้ไขสปรินต์ -------------
  return (
    <div
      className="bg-gray-50 p-4 sm:p-8 md:p-16"
      data-cy="sprint-edit-container"
    >
      <div className="w-full max-w-2xl mx-auto">
        {/* ------------- ส่วนแสดงฟอร์มแก้ไขสปรินต์ ------------- */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden">
          {/* ส่วนหัวฟอร์ม */}
          <div className="bg-blue-50 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Edit className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                แก้ไขสปรินต์
              </h2>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              data-cy="close-edit-form-btn"
            >
              <X className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          </div>

          {/* ฟอร์มแก้ไขสปรินต์ */}
          <form className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
            {/* ฟิลด์ชื่อสปรินต์ (แสดงแต่แก้ไขไม่ได้) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Sprint (สปรินต์)
              </label>
              <input
                type="text"
                value={sprint.name}
                disabled
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                data-cy="sprint-name-input"
              />
            </div>

            {/* ฟิลด์ช่วงวันที่สปรินต์ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                ช่วงวันที่ของสปรินต์
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={
                    dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString(
                          "th-TH"
                        )} - ${dateRange.to.toLocaleDateString("th-TH")}`
                      : "เลือกช่วงวันที่"
                  }
                  onClick={() => setShowDatePicker(true)}
                  readOnly
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 border border-gray-300 rounded-lg cursor-pointer"
                  data-cy="date-range-input"
                />
              </div>
            </div>

            {/* ปุ่มการจัดการ */}
            <div className="flex justify-end space-x-2 sm:space-x-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                data-cy="cancel-edit-btn"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!dateRange.from || !dateRange.to}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 disabled:bg-blue-300 text-sm sm:text-base"
                data-cy="save-sprint-btn"
              >
                <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>บันทึก</span>
              </button>
            </div>
          </form>
        </div>

        {/* ------------- โมดัลแสดงปฏิทินเลือกวันที่ ------------- */}
        {showDatePicker && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            data-cy="date-picker-modal"
          >
            <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-full sm:max-w-4xl max-h-full sm:max-h-[90vh] overflow-y-auto">
              {/* ส่วนหัวโมดัล */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base sm:text-lg font-semibold">
                  เลือกช่วงวันที่ของสปรินต์
                </h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-500 hover:text-gray-700"
                  data-cy="close-date-picker-btn"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* แสดงรายการสปรินต์ที่มีอยู่แล้ว เพื่อให้เห็นช่วงวันที่ที่มีการใช้งานแล้ว */}
              <div className="mb-4">
                <ExistingSprintsList sprints={existingSprints} />
              </div>

              {/* ปฏิทินเลือกช่วงวันที่ */}
              <div className="flex justify-center overflow-x-auto pb-2">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={handleRangeSelect}
                  locale={th}
                  numberOfMonths={window.innerWidth < 640 ? 1 : 2}
                  formatters={{
                    formatCaption: formatCaption,
                  }}
                  disabled={disabledDays}
                  className="border rounded-md p-2 sm:p-4"
                  classNames={dayPickerClassNames}
                  footer={
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4 text-center">
                      ปิดการเลือกวันหยุดสุดสัปดาห์
                    </p>
                  }
                  data-cy="date-range-picker"
                />
              </div>

              {/* ปุ่มการทำงาน */}
              <div className="flex justify-end space-x-3 sm:space-x-4 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm sm:text-base"
                  data-cy="cancel-date-selection-btn"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => {
                    if (dateRange.from && dateRange.to) {
                      setShowDatePicker(false);
                    }
                  }}
                  disabled={!dateRange.from || !dateRange.to}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm sm:text-base"
                  data-cy="confirm-date-selection-btn"
                >
                  ยืนยัน
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------- โมดัลยืนยันการบันทึกข้อมูล ------------- */}
        {showConfirmModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            data-cy="confirm-modal"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-xs sm:max-w-md w-full p-6 sm:p-8 shadow-xl sm:shadow-2xl">
              <div className="text-center">
                <AlertCircle className="mx-auto w-12 sm:w-16 h-12 sm:h-16 text-blue-500 mb-3 sm:mb-4" />
                <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4">
                  ยืนยันการแก้ไข
                </h2>
                <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                  แน่ใจหรือไม่ว่าต้องการบันทึกการเปลี่ยนแปลงนี้ในสปรินต์?
                </p>
              </div>
              <div className="flex justify-center space-x-3 sm:space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm sm:text-base"
                  data-cy="cancel-confirm-btn"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                  data-cy="confirm-edit-btn"
                >
                  <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------- โมดัลยืนยันการยกเลิกการแก้ไข ------------- */}
        <ConfirmModal
          isOpen={showCancelConfirmModal}
          onClose={() => setShowCancelConfirmModal(false)}
          onConfirm={confirmCancel}
          title="ยืนยันการยกเลิก"
          message={
            <>
              คุณได้เลือกช่วงวันที่สปรินต์แล้ว <br />
              คุณต้องการยกเลิกการสร้างสปรินต์ใช่หรือไม่?
            </>
          }
        />
      </div>
    </div>
  );
};

export default SprintEdit;
