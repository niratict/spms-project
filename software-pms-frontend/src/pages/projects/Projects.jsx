import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, Plus } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProjectStatusBadge = ({ status }) => {
  const statusColors = {
    Active: "bg-green-100 text-green-800",
    Completed: "bg-blue-100 text-blue-800",
    Pending: "bg-yellow-100 text-yellow-800",
    "On Hold": "bg-gray-100 text-gray-800",
  };

  return (
    <span
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

  const handleViewDetails = (id) => {
    navigate(`/projects/${id}`);
  };

  const handleCreateProject = () => {
    navigate("/projects/create");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative"
        role="alert"
      >
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">จัดการโปรเจกต์</h1>
          <button
            onClick={handleCreateProject}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
          >
            <Plus className="mr-2" />
            สร้างโปรเจกต์ใหม่
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.project_id}
              className="bg-white shadow-lg rounded-xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 line-clamp-1">
                    {project.name}
                  </h2>
                  <ProjectStatusBadge status={project.status} />
                </div>

                <p className="text-gray-600 mb-4 line-clamp-1">
                  {project.description}
                </p>

                <div className="flex justify-between space-x-2">
                  <button
                    onClick={() => handleViewDetails(project.project_id)}
                    className="flex-1 flex items-center justify-center bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-5 h-5 mr-2" />
                    ดูรายละเอียดเพิ่มเติม
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-2xl text-gray-600 mb-4">
              ยังไม่มีการสร้างโปรเจกต์
            </h2>
            <p className="text-gray-500 mb-6">สร้างโปรเจกต์แรกเพื่อเริ่มต้น</p>
            <button
              onClick={handleCreateProject}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors"
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
