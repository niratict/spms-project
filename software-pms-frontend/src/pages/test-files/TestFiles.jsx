import React, { useState, useEffect, useRef } from "react";
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
  Puzzle,
  FolderX,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowUpRight,
  FolderKanban,
  Timer,
  AlertCircle,
  Zap,
  Filter,
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

  const fileSectionRef = useRef(null);

  useEffect(() => {
    if (location.state?.scrollToFileSection && fileSectionRef.current) {
      // ลองใช้วิธีอื่นในการเลื่อน
      window.scrollTo({
        top: fileSectionRef.current.offsetTop - 100, // ลบระยะห่างด้านบนออก 100px
        behavior: "smooth",
      });
    }
  }, [location]);

  // Core state
  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [testFiles, setTestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [isDashboardVisible, setIsDashboardVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProjectSectionCollapsed, setIsProjectSectionCollapsed] =
    useState(true);
  const [isSprintSectionCollapsed, setIsSprintSectionCollapsed] =
    useState(true);
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Clear localStorage data when navigating away
  const clearStoredSelections = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  // Handle navigation with cleanup
  const navigateWithCleanup = (path) => {
    if (!path.includes("/test-files")) {
      clearStoredSelections();
    }
    navigate(path);
  };

  // Fetch projects and handle selection from state or localStorage
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);

        // First check location state, then localStorage
        let projectToSelect = null;

        if (location.state?.selectedProjectId) {
          projectToSelect = response.data.find(
            (p) => p.project_id === location.state.selectedProjectId
          );
        } else {
          const savedProjectId = localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
          if (savedProjectId) {
            projectToSelect = response.data.find(
              (p) => p.project_id === parseInt(savedProjectId)
            );
          }
        }

        if (projectToSelect) {
          setSelectedProject(projectToSelect);
          localStorage.setItem(
            STORAGE_KEYS.PROJECT_ID,
            projectToSelect.project_id
          );
          localStorage.setItem(STORAGE_KEYS.PROJECT_NAME, projectToSelect.name);

          // Fetch sprints for selected project
          await fetchSprintsForProject(projectToSelect.project_id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
        setLoading(false);
      }
    };

    fetchProjects();
  }, [user, location.state?.selectedProjectId]);

  // Fetch sprints for a project
  const fetchSprintsForProject = async (projectId) => {
    try {
      const sprintResponse = await axios.get(
        `${API_BASE_URL}/api/sprints?project_id=${projectId}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setSprints(sprintResponse.data);

      // Handle sprint selection from state or localStorage
      let sprintToSelect = null;

      if (location.state?.selectedSprintId) {
        sprintToSelect = sprintResponse.data.find(
          (s) => s.sprint_id === location.state.selectedSprintId
        );
      } else {
        const savedSprintId = localStorage.getItem(STORAGE_KEYS.SPRINT_ID);
        if (savedSprintId) {
          sprintToSelect = sprintResponse.data.find(
            (s) => s.sprint_id === parseInt(savedSprintId)
          );
        }
      }

      if (sprintToSelect) {
        setSelectedSprint(sprintToSelect);
        localStorage.setItem(STORAGE_KEYS.SPRINT_ID, sprintToSelect.sprint_id);
        localStorage.setItem(STORAGE_KEYS.SPRINT_NAME, sprintToSelect.name);
      }
    } catch (err) {
      console.error("Failed to fetch sprints:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch test files when sprint selection changes
  useEffect(() => {
    const fetchTestFiles = async () => {
      if (!selectedSprint) {
        setTestFiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Fetch test files for selected sprint
        const response = await axios.get(
          `${API_BASE_URL}/api/test-files?sprint_id=${selectedSprint.sprint_id}`,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        setTestFiles(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch test files");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    fetchTestFiles();
  }, [selectedSprint, user, isRefreshing]);

  // Clear localStorage when navigating away
  useEffect(() => {
    const handleRouteChange = () => {
      if (!location.pathname.includes("/test-files")) {
        clearStoredSelections();
      }
    };

    handleRouteChange();

    return () => {
      if (!window.location.pathname.includes("/test-files")) {
        clearStoredSelections();
      }
    };
  }, [location.pathname]);

  // Event handlers
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

    fetchSprintsForProject(project.project_id);
  };

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
  };

  const handleCreateTestFile = () => {
    if (selectedSprint) {
      navigate(`/test-files/create/${selectedSprint.sprint_id}`);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setIsStatusDropdownOpen(false);
  };

  const handleSortOrder = (order) => {
    setSortOrder(order);
    setIsSortDropdownOpen(false);
  };

  // Utility functions
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

  const getStatusColor = (status) => {
    switch (status) {
      case "Pass":
        return "bg-green-500";
      case "Fail":
        return "bg-red-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getRelativeTime = (dateString) => {
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

  // Filter and sort test files
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

  // Format file size to KB
  const formatFileSize = (bytes) => {
    return (bytes / 1024).toFixed(2) + " KB";
  };

  // Show filter results count
  const showFilterCount = () => {
    if (filteredTestFiles.length === 0) return "ไม่พบรายการที่ตรงกับเงื่อนไข";
    return `พบ ${filteredTestFiles.length} รายการ จากทั้งหมด ${testFiles.length} รายการ`;
  };

  return (
    <div
      className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6 lg:p-8"
      data-cy="test-files-page"
    >
      <div className="container mx-auto max-w-7xl">
        {/* Page header */}
        <header className="mb-3 md:mb-6">
          <h1 className="text-lg md:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 md:w-8 md:h-8 mr-2 md:mr-3 text-blue-600" />
            <span className="bg-black bg-clip-text text-transparent">
              การจัดการไฟล์ทดสอบ
            </span>
          </h1>
        </header>

        {/* Error message */}
        {error && (
          <div
            className="mb-3 md:mb-5 bg-red-50 border-l-4 border-red-500 p-2.5 md:p-4 rounded-lg shadow flex items-center"
            data-cy="error-message"
          >
            <AlertCircle className="text-red-500 mr-2 md:mr-3 w-5 h-5 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium text-sm md:text-base">เกิดข้อผิดพลาด</p>
              <p className="text-red-600 text-xs md:text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Project selection */}
        <section
          className="bg-white shadow rounded-xl p-3 sm:p-4 md:p-5 mb-3 md:mb-4 transition-all hover:shadow-md"
          data-cy="project-selection-section"
        >
          <div
            className="flex justify-between items-center cursor-pointer"
            onClick={() =>
              setIsProjectSectionCollapsed(!isProjectSectionCollapsed)
            }
          >
            <h2 className="text-base md:text-xl font-bold text-gray-800 flex items-center">
              <FolderKanban className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 text-blue-500" />
              <span>เลือกโปรเจกต์</span>
            </h2>
            <div className="flex items-center gap-2">
              {selectedProject && (
                <span className="hidden md:inline text-sm text-blue-600 font-medium">
                  {selectedProject.name}
                </span>
              )}
              {isProjectSectionCollapsed ? (
                <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              ) : (
                <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
              )}
            </div>
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              isProjectSectionCollapsed
                ? "max-h-0 opacity-0 mt-0"
                : "max-h-screen opacity-100 mt-4"
            }`}
          >
            {loading && !projects.length ? (
              <div className="flex justify-center items-center p-8">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                <span className="ml-3 text-gray-600">กำลังโหลดโปรเจกต์...</span>
              </div>
            ) : projects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-0.5">
                {projects.map((project) => (
                  <div
                    key={project.project_id}
                    onClick={() => {
                      // Toggle selection when clicking on the same project
                      if (selectedProject?.project_id === project.project_id) {
                        handleProjectSelect(null); // Deselect project
                      } else {
                        handleProjectSelect(project); // Select new project
                      }
                    }}
                    data-cy={`project-card-${project.project_id}`}
                    className={`
              cursor-pointer relative
              border-2 rounded-lg p-4
              transition-all duration-200 
              hover:shadow-md hover:scale-[1.01] hover:z-20
              ${
                selectedProject?.project_id === project.project_id
                  ? "border-blue-500 bg-blue-50 shadow"
                  : "border-gray-200 hover:border-blue-300"
              }
            `}
                  >
                    {selectedProject?.project_id === project.project_id && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                    )}
                    <h3 className="text-base font-semibold text-gray-800 mb-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-1 mb-2">
                      {project.description || "ไม่มีคำอธิบาย"}
                    </p>
                    {selectedProject?.project_id === project.project_id && (
                      <span className="absolute bottom-2 right-2 text-xs font-medium py-1 px-2 bg-blue-100 text-blue-700 rounded-full">
                        ที่เลือก
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                <FolderX className="w-12 h-12 text-gray-400 mb-3" />
                <p
                  className="text-lg font-medium text-gray-700 mb-2"
                  data-cy="project-notfound-1"
                >
                  ไม่พบโปรเจกต์
                </p>
                <p
                  className="text-sm text-gray-500 text-center"
                  data-cy="project-notfound-2"
                >
                  คุณยังไม่ได้ทำการสร้างโปรเจกต์
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Sprint selection */}
        {selectedProject && (
          <section
            className="bg-white shadow rounded-xl p-3 sm:p-4 md:p-5 mb-3 md:mb-4 transition-all hover:shadow-md"
            data-cy="sprints-section"
          >
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() =>
                setIsSprintSectionCollapsed(!isSprintSectionCollapsed)
              }
            >
              <h2 className="text-base md:text-xl font-bold text-gray-800 flex items-center">
                <Timer className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 text-green-500" />
                <span className="truncate">เลือกสปรินต์ในโปรเจกต์ {selectedProject.name}</span>
              </h2>
              <div className="flex items-center gap-2">
                {selectedSprint && (
                  <span className="hidden md:inline text-sm text-green-600 font-medium">
                    {selectedSprint.name}
                  </span>
                )}
                {isSprintSectionCollapsed ? (
                  <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                ) : (
                  <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-green-500" />
                )}
              </div>
            </div>

            <div
              className={`transition-all duration-300 overflow-hidden ${
                isSprintSectionCollapsed
                  ? "max-h-0 opacity-0 mt-0"
                  : "max-h-screen opacity-100 mt-4"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-0.5">
                  {sprints.map((sprint) => (
                    <div
                      key={sprint.sprint_id}
                      onClick={() => {
                        // Toggle selection when clicking on the same sprint
                        if (selectedSprint?.sprint_id === sprint.sprint_id) {
                          handleSprintSelect(null); // Deselect sprint
                        } else {
                          handleSprintSelect(sprint); // Select new sprint
                        }
                      }}
                      data-cy={`sprint-item-${sprint.sprint_id}`}
                      className={`
                cursor-pointer relative
                border-2 rounded-lg p-2 sm:p-4
                transition-all duration-200
                hover:shadow-md hover:scale-[1.01] hover:z-20
                ${
                  selectedSprint?.sprint_id === sprint.sprint_id
                    ? "border-green-500 bg-green-50 shadow"
                    : "border-gray-200 hover:border-green-300"
                }
              `}
                    >
                      {selectedSprint?.sprint_id === sprint.sprint_id && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-teal-500"></div>
                      )}
                      <h3 className="text-base font-semibold text-gray-800 mb-2">
                        {sprint.name}
                      </h3>
                      <div className="flex items-center text-xs text-gray-600 mb-2">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                        <span>
                          {new Date(sprint.start_date).toLocaleDateString(
                            "th-TH",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                          {" - "}
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
                        <span className="absolute bottom-2 right-2 text-xs font-medium py-1 px-2 bg-green-100 text-green-700 rounded-full">
                          ที่เลือก
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  data-cy="empty-sprints"
                >
                  <FolderX className="w-12 h-12 text-gray-400 mb-3" />
                  <h2 className="text-lg font-medium text-gray-700 mb-2">
                    ยังไม่มีสปรินต์ในโปรเจกต์นี้
                  </h2>
                  <p className="text-sm text-gray-500 text-center">
                    สปรินต์จะปรากฏที่นี่เมื่อถูกสร้างขึ้น
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Test files section */}
        {selectedSprint && (
          <div className="space-y-3 md:space-y-5">
            {/* Dashboard */}
            <TestStatsDashboard
              testFiles={testFiles}
              isVisible={isDashboardVisible}
              onToggle={() => setIsDashboardVisible(!isDashboardVisible)}
              data-cy="test-stats-dashboard"
            />

            {/* Test files search and filters */}
            <section
              className="bg-white shadow rounded-xl p-3 sm:p-4 md:p-5 transition-all hover:shadow-md"
              data-cy="test-files-filter-section"
              ref={fileSectionRef}
            >
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <h2 className="text-base md:text-xl font-bold text-gray-800 flex items-center">
                  <FileText className="w-4 h-4 md:w-5 md:h-5 mr-1.5 md:mr-2 text-blue-600" />
                  <span className="truncate text-sm md:text-base">
                    ไฟล์ทดสอบของ {selectedSprint.name}
                  </span>
                </h2>
              </div>

              {/* Search and filter section */}
              <div className="mb-3">
                {/* Desktop Layout - แสดงเฉพาะบนจอขนาดกลางขึ้นไป */}
                <div className="hidden md:flex md:flex-row md:items-center md:space-x-2">
                  {/* Search input */}
                  <div className="relative w-full md:mb-0 md:flex-1">
                    <input
                      type="text"
                      placeholder="ค้นหาไฟล์ทดสอบ..."
                      value={searchTerm}
                      onChange={handleSearch}
                      data-cy="search-test-files"
                      className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  </div>

                  {/* Filter Controls on desktop: horizontal layout */}
                  <div className="flex items-center space-x-2">
                    {/* Status Filter Dropdown */}
                    <div className="relative z-30">
                      <button
                        className="flex items-center justify-between bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm h-10 min-w-[110px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown = document.getElementById("statusDropdown");
                          dropdown.classList.toggle("hidden");

                          const closeDropdown = () => {
                            dropdown.classList.add("hidden");
                            document.removeEventListener("click", closeDropdown);
                          };

                          setTimeout(() => {
                            document.addEventListener("click", closeDropdown);
                          }, 0);
                        }}
                        data-cy="status-filter-button"
                      >
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4" />
                          <span>
                            {statusFilter === "all"
                              ? "ทั้งหมด"
                              : statusFilter === "pass"
                              ? "ผ่าน"
                              : statusFilter === "fail"
                              ? "ไม่ผ่าน"
                              : "รอดำเนินการ"}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </button>
                      <div
                        id="statusDropdown"
                        className="hidden absolute z-50 mt-1 w-40 bg-white border rounded-lg shadow-lg py-1 left-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleStatusFilter("all");
                            document
                              .getElementById("statusDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "all"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="filter-all"
                        >
                          ทั้งหมด
                        </button>
                        <button
                          onClick={() => {
                            handleStatusFilter("pass");
                            document
                              .getElementById("statusDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "pass"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="filter-pass"
                        >
                          ผ่าน
                        </button>
                        <button
                          onClick={() => {
                            handleStatusFilter("fail");
                            document
                              .getElementById("statusDropdown")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "fail"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          data-cy="filter-fail"
                        >
                          ไม่ผ่าน
                        </button>
                      </div>
                    </div>

                    {/* Sort order */}
                    <div className="relative">
                      <button
                        className="flex items-center justify-between bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm h-10 min-w-[110px]"
                        onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                        data-cy="sort-order-button"
                      >
                        <div className="flex items-center gap-1.5">
                          <ArrowUpRight className="w-4 h-4" />
                          <span>
                            {sortOrder === "newest"
                              ? "ล่าสุด"
                              : sortOrder === "oldest"
                              ? "เก่าสุด"
                              : sortOrder === "name-asc"
                              ? "A-Z"
                              : "Z-A"}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </button>

                      {isSortDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-44 bg-white border rounded-lg shadow-lg py-1 left-0">
                          <button
                            onClick={() => handleSortOrder("newest")}
                            className={`block w-full text-left px-3 py-2 text-sm ${
                              sortOrder === "newest"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            data-cy="sort-newest"
                          >
                            ล่าสุด
                          </button>
                          <button
                            onClick={() => handleSortOrder("oldest")}
                            className={`block w-full text-left px-3 py-2 text-sm ${
                              sortOrder === "oldest"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            data-cy="sort-oldest"
                          >
                            เก่าสุด
                          </button>
                          <button
                            onClick={() => handleSortOrder("name-asc")}
                            className={`block w-full text-left px-3 py-2 text-sm ${
                              sortOrder === "name-asc"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            data-cy="sort-name-asc"
                          >
                            ชื่อ A-Z
                          </button>
                          <button
                            onClick={() => handleSortOrder("name-desc")}
                            className={`block w-full text-left px-3 py-2 text-sm ${
                              sortOrder === "name-desc"
                                ? "bg-blue-50 text-blue-600"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                            data-cy="sort-name-desc"
                          >
                            ชื่อ Z-A
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Refresh button */}
                    <button
                      onClick={handleRefresh}
                      className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors h-10 w-10 flex items-center justify-center"
                      data-cy="refresh-test-files"
                      title="รีเฟรชข้อมูล"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </button>

                    {/* Upload button */}
                    <button
                      onClick={handleCreateTestFile}
                      data-cy="create-test-file-button"
                      className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg hover:shadow-md transition-all text-sm h-10"
                    >
                      <Upload className="w-4 h-4" />
                      อัปโหลดไฟล์ทดสอบ
                    </button>
                  </div>
                </div>

                {/* Mobile Layout - only show on mobile screens */}
                <div className="block md:hidden">
                  {/* Search input */}
                  <div className="relative w-full mb-2.5">
                    <input
                      type="text"
                      placeholder="ค้นหาไฟล์ทดสอบ..."
                      value={searchTerm}
                      onChange={handleSearch}
                      className="w-full pl-9 pr-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 transition-shadow"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                  </div>

                  <div className="flex mt-2.5 flex-wrap gap-2">
                    {/* Status Filter Dropdown */}
                    <div className="relative z-30 flex-1">
                      <button
                        className="flex w-full items-center justify-between bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm h-10"
                        onClick={(e) => {
                          e.stopPropagation();
                          const dropdown = document.getElementById("statusDropdownMobile");
                          dropdown.classList.toggle("hidden");

                          const closeDropdown = () => {
                            dropdown.classList.add("hidden");
                            document.removeEventListener("click", closeDropdown);
                          };

                          setTimeout(() => {
                            document.addEventListener("click", closeDropdown);
                          }, 0);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Filter className="w-4 h-4" />
                          <span>
                            {statusFilter === "all"
                              ? "ทั้งหมด"
                              : statusFilter === "pass"
                              ? "ผ่าน"
                              : statusFilter === "fail"
                              ? "ไม่ผ่าน"
                              : "รอดำเนินการ"}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </button>
                      <div
                        id="statusDropdownMobile"
                        className="hidden absolute z-50 mt-1 w-full bg-white border rounded-lg shadow-lg py-1 left-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            handleStatusFilter("all");
                            document
                              .getElementById("statusDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "all"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ทั้งหมด
                        </button>
                        <button
                          onClick={() => {
                            handleStatusFilter("pass");
                            document
                              .getElementById("statusDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "pass"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ผ่าน
                        </button>
                        <button
                          onClick={() => {
                            handleStatusFilter("fail");
                            document
                              .getElementById("statusDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            statusFilter === "fail"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ไม่ผ่าน
                        </button>
                      </div>
                    </div>

                    {/* Sort order - Mobile */}
                    <div className="relative flex-1">
                      <button
                        className="flex w-full items-center justify-between bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm h-10"
                        onClick={() => {
                          const dropdown = document.getElementById("sortDropdownMobile");
                          dropdown.classList.toggle("hidden");

                          const closeDropdown = () => {
                            dropdown.classList.add("hidden");
                            document.removeEventListener("click", closeDropdown);
                          };

                          setTimeout(() => {
                            document.addEventListener("click", closeDropdown);
                          }, 0);
                        }}
                      >
                        <div className="flex items-center gap-1.5">
                          <ArrowUpRight className="w-4 h-4" />
                          <span>
                            {sortOrder === "newest"
                              ? "ล่าสุด"
                              : sortOrder === "oldest"
                              ? "เก่าสุด"
                              : sortOrder === "name-asc"
                              ? "A-Z"
                              : "Z-A"}
                          </span>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 ml-1" />
                      </button>
                      <div
                        id="sortDropdownMobile"
                        className="hidden absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg py-1 left-0"
                      >
                        <button
                          onClick={() => {
                            handleSortOrder("newest");
                            document
                              .getElementById("sortDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            sortOrder === "newest"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ล่าสุด
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("oldest");
                            document
                              .getElementById("sortDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            sortOrder === "oldest"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          เก่าสุด
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("name-asc");
                            document
                              .getElementById("sortDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            sortOrder === "name-asc"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ชื่อ A-Z
                        </button>
                        <button
                          onClick={() => {
                            handleSortOrder("name-desc");
                            document
                              .getElementById("sortDropdownMobile")
                              .classList.add("hidden");
                          }}
                          className={`block w-full text-left px-3 py-2 text-sm ${
                            sortOrder === "name-desc"
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          ชื่อ Z-A
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center gap-2 mt-2.5">
                    {/* Refresh button - Mobile */}
                    <button
                      onClick={handleRefresh}
                      className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition-colors h-10 w-10 flex items-center justify-center"
                      title="รีเฟรชข้อมูล"
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${
                          isRefreshing ? "animate-spin" : ""
                        }`}
                      />
                    </button>

                    {/* Upload button - Mobile */}
                    <button
                      onClick={handleCreateTestFile}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-3 py-2 rounded-lg hover:shadow-md transition-all text-sm h-10"
                    >
                      <Upload className="w-4 h-4" />
                      อัปโหลดไฟล์ทดสอบ
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter results count */}
              <p
                className="text-xs text-gray-600"
                data-cy="filter-results-count"
              >
                {showFilterCount()}
              </p>
            </section>

            {/* Test files list */}
            <section
              className="bg-white shadow rounded-xl p-3 sm:p-4 md:p-5 transition-all hover:shadow-md"
              data-cy="test-files-list-section"
            >
              {loading ? (
                <div className="flex flex-col items-center justify-center p-6 md:p-8">
                  <RefreshCw className="w-10 h-10 md:w-12 md:h-12 text-blue-500 animate-spin mb-3 md:mb-4" />
                  <p className="text-center text-gray-600 text-sm md:text-base">
                    กำลังโหลดไฟล์ทดสอบ...
                  </p>
                </div>
              ) : testFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 md:p-5">
                  <FolderX className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mb-2 md:mb-3" />
                  <p className="text-base md:text-lg text-gray-600 mb-3 md:mb-4 text-center">
                    ไม่พบไฟล์ทดสอบในสปรินต์นี้
                  </p>
                  <button
                    onClick={handleCreateTestFile}
                    data-cy="upload-first-test-file-button"
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    อัปโหลดไฟล์ทดสอบไฟล์แรก
                  </button>
                </div>
              ) : filteredTestFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-4 md:p-5" data-cy="no-matching-files">
                  <Search className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mb-2 md:mb-3" />
                  <p className="text-base md:text-lg text-gray-600 mb-2 text-center">
                    ไม่พบไฟล์ทดสอบที่ตรงกับเงื่อนไข
                  </p>
                  <p className="text-xs md:text-sm text-gray-500 mb-3 md:mb-4 text-center">
                    ลองเปลี่ยนการค้นหาหรือตัวกรองของคุณ
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                    }}
                    data-cy="reset-filters-button"
                    className="bg-gray-200 text-gray-800 px-4 md:px-5 py-1.5 md:py-2 text-xs md:text-sm rounded-lg hover:bg-gray-300 transition-all duration-200"
                  >
                    ล้างตัวกรองทั้งหมด
                  </button>
                </div>
              ) : (
                <div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
                  data-cy="test-files-grid"
                >
                  {filteredTestFiles.map((file) => (
                    <div
                      key={file.file_id}
                      data-cy={`test-file-${file.file_id}`}
                      className="border rounded-lg sm:rounded-xl overflow-hidden relative hover:shadow-lg transition-all transform hover:translate-y-[-2px]"
                    >
                      <div
                        className={`h-1 w-full ${getStatusColor(file.status)}`}
                      ></div>
                      <div className="p-2.5 sm:p-4">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 break-words pr-2 line-clamp-2">
                            {file.filename}
                          </h3>
                          <div
                            data-cy={`test-status-${file.status.toLowerCase()}`}
                            className={`flex-shrink-0 p-1 sm:p-1.5 rounded-full ${
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

                        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>{formatFileSize(file.file_size)}</span>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="text-xs sm:text-sm flex flex-wrap items-center">
                              <span>{getRelativeTime(file.upload_date)}</span>
                              <span className="mx-1">•</span>
                              <span className="text-gray-500 text-xs">
                                {new Date(file.upload_date).toLocaleString(
                                  "th-TH",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: false,
                                  }
                                )}
                              </span>
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            navigate(`/test-files/${file.file_id}`)
                          }
                          data-cy={`view-detail-button-${file.file_id}`}
                          className="mt-2 sm:mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 text-xs sm:text-sm rounded-lg hover:shadow-lg transform transition hover:scale-[1.02]"
                        >
                          ดูรายละเอียดเพิ่มเติม
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestFiles;
