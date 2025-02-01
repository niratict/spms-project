import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  ArrowLeft,
  Plus,
  Calendar,
  FileText,
  Upload,
  X,
  Image,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    photo: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Only image files are allowed");
        return;
      }

      setFormData((prev) => ({
        ...prev,
        photo: file,
      }));
      setPreviewImage(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({
      ...prev,
      photo: null,
    }));
    setPreviewImage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null) {
          submitData.append(key, formData[key]);
        }
      });

      const response = await axios.post(
        `${API_BASE_URL}/api/projects`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      navigate(`/projects/${response.data.project_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate("/projects")}
        className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Back to Projects
      </button>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Plus className="w-8 h-8 text-blue-500" />
            Create New Project
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-red-800">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Image Upload Section */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Image className="w-5 h-5 text-blue-500" />
                Project Image
              </label>
              <div className="flex items-center justify-center w-full">
                <div className="w-full">
                  {previewImage ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, GIF up to 5MB
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="name"
                className="flex items-center gap-2 font-medium text-gray-700"
              >
                <FileText className="w-5 h-5 text-blue-500" />
                Project Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter project name"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="flex items-center gap-2 font-medium text-gray-700"
              >
                <FileText className="w-5 h-5 text-green-500" />
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-200 transition-all"
                placeholder="Enter project description"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="start_date"
                  className="flex items-center gap-2 font-medium text-gray-700"
                >
                  <Calendar className="w-5 h-5 text-purple-500" />
                  Start Date
                </label>
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  required
                  value={formData.start_date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="end_date"
                  className="flex items-center gap-2 font-medium text-gray-700"
                >
                  <Calendar className="w-5 h-5 text-red-500" />
                  End Date
                </label>
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  required
                  value={formData.end_date}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors"
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {loading ? "Creating..." : "Create Project"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/projects")}
              className="flex-1 px-6 py-3 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProject;
