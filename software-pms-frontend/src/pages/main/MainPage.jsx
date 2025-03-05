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
} from "lucide-react";
import axios from "axios";

// URL ของ API จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

// คอมโพเนนต์การ์ดสถิติที่มีการออกแบบที่ละเอียดและสวยงามมากขึ้น
const StatCard = ({ title, value, icon: Icon, description, className }) => (
  <div
    data-cy={`stat-card-${title.toLowerCase().replace(/\s+/g, "-")}`}
    className={`bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out overflow-hidden ${className}`}
  >
    <div className="p-6 relative">
      {/* ไอคอนที่มุมบนขวาของการ์ด */}
      <div className="absolute top-0 right-0 m-4 bg-blue-50 p-2.5 rounded-full">
        <Icon className="w-6 h-6 text-blue-600" />
      </div>
      <div className="space-y-3">
        {/* ชื่อหัวข้อและค่าสถิติ */}
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <h3 className="text-3xl font-bold text-gray-900">{value || 0}</h3>
        {description && (
          <p className="text-xs text-gray-600 mt-2 flex items-center">
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
          <div
            data-cy="test-file-pass-status"
            className="flex items-center bg-green-100 text-green-800 px-3 py-1.5 rounded-full space-x-2"
          >
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-sm">ผ่านการทดสอบ</span>
          </div>
        );
      case "Fail":
        return (
          <div
            data-cy="test-file-fail-status"
            className="flex items-center bg-red-100 text-red-800 px-3 py-1.5 rounded-full space-x-2"
          >
            <XCircle className="w-5 h-5 text-red-600" />
            <span className="font-semibold text-sm">ไม่ผ่านการทดสอบ</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      data-cy={`test-file-card-${file.filename
        .toLowerCase()
        .replace(/\s+/g, "-")}`}
      className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out"
    >
      <div className="p-6">
        {/* ส่วนหัวของการ์ดไฟล์ทดสอบ */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-grow pr-4">
            <h3 className="text-lg font-bold text-gray-900 mb-1.5 truncate">
              {file.filename}
            </h3>
            <p className="text-sm text-gray-500 flex items-center space-x-2">
              <span>{file.projectName}</span>
              <span className="text-xs text-gray-400">•</span>
              <span>{file.sprintName}</span>
            </p>
          </div>
          {renderStatus()}
        </div>
        {/* ส่วนล่างของการ์ดแสดงวันที่อัพโหลด */}
        <div className="border-t border-gray-200 pt-4 mt-4 text-sm text-gray-500 flex justify-between items-center">
          <span>
            อัพโหลดเมื่อ{" "}
            {new Date(file.uploadDate).toLocaleString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <ArrowUpRight className="w-5 h-5 text-blue-600 hover:text-blue-800" />
        </div>
      </div>
    </div>
  );
};

// คอมโพเนนต์การ์ดโปรเจกต์ที่มีการออกแบบเชิงโต้ตอบมากขึ้น
const ProjectCard = ({ project }) => (
  <div
    data-cy={`project-card-${project.name.toLowerCase().replace(/\s+/g, "-")}`}
    className="bg-white rounded-3xl border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out"
  >
    <div className="p-6">
      {/* ส่วนหัวของการ์ดโปรเจกต์ */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-grow pr-4">
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 truncate">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500">
            สร้างเมื่อ{" "}
            {new Date(project.created_at).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        {/* แท็กสถานะโปรเจกต์ */}
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${
            project.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {project.status === "Active" ? "กำลังดำเนินการ" : "ไม่ได้ใช้งาน"}
        </span>
      </div>
      {/* ส่วนล่างของการ์ดแสดงรายละเอียดเพิ่มเติม */}
      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{project.sprintCount || 0} สปรินต์</span>
        </div>
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <span>{project.fileCount || 0} ไฟล์ทดสอบ</span>
        </div>
      </div>
    </div>
  </div>
);

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

  // ฟังก์ชันดึงข้อมูลหน้าหลัก
  useEffect(() => {
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
      }
    };

    fetchMainPageData();
  }, [user]);

  // หน้าโหลดข้อมูล
  if (loading) {
    return (
      <div
        data-cy="loading-screen"
        className="flex justify-center items-center min-h-screen bg-gray-50"
      >
        <div className="flex flex-col items-center">
          <div className="animate-pulse">
            <Layers className="w-24 h-24 text-blue-500 opacity-50" />
          </div>
          <p className="text-gray-600 font-medium text-xl mt-6">
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
        className="flex justify-center items-center min-h-screen bg-red-50 p-4"
      >
        <div className="bg-white p-10 rounded-3xl shadow-2xl text-center max-w-md">
          <XCircle className="w-24 h-24 text-red-600 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-red-800 mb-4">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-red-600 font-semibold text-lg mb-4">{error}</p>
          <p className="text-gray-500 text-sm">
            กรุณาลองใหม่อีกครั้งหรือติดต่อผู้ดูแลระบบ
          </p>
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
      className="min-h-screen bg-gray-50 p-4 md:p-8"
    >
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวหน้าจอด้วยการออกแบบสมัยใหม่ */}
        <header className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-6">
            <div className="bg-blue-100 p-4 rounded-2xl">
              <Layers className="w-12 h-12 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                การจัดการไฟล์ทดสอบ
              </h1>
              <p className="text-gray-500 mt-2 text-base">
                ภาพรวมของโปรเจกต์และไฟล์ทดสอบ
              </p>
            </div>
          </div>
        </header>

        {/* ส่วนแสดงสถิติด้วยการออกแบบที่ปรับปรุง */}
        <section
          data-cy="stats-section"
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-14"
        >
          <StatCard
            title="จำนวนโปรเจกต์ทั้งหมด"
            value={stats.totalProjects}
            icon={Briefcase}
            description={`${stats.activeProjects} โปรเจกต์ที่กำลังดำเนินการ`}
          />
          <StatCard
            title="จำนวนสปรินต์ทั้งหมด"
            value={stats.totalSprints}
            icon={Calendar}
            description="จากทุกโปรเจกต์"
          />
          <StatCard
            title="จำนวนไฟล์ทดสอบ"
            value={stats.totalFiles}
            icon={BarChart3}
            description="ไฟล์ทดสอบที่ใช้งานอยู่"
          />
          <StatCard
            title="โปรเจกต์ที่กำลังดำเนินการ"
            value={stats.activeProjects}
            icon={Activity}
            description={`${percentageActive}% ของทั้งหมด`}
          />
        </section>

        {/* ส่วนโปรเจกต์ล่าสุดด้วยเลย์เอาต์ที่ปรับปรุง */}
        <section data-cy="latest-projects-section" className="mb-14">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">โปรเจกต์ล่าสุด</h2>
            <a
              href="/projects"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 transition-colors duration-300"
            >
              <span className="text-sm">ดูทั้งหมด</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestProjects.length > 0 ? (
              latestProjects.map((project, index) => (
                <ProjectCard key={index} project={project} />
              ))
            ) : (
              <div className="col-span-full text-center bg-white p-8 rounded-3xl shadow-lg">
                <p className="text-gray-500 text-base">
                  ยังไม่มีโปรเจกต์ล่าสุด
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ส่วนไฟล์ทดสอบล่าสุดด้วยเลย์เอาต์ที่ปรับปรุง */}
        <section data-cy="latest-test-files-section">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              ไฟล์ทดสอบล่าสุด
            </h2>
            <a
              href="/test-files"
              className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 transition-colors duration-300"
            >
              <span className="text-sm">ดูทั้งหมด</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestTestFiles.length > 0 ? (
              latestTestFiles.map((file, index) => (
                <TestFileCard key={index} file={file} />
              ))
            ) : (
              <div className="col-span-full text-center bg-white p-8 rounded-3xl shadow-lg">
                <p className="text-gray-500 text-base">
                  ยังไม่มีไฟล์ทดสอบล่าสุด
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default MainPage;
