import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const TestFileEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [testFile, setTestFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    filename: "",
    status: "Pending",
  });

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
        setFormData({
          filename: response.data.filename,
          status: response.data.status || "Pending",
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch test file");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchTestFile();
  }, [id, user]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError(null);
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/json") {
      setFileError("Only JSON files are allowed");
      setSelectedFile(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size must be less than 5MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const submitData = new FormData();
      if (selectedFile) {
        submitData.append("testFile", selectedFile);
      }
      submitData.append("filename", formData.filename);
      submitData.append("status", formData.status);

      await axios.put(
        `${API_BASE_URL}/api/test-files/${id}/upload`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      navigate(`/test-files/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update test file");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading file details...</p>
        </div>
      </div>
    );

  if (!testFile)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <FileText className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Test file not found</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate("/test-files")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Test Files</span>
          </button>
          {testFile.status === "Pass" ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              <span>Passed</span>
            </div>
          ) : testFile.status === "Fail" ? (
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <span>Failed</span>
            </div>
          ) : null}
        </div>

        <div className="bg-white shadow-xl rounded-xl overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Edit Test File</h1>
            <p className="text-blue-100 mt-1">
              Editing: {testFile.original_filename}
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-6 h-6" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload New File (Optional)
                </label>
                <div className="flex items-center gap-4">
                  <label className="relative cursor-pointer">
                    <input
                      type="file"
                      accept="application/json"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                      <Upload className="w-5 h-5" />
                      <span>Choose File</span>
                    </div>
                  </label>
                  {selectedFile && (
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {selectedFile.name}
                    </span>
                  )}
                </div>
                {fileError && (
                  <p className="mt-2 text-sm text-red-500">{fileError}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filename
                </label>
                <input
                  type="text"
                  value={formData.filename}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      filename: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="relative">
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
                    <svg
                      className="fill-current h-4 w-4"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <button
                onClick={() => navigate(`/test-files/${id}`)}
                className="px-4 py-2 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">↻</span>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestFileEdit;
