import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  Calendar,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react";
import axios from "axios";

// ตั้งค่า URL API จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ===============================================
// คอมโพเนนต์ย่อย (Sub-components)
// ===============================================

/**
 * คอมโพเนนต์แสดงการ์ดสถิติ
 */
const StatCard = ({
  title,
  value,
  icon: Icon,
  description,
  color = "blue",
}) => (
  <div
    className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md"
    data-cy="stat-card"
  >
    <div className="p-4 sm:p-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`p-2 sm:p-3 bg-${color}-50 rounded-lg flex-shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 text-${color}-500`} />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-500">
            {title}
          </p>
          <h3
            className="text-xl sm:text-2xl font-bold text-gray-900"
            data-cy="stat-value"
          >
            {value || 0}
          </h3>
          {description && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * คอมโพเนนต์แสดงการ์ดโปรเจกต์
 */
const ProjectCard = ({ project }) => (
  <div
    className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md"
    data-cy="project-card"
  >
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
        <div>
          <h3
            className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-1"
            data-cy="project-name"
          >
            {project.name}
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            สร้างเมื่อ{" "}
            {new Date(project.created_at).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs ${
            project.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          } self-start sm:self-auto`}
          data-cy="project-status"
        >
          {project.status === "Active" ? "กำลังดำเนินการ" : "ไม่ได้ใช้งาน"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <span
            className="text-xs sm:text-sm text-gray-600"
            data-cy="project-sprint-count"
          >
            {project.sprintCount || 0} สปรินต์
          </span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
          <span
            className="text-xs sm:text-sm text-gray-600"
            data-cy="project-file-count"
          >
            {project.fileCount || 0} ไฟล์ทดสอบ
          </span>
        </div>
      </div>
    </div>
  </div>
);

/**
 * คอมโพเนนต์แสดงไฟล์ทดสอบล่าสุด
 */
const TestFileCard = ({ file }) => {
  // กำหนดไอคอนและสีสำหรับแต่ละสถานะ
  const getStatusDetails = (status) => {
    switch (status) {
      case "Pass":
        return { icon: CheckCircle, color: "green", text: "ผ่าน" };
      case "Fail":
        return { icon: XCircle, color: "red", text: "ไม่ผ่าน" };
      case "Pending":
        return { icon: AlertCircle, color: "yellow", text: "รอดำเนินการ" };
      default:
        return { icon: FileText, color: "gray", text: status };
    }
  };

  const statusDetails = getStatusDetails(file.status);
  const StatusIcon = statusDetails.icon;

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all hover:shadow-md"
      data-cy="test-file-card"
    >
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm text-gray-900 line-clamp-1"
              data-cy="file-name"
            >
              {file.filename}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-xs text-gray-500 line-clamp-1"
                data-cy="project-sprint-info"
              >
                {file.projectName} / {file.sprintName}
              </span>
            </div>
          </div>
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs flex items-center gap-1 bg-${statusDetails.color}-100 text-${statusDetails.color}-800`}
            data-cy="file-status"
          >
            <StatusIcon className="w-3 h-3" />
            {statusDetails.text}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {new Date(file.uploadDate).toLocaleDateString("th-TH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์แสดงปฏิทินกิจกรรม
 */
const ActivityCalendar = ({ events }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);

  // สร้างวันที่สำหรับแสดงในปฏิทิน
  useEffect(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // หาวันแรกของเดือน
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay(); // 0 = วันอาทิตย์, 1 = วันจันทร์, ...

    // หาจำนวนวันในเดือน
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const days = [];

    // เพิ่มวันก่อนหน้าเดือนปัจจุบัน (วันจากเดือนที่แล้ว)
    for (let i = 0; i < startDay; i++) {
      const prevMonthDay = new Date(year, month, -startDay + i + 1);
      days.push({
        date: prevMonthDay,
        day: prevMonthDay.getDate(),
        isCurrentMonth: false,
        hasEvent: false, // สมมติว่าไม่มีกิจกรรม
        eventCount: 0,
      });
    }

    // เพิ่มวันในเดือนปัจจุบัน
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      // ในสถานการณ์จริง คุณจะตรวจสอบ events ที่ได้รับจาก API ที่นี่
      const dayEvents =
        events?.filter((event) => {
          const eventDate = new Date(event.date);
          return (
            eventDate.getDate() === i &&
            eventDate.getMonth() === month &&
            eventDate.getFullYear() === year
          );
        }) || [];

      days.push({
        date,
        day: i,
        isCurrentMonth: true,
        hasEvent: dayEvents.length > 0,
        eventCount: dayEvents.length,
      });
    }

    // เพิ่มวันหลังเดือนปัจจุบัน (วันจากเดือนถัดไป) ให้ครบ 42 วัน (6 สัปดาห์)
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        day: i,
        isCurrentMonth: false,
        hasEvent: false, // สมมติว่าไม่มีกิจกรรม
        eventCount: 0,
      });
    }

    setCalendarDays(days);
  }, [currentDate, events]);

  const dayNames = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
      data-cy="activity-calendar"
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">ปฏิทินกิจกรรม</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Previous month"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium">
            {currentDate.toLocaleDateString("th-TH", {
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={nextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Next month"
          >
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {/* วันในสัปดาห์ */}
        {dayNames.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}

        {/* วันในปฏิทิน */}
        {calendarDays.map((day, index) => {
          const isToday = day.date.toDateString() === new Date().toDateString();

          return (
            <div
              key={index}
              className={`aspect-square p-1 text-center relative ${
                !day.isCurrentMonth
                  ? "text-gray-300"
                  : isToday
                  ? "bg-blue-50 text-blue-600 font-bold rounded-lg"
                  : "text-gray-700"
              }`}
            >
              <div className="text-xs h-full flex flex-col justify-center items-center">
                {day.day}
                {day.hasEvent && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    {day.eventCount > 1 && (
                      <span className="text-xxs text-blue-500">
                        +{day.eventCount}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ===============================================
// คอมโพเนนต์หลัก MainPage
// ===============================================

const MainPage = () => {
  // ใช้ Auth Context สำหรับข้อมูลการยืนยันตัวตนของผู้ใช้
  const { user } = useAuth();

  // สถานะต่างๆ สำหรับการทำงานของหน้าหลัก
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainPageData, setMainPageData] = useState({
    stats: {
      totalProjects: 0,
      totalSprints: 0,
      totalFiles: 0,
      activeProjects: 0,
      passedFiles: 0,
      failedFiles: 0,
      pendingFiles: 0,
    },
    latestProjects: [],
    latestTestFiles: [],
    // สมมุติข้อมูลกิจกรรมปฏิทิน (ในการใช้งานจริงควรดึงจาก API)
    calendarEvents: [
      { date: new Date(), type: "file_upload", count: 3 },
      {
        date: new Date(new Date().setDate(new Date().getDate() - 2)),
        type: "new_project",
        count: 1,
      },
      {
        date: new Date(new Date().setDate(new Date().getDate() - 5)),
        type: "sprint_created",
        count: 2,
      },
    ],
  });

  // ===============================================
  // Effect Hooks และการดึงข้อมูล
  // ===============================================

  /**
   * ดึงข้อมูลหน้าหลักจาก API เมื่อคอมโพเนนต์ถูกโหลดหรือเมื่อผู้ใช้เปลี่ยนแปลง
   */
  useEffect(() => {
    const fetchMainPageData = async () => {
      // ตรวจสอบว่ามี token ในการเชื่อมต่อ API หรือไม่
      if (!user?.token) return;

      try {
        setLoading(true);
        // ดึงข้อมูลสถิติจาก API
        const statsResponse = await axios.get(
          `${API_BASE_URL}/api/main-dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // ดึงข้อมูลไฟล์ทดสอบล่าสุด
        const filesResponse = await axios.get(
          `${API_BASE_URL}/api/main-dashboard/latest-test-files`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับกลับมา
        const stats = statsResponse.data?.stats || {
          totalProjects: 0,
          totalSprints: 0,
          totalFiles: 0,
          activeProjects: 0,
          passedFiles: 0,
          failedFiles: 0,
          pendingFiles: 0,
        };

        const latestProjects = statsResponse.data?.latestProjects || [];
        const latestTestFiles = filesResponse.data?.latestTestFiles || [];

        // อัพเดทสถานะข้อมูลหน้าหลัก
        setMainPageData((prevData) => ({
          ...prevData,
          stats,
          latestProjects,
          latestTestFiles: latestTestFiles.slice(0, 6), // แสดงไม่เกิน 6 รายการ
        }));
      } catch (err) {
        console.error("Error fetching main page data:", err);
        setError(err.response?.data?.error || "ไม่สามารถดึงข้อมูลหน้าหลักได้");
      } finally {
        setLoading(false);
      }
    };

    fetchMainPageData();
  }, [user]);

  // ===============================================
  // การแสดงผลตามเงื่อนไขสถานะ
  // ===============================================

  // แสดงตัวโหลดเมื่อกำลังดึงข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="mx-4 sm:mx-auto max-w-2xl p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm sm:text-base"
        data-cy="error-message"
      >
        {error}
      </div>
    );
  }

  // ดึงข้อมูลที่จะแสดงผล
  const { stats, latestProjects, latestTestFiles, calendarEvents } =
    mainPageData;

  // คำนวณเปอร์เซ็นต์โปรเจกต์ที่กำลังใช้งาน
  const percentageActive =
    stats.totalProjects > 0
      ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(1)
      : 0;

  // ===============================================
  // การแสดงผลหน้าหลัก (โครงใหม่)
  // ===============================================
  return (
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8"
      data-cy="main-page-container"
    >
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวของหน้าหลัก */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Layers className="w-7 h-7 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
            การจัดการไฟล์ทดสอบ
          </h1>
        </div>

        {/* แบ่งหน้าเป็น 2 คอลัมน์ (กริดแบบแปลเปลี่ยนตามขนาดหน้าจอ) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* คอลัมน์ซ้าย (เมนูหลัก) */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* ส่วนแสดงสถิติ */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
              data-cy="stats-container"
            >
              <StatCard
                title="จำนวนโปรเจกต์ทั้งหมด"
                value={stats.totalProjects}
                icon={Activity}
                description={`${stats.activeProjects} โปรเจกต์ที่กำลังดำเนินการ`}
                color="blue"
              />
              <StatCard
                title="จำนวนสปรินต์ทั้งหมด"
                value={stats.totalSprints}
                icon={Calendar}
                description="จากทุกโปรเจกต์"
                color="indigo"
              />
              <StatCard
                title="จำนวนไฟล์ทดสอบทั้งหมด"
                value={stats.totalFiles}
                icon={FileText}
                description="ไฟล์ทดสอบที่ใช้งานอยู่"
                color="purple"
              />
              <StatCard
                title="โปรเจกต์ที่กำลังดำเนินการ"
                value={`${percentageActive}%`}
                icon={Clock}
                description={`${stats.activeProjects} จาก ${stats.totalProjects} โปรเจกต์`}
                color="green"
              />
            </div>

            {/* ส่วนแสดงโปรเจกต์ล่าสุด */}
            <div data-cy="latest-projects-section">
              <h2
                className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center"
                data-cy="latest-projects-title"
              >
                <Activity className="w-5 h-5 mr-2 text-blue-500" />
                โปรเจกต์ล่าสุด
              </h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
                data-cy="latest-projects-grid"
              >
                {latestProjects.length > 0 ? (
                  latestProjects.map((project, index) => (
                    <ProjectCard key={index} project={project} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg border border-gray-200 text-gray-500">
                    ยังไม่มีโปรเจกต์ล่าสุด
                  </div>
                )}
              </div>
            </div>

            {/* ส่วนแสดงไฟล์ทดสอบล่าสุด */}
            <div data-cy="latest-test-files-section">
              <h2
                className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center"
                data-cy="latest-files-title"
              >
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                ไฟล์ทดสอบล่าสุด
              </h2>
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4"
                data-cy="latest-files-grid"
              >
                {latestTestFiles.length > 0 ? (
                  latestTestFiles.map((file, index) => (
                    <TestFileCard key={index} file={file} />
                  ))
                ) : (
                  <div className="col-span-full text-center p-8 bg-white rounded-lg border border-gray-200 text-gray-500">
                    ยังไม่มีไฟล์ทดสอบล่าสุด
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* คอลัมน์ขวา (ข้อมูลเสริม) */}
          <div className="flex flex-col gap-6">
            {/* สรุปสถานะไฟล์ทดสอบ */}
            <div
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
              data-cy="file-status-summary"
            >
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-500" />
                สถานะไฟล์ทดสอบ
              </h2>

              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-500 h-2.5 rounded-full"
                      style={{
                        width: `${
                          (stats.passedFiles / stats.totalFiles) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-700 min-w-[50px]">
                    {stats.passedFiles} ผ่าน
                  </span>
                </div>

                <div className="flex items-center">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-500 h-2.5 rounded-full"
                      style={{
                        width: `${
                          (stats.failedFiles / stats.totalFiles) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                  <span className="ml-2 text-sm text-gray-700 min-w-[50px]">
                    {stats.failedFiles} ไม่ผ่าน
                  </span>
                </div>
              </div>
            </div>

            {/* ปฏิทินกิจกรรม */}
            <ActivityCalendar events={calendarEvents} />

            {/* ทิปหรือข่าวสารล่าสุด */}
            <div
              className="bg-blue-50 rounded-lg border border-blue-100 p-4"
              data-cy="tips-section"
            >
              <h2 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                เกร็ดความรู้
              </h2>
              <p className="text-sm text-blue-800">
                คุณสามารถกรองไฟล์ทดสอบตามสถานะได้โดยคลิกที่แท็บสถานะในหน้ารายละเอียดโปรเจกต์
                การแท็กไฟล์ทดสอบจะช่วยให้ค้นหาได้ง่ายขึ้นในภายหลัง
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
