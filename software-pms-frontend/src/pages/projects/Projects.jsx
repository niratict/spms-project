import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, FolderKanban } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// คอมโพเนนต์แสดงสถานะโปรเจกต์ด้วยป้ายสี
const ProjectStatusBadge = ({ status }) => {
  const statusColors = {
    Active: "bg-green-100 text-green-800 border-green-300",
    Completed: "bg-blue-500 text-white border-blue-300",
    "On Hold": "bg-gray-100 text-gray-800 border-gray-300",
  };

  // เพิ่มการแปลงสถานะเป็นภาษาไทย
  const statusTranslation = {
    Active: "กำลังดำเนินการ",
    Completed: "เสร็จสิ้น",
    "On Hold": "ระงับชั่วคราว",
  };

  return (
    <span
      data-cy="project-status-badge"
      className={`px-2 py-1 text-xs sm:px-3 sm:py-1 rounded-full font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {statusTranslation[status] || status}
    </span>
  );
};

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // ดึงข้อมูลโปรเจกต์ทั้งหมดจาก API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProjects();
  }, [user]);

  // นำทางไปยังหน้ารายละเอียดโปรเจกต์
  const handleViewDetails = (id) => {
    navigate(`/projects/${id}`);
  };

  // นำทางไปยังหน้าสร้างโปรเจกต์ใหม่
  const handleCreateProject = () => {
    navigate("/projects/create");
  };

  // แสดงตัวโหลดขณะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 sm:px-4 sm:py-3 rounded relative"
        role="alert"
        data-cy="error-message"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8"
      data-cy="projects-page"
    >
      <div className="container mx-auto max-w-7xl">
        {/* ส่วนหัวของหน้า */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center"
            data-cy="page-title"
          >
            <FolderKanban className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 sm:mr-3 md:mr-4 text-blue-600" />
            จัดการโปรเจกต์
          </h1>
          <button
            onClick={handleCreateProject}
            className="w-full sm:w-auto flex items-center justify-center bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
            data-cy="create-project-button"
          >
            <Plus className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            สร้างโปรเจกต์ใหม่
          </button>
        </div>

        {/* แสดงรายการโปรเจกต์ */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          data-cy="projects-grid"
        >
          {projects.map((project) => (
            <div
              key={project.project_id}
              className="bg-white shadow rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
              data-cy={`project-card-${project.project_id}`}
            >
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-start mb-3 sm:mb-4">
                  <h2
                    className="text-xl sm:text-2xl font-bold text-gray-800 line-clamp-1 break-words pr-2"
                    data-cy="project-name"
                  >
                    {project.name}
                  </h2>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <p
                  className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-1"
                  data-cy="project-description"
                >
                  {project.description}
                </p>

                <div className="flex justify-between space-x-2">
                  <button
                    onClick={() => handleViewDetails(project.project_id)}
                    className="flex-1 flex items-center justify-center bg-blue-500 text-white px-3 py-2 rounded text-sm sm:text-base hover:bg-blue-600 transition-colors"
                    data-cy="view-details-button"
                  >
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="truncate">ดูรายละเอียดเพิ่มเติม</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* แสดงเมื่อไม่มีโปรเจกต์ */}
        {projects.length === 0 && (
          <div
            className="flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
            data-cy="empty-projects"
          >
            <h2 className="text-xl sm:text-2xl text-gray-600 mb-2 sm:mb-4 text-center">
              ยังไม่มีการสร้างโปรเจกต์
            </h2>
            <p className="text-gray-500 mb-4 sm:mb-6 text-center text-sm sm:text-base">
              สร้างโปรเจกต์แรกเพื่อเริ่มต้น
            </p>
            <button
              onClick={handleCreateProject}
              className="bg-green-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg hover:bg-green-600 transition-colors text-sm sm:text-base"
              data-cy="create-first-project-button"
            >
              สร้างโปรเจกต์
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Projects;
