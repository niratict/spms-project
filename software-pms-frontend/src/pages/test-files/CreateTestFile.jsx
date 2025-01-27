import React, { useState } from "react";
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError(null);

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
    if (!filename) {
      setFilename(file.name.replace(".json", ""));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      const response = await axios.post(
        `${API_BASE_URL}/api/test-files/upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      navigate(`/test-files/${response.data.file_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload test file");
    } finally {
      setLoading(false);
    }
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
              Upload Test File
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
                {loading ? "Uploading..." : "Upload File"}
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
      </div>
    </div>
  );
};

export default CreateTestFile;
