import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ChevronLeft, FileUp, AlertTriangle } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateTestFile = () => {
  const navigate = useNavigate();
  const { sprintId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [filename, setFilename] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [pendingFileId, setPendingFileId] = useState(null);
  const [existingSprintName, setExistingSprintName] = useState(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const [isUpdateMode, setIsUpdateMode] = useState(false); // เพิ่มสถานะสำหรับโหมดอัปเดต

  useEffect(() => {
    const fetchExistingFiles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/test-files`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setExistingFiles(response.data);
      } catch (err) {
        console.error("Error fetching existing files:", err);
      }
    };
    fetchExistingFiles();
  }, [user.token]);

  const checkExistingFile = (file) => {
    const existingFile = existingFiles.find(
      (ef) => ef.original_filename === file.name && ef.status !== "Deleted"
    );

    if (existingFile) {
      if (existingFile.sprint_id === parseInt(sprintId)) {
        setPendingFileId(existingFile.file_id);
        setShowConfirmDialog(true);
        return "SAME_SPRINT";
      } else {
        setExistingSprintName(existingFile.sprint_name);
        setShowErrorDialog(true);
        return "DIFFERENT_SPRINT";
      }
    }
    return "NEW_FILE";
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
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

    const fileStatus = checkExistingFile(file);
    if (fileStatus === "NEW_FILE" || fileStatus === "SAME_SPRINT") {
      setSelectedFile(file);
      if (!filename) {
        setFilename(file.name.replace(".json", ""));
      }
    } else {
      setSelectedFile(null);
      if (!filename) {
        setFilename("");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Please select a file");
      return;
    }

    if (!filename.trim()) {
      setError("Please enter a filename");
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("testFile", selectedFile);
    formData.append("sprint_id", sprintId);
    formData.append("filename", filename);

    try {
      // Use the correct endpoint for update mode
      const endpoint = isUpdateMode
        ? `${API_BASE_URL}/api/test-files/upload/${pendingFileId}`
        : `${API_BASE_URL}/api/test-files/upload`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      navigate(`/test-files/${response.data.file_id || pendingFileId}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.sameSprint) {
        setPendingFileId(err.response.data.file_id);
        setShowConfirmDialog(true);
        setLoading(false);
        return;
      }

      setError(err.response?.data?.message || "Failed to upload test file");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleUpload();
  };

  const handleConfirmUpdate = () => {
    setShowConfirmDialog(false);
    setIsUpdateMode(true); // เปิดโหมดอัปเดตเมื่อผู้ใช้ยืนยัน
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => navigate("/test-files")}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ChevronLeft className="mr-2" />
          <span className="font-medium">Back to Test Files</span>
        </button>

        <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
          <div className="bg-blue-50 px-6 py-5 border-b border-blue-100">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center">
              <FileUp className="mr-3 text-blue-600" />
              {isUpdateMode ? "Update Test File" : "Upload Test File"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
                <AlertTriangle className="mr-3 text-red-500" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="filename"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  File Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="filename"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter descriptive file name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="testFile"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  JSON Test File <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="file"
                    id="testFile"
                    accept=".json,application/json"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="testFile"
                    className={`
                      w-full flex items-center justify-center px-6 py-4 
                      border-2 border-dashed rounded-lg cursor-pointer 
                      transition-all duration-300
                      ${
                        selectedFile
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-700"
                      }
                    `}
                  >
                    <FileUp className="mr-3 w-6 h-6" />
                    <span className="text-sm font-medium">
                      {selectedFile
                        ? selectedFile.name
                        : "Click to upload or drag and drop"}
                    </span>
                  </label>

                  {fileError && (
                    <p className="mt-2 text-sm text-red-500 flex items-center">
                      <AlertTriangle className="mr-2 w-4 h-4" />
                      {fileError}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Only JSON files are allowed (max 5MB)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`
                  w-full py-3 rounded-lg text-white font-semibold transition-all duration-300
                  ${
                    loading || !selectedFile
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                  }
                `}
              >
                {loading
                  ? "Uploading..."
                  : isUpdateMode
                  ? "Update File"
                  : "Upload File"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/test-files")}
                className="
                  w-full py-3 rounded-lg text-gray-600 bg-gray-100 
                  hover:bg-gray-200 font-semibold transition-all duration-300
                "
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        {showErrorDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
              <div className="px-6 py-4">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="text-red-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cannot Upload File
                  </h3>
                </div>
                <p className="text-gray-600">
                  This test file has already been uploaded to{" "}
                  {existingSprintName}. You cannot upload the same file to
                  multiple sprints.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowErrorDialog(false)}
                  className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Understand
                </button>
              </div>
            </div>
          </div>
        )}

        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-md w-full mx-4 overflow-hidden">
              <div className="px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Update Existing Test File?
                </h3>
                <p className="text-gray-600">
                  A test file with the same name already exists in this sprint.
                  Would you like to update it with the new results?
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpdate}
                  className="px-4 py-2 rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Update File
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateTestFile;
