import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Activity, Users, FileText, ArrowLeft } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

Modal.setAppElement("#root");

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
    padding: "24px",
    borderRadius: "8px",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
};

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

  // back to sprints
  const handleBackToSprints = () => {
    navigate("/sprints", {
      state: {
        selectedProjectId: sprint.project_id,
        projectName: sprint.project_name, // ส่งข้อมูลครบถ้วน
      },
    });
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!sprint) return <div className="text-center p-6">Sprint not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={handleBackToSprints}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Select Sprint</span>
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{sprint.name}</h1>
          <p className="text-gray-600">Project: {sprint.project_name}</p>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate(`/sprints/${id}/edit`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Edit Sprint
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete Sprint
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Sprint Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>
                Start Date: {new Date(sprint.start_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>
                End Date: {new Date(sprint.end_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span>Created by: {sprint.created_by}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Total Tests: {sprint.total_tests}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {sprint.passed_tests}
              </div>
              <div className="text-sm text-green-600">Passed Tests</div>
            </div>
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {sprint.failed_tests}
              </div>
              <div className="text-sm text-red-600">Failed Tests</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {sprint.total_tests
                  ? ((sprint.passed_tests / sprint.total_tests) * 100).toFixed(
                      1
                    )
                  : 0}
                %
              </div>
              <div className="text-sm text-blue-600">Pass Rate</div>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        style={modalStyles}
        contentLabel="Delete Sprint Modal"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Delete Sprint</h2>
            <p className="text-gray-600 mt-2">
              Are you sure you want to delete this sprint? This action cannot be
              undone.
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Delete Sprint
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SprintDetail;
