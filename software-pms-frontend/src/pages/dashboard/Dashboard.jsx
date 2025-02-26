import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Activity, Calendar, FileText, Clock, Layers } from "lucide-react";
import axios from "axios";

// ตั้งค่า URL API จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ===============================================
// คอมโพเนนต์ย่อย (Sub-components)
// ===============================================

/**
 * คอมโพเนนต์แสดงการ์ดสถิติ
 * @param {string} title - หัวข้อสถิติ
 * @param {number|string} value - ค่าสถิติ
 * @param {Component} icon - ไอคอนที่จะแสดง
 * @param {string} description - คำอธิบายเพิ่มเติมสำหรับสถิติ
 */
const StatCard = ({ title, value, icon: Icon, description }) => (
  <div
    className="bg-white rounded-lg shadow-sm border border-gray-200"
    data-cy="stat-card"
  >
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900" data-cy="stat-value">
            {value || 0}
          </h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * คอมโพเนนต์แสดงการ์ดโปรเจกต์
 * @param {Object} project - ข้อมูลโปรเจกต์ที่จะแสดง
 */
const ProjectCard = ({ project }) => (
  <div
    className="bg-white rounded-lg shadow-sm border border-gray-200"
    data-cy="project-card"
  >
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3
            className="font-semibold text-lg text-gray-900 line-clamp-1"
            data-cy="project-name"
          >
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            สร้างเมื่อ{" "}
            {new Date(project.created_at).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            project.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
          data-cy="project-status"
        >
          {project.status === "Active" ? "กำลังดำเนินการ" : "ไม่ได้ใช้งาน"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span
            className="text-sm text-gray-600"
            data-cy="project-sprint-count"
          >
            {project.sprintCount || 0} สปรินต์
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600" data-cy="project-file-count">
            {project.fileCount || 0} ไฟล์ทดสอบ
          </span>
        </div>
      </div>
    </div>
  </div>
);

// ===============================================
// คอมโพเนนต์หลัก Dashboard
// ===============================================

const Dashboard = () => {
  // ใช้ Auth Context สำหรับข้อมูลการยืนยันตัวตนของผู้ใช้
  const { user } = useAuth();

  // สถานะต่างๆ สำหรับการทำงานของหน้า Dashboard
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProjects: 0,
      totalSprints: 0,
      totalFiles: 0,
      activeProjects: 0,
    },
    latestProjects: [],
  });

  // ===============================================
  // Effect Hooks และการดึงข้อมูล
  // ===============================================

  /**
   * ดึงข้อมูล Dashboard จาก API เมื่อคอมโพเนนต์ถูกโหลดหรือเมื่อผู้ใช้เปลี่ยนแปลง
   */
  useEffect(() => {
    const fetchDashboardData = async () => {
      // ตรวจสอบว่ามี token ในการเชื่อมต่อ API หรือไม่
      if (!user?.token) return;

      try {
        setLoading(true);
        // ดึงข้อมูลจาก API โดยใช้ token สำหรับการยืนยันตัวตน
        const response = await axios.get(
          `${API_BASE_URL}/api/main-dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // ตรวจสอบโครงสร้างข้อมูลที่ได้รับกลับมา
        const stats = response.data?.stats || {
          totalProjects: 0,
          totalSprints: 0,
          totalFiles: 0,
          activeProjects: 0,
        };

        const latestProjects = response.data?.latestProjects || [];

        // อัพเดทสถานะข้อมูล Dashboard
        setDashboardData({
          stats,
          latestProjects,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.error || "ไม่สามารถดึงข้อมูลแดชบอร์ดได้");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800"
        data-cy="error-message"
      >
        {error}
      </div>
    );
  }

  // ดึงข้อมูลที่จะแสดงผล
  const { stats, latestProjects } = dashboardData;

  // คำนวณเปอร์เซ็นต์โปรเจกต์ที่กำลังใช้งาน
  const percentageActive =
    stats.totalProjects > 0
      ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(1)
      : 0;

  // ===============================================
  // การแสดงผลหน้า Dashboard
  // ===============================================
  return (
    <div className="min-h-screen bg-gray-50 p-8" data-cy="dashboard-container">
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวของหน้า Dashboard */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Layers className="w-10 h-10 mr-4 text-blue-600" />
            การจัดการไฟล์ทดสอบ
          </h1>
        </div>

        {/* ส่วนแสดงสถิติ */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          data-cy="stats-container"
        >
          <StatCard
            title="จำนวนโปรเจกต์ทั้งหมด"
            value={stats.totalProjects}
            icon={Activity}
            description={`${stats.activeProjects} โปรเจกต์ที่กำลังดำเนินการ`}
          />
          <StatCard
            title="จำนวนสปรินต์ทั้งหมด"
            value={stats.totalSprints}
            icon={Calendar}
            description="จากทุกโปรเจกต์"
          />
          <StatCard
            title="จำนวนไฟล์ทดสอบทั้งหมด"
            value={stats.totalFiles}
            icon={FileText}
            description="ไฟล์ทดสอบที่ใช้งานอยู่"
          />
          <StatCard
            title="โปรเจกต์ที่กำลังดำเนินการ"
            value={stats.activeProjects}
            icon={Clock}
            description={`${percentageActive}% ของทั้งหมด`}
          />
        </div>

        {/* ส่วนแสดงโปรเจกต์ล่าสุด */}
        <div className="mb-6" data-cy="latest-projects-section">
          <h2
            className="text-xl font-semibold text-gray-900 mb-4"
            data-cy="latest-projects-title"
          >
            โปรเจกต์ล่าสุด
          </h2>
          <div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-cy="latest-projects-grid"
          >
            {latestProjects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
