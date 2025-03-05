import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Filter, ClipboardList } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ตั้งค่า URL พื้นฐานของ API จาก environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ActionLogs = () => {
  // --------- สถานะและการจัดการข้อมูลผู้ใช้ ---------
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --------- สถานะสำหรับข้อมูลการดำเนินการ ---------
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTypes, setActionTypes] = useState([]);
  const [targetTables, setTargetTables] = useState([]);

  // --------- สถานะสำหรับการแบ่งหน้าและการกรอง ---------
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [filters, setFilters] = useState({
    action_type: "",
    target_table: "",
    start_date: "",
    end_date: "",
    limit: 10,
  });

  // แมปปิ้งประเภทการดำเนินการเป็นภาษาไทย
  const actionTypeMapping = {
    create: "สร้าง",
    delete: "ลบ",
    update: "อัพเดต",
    upload: "อัพโหลด",
    update_profile_image: "อัพโหลดรูปโปรไฟล์",
  };

  // แมปปิ้งตารางเป้าหมายเป็นภาษาไทย
  const targetTableMapping = {
    projects: "โปรเจกต์",
    sprints: "สปรินต์",
    test_files: "ไฟล์ทดสอบ",
    users: "ผู้ใช้",
  };

  // --------- ฟังก์ชันจัดรูปแบบรายละเอียด ---------
  // แสดงรายละเอียดการดำเนินการในรูปแบบที่อ่านง่าย
  // ฟังก์ชันจัดรูปแบบรายละเอียด (ปรับปรุง)
  const formatDetails = (details, targetTable, actionType) => {
    if (!details) return "-";

    if (typeof details === "object") {
      // สร้างสำเนาของ details เพื่อแก้ไข
      const displayDetails = { ...details };

      // ลบ json_content ถ้าเป้าหมายเป็น test_files และการดำเนินการเป็น update หรือ delete
      if (
        targetTable === "test_files" &&
        (actionType === "update" || actionType === "delete") &&
        displayDetails.json_content
      ) {
        delete displayDetails.json_content;
      }

      // ลบข้อมูล password ไม่ให้แสดง
      if (displayDetails.password) {
        delete displayDetails.password;
      }

      // สร้างแผนที่สำหรับแปลงชื่อฟิลด์ภาษาอังกฤษเป็นภาษาไทย
      const fieldNameMapping = {
        name: "ชื่อ",
        end_date: "วันที่สิ้นสุด",
        sprint_id: "รหัสสปรินต์",
        created_at: "วันที่สร้าง",
        changed_at: "วันที่เปลี่ยน",
        created_by: "สร้างโดย",
        project_id: "รหัสโปรเจกต์",
        upload_date: "วันที่อัพโหลด",
        last_modified_by: "แก้ไขล่าสุดโดย",
        start_date: "วันที่เริ่มต้น",
        updated_at: "แก้ไขโดย",
        file_size: "ขนาดไฟล์",
        custom_filename: "ชื่อไฟล์",
        original_filename: "ชื่อไฟล์ที่อัพโหลด",
        photo: "รูปภาพ",
        description: "รายละเอียด",
        role: "บทบาท",
        email: "อีเมล",
        user_id: "รหัสผู้ใช้",
        status: "สถานะ",
        file_id: "รหัสไฟล์",
        filename: "ชื่อไฟล์",
        new_image: "รูปภาพใหม่",
        old_image: "รูปภาพเก่า",
        last_modified_date: "วันที่แก้ไขล่าสุด",
      };

      // กำหนดลำดับความสำคัญของฟิลด์ที่ต้องการแสดงก่อน
      const fieldDisplayOrder = [
        "status", // สถานะ
        "file_id", // รหัสไฟล์
        "filename", // ชื่อไฟล์
        "original_filename", // ชื่อไฟล์ที่อัพโหลด
        "custom_filename", // ชื่อไฟล์
        "file_size", // ขนาดไฟล์
        "upload_date", // วันที่อัพโหลด
        "last_modified_by", // แก้ไขล่าสุดโดย
        "last_modified_date", // วันที่แก้ไขล่าสุด
        "name", // ชื่อ
        "description", // รายละเอียด
        "role", // บทบาท
        "email", // อีเมล
        "user_id", // รหัสผู้ใช้
        "created_by", // สร้างโดย
        "created_at", // วันที่สร้าง
        "updated_at", // แก้ไขโดย
        "start_date", // วันที่เริ่มต้น
        "end_date", // วันที่สิ้นสุด
        "sprint_id", // รหัสสปรินต์
        "project_id", // รหัสโปรเจกต์
        "changed_at", // วันที่เปลี่ยน
        "photo", // รูปภาพ
      ];

      // เก็บฟิลด์ที่มีค่าไม่เป็น null หรือ undefined
      const validFields = Object.entries(displayDetails).filter(
        ([key, value]) => value !== null && value !== undefined
      );

      // จัดเรียงฟิลด์ตามลำดับที่กำหนด
      const sortedFields = validFields.sort((a, b) => {
        const indexA = fieldDisplayOrder.indexOf(a[0]);
        const indexB = fieldDisplayOrder.indexOf(b[0]);

        // ถ้าฟิลด์ไม่อยู่ในรายการลำดับ ให้แสดงอยู่ท้ายๆ
        const priorityA = indexA === -1 ? 999 : indexA;
        const priorityB = indexB === -1 ? 999 : indexB;

        return priorityA - priorityB;
      });

      return sortedFields.map(([key, value]) => {
        // ตรวจสอบว่าชื่อ field เป็นฟิลด์วันที่หรือไม่
        const isDateField =
          [
            "created_at",
            "updated_at",
            "start_date",
            "end_date",
            "action_date",
            "upload_date",
            "changed_at",
            "last_modified_date",
          ].includes(key) && typeof value === "string";

        // ตรวจสอบรูปแบบวันที่แบบ ISO date (YYYY-MM-DDThh:mm:ss...)
        const isISODateFormat =
          isDateField && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

        // ตรวจสอบรูปแบบวันที่แบบ YYYY-MM-DD
        const isSimpleDateFormat =
          isDateField && /^\d{4}-\d{2}-\d{2}$/.test(value);

        // แปลงค่าตามรูปแบบที่พบ
        let displayValue;
        if (isISODateFormat) {
          displayValue = formatThaiDate(new Date(value));
        } else if (isSimpleDateFormat) {
          displayValue = formatThaiDate(new Date(value));
        } else if (typeof value === "object") {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = value.toString();
        }

        // แปลงชื่อฟิลด์ภาษาอังกฤษเป็นภาษาไทย (ถ้ามีใน mapping)
        const displayKey = fieldNameMapping[key] || key;

        return (
          <div
            key={key}
            className="whitespace-normal break-words"
            data-cy={`detail-item-${key}`}
          >
            <span className="font-bold text-gray-700">{displayKey}:</span>{" "}
            {displayValue}
          </div>
        );
      });
    }

    return details;
  };

  // --------- ฟังก์ชันจัดรูปแบบวันที่ ---------
  // แปลงวันที่เป็นรูปแบบปฏิทินไทย (วัน/เดือน/พ.ศ.)
  const formatThaiDate = (date, includeTime = false) => {
    if (!date) return "";
    const buddhistYear = parseInt(format(date, "yyyy", { locale: th })) + 543;
    const dateFormatted = format(date, "dd/MM/") + buddhistYear;

    if (includeTime) {
      const timeFormatted = format(date, "HH:mm:ss");
      return dateFormatted;
    }

    return dateFormatted;
  };

  // เพิ่มฟังก์ชันใหม่สำหรับแสดงเฉพาะเวลา
  const formatTime = (date) => {
    if (!date) return "";
    return format(date, "HH:mm:ss");
  };

  // --------- ฟังก์ชันจัดรูปแบบช่วงวันที่ ---------
  // จัดรูปแบบช่วงวันที่สำหรับแสดงผล
  const formatDateRange = () => {
    if (!selectedRange.from && !selectedRange.to) return "เลือกช่วงวันที่";
    if (selectedRange.from && !selectedRange.to)
      return formatThaiDate(selectedRange.from);
    return `${formatThaiDate(selectedRange.from)} ถึง ${formatThaiDate(
      selectedRange.to
    )}`;
  };

  // --------- การจัดการเลือกช่วงวันที่ ---------
  // จัดการการเลือกช่วงวันที่และอัปเดตตัวกรอง
  const handleDateRangeSelect = (range) => {
    setSelectedRange(range || { from: undefined, to: undefined });
    if (range?.from) {
      setFilters((prev) => ({
        ...prev,
        start_date: format(range.from, "yyyy-MM-dd"),
      }));
    }
    if (range?.to) {
      setFilters((prev) => ({
        ...prev,
        end_date: format(range.to, "yyyy-MM-dd"),
      }));
    }
    if (!range) {
      setFilters((prev) => ({
        ...prev,
        start_date: "",
        end_date: "",
      }));
    }
  };

  // --------- ดึงข้อมูลประเภทการดำเนินการและตารางเป้าหมาย ---------
  // ดึงตัวเลือกสำหรับตัวกรองจาก API
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [typesRes, tablesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/action-logs/types`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          axios.get(`${API_BASE_URL}/api/action-logs/tables`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
        ]);
        setActionTypes(typesRes.data);
        setTargetTables(tablesRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
        }
      }
    };

    if (user?.token) {
      fetchFilterOptions();
    }
  }, [user, logout, navigate]);

  // --------- ปรับช่วงวันที่ให้ครอบคลุมทั้งวัน ---------
  // ปรับวันที่เริ่มต้นและสิ้นสุดให้ครอบคลุมทั้งวัน
  const adjustDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return { startDate: "", endDate: "" };

    let adjustedStart = startDate;
    let adjustedEnd = endDate;

    if (startDate) {
      adjustedStart = new Date(startDate);
      adjustedStart.setUTCHours(0, 0, 0, 0);
      adjustedStart = adjustedStart.toISOString();
    }

    if (endDate) {
      adjustedEnd = new Date(endDate);
      adjustedEnd.setUTCHours(23, 59, 59, 999);
      adjustedEnd = adjustedEnd.toISOString();
    }

    return { startDate: adjustedStart, endDate: adjustedEnd };
  };

  // --------- ดึงข้อมูลบันทึกการดำเนินการตามตัวกรอง ---------
  // ดึกบันทึกการดำเนินการจาก API พร้อมตัวกรอง
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * filters.limit;

        const { startDate, endDate } = adjustDateRange(
          filters.start_date,
          filters.end_date
        );

        const queryParams = new URLSearchParams({
          ...filters,
          start_date: startDate,
          end_date: endDate,
          offset: offset.toString(),
        });

        const response = await axios.get(
          `${API_BASE_URL}/api/action-logs?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        setLogs(response.data.logs);
        setTotalLogs(response.data.total);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(
          err.response?.data?.message || "การดึงข้อมูลบันทึกการดำเนินการล้มเหลว"
        );
        setLogs([]);
        setTotalLogs(0);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchLogs();
    }
  }, [user, currentPage, filters, logout, navigate]);

  // --------- การจัดการเปลี่ยนแปลงตัวกรอง ---------
  // จัดการเปลี่ยนแปลงในตัวกรองและรีเซ็ตหน้าปัจจุบัน
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setError(null);
  };

  // --------- การล้างตัวกรองทั้งหมด ---------
  // ล้างตัวกรองทั้งหมดและรีเซ็ตการแบ่งหน้า
  const clearFilters = () => {
    setFilters({
      action_type: "",
      target_table: "",
      start_date: "",
      end_date: "",
      limit: 10,
    });
    setSelectedRange({ from: undefined, to: undefined });
    setCurrentPage(1);
    setError(null);
  };

  // --------- คำนวณข้อมูลการแบ่งหน้า ---------
  // คำนวณจำนวนหน้าทั้งหมดและตรวจสอบว่าสามารถไปยังหน้าถัดไป/ก่อนหน้าได้หรือไม่
  const totalPages = Math.ceil(totalLogs / filters.limit);
  const canGoToNextPage = currentPage < totalPages && logs.length > 0;
  const canGoToPreviousPage = currentPage > 1 && logs.length > 0;

  // --------- ตรวจสอบการเข้าสู่ระบบ ---------
  // ถ้าไม่ได้เข้าสู่ระบบ ให้นำทางไปยังหน้าเข้าสู่ระบบ
  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  // --------- แสดงสถานะกำลังโหลด ---------
  // แสดงตัวบ่งชี้การโหลดระหว่างดึงข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // --------- การแสดงผลหลัก ---------
  return (
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8"
      data-cy="action-logs-page"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* --------- ส่วนหัว --------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
            <ClipboardList className="w-7 h-7 sm:w-10 sm:h-10 mr-2 sm:mr-4 text-blue-600" />
            บันทึกการดำเนินการ
          </h1>
        </div>

        {/* --------- ส่วนตัวกรอง --------- */}
        <div
          className="bg-white shadow-md rounded-lg p-4 sm:p-6 border border-gray-200"
          data-cy="filters-section"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ตัวกรองประเภทการดำเนินการ */}
            <div className="relative" data-cy="action-type-filter-container">
              <select
                data-cy="action-type-filter"
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ประเภทการดำเนินการทั้งหมด</option>
                {actionTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                    data-cy={`action-type-option-${type}`}
                  >
                    {actionTypeMapping[type] || type}
                  </option>
                ))}
              </select>
            </div>

            {/* ตัวกรองตารางเป้าหมาย */}
            <div className="relative" data-cy="target-table-filter-container">
              <select
                data-cy="target-table-filter"
                name="target_table"
                value={filters.target_table}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ตารางเป้าหมายทั้งหมด</option>
                {targetTables.map((table) => (
                  <option
                    key={table}
                    value={table}
                    data-cy={`target-table-option-${table}`}
                  >
                    {targetTableMapping[table] || table}
                  </option>
                ))}
              </select>
            </div>

            {/* ตัวเลือกช่วงวันที่ */}
            <div className="relative" data-cy="date-range-container">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-cy="date-range-picker"
                >
                  <span className="text-gray-700 truncate">
                    {formatDateRange()}
                  </span>
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>

                {isDatePickerOpen && (
                  <div
                    className="absolute z-10 mt-1 bg-white rounded-md shadow-lg p-2 sm:p-4 border border-gray-200 left-0 right-0 sm:right-auto"
                    data-cy="date-picker-popup"
                  >
                    <div
                      className="overflow-x-auto"
                      style={{ maxWidth: "100%" }}
                    >
                      <DayPicker
                        mode="range"
                        selected={selectedRange}
                        onSelect={handleDateRangeSelect}
                        locale={th}
                        formatters={{
                          formatYear: (year) => `${year + 543}`,
                        }}
                        modifiers={{
                          selected: [selectedRange.from, selectedRange.to],
                        }}
                        modifiersStyles={{
                          selected: {
                            backgroundColor: "#3b82f6",
                            color: "white",
                          },
                        }}
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setIsDatePickerOpen(false)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        data-cy="date-picker-confirm"
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ปุ่มล้างตัวกรอง */}
          {(filters.action_type ||
            filters.target_table ||
            filters.start_date ||
            filters.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                data-cy="clear-filters-button"
                onClick={clearFilters}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition duration-200"
              >
                <Filter className="h-4 w-4 mr-2" /> ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* --------- ข้อความแสดงข้อผิดพลาด --------- */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
            data-cy="error-message"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* --------- ตารางบันทึกการดำเนินการ (แบบ responsive) --------- */}
        <div
          className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
          data-cy="logs-table-container"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-full" data-cy="logs-table">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-date"
                  >
                    วันที่
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-user"
                  >
                    ผู้ใช้
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-action"
                  >
                    การดำเนินการ
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32 sm:w-auto"
                    data-cy="column-header-target"
                  >
                    เป้าหมาย
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-details"
                  >
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.log_id}
                    data-cy={`log-row-${log.log_id}`}
                    className="hover:bg-gray-50 transition-colors duration-100 border-b last:border-b-0"
                  >
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600"
                      data-cy={`log-date-${log.log_id}`}
                    >
                      <div>{formatThaiDate(new Date(log.action_date))}</div>
                      <div className="text-gray-400 text-xs">
                        เวลา {formatTime(new Date(log.action_date))}
                      </div>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4"
                      data-cy={`log-user-${log.log_id}`}
                    >
                      <div
                        className="text-xs sm:text-sm font-medium text-gray-900"
                        data-cy={`user-name-${log.log_id}`}
                      >
                        {log.user_name}
                      </div>
                      <div
                        className="text-xs sm:text-sm text-gray-500"
                        data-cy={`user-role-${log.log_id}`}
                      >
                        {log.user_role}
                      </div>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4"
                      data-cy={`log-action-${log.log_id}`}
                    >
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {actionTypeMapping[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 break-words"
                      data-cy={`log-target-${log.log_id}`}
                    >
                      <span data-cy={`target-info-${log.log_id}`}>
                        {targetTableMapping[log.target_table] ||
                          log.target_table}{" "}
                        #{log.target_id}
                      </span>
                      {log.target_name && (
                        <div
                          className="text-xs sm:text-sm font-medium text-gray-900"
                          data-cy={`target-name-${log.log_id}`}
                        >
                          {log.target_name}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 max-w-xs sm:max-w-sm md:max-w-md"
                      data-cy={`log-details-${log.log_id}`}
                    >
                      {formatDetails(
                        log.details,
                        log.target_table,
                        log.action_type
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --------- สถานะว่างเปล่า --------- */}
          {logs.length === 0 && (
            <div
              className="text-center py-8 sm:py-10 text-gray-500 bg-gray-50"
              data-cy="empty-state"
            >
              ไม่พบบันทึกการดำเนินการ
            </div>
          )}
        </div>

        {/* --------- การแบ่งหน้า --------- */}
        <div
          className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4"
          data-cy="pagination-container"
        >
          <div
            className="text-xs sm:text-sm text-gray-700 text-center sm:text-left w-full sm:w-auto"
            data-cy="pagination-info"
          >
            แสดง {logs.length > 0 ? (currentPage - 1) * filters.limit + 1 : 0}{" "}
            ถึง {Math.min(currentPage * filters.limit, totalLogs)} จาก{" "}
            {totalLogs} รายการ
          </div>
          <div className="flex space-x-2 w-full sm:w-auto justify-center">
            <button
              data-cy="previous-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!canGoToPreviousPage}
              className="px-3 sm:px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              ก่อนหน้า
            </button>
            <button
              data-cy="next-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canGoToNextPage}
              className="px-3 sm:px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionLogs;
