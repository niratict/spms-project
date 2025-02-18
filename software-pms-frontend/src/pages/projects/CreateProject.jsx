import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { format, setHours } from "date-fns";
import "react-day-picker/dist/style.css";
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
import { DayPicker } from "react-day-picker";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// DateRangePickerModal Component
const DateRangePickerModal = ({
  isOpen,
  onClose,
  onConfirm,
  startDate,
  endDate,
}) => {
  const [range, setRange] = useState({
    from: startDate ? new Date(startDate) : undefined,
    to: endDate ? new Date(endDate) : undefined,
  });

  // Reset range when modal opens
  useEffect(() => {
    if (isOpen) {
      setRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      });
    }
  }, [isOpen, startDate, endDate]);

  const handleConfirm = () => {
    if (range?.from && range?.to) {
      // Convert to Thailand timezone (UTC+7)
      const adjustedFrom = setHours(range.from, 7);
      const adjustedTo = setHours(range.to, 7);
      onConfirm(adjustedFrom, adjustedTo);
      onClose();
    }
  };

  const handleRangeSelect = (newRange) => {
    // ถ้าคลิกวันเดียวกับ from ที่เลือกไว้ ให้ล้างค่า range
    if (
      newRange?.from &&
      range?.from &&
      newRange.from.getTime() === range.from.getTime() &&
      !newRange.to
    ) {
      setRange({ from: undefined, to: undefined });
      return;
    }

    // ถ้าคลิกวันเดียวกับ to ที่เลือกไว้ ให้ล้างค่า to
    if (
      newRange?.to &&
      range?.to &&
      newRange.to.getTime() === range.to.getTime()
    ) {
      setRange({ ...range, to: undefined });
      return;
    }

    setRange(newRange || { from: undefined, to: undefined });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Select Date Range
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="flex justify-center">
          <DayPicker
            mode="range"
            selected={range}
            onSelect={handleRangeSelect}
            numberOfMonths={2}
            disabled={[
              { dayOfWeek: [0, 6] }, // Disable weekends
            ]}
            modifiers={{
              disabled: { dayOfWeek: [0, 6] },
            }}
            styles={{
              months: { display: "flex", gap: "1rem" },
              caption: { color: "#3B82F6" },
              head_cell: { color: "#6B7280" },
              day_selected: {
                backgroundColor: "#3B82F6 !important",
                color: "white !important",
                fontWeight: "bold",
              },
              day_today: {
                color: "#3B82F6 !important",
                fontWeight: "bold",
              },
              day: { margin: "0.2rem" },
            }}
            className="border border-gray-200 rounded-lg p-4"
          />
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!range?.from || !range?.to}
            className="px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Main CreateProject Component
const CreateProject = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    start_date: "",
    end_date: "",
    photo: null,
  });

  const displayDateRange = () => {
    if (!formData.start_date || !formData.end_date) return "";
    return `${format(new Date(formData.start_date), "dd/MM/yyyy")} - ${format(
      new Date(formData.end_date),
      "dd/MM/yyyy"
    )}`;
  };

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

          <div className="space-y-6">
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

            {/* Project Name */}
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

            {/* Description */}
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

            {/* Date Range Picker */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 font-medium text-gray-700">
                <Calendar className="w-5 h-5 text-purple-500" />
                Project Duration
              </label>
              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={displayDateRange()}
                  onClick={() => setShowDatePicker(true)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer"
                  placeholder="Select project duration"
                />
              </div>
            </div>
          </div>

          {/* Form Buttons */}
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

      {/* Date Range Picker Modal */}
      <DateRangePickerModal
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        startDate={formData.start_date}
        endDate={formData.end_date}
        onConfirm={(start, end) => {
          setFormData((prev) => ({
            ...prev,
            start_date: format(start, "yyyy-MM-dd"),
            end_date: format(end, "yyyy-MM-dd"),
          }));
        }}
      />
    </div>
  );
};

export default CreateProject;
