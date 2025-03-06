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

// คอมโพเนนต์การ์ดสถิติที่มีการออกแบบที่ละเอียดและสวยงาม
const StatCard = ({ title, value, icon: Icon, description, className }) => (
  <div
    data-cy={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    className={`bg-white rounded-2xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-300 ease-in-out overflow-hidden ${className}`}
  >
    <div className="p-4 sm:p-5 relative">
      {/* ไอคอนที่มุมบนขวาของการ์ด */}
      <div className="absolute top-0 right-0 m-3 bg-blue-50 p-2 rounded-full">
        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
      </div>
      <div className="space-y-2">
        {/* ชื่อหัวข้อและค่าสถิติ */}
        <p className="text-xs font-medium text-gray-500">{title}</p>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
          {value || 0}
        </h3>
        {description && (
          <p className="text-xs text-gray-600 mt-1 flex items-center">
            {description}
          </p>
        )}
      </div>
    </div>
  </div>
);

// คอมโพเนนต์การ์ดไฟล์ทดสอบที่มีการแสดงสถานะที่ชัดเจนและสวยงาม
const TestFileCard = ({ file }) => {
  // ฟังก์ชันแสดงสถานะการทดสอบด้วยการออกแบบที่เป็นเอกลักษณ์
  const renderStatus = () => {
    switch (file.status) {
      case "Pass":
        return (
          <span
            data-cy="test-file-pass-status"
            className="flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800"
          >
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
            <span>ผ่านการทดสอบ</span>
          </span>
        );
      case "Fail":
        return (
          <span
            data-cy="test-file-fail-status"
            className="flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800"
          >
            <XCircle className="w-3 h-3 mr-1 text-red-600" />
            <span>ไม่ผ่านการทดสอบ</span>
          </span>
        );
      default:
        return (
          <span
            data-cy="test-file-pending-status"
            className="flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800"
          >
            <Clock className="w-3 h-3 mr-1 text-yellow-600" />
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
      className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-200"
    >
      <div className="p-4">
        {/* ส่วนหัวของการ์ดไฟล์ทดสอบ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
          <div className="flex-grow pr-2">
            <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">
              {file.filename}
            </h3>
            <div className="flex flex-wrap items-center text-xs text-gray-500 gap-1">
              <span className="inline-block px-2 py-0.5 bg-blue-50 rounded-lg text-blue-700 text-xs font-medium truncate max-w-[120px]">
                {file.projectName}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="inline-block px-2 py-0.5 bg-indigo-50 rounded-lg text-indigo-700 text-xs font-medium truncate max-w-[120px]">
                {file.sprintName}
              </span>
            </div>
          </div>
          <div className="self-start sm:self-auto mt-1 sm:mt-0">
            {renderStatus()}
          </div>
        </div>
        {/* ส่วนล่างของการ์ดแสดงวันที่อัพโหลดและผู้อัพโหลด */}
        <div className="border-t border-gray-200 pt-3 mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-blue-600 flex-shrink-0" />
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
            <div className="flex items-center space-x-1 justify-start sm:justify-end">
              <User className="w-3 h-3 text-blue-600 flex-shrink-0" />
              <span className="truncate">{file.uploadedBy}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// คอมโพเนนต์การ์ดโปรเจกต์ที่มีการออกแบบเชิงโต้ตอบมากขึ้น
const ProjectCard = ({ project }) => {
  // ฟังก์ชันสำหรับแสดงสถานะโปรเจกต์
  const renderStatus = () => {
    switch (project.status) {
      case "Active":
        return (
          <span
            data-cy="project-active-status"
            className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 flex items-center"
          >
            <Activity className="w-3 h-3 mr-1" />
            <span>กำลังดำเนินการ</span>
          </span>
        );
      case "Completed":
        return (
          <span
            data-cy="project-completed-status"
            className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 flex items-center"
          >
            <CheckCircle2 className="w-3 h-3 mr-1" />
            <span>เสร็จสิ้น</span>
          </span>
        );
      default:
        return (
          <span
            data-cy="project-suspended-status"
            className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 flex items-center"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
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
      className="bg-white rounded-xl border border-gray-100 shadow-md hover:shadow-lg transition-all duration-200"
    >
      <div className="p-4">
        {/* ส่วนหัวของการ์ดโปรเจกต์ */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2 sm:gap-0">
          <div className="flex-grow pr-2">
            <h3 className="text-sm font-bold text-gray-900 mb-1 truncate">
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
        <div className="border-t border-gray-200 pt-3 mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Calendar className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span>{project.sprintCount || 0} สปรินต์</span>
          </div>
          <div className="flex items-center space-x-1 justify-end">
            <FileText className="w-3 h-3 text-blue-600 flex-shrink-0" />
            <span>{project.fileCount || 0} ไฟล์ทดสอบ</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// คอมโพเนนต์หน้าหลักพร้อมเลย์เอาต์ที่ปรับปรุงแล้ว
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
        className="flex justify-center items-center min-h-screen bg-blue-50"
      >
        <div className="flex flex-col items-center">
          <div className="animate-bounce mb-4">
            <div className="animate-pulse">
              <Layers className="w-16 h-16 text-blue-500 opacity-75" />
            </div>
          </div>
          <p className="text-gray-600 font-medium text-lg mt-2 animate-pulse">
            กำลังโหลดข้อมูล...
          </p>
        </div>
      </div>
    );
  }

  // หน้าแสดงข้อผิดพลาดที่ได้รับการปรับปรุง
  if (error) {
    return (
      <div
        data-cy="error-screen"
        className="flex justify-center items-center min-h-screen bg-red-50 p-4"
      >
        <div className="bg-white p-6 rounded-xl shadow-lg text-center max-w-md border border-red-100">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-red-800 mb-3">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-red-600 font-semibold text-base mb-3 break-words">
            {error}
          </p>
          <p className="text-gray-500 text-sm mb-4">
            กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ
          </p>
          <button
            onClick={() => window.location.reload()}
            data-cy="reload-button"
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm"
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
      className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวหน้าจอด้วยการออกแบบสมัยใหม่ */}
        <header className="flex flex-col md:flex-row items-center md:justify-between mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left space-y-3 sm:space-y-0 sm:space-x-4">
            <div className="bg-blue-100 p-3 rounded-xl shadow-sm">
              <Layers className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                <span>ระบบบริหารโครงการพัฒนาซอฟต์แวร์</span>
                {user?.role && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full whitespace-nowrap self-center mt-1 sm:mt-0">
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
              className={`px-3 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg shadow-sm hover:bg-blue-50 transition-colors duration-300 flex items-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm">รีเฟรช</span>
            </button>
          </div>
        </header>

        {/* ส่วนแสดงสถิติด้วยการออกแบบที่ปรับปรุง */}
        <section
          data-cy="stats-section"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6"
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

        {/* ส่วนโปรเจกต์ล่าสุดด้วยเลย์เอาต์ที่ปรับปรุง */}
        <section
          data-cy="latest-projects-section"
          className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-blue-600" />
              <span>โปรเจกต์ล่าสุด</span>
            </h2>
            {(user?.role === "Admin" || user?.role === "Product Owner") && (
              <a
                href="/projects"
                data-cy="view-all-projects"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 transition-colors duration-300 bg-blue-50 px-3 py-1.5 rounded-full self-start sm:self-auto"
              >
                <span className="text-xs">ดูทั้งหมด</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {latestProjects.length > 0 ? (
              latestProjects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
                <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีโปรเจกต์ล่าสุด</p>
              </div>
            )}
          </div>
        </section>

        {/* ส่วนไฟล์ทดสอบล่าสุดด้วยเลย์เอาต์ที่ปรับปรุง */}
        <section
          data-cy="latest-test-files-section"
          className="mb-6 bg-white rounded-xl p-4 shadow-md border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              <span>ไฟล์ทดสอบล่าสุด</span>
            </h2>
            {(user?.role === "Admin" ||
              user?.role === "Tester" ||
              user?.role === "Product Owner") && (
              <a
                href="/test-files"
                data-cy="view-all-test-files"
                className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 transition-colors duration-300 bg-blue-50 px-3 py-1.5 rounded-full self-start sm:self-auto"
              >
                <span className="text-xs">ดูทั้งหมด</span>
                <ArrowUpRight className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {latestTestFiles.length > 0 ? (
              latestTestFiles.map((file, index) => (
                <TestFileCard key={index} file={file} />
              ))
            ) : (
              <div className="col-span-full text-center bg-gray-50 p-6 rounded-xl shadow-sm border border-gray-100">
                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">ยังไม่มีไฟล์ทดสอบล่าสุด</p>
              </div>
            )}
          </div>
        </section>

        {/* ส่วนท้ายของหน้าจอ */}
        <footer className="text-center text-gray-500 text-xs py-4">
          <p>© {new Date().getFullYear()} ระบบบริหารโครงการพัฒนาซอฟต์แวร์</p>
        </footer>
      </div>
    </div>
  );
};

export default MainPage;
