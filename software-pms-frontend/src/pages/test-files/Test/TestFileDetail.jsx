import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Calendar, FileText, Users, ArrowLeft } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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

const TestFileDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [testFile, setTestFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchTestFile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/test-files/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setTestFile(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch test file details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchTestFile();
  }, [id, user]);

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/test-files/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/test-files");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete test file");
    }
  };

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center text-red-500 p-6">{error}</div>;
  if (!testFile)
    return <div className="text-center p-6">Test file not found</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <button
        onClick={() =>
          navigate("/test-files", {
            state: {
              selectedProjectId: testFile.project_id,
              projectName: testFile.project_name,
              selectedSprintId: testFile.sprint_id,
              sprintName: testFile.sprint_name,
            },
          })
        }
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Test Files</span>
      </button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">File Details</h1>
          <div className="space-y-1">
            <p className="text-gray-700">
              <span className="font-semibold">Filename:</span>{" "}
              {testFile.filename}
            </p>
            <p className="text-gray-700">
              <span className="font-semibold">Original Filename:</span>{" "}
              {testFile.original_filename}
            </p>
            <p className="text-gray-600">Sprint: {testFile.sprint_name}</p>
            <p className="text-gray-600">Project: {testFile.project_name}</p>
          </div>
        </div>
        <div className="space-x-4">
          <button
            onClick={() => navigate(`/test-files/${id}/edit`)}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Edit File
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Delete File
          </button>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>
                Upload Date:{" "}
                {new Date(testFile.upload_date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span>Uploaded by: {testFile.last_modified_by}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>
                File Size: {(testFile.file_size / 1024).toFixed(2)} KB
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-500" />
              <span>Status: {testFile.status}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDeleteModal}
        onRequestClose={() => setShowDeleteModal(false)}
        style={modalStyles}
        contentLabel="Delete Test File Modal"
      >
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold">Delete Test File</h2>
            <p className="text-gray-600 mt-2">
              Are you sure you want to delete this test file? This action cannot
              be undone.
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
              Delete File
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TestFileDetail;
