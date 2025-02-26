import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, Plus, FolderKanban } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// คอมโพเนนต์แสดงสถานะโปรเจกต์ด้วยป้ายสี
const ProjectStatusBadge = ({ status }) => {
  const statusColors = {
    Active: "bg-green-100 text-green-800",
    Completed: "bg-blue-100 text-blue-800",
    Pending: "bg-yellow-100 text-yellow-800",
    "On Hold": "bg-gray-100 text-gray-800",
  };

  return (
    <span
      data-cy="project-status-badge"
      className={`px-3 py-1 rounded-full text-xs font-medium ${
        statusColors[status] || "bg-gray-100 text-gray-800"
      }`}
    >
      {status}
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
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative"
        role="alert"
        data-cy="error-message"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-cy="projects-page">
      <div className="container mx-auto max-w-7xl">
        {/* ส่วนหัวของหน้า */}
        <div className="flex justify-between items-center mb-8">
          <h1
            className="text-3xl font-bold text-gray-900 flex items-center"
            data-cy="page-title"
          >
            <FolderKanban className="w-10 h-10 mr-4 text-blue-600" />
            จัดการโปรเจกต์
          </h1>
          <button
            onClick={handleCreateProject}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
            data-cy="create-project-button"
          >
            <Plus className="mr-2" />
            สร้างโปรเจกต์ใหม่
          </button>
        </div>

        {/* แสดงรายการโปรเจกต์ */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          data-cy="projects-grid"
        >
          {projects.map((project) => (
            <div
              key={project.project_id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
              data-cy={`project-card-${project.project_id}`}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2
                    className="text-2xl font-bold text-gray-800 line-clamp-1"
                    data-cy="project-name"
                  >
                    {project.name}
                  </h2>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <p
                  className="text-gray-600 mb-4 line-clamp-1"
                  data-cy="project-description"
                >
                  {project.description}
                </p>

                <div className="flex justify-between space-x-2">
                  <button
                    onClick={() => handleViewDetails(project.project_id)}
                    className="flex-1 flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                    data-cy="view-details-button"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    ดูรายละเอียดเพิ่มเติม
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* แสดงเมื่อไม่มีโปรเจกต์ */}
        {projects.length === 0 && (
          <div
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
            data-cy="empty-projects"
          >
            <h2 className="text-2xl text-gray-600 mb-4">
              ยังไม่มีการสร้างโปรเจกต์
            </h2>
            <p className="text-gray-500 mb-6">สร้างโปรเจกต์แรกเพื่อเริ่มต้น</p>
            <button
              onClick={handleCreateProject}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
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
