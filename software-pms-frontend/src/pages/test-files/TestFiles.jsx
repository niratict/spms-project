import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Calendar,
  Upload,
  Check,
  X,
  Clock,
  Search,
  Target,
  FolderX,
  Menu,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Filter,
  Zap,
  AlertCircle,
  Puzzle,
  ArrowUpRight,
} from "lucide-react";
import TestStatsDashboard from "./TestStatsDashboard";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Constants for localStorage keys
const STORAGE_KEYS = {
  PROJECT_ID: "selectedProjectId",
  PROJECT_NAME: "selectedProjectName",
  SPRINT_ID: "selectedSprintId",
  SPRINT_NAME: "selectedSprintName",
};

const TestFiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // สถานะข้อมูลโปรเจกต์และสปรินต์
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);

  // สถานะข้อมูลไฟล์ทดสอบและการแสดงผล
  const [testFiles, setTestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDashboardVisible, setIsDashboardVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // สถานะสำหรับการแสดงผลแบบ Responsive
  const [isProjectSectionCollapsed, setIsProjectSectionCollapsed] =
    useState(false);
  const [isSprintSectionCollapsed, setIsSprintSectionCollapsed] =
    useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // สถานะสำหรับการกรองข้อมูล
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // ฟังก์ชั่นลบข้อมูลที่เก็บใน localStorage
  const clearStoredSelections = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  // ดึงข้อมูลโปรเจกต์และจัดการการเลือกโปรเจกต์จาก state หรือ localStorage
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);

        // ตรวจสอบ state จาก location ก่อน
        if (location.state?.selectedProjectId) {
          const project = response.data.find(
            (p) => p.project_id === location.state.selectedProjectId
          );
          if (project) {
            setSelectedProject(project);
            localStorage.setItem(STORAGE_KEYS.PROJECT_ID, project.project_id);
            localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, project.name);
          }
        }
        // ถ้าไม่มี state ให้ดึงจาก localStorage
        else {
          const savedProjectId = localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
          if (savedProjectId) {
            const project = response.data.find(
              (p) => p.project_id === parseInt(savedProjectId)
            );
            if (project) {
              setSelectedProject(project);
            }
          }
        }

        // จัดการการเลือกสปรินต์จาก state หรือ localStorage
        const handleSprintSelection = async (projectId) => {
          try {
            const sprintResponse = await axios.get(
              `${API_BASE_URL}/api/sprints?project_id=${projectId}`,
              {
                headers: { Authorization: `Bearer ${user.token}` },
              }
            );
            setSprints(sprintResponse.data);

            if (location.state?.selectedSprintId) {
              const sprint = sprintResponse.data.find(
                (s) => s.sprint_id === location.state.selectedSprintId
              );
              if (sprint) {
                setSelectedSprint(sprint);
                localStorage.setItem(STORAGE_KEYS.SPRINT_ID, sprint.sprint_id);
                localStorage.setItem(STORAGE_KEYS.SPRINT_NAME, sprint.name);
              }
            } else {
              const savedSprintId = localStorage.getItem(
                STORAGE_KEYS.SPRINT_ID
              );
              if (savedSprintId) {
                const sprint = sprintResponse.data.find(
                  (s) => s.sprint_id === parseInt(savedSprintId)
                );
                if (sprint) {
                  setSelectedSprint(sprint);
                }
              }
            }
          } catch (err) {
            console.error("Failed to fetch sprint:", err);
          } finally {
            setLoading(false);
          }
        };

        const projectId =
          location.state?.selectedProjectId ||
          localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
        if (projectId) {
          handleSprintSelection(projectId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
        setLoading(false);
      }
    };

    if (user) fetchProjects();
  }, [
    user,
    location.state?.selectedProjectId,
    location.state?.selectedSprintId,
  ]);

  // ดึงข้อมูลไฟล์ทดสอบเมื่อมีการเลือกสปรินต์
  useEffect(() => {
    const fetchTestFiles = async () => {
      if (!selectedSprint) {
        setTestFiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // ดึงข้อมูลไฟล์ทดสอบตามสปรินต์ที่เลือก
        const response = await axios.get(
          `${API_BASE_URL}/api/test-files?sprint_id=${selectedSprint.sprint_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setTestFiles(response.data);

        // ดึงข้อมูลสถิติการทดสอบ
        const statsResponse = await axios.get(
          `${API_BASE_URL}/api/test-files/stats?sprint_id=${selectedSprint.sprint_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setStats(statsResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch test files");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchTestFiles();
  }, [selectedSprint, user, isRefreshing]);

  // จัดการการเปลี่ยนเส้นทางและล้าง localStorage เมื่อออกจากหน้า test-files
  useEffect(() => {
    // ฟังก์ชั่นจัดการการเปลี่ยนเส้นทาง
    const handleRouteChange = () => {
      const currentPath = location.pathname;
      // ถ้าไม่ได้อยู่ในหน้าที่เกี่ยวกับ test files ให้เคลียร์ค่า
      if (!currentPath.includes("/test-files")) {
        clearStoredSelections();
      }
    };

    handleRouteChange();

    // Cleanup เมื่อ component unmounts
    return () => {
      // ล้างข้อมูลเมื่อนำทางออกจากเส้นทาง test-files
      if (!window.location.pathname.includes("/test-files")) {
        clearStoredSelections();
      }
    };
  }, []);

  // ฟังก์ชันนำทางที่จะล้าง localStorage เมื่อออกจาก test-files
  const navigateWithCleanup = (path) => {
    if (!path.includes("/test-files")) {
      clearStoredSelections();
    }
    navigate(path);
  };

  // จัดการการเลือกโปรเจกต์
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedSprint(null);
    localStorage.setItem(STORAGE_KEYS.PROJECT_ID, project.project_id);
    localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, project.name);
    localStorage.removeItem(STORAGE_KEYS.SPRINT_ID);
    localStorage.removeItem(STORAGE_KEYS.SPRINT_NAME);
    navigate(".", {
      replace: true,
      state: { selectedProjectId: project.project_id },
    });

    // ปิดเมนูบนมือถือหลังจากเลือกโปรเจกต์
    setIsMobileMenuOpen(false);
  };

  // จัดการการเลือกสปรินต์
  const handleSprintSelect = (sprint) => {
    setSelectedSprint(sprint);
    localStorage.setItem(STORAGE_KEYS.SPRINT_ID, sprint.sprint_id);
    localStorage.setItem(STORAGE_KEYS.SPRINT_NAME, sprint.name);
    navigate(".", {
      replace: true,
      state: {
        selectedProjectId: selectedProject.project_id,
        selectedSprintId: sprint.sprint_id,
      },
    });

    // ปิดเมนูบนมือถือหลังจากเลือกสปรินต์
    setIsMobileMenuOpen(false);
  };

  // จัดการการค้นหาไฟล์ทดสอบ
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  // จัดการการรีเฟรชข้อมูล
  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  // จัดการการกรองตามสถานะ
  const handleStatusFilter = (status) => {
    setStatusFilter(status);
  };

  // จัดการการเรียงลำดับ
  const handleSortOrder = (order) => {
    setSortOrder(order);
  };

  // นำทางไปยังหน้าสร้างไฟล์ทดสอบใหม่
  const handleCreateTestFile = () => {
    if (selectedSprint) {
      navigate(`/test-files/create/${selectedSprint.sprint_id}`);
    }
  };

  // สร้างไอคอนตามสถานะไฟล์ทดสอบ
  const getStatusIcon = (status) => {
    switch (status) {
      case "Pass":
        return <Check className="w-5 h-5 text-green-500" />;
      case "Fail":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  // กรองไฟล์ทดสอบตามคำค้นหาและสถานะ
  const filteredTestFiles = testFiles
    .filter(
      (file) =>
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (statusFilter === "all" ||
          file.status.toLowerCase() === statusFilter.toLowerCase())
    )
    .sort((a, b) => {
      if (sortOrder === "newest") {
        return new Date(b.upload_date) - new Date(a.upload_date);
      } else if (sortOrder === "oldest") {
        return new Date(a.upload_date) - new Date(b.upload_date);
      } else if (sortOrder === "name-asc") {
        return a.filename.localeCompare(b.filename);
      } else if (sortOrder === "name-desc") {
        return b.filename.localeCompare(a.filename);
      }
      return 0;
    });

  // สร้างแถบสถานะสี
  const getStatusBar = (status) => {
    const statusClasses = {
      Pass: "bg-green-500",
      Fail: "bg-red-500",
      Pending: "bg-yellow-500",
    };
    return (
      <div
        className={`absolute top-0 left-0 w-full h-1 ${
          statusClasses[status] || "bg-gray-300"
        }`}
      ></div>
    );
  };

  // แสดงวันที่แบบ relative
  const getRelativeTimeString = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return days === 1 ? "1 วันที่แล้ว" : `${days} วันที่แล้ว`;
    } else if (hours > 0) {
      return hours === 1 ? "1 ชั่วโมงที่แล้ว" : `${hours} ชั่วโมงที่แล้ว`;
    } else if (minutes > 0) {
      return minutes === 1 ? "1 นาทีที่แล้ว" : `${minutes} นาทีที่แล้ว`;
    } else {
      return seconds <= 10 ? "เมื่อสักครู่" : `${seconds} วินาทีที่แล้ว`;
    }
  };

  // แสดงจำนวนรายการที่กรองได้
  const showFilterResults = () => {
    if (filteredTestFiles.length === 0) return "ไม่พบรายการที่ตรงกับเงื่อนไข";
    return `พบ ${filteredTestFiles.length} รายการจากทั้งหมด ${testFiles.length} รายการ`;
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-3 sm:p-5 md:p-8"
      data-cy="test-files-page"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header section with mobile menu */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 mr-3 sm:mr-4 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              การจัดการไฟล์ทดสอบ
            </span>
          </h1>
        </div>

        {/* Mobile Menu */}
        <div
          className={`sm:hidden transition-all duration-500 overflow-hidden rounded-xl mb-6 ${
            isMobileMenuOpen
              ? "max-h-screen opacity-100 border-2 border-blue-100 shadow-lg"
              : "max-h-0 opacity-0"
          }`}
        >
          <div className="bg-white p-4 divide-y divide-blue-100">
            {selectedProject && (
              <div className="py-3">
                <p className="text-sm text-gray-500 mb-1">โปรเจกต์ที่เลือก</p>
                <div className="flex items-center bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <Puzzle className="w-5 h-5 text-blue-500 mr-2" />
                  <p className="font-medium text-blue-700">
                    {selectedProject.name}
                  </p>
                </div>
              </div>
            )}
            {selectedSprint && (
              <div className="py-3">
                <p className="text-sm text-gray-500 mb-1">สปรินต์ที่เลือก</p>
                <div className="flex items-center bg-green-50 p-3 rounded-lg border border-green-200">
                  <Zap className="w-5 h-5 text-green-500 mr-2" />
                  <p className="font-medium text-green-700">
                    {selectedSprint.name}
                  </p>
                </div>
              </div>
            )}
            {selectedSprint && (
              <div className="pt-3">
                <button
                  onClick={handleCreateTestFile}
                  data-cy="mobile-create-test-file-button"
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg hover:shadow-lg transform transition hover:scale-105"
                >
                  <Upload className="w-5 h-5" />
                  อัพโหลดไฟล์ทดสอบ
                </button>
              </div>
            )}
          </div>
        </div>

        {/* แสดงข้อผิดพลาด */}
        {error && (
          <div
            className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-md flex items-center"
            data-cy="error-message"
          >
            <AlertCircle className="text-red-500 mr-3 w-6 h-6" />
            <div>
              <p className="text-red-700 font-medium">เกิดข้อผิดพลาด</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* ส่วนเลือกโปรเจกต์ */}
        <div
          className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 transform transition-transform hover:translate-y-[-2px]"
          data-cy="project-selection-section"
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() =>
              setIsProjectSectionCollapsed(!isProjectSectionCollapsed)
            }
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-500" />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                เลือกโปรเจกต์
              </span>
            </h2>
            <div className="flex items-center space-x-2 text-gray-600">
              {selectedProject && (
                <span className="hidden md:inline text-sm text-blue-600 font-medium">
                  {selectedProject.name}
                </span>
              )}
              {isProjectSectionCollapsed ? (
                <ChevronDown className="w-5 h-5 text-blue-500" />
              ) : (
                <ChevronUp className="w-5 h-5 text-blue-500" />
              )}
            </div>
          </div>

          <div
            className={`transition-all duration-500 overflow-hidden ${
              isProjectSectionCollapsed
                ? "max-h-0 opacity-0 mt-0"
                : "max-h-screen opacity-100 mt-6"
            }`}
          >
            {loading && !projects.length ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">กำลังโหลดโปรเจกต์...</span>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {projects.map((project) => (
                  <div
                    key={project.project_id}
                    onClick={() => handleProjectSelect(project)}
                    data-cy={`project-card-${project.project_id}`}
                    className={`
                      cursor-pointer relative overflow-hidden
                      border-2 rounded-lg p-4 sm:p-5 
                      transition-all duration-300 
                      hover:shadow-lg transform hover:scale-[1.02]
                      ${
                        selectedProject?.project_id === project.project_id
                          ? "border-blue-500 bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-blue-300"
                      }
                    `}
                  >
                    {selectedProject?.project_id === project.project_id && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    )}
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 sm:mb-2">
                      {project.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3">
                      {project.description}
                    </p>
                    {selectedProject?.project_id === project.project_id && (
                      <span className="absolute bottom-2 right-3 text-xs font-medium py-1 px-2 bg-blue-100 text-blue-700 rounded-full">
                        ที่เลือก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <FolderX className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400 mb-3 sm:mb-4" />
                <p
                  className="text-lg sm:text-xl font-medium text-gray-700 mb-2"
                  data-cy="project-notfound-1"
                >
                  ไม่พบโปรเจกต์
                </p>
                <p
                  className="text-sm text-gray-500 text-center mb-4"
                  data-cy="project-notfound-2"
                >
                  คุณยังไม่ได้ทำการสร้างโปรเจกต์
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ส่วนแสดงสปรินต์ */}
        {selectedProject && (
          <div
            className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6 transform transition-transform hover:translate-y-[-2px]"
            data-cy="sprints-section"
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() =>
                setIsSprintSectionCollapsed(!isSprintSectionCollapsed)
              }
            >
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                <Target className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-green-500" />
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  เลือกสปรินต์ในโปรเจกต์ {selectedProject.name}
                </span>
              </h2>
              <div className="flex items-center space-x-2 text-gray-600">
                {selectedSprint && (
                  <span className="hidden md:inline text-sm text-green-600 font-medium">
                    {selectedSprint.name}
                  </span>
                )}
                {isSprintSectionCollapsed ? (
                  <ChevronDown className="w-5 h-5 text-green-500" />
                ) : (
                  <ChevronUp className="w-5 h-5 text-green-500" />
                )}
              </div>
            </div>

            <div
              className={`transition-all duration-500 overflow-hidden ${
                isSprintSectionCollapsed
                  ? "max-h-0 opacity-0 mt-0"
                  : "max-h-screen opacity-100 mt-6"
              }`}
            >
              {loading && !sprints.length ? (
                <div className="flex justify-center items-center p-8">
                  <RefreshCw className="w-8 h-8 text-green-500 animate-spin" />
                  <span className="ml-3 text-gray-600">
                    กำลังโหลดสปรินต์...
                  </span>
                </div>
              ) : sprints.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {sprints.map((sprint) => (
                    <div
                      key={sprint.sprint_id}
                      onClick={() => handleSprintSelect(sprint)}
                      data-cy={`sprint-item-${sprint.sprint_id}`}
                      className={`
                  cursor-pointer relative overflow-hidden
                  border-2 rounded-lg p-4 sm:p-5 
                  transition-all duration-300 
                  hover:shadow-lg transform hover:scale-[1.02]
                  ${
                    selectedSprint?.sprint_id === sprint.sprint_id
                      ? "border-green-500 bg-green-50 shadow-md"
                      : "border-gray-200 hover:border-green-300"
                  }
                `}
                    >
                      {selectedSprint?.sprint_id === sprint.sprint_id && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
                      )}
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                        {sprint.name}
                      </h3>
                      <div className="flex items-center text-xs sm:text-sm text-gray-600 mb-3">
                        <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-gray-500" />
                        <span className="text-xs sm:text-sm">
                          {new Date(sprint.start_date).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}{" "}
                          -{" "}
                          {new Date(sprint.end_date).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      {selectedSprint?.sprint_id === sprint.sprint_id && (
                        <span className="absolute bottom-2 right-3 text-xs font-medium py-1 px-2 bg-green-100 text-green-700 rounded-full">
                          ที่เลือก
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  data-cy="empty-sprints"
                >
                  <FolderX className="w-10 h-10 sm:w-14 sm:h-14 text-gray-400 mb-3 sm:mb-4" />
                  <h2 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">
                    ยังไม่มีสปรินต์ในโปรเจกต์นี้
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    สปรินต์จะปรากฏที่นี่เมื่อถูกสร้างขึ้น
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        {/* ส่วนแสดงไฟล์ทดสอบและสถิติ */}
        {selectedSprint && (
          <div className="space-y-4 sm:space-y-6">
            {/* แดชบอร์ดแสดงสถิติ */}
            <TestStatsDashboard
              testFiles={testFiles}
              isVisible={isDashboardVisible}
              onToggle={() => setIsDashboardVisible(!isDashboardVisible)}
              data-cy="test-stats-dashboard"
            />

            {/* ส่วนค้นหาและตัวกรองข้อมูล */}
            <div
              className="bg-white shadow-lg rounded-xl p-3 sm:p-4 md:p-6 transform transition-transform hover:translate-y-[-2px] relative z-10"
              data-cy="test-files-filter-section"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4 mb-3 md:mb-4">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 flex items-center">
                  <FileText className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-2 text-blue-600" />
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    ไฟล์ทดสอบของ {selectedSprint.name}
                  </span>
                </h2>

                {/* ปรับปรุงส่วนควบคุมให้มีขนาดและการจัดวางที่เหมาะสมทั้งบน tablet และ laptop */}
                <div className="flex flex-col sm:flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3 w-full md:w-auto">
                  {/* ส่วนของการค้นหาและตัวกรอง */}
                  <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {/* Search input */}
                    <div className="relative w-full sm:w-64 md:w-56 lg:w-64 xl:w-72">
                      <input
                        type="text"
                        placeholder="ค้นหาไฟล์ทดสอบ..."
                        value={searchTerm}
                        onChange={handleSearch}
                        data-cy="search-test-files"
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                      />
                      <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    </div>

                    {/* Filter dropdown */}
                    <div className="relative flex-grow sm:flex-grow-0 sm:w-40 md:w-40 lg:w-44 z-30">
                      <button
                        className="flex items-center justify-between gap-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors w-full text-sm min-h-[40px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown =
                            document.getElementById("sortOrderDropdown");
                          dropdown.classList.toggle("hidden");

                          const closeDropdown = () => {
                            dropdown.classList.add("hidden");
                            document.removeEventListener(
                              "click",
                              closeDropdown
                            );
                          };

                          setTimeout(() => {
                            document.addEventListener("click", closeDropdown);
                          }, 0);
                        }}
                        data-cy="sort-order-button"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowUpRight className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">
                            เรียง:{" "}
                            {sortOrder === "newest"
                              ? "ล่าสุด"
                              : sortOrder === "oldest"
                              ? "เก่าสุด"
                              : sortOrder === "name-asc"
                              ? "A-Z"
                              : "Z-A"}
                          </span>
                        </div>
                        <ChevronDown className="w-4 h-4 flex-shrink-0" />
                      </button>
                      <div
                        id="sortOrderDropdown"
                        className="hidden absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg py-1 right-0"
                        style={{ maxHeight: "200px", overflowY: "auto" }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleSortOrder("newest");
                            document
                              .getElementById("sortOrderDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            sortOrder === "newest"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="sort-newest"
                        >
                          ล่าสุด
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("oldest");
                            document
                              .getElementById("sortOrderDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            sortOrder === "oldest"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="sort-oldest"
                        >
                          เก่าสุด
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("name-asc");
                            document
                              .getElementById("sortOrderDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            sortOrder === "name-asc"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="sort-name-asc"
                        >
                          ชื่อ A-Z
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("name-desc");
                            document
                              .getElementById("sortOrderDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            sortOrder === "name-desc"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="sort-name-desc"
                        >
                          ชื่อ Z-A
                        </button>
                      </div>
                    </div>

                    {/* Refresh button */}
                    <button
                      onClick={handleRefresh}
                      className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center flex-shrink-0"
                      data-cy="refresh-test-files"
                    >
                      <RefreshCw
                        className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
                <p
                  className="text-xs sm:text-sm text-gray-600 w-full sm:w-auto text-center sm:text-left order-2 sm:order-1"
                  data-cy="filter-results-count"
                >
                  {showFilterResults()}
                </p>

                <button
                  onClick={handleCreateTestFile}
                  data-cy="create-test-file-button"
                  className="flex items-center justify-center gap-1 sm:gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:shadow-lg transform transition hover:scale-105 w-full sm:w-auto text-sm min-h-[40px] order-1 sm:order-2"
                >
                  <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                  อัพโหลดไฟล์ทดสอบ
                </button>
              </div>
            </div>

            {/* แสดงรายการไฟล์ทดสอบ */}
            {loading ? (
              <div
                className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center"
                data-cy="loading-test-files"
              >
                <RefreshCw className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <p className="text-center text-gray-600">
                  กำลังโหลดไฟล์ทดสอบ...
                </p>
              </div>
            ) : testFiles.length === 0 ? (
              <div
                className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center justify-center"
                data-cy="empty-test-files"
              >
                <FolderX className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl text-gray-600 mb-6 text-center">
                  ไม่พบไฟล์ทดสอบในสปรินต์นี้
                </p>
                <button
                  onClick={handleCreateTestFile}
                  data-cy="upload-first-test-file-button"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 text-base rounded-lg hover:shadow-lg transform transition hover:scale-105"
                >
                  อัพโหลดไฟล์ทดสอบไฟล์แรก
                </button>
              </div>
            ) : (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                data-cy="test-files-grid"
              >
                {filteredTestFiles.map((file) => (
                  <div
                    key={file.file_id}
                    data-cy={`test-file-${file.file_id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden relative hover:shadow-lg transition-all transform hover:translate-y-[-2px]"
                  >
                    {getStatusBar(file.status)}
                    <div className="p-4 sm:p-6">
                      <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 break-words pr-2">
                          {file.filename}
                        </h3>
                        <div
                          data-cy={`test-status-${file.status.toLowerCase()}`}
                          className={`flex-shrink-0 p-1.5 rounded-full ${
                            file.status === "Pass"
                              ? "bg-green-100"
                              : file.status === "Fail"
                              ? "bg-red-100"
                              : "bg-yellow-100"
                          }`}
                        >
                          {getStatusIcon(file.status)}
                        </div>
                      </div>

                      <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span className="text-xs sm:text-sm flex items-center">
                            <span>
                              {getRelativeTimeString(file.upload_date)}
                            </span>
                            <span className="mx-1">•</span>
                            <span className="text-gray-500 text-xs">
                              {new Date(file.upload_date).toLocaleDateString(
                                "th-TH",
                                {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                }
                              )}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 sm:mt-5 flex justify-between items-center">
                        <span
                          className={`
                    text-xs font-medium px-2 py-1 rounded-full
                    ${
                      file.status === "Pass"
                        ? "bg-green-100 text-green-700"
                        : file.status === "Fail"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700"
                    }
                  `}
                        >
                          {file.status === "Pass"
                            ? "ผ่านการทดสอบ"
                            : file.status === "Fail"
                            ? "ไม่ผ่านการทดสอบ"
                            : "รอดำเนินการ"}
                        </span>

                        <button
                          onClick={() =>
                            navigate(`/test-files/${file.file_id}`)
                          }
                          data-cy={`view-test-file-${file.file_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                        >
                          ดูรายละเอียด
                          <ArrowUpRight className="w-3 h-3 ml-1" />
                        </button>
                      </div>

                      <button
                        onClick={() => navigate(`/test-files/${file.file_id}`)}
                        data-cy={`view-detail-button-${file.file_id}`}
                        className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 text-sm rounded-lg hover:shadow-lg transform transition hover:scale-[1.02]"
                      >
                        ดูรายละเอียดเพิ่มเติม
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestFiles;
