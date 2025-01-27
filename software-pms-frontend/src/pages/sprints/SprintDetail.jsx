import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Activity,
  Users,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  BarChart,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SprintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchSprint = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/sprints/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setSprint(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch sprint details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchSprint();
  }, [id, user]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sprints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/sprints");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete sprint");
    }
  };

  const handleBackToSprints = () => {
    navigate("/sprints", {
      state: {
        selectedProjectId: sprint.project_id,
        projectName: sprint.project_name,
      },
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg">
          <XCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );

  if (!sprint)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Sprint not found</p>
      </div>
    );

  const passRate = sprint.total_tests
    ? ((sprint.passed_tests / sprint.total_tests) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleBackToSprints}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Sprints</span>
          </button>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate(`/sprints/${id}/edit`)}
              className="p-3 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <Edit className="w-6 h-6" />
              <span className="ml-2 hidden md:inline">Edit</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors shadow-md hover:shadow-lg flex items-center justify-center"
            >
              <Trash2 className="w-6 h-6" />
              <span className="ml-2 hidden md:inline">Delete</span>
            </button>
          </div>
        </div>

        {/* Sprint Overview */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column: Sprint Details */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {sprint.name}
              </h1>
              <p className="text-gray-600 text-lg">
                Project: {sprint.project_name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <Calendar className="w-12 h-12 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">Start Date</div>
                  <div className="font-semibold text-xl">
                    {new Date(sprint.start_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <Calendar className="w-12 h-12 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-500">End Date</div>
                  <div className="font-semibold text-xl">
                    {new Date(sprint.end_date).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <Users className="w-12 h-12 text-green-500" />
                <div>
                  <div className="text-sm text-gray-500">Created By</div>
                  <div className="font-semibold text-xl">
                    {sprint.created_by}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg">
                <FileText className="w-12 h-12 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-500">Total Tests</div>
                  <div className="font-semibold text-xl">
                    {sprint.total_tests}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Test Statistics */}
          <div className="space-y-6">
            <div className="bg-green-50 rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
              <CheckCircle className="mx-auto w-20 h-20 text-green-600 mb-4" />
              <div className="text-5xl font-bold text-green-700 mb-2">
                {sprint.passed_tests}
              </div>
              <div className="text-2xl text-green-600">Passed Tests</div>
            </div>
            <div className="bg-red-50 rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
              <XCircle className="mx-auto w-20 h-20 text-red-600 mb-4" />
              <div className="text-5xl font-bold text-red-700 mb-2">
                {sprint.failed_tests}
              </div>
              <div className="text-2xl text-red-600">Failed Tests</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-8 text-center shadow-lg hover:shadow-xl transition-shadow">
              <BarChart className="mx-auto w-20 h-20 text-blue-600 mb-4" />
              <div className="text-5xl font-bold text-blue-700 mb-2">
                {passRate}%
              </div>
              <div className="text-2xl text-blue-600">Pass Rate</div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
              <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
                <Trash2 className="mr-3 text-red-500" />
                Delete Sprint
              </h2>
              <p className="text-gray-600 mb-6 text-lg">
                Are you absolutely sure you want to delete this sprint? This
                action cannot be undone and will permanently remove all
                associated test data.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center"
                >
                  <Trash2 className="mr-2" />
                  Delete Sprint
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintDetail;
