import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Activity, Calendar, FileText, Clock, Layers, Plus, BarChart2, TrendingUp, EyeOff, ChevronLeft, ChevronRight } from "lucide-react";
import axios from "axios";

// ตั้งค่า URL API จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

// ===============================================
// คอมโพเนนต์ย่อย (Sub-components)
// ===============================================

/**
 * คอมโพเนนต์แสดงการ์ดสถิติแบบยกระดับด้วย Animation
 */
const StatCard = ({ title, value, icon: Icon, description }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 transform hover:-translate-y-1"
      data-cy="stat-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-4 sm:p-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`p-3 sm:p-4 rounded-lg flex-shrink-0 transition-all duration-300 ${isHovered ? 'bg-blue-100' : 'bg-blue-50'}`}>
            <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isHovered ? 'text-blue-600' : 'text-blue-500'}`} />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-medium text-gray-500">
              {title}
            </p>
            <h3
              className="text-xl sm:text-2xl font-bold text-gray-900"
              data-cy="stat-value"
            >
              <CountUpAnimation targetValue={value || 0} />
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
};

/**
 * คอมโพเนนต์ Animation นับตัวเลขขึ้น
 */
const CountUpAnimation = ({ targetValue }) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    // เริ่มค่าเป็น 0
    setCount(0);
    
    // ถ้าเป้าหมายมากกว่า 100 ให้เพิ่มทีละมากๆ
    const step = targetValue > 100 ? 5 : 1;
    const duration = 1000; // 1 วินาที
    const interval = duration / (targetValue / step);
    
    let current = 0;
    const timer = setInterval(() => {
      current += step;
      if (current >= targetValue) {
        setCount(targetValue);
        clearInterval(timer);
      } else {
        setCount(current);
      }
    }, interval);
    
    return () => clearInterval(timer);
  }, [targetValue]);
  
  return <>{count}</>;
};

/**
 * คอมโพเนนต์แสดงการ์ดโปรเจกต์ที่ปรับปรุงแล้ว
 */
const ProjectCard = ({ project }) => {
  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-200 group"
      data-cy="project-card"
    >
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
          <div>
            <h3
              className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors duration-300"
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
                ? "bg-green-100 text-green-800 group-hover:bg-green-200"
                : "bg-gray-100 text-gray-800 group-hover:bg-gray-200"
            } self-start sm:self-auto transition-colors duration-300`}
            data-cy="project-status"
          >
            {project.status === "Active" ? "กำลังดำเนินการ" : "ไม่ได้ใช้งาน"}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-100 h-2 rounded-full mt-3 overflow-hidden">
          <div 
            className={`h-full rounded-full ${project.status === "Active" ? "bg-green-500" : "bg-gray-300"}`}
            style={{ width: `${project.status === "Active" ? 75 : 100}%` }}
          ></div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 sm:gap-4 mt-3 sm:mt-4">
          <div className="flex items-center gap-1 sm:gap-2">
            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            <span
              className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
              data-cy="project-sprint-count"
            >
              {project.sprintCount || 0} สปรินต์
            </span>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            <span
              className="text-xs sm:text-sm text-gray-600 group-hover:text-gray-900 transition-colors duration-300"
              data-cy="project-file-count"
            >
              {project.fileCount || 0} ไฟล์ทดสอบ
            </span>
          </div>
        </div>
        
        {/* View Details Button */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <button className="w-full text-center text-sm text-blue-600 font-medium hover:text-blue-800 transition-all duration-300 flex items-center justify-center">
            <span>ดูรายละเอียด</span>
            <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์ Carousel สำหรับโปรเจกต์
 */
const ProjectCarousel = ({ projects }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // ติดตามการเปลี่ยนแปลงความกว้างหน้าจอ
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // คำนวณจำนวนการ์ดที่แสดงต่อหน้า ตามขนาดหน้าจอ
  const getCardsPerPage = () => {
    if (windowWidth >= 1024) return 3; // lg screens
    if (windowWidth >= 640) return 2;  // sm screens
    return 1; // xs screens
  };
  
  const cardsPerPage = getCardsPerPage();
  const totalPages = Math.ceil(projects.length / cardsPerPage);
  
  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex + cardsPerPage >= projects.length ? 0 : prevIndex + cardsPerPage
    );
  };
  
  const goToPrev = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex - cardsPerPage < 0 ? Math.max(0, projects.length - cardsPerPage) : prevIndex - cardsPerPage
    );
  };
  
  if (projects.length === 0) {
    return (
      <div className="col-span-full text-center p-8 bg-white rounded-lg border border-gray-200 text-gray-500">
        ยังไม่มีโปรเจกต์ล่าสุด
      </div>
    );
  }
  
  const visibleProjects = projects.slice(currentIndex, currentIndex + cardsPerPage);
  
  return (
    <div className="relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {visibleProjects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
      
      {/* ปุ่มนำทาง */}
      {projects.length > cardsPerPage && (
        <div className="flex justify-center mt-6 gap-2">
          <button 
            onClick={goToPrev}
            className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
            aria-label="Previous projects"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx * cardsPerPage)}
                className={`w-2 h-2 rounded-full transition-all duration-200 ${
                  Math.floor(currentIndex / cardsPerPage) === idx 
                    ? 'bg-blue-500 w-4' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to page ${idx + 1}`}
              />
            ))}
          </div>
          <button 
            onClick={goToNext}
            className="p-2 rounded-full bg-white border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 transition-all duration-200"
            aria-label="Next projects"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * คอมโพเนนต์แสดงกราฟสรุป
 */
const SummaryChart = ({ activeProjects, totalProjects }) => {
  const percentage = totalProjects > 0 ? (activeProjects / totalProjects) * 100 : 0;
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">สถานะโปรเจกต์</h3>
      <div className="flex items-center justify-center py-4">
        <div className="relative h-40 w-40">
          {/* วงกลมรอบนอก */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#EDF2F7" 
              strokeWidth="10" 
            />
            {/* วงกลมแสดงเปอร์เซ็นต์ */}
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke="#3B82F6" 
              strokeWidth="10" 
              strokeDasharray={`${percentage * 2.83} 283`}
              strokeDashoffset="0" 
              strokeLinecap="round" 
              transform="rotate(-90 50 50)" 
            />
          </svg>
          {/* ตัวเลขตรงกลาง */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-gray-900">{percentage.toFixed(0)}%</span>
            <span className="text-xs text-gray-500">กำลังดำเนินการ</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
          <span className="text-sm text-gray-600">กำลังดำเนินการ ({activeProjects})</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full bg-gray-300 mr-2"></div>
          <span className="text-sm text-gray-600">ไม่ได้ใช้งาน ({totalProjects - activeProjects})</span>
        </div>
      </div>
    </div>
  );
};

/**
 * คอมโพเนนต์ Quick Actions
 */
const QuickActions = () => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">คำสั่งด่วน</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
          <Plus className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm text-gray-900">สร้างโปรเจกต์</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
          <BarChart2 className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm text-gray-900">สถิติทั้งหมด</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
          <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm text-gray-900">รายงาน</span>
        </button>
        <button className="flex flex-col items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
          <EyeOff className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-sm text-gray-900">ซ่อนไม่ใช้งาน</span>
        </button>
      </div>
    </div>
  );
};

// ===============================================
// คอมโพเนนต์หลัก Dashboard ที่ปรับปรุงแล้ว
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

        // จำลองข้อมูลสำหรับการทดสอบหากไม่มีข้อมูลจริง
        if (latestProjects.length === 0) {
          // สร้างข้อมูลจำลองสำหรับการแสดงผล
          const mockProjects = [
            {
              name: "โปรเจกต์ทดสอบ A",
              created_at: new Date().toISOString(),
              status: "Active",
              sprintCount: 3,
              fileCount: 12
            },
            {
              name: "โปรเจกต์ทดสอบ B",
              created_at: new Date(Date.now() - 3*24*60*60*1000).toISOString(),
              status: "Inactive",
              sprintCount: 2,
              fileCount: 8
            },
            {
              name: "โปรเจกต์ทดสอบ C",
              created_at: new Date(Date.now() - 5*24*60*60*1000).toISOString(),
              status: "Active",
              sprintCount: 5,
              fileCount: 18
            },
            {
              name: "โปรเจกต์ทดสอบ D",
              created_at: new Date(Date.now() - 7*24*60*60*1000).toISOString(),
              status: "Active",
              sprintCount: 1,
              fileCount: 5
            }
          ];
          
          // อัพเดทสถานะข้อมูล Dashboard ด้วยข้อมูลจำลอง
          setDashboardData({
            stats: {
              totalProjects: 10,
              totalSprints: 42,
              totalFiles: 156,
              activeProjects: 7,
            },
            latestProjects: mockProjects,
          });
        } else {
          // อัพเดทสถานะข้อมูล Dashboard ด้วยข้อมูลจริง
          setDashboardData({
            stats,
            latestProjects,
          });
        }
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
        className="flex justify-center items-center min-h-screen bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-600 animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="flex min-h-screen bg-gray-50 justify-center items-center"
        data-cy="error-container"
      >
        <div
          className="mx-4 sm:mx-auto max-w-2xl p-6 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm sm:text-base shadow-sm"
          data-cy="error-message"
        >
          <div className="flex items-center mb-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">เกิดข้อผิดพลาด</span>
          </div>
          <p>{error}</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors duration-200"
            onClick={() => window.location.reload()}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
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
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8"
      data-cy="dashboard-container"
    >
      <div className="max-w-7xl mx-auto">
        {/* ส่วนหัวของหน้า Dashboard */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
            <Layers className="w-7 h-7 sm:w-10 sm:h-10 mr-2 sm:mr-4 text-blue-600" />
            การจัดการไฟล์ทดสอบ
          </h1>
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-md border border-blue-100">
            <Clock className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm text-gray-700">อัพเดทล่าสุด: {new Date().toLocaleTimeString('th-TH')}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActions />

        {/* ส่วนแสดงสถิติ */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8"
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

        {/* สรุปและแสดงโปรเจกต์ล่าสุด */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="lg:col-span-1">
            <SummaryChart 
              activeProjects={stats.activeProjects} 
              totalProjects={stats.totalProjects}
            />
          </div>
          
          <div className="lg:col-span-3" data-cy="latest-projects-section">
            <h2
              className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center"
              data-cy="latest-projects-title"
            >
              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
              โปรเจกต์ล่าสุด
            </h2>
            
            <ProjectCarousel projects={latestProjects} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;