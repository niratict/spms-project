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
  Layers,
  Target,
  FolderX,
  BarChart2,
  Folder,
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

  // ฟังก์ชั่นลบข้อมูลที่เก็บใน localStorage
  const clearStoredSelections = () => {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  };

  // ดึงข้อมูลโปรเจกต์และจัดการการเลือกโปรเจกต์จาก state หรือ localStorage
  useEffect(() => {
    const fetchProjects = async () => {
      try {
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
          }
        };

        const projectId =
          location.state?.selectedProjectId ||
          localStorage.getItem(STORAGE_KEYS.PROJECT_ID);
        if (projectId) {
          handleSprintSelection(projectId);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
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
      }
    };

    fetchTestFiles();
  }, [selectedSprint, user]);

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
  }, []); // ลบ location.pathname dependency

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
  };

  // จัดการการค้นหาไฟล์ทดสอบ
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
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

  // กรองไฟล์ทดสอบตามคำค้นหา
  const filteredTestFiles = testFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-gray-50 min-h-screen p-8" data-cy="test-files-page">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <FileText  className="w-10 h-10 mr-4 text-blue-600" />
            การจัดการไฟล์ทดสอบ
          </h1>
        </div>

        {/* ส่วนเลือกโปรเจกต์ */}
        <div
          className="bg-white shadow-lg rounded-xl p-6 mb-6"
          data-cy="project-selection-section"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-3 text-blue-500" />
            เลือกโปรเจกต์
          </h2>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  onClick={() => handleProjectSelect(project)}
                  data-cy={`project-card-${project.project_id}`}
                  className={`
            cursor-pointer 
            border-2 rounded-lg p-5 
            transition-all duration-300 
            hover:shadow-lg
            ${
              selectedProject?.project_id === project.project_id
                ? "border-blue-500 bg-blue-50 shadow-md"
                : "border-gray-200 hover:border-blue-300"
            }
          `}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-1">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <FolderX className="w-12 h-12 text-gray-400 mb-3" />
              <p
                className="text-lg font-medium text-gray-700 mb-1"
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

        {/* ส่วนแสดงสปรินต์ */}
        {selectedProject && (
          <div
            className="bg-white shadow-lg rounded-xl p-6 mb-6"
            data-cy="sprints-section"
          >
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-green-500" />
              เลือกสปรินต์ในโปรเจกต์ {selectedProject.name}
            </h2>

            {sprints.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sprints.map((sprint) => (
                  <div
                    key={sprint.sprint_id}
                    onClick={() => handleSprintSelect(sprint)}
                    data-cy={`sprint-item-${sprint.sprint_id}`}
                    className={`
                 cursor-pointer 
                 border-2 rounded-lg p-5 
                 transition-all duration-300 
                 hover:shadow-lg
                 ${
                   selectedSprint?.sprint_id === sprint.sprint_id
                     ? "border-green-500 bg-green-50 shadow-md"
                     : "border-gray-200 hover:border-green-300"
                 }
               `}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {sprint.name}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      {new Date(sprint.start_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}{" "}
                      -{" "}
                      {new Date(sprint.end_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                data-cy="empty-sprints"
              >
                <h2 className=" text-gray-600 mb-4">
                  ยังไม่มีสปรินต์ในโปรเจกต์นี้
                </h2>
                <p className="text-gray-500">
                  สปรินต์จะปรากฏที่นี่เมื่อถูกสร้างขึ้น
                </p>
              </div>
            )}
          </div>
        )}

        {/* ส่วนแสดงไฟล์ทดสอบและสถิติ */}
        {selectedSprint && (
          <div className="space-y-6">
            {/* แดชบอร์ดแสดงสถิติ */}
            <TestStatsDashboard
              testFiles={testFiles}
              isVisible={isDashboardVisible}
              onToggle={() => setIsDashboardVisible(!isDashboardVisible)}
              data-cy="test-stats-dashboard"
            />

            {/* ส่วนหัวของรายการไฟล์ทดสอบ */}
            <div
              className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md"
              data-cy="test-files-header"
            >
              <h2 className="text-2xl font-bold text-gray-800">
                ไฟล์ทดสอบของ {selectedSprint.name}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ค้นหาไฟล์ทดสอบ..."
                    value={searchTerm}
                    onChange={handleSearch}
                    data-cy="search-test-files"
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-3 text-gray-400" />
                </div>
                <button
                  onClick={handleCreateTestFile}
                  data-cy="create-test-file-button"
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  อัพโหลดไฟล์ทดสอบ
                </button>
              </div>
            </div>

            {/* แสดงรายการไฟล์ทดสอบ */}
            {loading ? (
              <div
                className="text-center text-gray-600 py-12"
                data-cy="loading-test-files"
              >
                กำลังโหลดไฟล์ทดสอบ...
              </div>
            ) : testFiles.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                data-cy="empty-test-files"
              >
                <p className="text-gray-600 mb-6">ไม่พบไฟล์ทดสอบในสปรินต์นี้</p>
                <button
                  onClick={handleCreateTestFile}
                  data-cy="upload-first-test-file-button"
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  อัพโหลดไฟล์ทดสอบไฟล์แรก
                </button>
              </div>
            ) : (
              <div
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                data-cy="test-files-grid"
              >
                {filteredTestFiles.map((file) => (
                  <div
                    key={file.file_id}
                    data-cy={`test-file-${file.file_id}`}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {file.filename}
                        </h3>
                        <div
                          data-cy={`test-status-${file.status.toLowerCase()}`}
                        >
                          {getStatusIcon(file.status)}
                        </div>
                      </div>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(file.upload_date).toLocaleDateString(
                              "th-TH",
                              {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                              }
                            )}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/test-files/${file.file_id}`)}
                        data-cy={`view-test-file-${file.file_id}`}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
