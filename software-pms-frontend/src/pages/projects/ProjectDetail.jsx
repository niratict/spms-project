import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  Users,
  Activity,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="text-center">
          <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Delete Project
          </h2>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this project? This action cannot be
            undone and will remove all associated data.
          </p>
        </div>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProject(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch project details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchProject();
  }, [id, user]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/projects");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete project");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg text-center">
        {error}
      </div>
    );

  if (!project)
    return (
      <div className="text-center p-6 bg-gray-100 rounded-lg">
        Project not found
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      <button
        onClick={() => navigate("/projects")}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </button>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
            <div className="flex space-x-3">
              <button
                onClick={() => navigate(`/projects/${id}/edit`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Edit className="w-5 h-5" />
                Edit Project
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Description ส่วนบน */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Description
            </h2>
            <p className="text-gray-600">{project.description}</p>
          </div>

          {/* รูปภาพและข้อมูล Project */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* คอลัมน์ซ้าย - รูปภาพ */}
            <div>
              {project.photo ? (
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                  <img
                    src={`${API_BASE_URL}/api/uploads/projects/${project.photo}`}
                    alt={project.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.png";
                    }}
                  />
                </div>
              ) : (
                <div className="aspect-video w-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <p className="text-gray-400">No image available</p>
                </div>
              )}
            </div>

            {/* คอลัมน์ขวา - ข้อมูล Project */}
            <div className="grid grid-cols-1 gap-4 content-start">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-semibold">
                    {new Date(project.start_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="font-semibold">
                    {new Date(project.end_date).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Activity className="w-6 h-6 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Status</div>
                  <div className="font-semibold">{project.status}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-600">Created By</div>
                  <div className="font-semibold">{project.created_by}</div>
                </div>
              </div>
            </div>
          </div>

          {/* ส่วน Sprints */}
          {project.sprints && project.sprints.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Sprints</h2>
              <div className="grid gap-4">
                {project.sprints.map((sprint) => (
                  <div
                    key={sprint.sprint_id}
                    className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    onClick={() => navigate(`/sprints/${sprint.sprint_id}`)}
                  >
                    <div>
                      <h3 className="font-semibold">{sprint.name}</h3>
                      <div className="text-sm text-gray-600">
                        {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                        {new Date(sprint.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      <XCircle className="w-5 h-5 text-red-500" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
