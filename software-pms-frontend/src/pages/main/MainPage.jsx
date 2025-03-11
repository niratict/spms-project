import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  Activity,
  Calendar,
  FileText,
  Layers,
  CheckCircle2,
  XCircle,
  BarChart3,
  Briefcase,
  ArrowUpRight,
  User,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import axios from "axios";

// URL ของ API จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * คอมโพเนนต์การ์ดสถิติ
 * แสดงข้อมูลสถิติพร้อมไอคอนและคำอธิบาย
 */
const StatCard = ({ title, value, icon: Icon, description, className }) => (
  <div
    data-cy={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    className={`bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 ease-in-out overflow-hidden ${className}`}
  >
    <div className="p-5 relative">
      {/* ไอคอนที่มุมบนขวาของการ์ด */}
      <div className="absolute top-0 right-0 m-3 bg-blue-50 p-2 rounded-full">
        <Icon className="w-5 h-5 text-blue-500" />
      </div>
      <div className="space-y-2">
        {/* ชื่อหัวข้อและค่าสถิติ */}
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-2xl font-bold text-gray-800">{value || 0}</h3>
        {description && (
          <p className="text-xs text-gray-600 mt-1 flex items-center">
            {description}
          </p>
        )}
      </div>
    </div>
  </div>
);

/**
 * คอมโพเนนต์การ์ดไฟล์ทดสอบ
 * แสดงข้อมูลไฟล์ทดสอบพร้อมสถานะที่ชัดเจน
 */
const TestFileCard = ({ file }) => {
  // ฟังก์ชันแสดงสถานะการทดสอบด้วยการออกแบบที่เป็นเอกลักษณ์
  const renderStatus = () => {
    switch (file.status) {
      case "Pass":
        return (
          <span
            data-cy="test-file-pass-status"
            className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-green-500" />
            <span>ผ่านการทดสอบ</span>
          </span>
        );
      case "Fail":
        return (
          <span
            data-cy="test-file-fail-status"
            className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"
          >
            <XCircle className="w-3.5 h-3.5 mr-1 text-red-500" />
            <span>ไม่ผ่านการทดสอบ</span>
          </span>
        );
      default:
        return (
          <span
            data-cy="test-file-pending-status"
            className="flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700"
          >
            <Clock className="w-3.5 h-3.5 mr-1 text-amber-500" />
            <span>รอการทดสอบ</span>
          </span>
        );
    }
  };

  return (
    <div
      data-cy={`test-file-card-${file.filename
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="p-4">
        {/* ส่วนหัวของการ์ดไฟล์ทดสอบ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
          <div className="flex-grow">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5 truncate">
              {file.filename}
            </h3>
            <div className="flex flex-wrap items-center text-xs text-gray-500 gap-2">
              <span className="inline-block px-2 py-0.5 bg-blue-50 rounded-md text-blue-600 text-xs font-medium truncate max-w-[120px]">
                {file.projectName}
              </span>
              <span className="inline-block px-2 py-0.5 bg-indigo-50 rounded-md text-indigo-600 text-xs font-medium truncate max-w-[120px]">
                {file.sprintName}
              </span>
            </div>
          </div>
          <div className="self-start sm:self-auto mt-1 sm:mt-0">
            {renderStatus()}
          </div>
        </div>
        {/* ส่วนล่างของการ์ดแสดงวันที่อัพโหลดและผู้อัพโหลด */}
        <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span className="truncate">
              {new Date(file.uploadDate).toLocaleString("th-TH", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
          {file.uploadedBy && (
            <div className="flex items-center space-x-1.5 justify-start sm:justify-end">
              <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
              <span className="truncate">{file.uploadedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์การ์ดโปรเจกต์
 * แสดงข้อมูลโปรเจกต์พร้อมสถานะและรายละเอียด
 */
const ProjectCard = ({ project }) => {
  // ฟังก์ชันสำหรับแสดงสถานะโปรเจกต์
  const renderStatus = () => {
    switch (project.status) {
      case "Active":
        return (
          <span
            data-cy="project-active-status"
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 flex items-center"
          >
            <Activity className="w-3.5 h-3.5 mr-1" />
            <span>กำลังดำเนินการ</span>
          </span>
        );
      case "Completed":
        return (
          <span
            data-cy="project-completed-status"
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 flex items-center"
          >
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            <span>เสร็จสิ้น</span>
          </span>
        );
      default:
        return (
          <span
            data-cy="project-suspended-status"
            className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 flex items-center"
          >
            <AlertCircle className="w-3.5 h-3.5 mr-1" />
            <span>ระงับ</span>
          </span>
        );
    }
  };

  return (
    <div
      data-cy={`project-card-${project.name
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200"
    >
      <div className="p-4">
        {/* ส่วนหัวของการ์ดโปรเจกต์ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
          <div className="flex-grow">
            <h3 className="text-sm font-semibold text-gray-800 mb-1.5 truncate">
              {project.name}
            </h3>
            <p className="text-xs text-gray-500">
              สร้างเมื่อ{" "}
              {new Date(project.created_at).toLocaleDateString("th-TH", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })}
            </p>
          </div>
          {/* แท็กสถานะโปรเจกต์ */}
          <div className="self-start sm:self-auto mt-1 sm:mt-0">
            {renderStatus()}
          </div>
        </div>
        {/* ส่วนล่างของการ์ดแสดงรายละเอียดเพิ่มเติม */}
        <div className="border-t border-gray-100 pt-3 mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{project.sprintCount || 0} สปรินต์</span>
          </div>
          <div className="flex items-center space-x-1.5 justify-end">
            <FileText className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
            <span>{project.fileCount || 0} ไฟล์ทดสอบ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์หน้าหลัก
 * แสดงภาพรวมของระบบพร้อมสถิติและข้อมูลล่าสุด
 */
const MainPage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mainPageData, setMainPageData] = useState({
    stats: {
      totalProjects: 0,
      totalSprints: 0,
      totalFiles: 0,
      activeProjects: 0,
    },
    latestProjects: [],
    latestTestFiles: [],
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ฟังก์ชันดึงข้อมูลหน้าหลัก
  const fetchMainPageData = async () => {
    if (!user?.token) return;

    try {
      setLoading(true);
      // ดึงข้อมูลสถิติและไฟล์ทดสอบล่าสุด
      const [statsResponse, testFilesResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/main-dashboard/stats`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/api/main-dashboard/latest-test-files`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // กำหนดค่าเริ่มต้นหากไม่มีข้อมูล
      const stats = statsResponse.data?.stats || {
        totalProjects: 0,
        totalSprints: 0,
        totalFiles: 0,
        activeProjects: 0,
      };

      const latestProjects = statsResponse.data?.latestProjects || [];
      const latestTestFiles = testFilesResponse.data?.latestTestFiles || [];

      setMainPageData({
        stats,
        latestProjects,
        latestTestFiles,
      });
    } catch (err) {
      console.error("เกิดข้อผิดพลาดในการดึงข้อมูลหน้าหลัก:", err);
      setError(err.response?.data?.error || "ไม่สามารถดึงข้อมูลหน้าหลักได้");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // เรียกใช้ฟังก์ชันดึงข้อมูลเมื่อคอมโพเนนต์ถูกโหลดหรือผู้ใช้เปลี่ยนแปลง
  useEffect(() => {
    fetchMainPageData();
  }, [user]);

  // ฟังก์ชันรีเฟรชข้อมูล
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchMainPageData();
  };

  // หน้าโหลดข้อมูลพร้อมเอนิเมชัน
  if (loading) {
    return (
      <div
        data-cy="loading-screen"
        className="flex justify-center items-center min-h-screen bg-gradient-to-b from-blue-50 to-white"
      >
        <div className="flex flex-col items-center">
          <div className="animate-bounce mb-4">
            <div className="animate-pulse">
              <Layers className="w-16 h-16 text-blue-500 opacity-80" />
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg mt-2 animate-pulse">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    );
  }

  // หน้าแสดงข้อผิดพลาด
  if (error) {
    return (
      <div
        data-cy="error-screen"
        className="flex justify-center items-center min-h-screen bg-gradient-to-b from-red-50 to-white p-4"
      >
        <div className="bg-white p-6 rounded-xl shadow-md text-center max-w-md border border-red-100">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-red-700 mb-3">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-red-600 font-medium text-base mb-3 break-words">
            {error}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ
          </p>
          <button
            onClick={() => window.location.reload()}
            data-cy="reload-button"
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 text-sm font-medium"
          >
            โหลดใหม่
          </button>
        </div>
      </div>
    );
  }

  const { stats, latestProjects, latestTestFiles } = mainPageData;
  // คำนวณเปอร์เซ็นต์โปรเจกต์ที่กำลังดำเนินการ
  const percentageActive =
    stats.totalProjects > 0
      ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(1)
      : 0;

  return (
    <div
      data-cy="main-dashboard"
      className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวหน้าจอ */}
        <header className="flex flex-col md:flex-row items-center md:justify-between mb-8 gap-4">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-xl shadow-sm">
              <Layers className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <span>ระบบบริหารโครงการพัฒนาซอฟต์แวร์</span>
                {user?.role && (
                  <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full whitespace-nowrap self-center mt-1 sm:mt-0 font-medium">
                    {user.role}
                  </span>
                )}
              </h1>
              <p className="text-gray-500 mt-1 text-sm">
                ภาพรวมของโปรเจกต์และไฟล์ทดสอบ
              </p>
            </div>
          </div>
          <div className="flex">
            <button
              data-cy="refresh-dashboard"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`px-4 py-2 bg-white text-blue-600 border border-blue-100 rounded-lg shadow-sm hover:bg-blue-50 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm font-medium">รีเฟรช</span>
            </button>
          </div>
        </header>

        {/* ส่วนแสดงสถิติ */}
        <section
          data-cy="stats-section"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            title="จำนวนโปรเจกต์ทั้งหมด"
            value={stats.totalProjects}
            icon={Briefcase}
            description={`${stats.activeProjects} โปรเจกต์ที่กำลังดำเนินการ`}
            className="transition-transform hover:scale-103"
          />
          <StatCard
            title="จำนวนสปรินต์ทั้งหมด"
            value={stats.totalSprints}
            icon={Calendar}
            description="จากทุกโปรเจกต์"
            className="transition-transform hover:scale-103"
          />
          <StatCard
            title="จำนวนไฟล์ทดสอบ"
            value={stats.totalFiles}
            icon={BarChart3}
            description="ไฟล์ทดสอบที่ใช้งานอยู่"
            className="transition-transform hover:scale-103"
          />
          <StatCard
            title="โปรเจกต์ที่กำลังดำเนินการ"
            value={stats.activeProjects}
            icon={Activity}
            description={`${percentageActive}% ของทั้งหมด`}
            className="transition-transform hover:scale-103"
          />
        </section>

        {/* ส่วนโปรเจกต์ล่าสุด */}
        <section
          data-cy="latest-projects-section"
          className="mb-8 bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-500" />
              <span>โปรเจกต์ล่าสุด</span>
            </h2>
            {(user?.role === "Admin" || user?.role === "Product Owner") && (
              <a
                href="/projects"
                data-cy="view-all-projects"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors duration-300 bg-blue-50 px-3 py-1.5 rounded-full self-start sm:self-auto"
              >
                <span className="text-xs font-medium">ดูทั้งหมด</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestProjects.length > 0 ? (
              latestProjects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีโปรเจกต์ล่าสุด</p>
              </div>
            )}
          </div>
        </section>

        {/* ส่วนไฟล์ทดสอบล่าสุด */}
        <section
          data-cy="latest-test-files-section"
          className="mb-8 bg-white rounded-xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-500" />
              <span>ไฟล์ทดสอบล่าสุด</span>
            </h2>
            {(user?.role === "Admin" ||
              user?.role === "Tester" ||
              user?.role === "Product Owner") && (
              <a
                href="/test-files"
                data-cy="view-all-test-files"
                className="text-blue-600 hover:text-blue-700 flex items-center space-x-2 transition-colors duration-300 bg-blue-50 px-3 py-1.5 rounded-full self-start sm:self-auto"
              >
                <span className="text-xs font-medium">ดูทั้งหมด</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {latestTestFiles.length > 0 ? (
              latestTestFiles.map((file, index) => (
                <TestFileCard key={index} file={file} />
              ))
            ) : (
              <div className="col-span-full text-center bg-gray-50 p-8 rounded-xl shadow-sm border border-gray-100">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีไฟล์ทดสอบล่าสุด</p>
              </div>
            )}
          </div>
        </section>

        {/* ส่วนท้ายของหน้าจอ */}
        <footer className="text-center text-gray-500 text-xs py-6">
          <p>© {new Date().getFullYear()} ระบบบริหารโครงการพัฒนาซอฟต์แวร์</p>
        </footer>
      </div>
    </div>
  );
};

export default MainPage;
