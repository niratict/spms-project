import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ArrowLeft, Plus, Calendar, AlertCircle, Lock, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import "react-day-picker/dist/style.css";
import ExistingSprintsList from "./ExistingSprintsList";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateSprint = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();

  // สถานะหลักสำหรับการสร้างสปรินต์
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingSprints, setExistingSprints] = useState([]);
  const [nextSprintName, setNextSprintName] = useState("");
  const [showDateRanges, setShowDateRanges] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [numberOfMonths, setNumberOfMonths] = useState(2);

  // เลื่อนไปด้านบนสุดของหน้าเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ปรับจำนวน months ที่แสดงในปฏิทินตามขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setNumberOfMonths(width < 768 ? 1 : 2);
    };

    handleResize(); // เรียกใช้ครั้งแรกเพื่อกำหนดค่าเริ่มต้น
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ดึงข้อมูลสปรินต์ที่มีอยู่และกำหนดชื่อสปรินต์ถัดไป
  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${projectId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        setExistingSprints(response.data);
        const nextNumber = response.data.length + 1;
        setNextSprintName(`Sprint ${nextNumber}`);
      } catch (err) {
        setError("Failed to fetch sprint data");
      }
    };

    fetchSprintData();
  }, [projectId, user.token]);

  // ฟังก์ชันจัดการการเลือกช่วงวันที่
  const handleRangeSelect = (range) => {
    if (!range) {
      setDateRange({
        from: undefined,
        to: undefined,
      });
      return;
    }

    setDateRange({
      from: range.from,
      to: range.to,
    });
  };

  // ฟังก์ชันจัดการการกลับไปยังหน้าก่อนหน้า
  const handleBack = () => {
    navigate("/sprints", {
      state: { selectedProjectId: parseInt(projectId) },
    });
  };

  // ฟังก์ชันสำหรับการสร้างสปรินต์ใหม่
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!dateRange.from || !dateRange.to) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    try {
      // แก้ไขปัญหา timezone โดยตั้งเวลาเป็น 12:00 น. ในเวลาท้องถิ่น
      const startDate = new Date(dateRange.from);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(dateRange.to);
      endDate.setHours(12, 0, 0, 0);

      const formData = {
        project_id: projectId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/sprints`,
        formData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      navigate(`/sprints/${response.data.sprint_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create sprint");
    } finally {
      setLoading(false);
    }
  };

  // กำหนดวันที่ไม่สามารถเลือกได้ (วันหยุดสุดสัปดาห์ และวันที่มีสปรินต์อยู่แล้ว)
  const disabledDays = [
    ...existingSprints.map((sprint) => ({
      from: new Date(sprint.start_date),
      to: new Date(sprint.end_date),
    })),
    // ปิดการเลือกวันเสาร์-อาทิตย์
    (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 คือวันอาทิตย์, 6 คือวันเสาร์
    },
  ];

  // กำหนด CSS classes สำหรับ DayPicker
  const dayPickerClassNames = {
    months: "flex flex-col md:flex-row space-y-4 md:space-x-4 md:space-y-0",
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

  // ฟังก์ชันสำหรับแสดงปี พ.ศ. และชื่อเดือนภาษาไทย
  const formatCaption = (date, options) => {
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const month = format(date, "LLLL", { locale: th }); // แสดงชื่อเดือนภาษาไทย
    return `${month} ${year}`;
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      data-cy="create-sprint-container"
    >
      <div className="w-full px-4 sm:px-6 py-6 sm:py-8 mx-auto max-w-lg sm:max-w-xl md:max-w-2xl">
        {/* ปุ่มกลับไปยังหน้าเลือกสปรินต์ */}
        <button
          onClick={handleBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors"
          data-cy="back-button"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-sm sm:text-base">
            กลับไปที่หน้าเลือกสปรินต์
          </span>
        </button>

        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-2xl overflow-hidden">
          {/* ส่วนหัวของฟอร์ม */}
          <div className="bg-blue-50 p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Plus className="w-6 h-6 sm:w-10 sm:h-10 text-blue-600" />
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
                สร้างสปรินต์ใหม่
              </h2>
            </div>
          </div>

          {/* ฟอร์มสร้างสปรินต์ */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6"
            data-cy="create-sprint-form"
          >
            {/* แสดงข้อความผิดพลาด (ถ้ามี) */}
            {error && (
              <div
                className="flex items-center space-x-2 sm:space-x-3 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg"
                data-cy="error-message"
              >
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
                <p className="text-sm sm:text-base text-red-600">{error}</p>
              </div>
            )}

            {/* ส่วนแสดงชื่อสปรินต์ (ไม่สามารถแก้ไขได้) */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Sprint (สปรินต์)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nextSprintName}
                  disabled
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm sm:text-base"
                  data-cy="sprint-name-input"
                />
                <Lock className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                สปรินต์จะถูกสร้างโดยอัตโนมัติตามลำดับ
              </p>
            </div>

            {/* ส่วนเลือกช่วงวันที่ */}
            <div>
              <div className="flex justify-between items-center mb-1 sm:mb-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700">
                  ช่วงวันที่ของสปรินต์
                </label>
              </div>

              <div className="relative">
                <Calendar className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  value={
                    dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString(
                          "th-TH"
                        )} - ${dateRange.to.toLocaleDateString("th-TH")}`
                      : "เลือกช่วงวันที่"
                  }
                  onClick={() => setShowDateRanges(true)}
                  readOnly
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 pl-10 sm:pl-12 border border-gray-300 rounded-lg cursor-pointer text-sm sm:text-base"
                  data-cy="date-range-input"
                />
              </div>
            </div>

            {/* ปุ่มยกเลิกและสร้างสปรินต์ */}
            <div className="flex justify-end space-x-2 sm:space-x-4 pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-100"
                data-cy="cancel-button"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || !dateRange?.from || !dateRange?.to}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm sm:text-base"
                data-cy="submit-button"
              >
                <span>{loading ? "Creating..." : "สร้างสปรินต์"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* โมดัลสำหรับเลือกช่วงวันที่ */}
      {showDateRanges && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4"
          data-cy="date-picker-modal"
        >
          <div className="bg-white rounded-lg p-3 sm:p-6 w-full max-w-lg sm:max-w-2xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* ส่วนหัวของโมดัล */}
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold">
                เลือกช่วงวันที่ของสปรินต์
              </h3>
              <button
                onClick={() => setShowDateRanges(false)}
                className="text-gray-500 hover:text-gray-700"
                data-cy="close-modal-button"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* แสดงรายการสปรินต์ที่มีอยู่แล้ว */}
            <div className="mb-4 overflow-x-auto">
              <ExistingSprintsList sprints={existingSprints} />
            </div>

            {/* ตัวเลือกช่วงวันที่ */}
            <div className="flex justify-center">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={handleRangeSelect}
                locale={th}
                numberOfMonths={numberOfMonths}
                formatters={{
                  formatCaption: formatCaption,
                }}
                disabled={disabledDays}
                className="border rounded-md p-2 sm:p-4 w-full"
                classNames={dayPickerClassNames}
                styles={{
                  months: {
                    display: "flex",
                    gap: "1rem",
                    flexDirection: numberOfMonths === 1 ? "column" : "row",
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
                footer={
                  <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-4 text-center">
                    ปิดการเลือกวันหยุดสุดสัปดาห์
                  </p>
                }
                data-cy="day-picker"
              />
            </div>

            {/* ปุ่มยกเลิกและยืนยันการเลือกวันที่ */}
            <div className="flex justify-end space-x-2 sm:space-x-4 mt-4 sm:mt-6">
              <button
                onClick={() => setShowDateRanges(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg text-sm sm:text-base text-gray-700 hover:bg-gray-100"
                data-cy="cancel-date-selection"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  if (dateRange.from && dateRange.to) {
                    setShowDateRanges(false);
                  }
                }}
                disabled={!dateRange.from || !dateRange.to}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 text-sm sm:text-base"
                data-cy="confirm-date-selection"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSprint;
