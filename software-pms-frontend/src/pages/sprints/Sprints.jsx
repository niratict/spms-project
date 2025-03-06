import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Plus,
  Layers,
  Target,
  FolderX,
  FileText,
  BarChart2,
  FolderKanban,
  Timer,
} from "lucide-react";

// ค่าคงที่สำหรับ API URL
const API_BASE_URL = import.meta.env.VITE_API_URL;

const Sprints = () => {
  // ========== State และ Hooks ==========
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // สถานะของข้อมูลโปรเจกต์และสปรินต์
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ========== API และการโหลดข้อมูล ==========

  // ดึงข้อมูลโปรเจกต์ทั้งหมดและจัดการการเลือกโปรเจกต์
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);

        // กรณีมีการส่ง selectedProjectId มาจากหน้าอื่น
        if (location.state?.selectedProjectId) {
          const project = response.data.find(
            (p) => p.project_id === location.state.selectedProjectId
          );
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };

    if (user) fetchProjects();
  }, [user, location.state?.selectedProjectId]);

  // ดึงข้อมูลสปรินต์ของโปรเจกต์ที่เลือก
  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProject) {
        setSprints([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/sprints?project_id=${selectedProject.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setSprints(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprints");
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, [selectedProject, user]);

  // ========== Handler Functions ==========

  // จัดการเมื่อผู้ใช้เลือกโปรเจกต์
  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    navigate(".", { replace: true, state: {} });
  };

  // นำทางไปยังหน้าสร้างสปรินต์ใหม่
  const handleCreateSprint = () => {
    if (selectedProject) {
      navigate(`/sprints/create/${selectedProject.project_id}`);
    }
  };

  // ========== Helper Functions ==========

  // คำนวณสถิติของสปรินต์ (อัตราการผ่านเทสต์)
  const calculateSprintStats = (sprint) => {
    const totalTests = sprint.total_tests || 0;
    const passedTests = sprint.passed_tests || 0;
    const passRate =
      totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";

    return {
      totalTests,
      passedTests,
      passRate,
    };
  };

  // ========== Render UI ==========
  return (
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8"
      data-cy="sprints-page"
    >
      <div className="container mx-auto max-w-7xl">
        {/* หัวหน้าเพจ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
            <Timer className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 text-blue-600" />
            การจัดสปรินต์
          </h1>
        </div>

        {/* ส่วนเลือกโปรเจกต์ */}
        <div
          className="bg-white shadow-lg rounded-xl p-4 sm:p-6 mb-6"
          data-cy="project-selection-section"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center">
            <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-500" />
            เลือกโปรเจกต์
          </h2>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {projects.map((project) => (
                <div
                  key={project.project_id}
                  onClick={() => handleProjectSelect(project)}
                  data-cy={`project-card-${project.project_id}`}
                  className={`
                    cursor-pointer 
                    border-2 rounded-lg p-4 sm:p-5 
                    transition-all duration-300 
                    hover:shadow-lg
                    ${
                      selectedProject?.project_id === project.project_id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "border-gray-200 hover:border-blue-300"
                    }
                  `}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">
                    {project.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-1">
                    {project.description}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-4 sm:p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <FolderX className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 mb-2 sm:mb-3" />
              <p
                className="text-base sm:text-lg font-medium text-gray-700 mb-1"
                data-cy="project-notfound-1"
              >
                ไม่พบโปรเจกต์
              </p>
              <p
                className="text-xs sm:text-sm text-gray-500 text-center mb-3 sm:mb-4"
                data-cy="project-notfound-2"
              >
                คุณยังไม่ได้ทำการสร้างโปรเจกต์
              </p>
            </div>
          )}
        </div>

        {/* ส่วนแสดงสปรินต์ (แสดงเมื่อเลือกโปรเจกต์แล้ว) */}
        {selectedProject && (
          <div className="space-y-4 sm:space-y-6" data-cy="sprints-section">
            {/* ส่วนหัวของรายการสปรินต์ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 sm:p-6 rounded-xl shadow-md gap-4 sm:gap-0">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                สปรินต์ในโปรเจกต์ {selectedProject.name}
              </h2>
              <button
                onClick={handleCreateSprint}
                data-cy="create-sprint-button"
                className="flex items-center gap-2 bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base w-full sm:w-auto justify-center sm:justify-start"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                สร้าง Sprint (สปรินต์)
              </button>
            </div>

            {/* สถานะการโหลดข้อมูล */}
            {loading ? (
              <div
                className="text-center text-gray-600 py-8 sm:py-12"
                data-cy="sprints-loading"
              >
                กำลังโหลดสปรินต์...
              </div>
            ) : sprints.length === 0 ? (
              /* แสดงเมื่อไม่มีสปรินต์ */
              <div
                className="flex flex-col items-center justify-center p-4 sm:p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                data-cy="no-sprints-message"
              >
                <p className="text-gray-600 mb-4 sm:mb-6 text-center">
                  ไม่พบสปรินต์ในโปรเจกต์นี้
                </p>
                <button
                  onClick={handleCreateSprint}
                  data-cy="create-first-sprint-button"
                  className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 text-sm sm:text-base"
                >
                  เริ่มต้นสร้างสปรินต์แรก
                </button>
              </div>
            ) : (
              /* แสดงรายการสปรินต์ */
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
                data-cy="sprints-grid"
              >
                {sprints.map((sprint) => {
                  const { totalTests, passedTests, passRate } =
                    calculateSprintStats(sprint);

                  return (
                    <div
                      key={sprint.sprint_id}
                      data-cy={`sprint-card-${sprint.sprint_id}`}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="p-4 sm:p-6">
                        <div className="flex justify-between items-start mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                            {sprint.name}
                          </h3>
                        </div>

                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                            <span
                              className="truncate"
                              data-cy={`sprint-date-range-${sprint.sprint_id}`}
                            >
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
                        </div>

                        <button
                          onClick={() =>
                            navigate(`/sprints/${sprint.sprint_id}`)
                          }
                          data-cy={`view-sprint-details-${sprint.sprint_id}`}
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm"
                        >
                          ดูรายละเอียดเพิ่มเติม
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* แสดงข้อความผิดพลาด */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
            <p className="text-sm">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sprints;
