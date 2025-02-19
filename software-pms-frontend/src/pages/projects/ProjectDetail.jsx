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
  AlertTriangle,
  Plus,
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

const DeleteErrorModal = ({ isOpen, onClose, sprintCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Cannot Delete Project
          </h2>
          <p className="text-gray-600 mb-6">
            This project cannot be deleted because it has {sprintCount} existing{" "}
            {sprintCount === 1 ? "sprint" : "sprints"}. Please delete all
            sprints first before attempting to delete this project.
          </p>
        </div>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

const SprintItem = ({ sprint, onNavigate }) => {
  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "in progress":
        return <Activity className="w-5 h-5 text-blue-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div
      onClick={() => onNavigate(sprint.sprint_id)}
      className="flex justify-between items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
    >
      <div>
        <h3 className="font-semibold">{sprint.name}</h3>
        <div className="text-sm text-gray-600">
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
      <div className="flex items-center gap-4">
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            sprint.status?.toLowerCase() === "completed"
              ? "bg-green-100 text-green-800"
              : sprint.status?.toLowerCase() === "in progress"
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {sprint.status || "Not Started"}
        </span>
        {getStatusIcon(sprint.status)}
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
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [sprintCount, setSprintCount] = useState(0);

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
      if (
        err.response?.data?.message ===
        "Cannot delete project with existing sprints"
      ) {
        setSprintCount(err.response.data.sprint_count);
        setShowDeleteModal(false);
        setShowDeleteErrorModal(true);
      } else {
        setError(err.response?.data?.message || "Failed to delete project");
      }
    }
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-red-50 border border-red-200 text-red-800 px-6 py-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center p-6 bg-gray-100 rounded-lg">
          Project not found
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      <DeleteErrorModal
        isOpen={showDeleteErrorModal}
        onClose={() => setShowDeleteErrorModal(false)}
        sprintCount={sprintCount}
      />

      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => navigate("/projects")}
          className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Projects
        </button>

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

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {project.name}
              </h1>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    project.status?.toLowerCase() === "completed"
                      ? "bg-green-100 text-green-800"
                      : project.status?.toLowerCase() === "in progress"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {project.status || "Not Started"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">
              Description
            </h2>
            <p className="text-gray-600">{project.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
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

            <div className="grid grid-cols-1 gap-4 content-start">
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">Start Date</div>
                  <div className="font-semibold">
                    {new Date(project.start_date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">End Date</div>
                  <div className="font-semibold">
                    {new Date(project.end_date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
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

          <div className="border-t pt-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Sprints</h2>
              <button
                onClick={() => navigate(`/projects/${id}/sprints/new`)}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Sprint
              </button>
            </div>

            {project.sprints && project.sprints.length > 0 ? (
              <div className="grid gap-4">
                {project.sprints.map((sprint) => (
                  <SprintItem
                    key={sprint.sprint_id}
                    sprint={sprint}
                    onNavigate={(sprintId) => navigate(`/sprints/${sprintId}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                <div className="mb-3">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Sprints Yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Get started by creating your first sprint for this project
                </p>
                <button
                  onClick={() => navigate(`/projects/${id}/sprints/new`)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create First Sprint
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
