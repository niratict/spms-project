import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ArrowLeft, Plus, Calendar, AlertCircle, Lock, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateSprint = () => {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [existingSprints, setExistingSprints] = useState([]);
  const [nextSprintName, setNextSprintName] = useState("");
  const [showDateRanges, setShowDateRanges] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // Helper function to get next Monday
  const getNextMonday = (date = new Date()) => {
    const nextMonday = new Date(date);
    nextMonday.setDate(date.getDate() + ((7 - date.getDay() + 1) % 7 || 7));
    return nextMonday;
  };

  // Helper function to add business days
  const addBusinessDays = (date, days) => {
    const result = new Date(date);
    let addedDays = 0;
    while (addedDays < days) {
      result.setDate(result.getDate() + 1);
      if (result.getDay() !== 0 && result.getDay() !== 6) {
        addedDays++;
      }
    }
    return result;
  };

  // Calculate sprint dates automatically
  const calculateSprintDates = (existingSprints) => {
    let startDate;

    if (existingSprints.length === 0) {
      startDate = getNextMonday();
    } else {
      const lastSprint = existingSprints[existingSprints.length - 1];
      const lastEndDate = new Date(lastSprint.end_date);
      startDate = getNextMonday(lastEndDate);
    }

    const endDate = addBusinessDays(startDate, 9); // 10 business days including start date
    return { from: startDate, to: endDate };
  };

  // Handle date range selection
  const handleRangeSelect = (range) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined });
      return;
    }

    // Only process if both dates are selected
    if (range.from && range.to) {
      // Calculate business days between dates
      let workDays = 0;
      let currentDate = new Date(range.from);

      while (currentDate <= range.to) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          workDays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // If exactly 10 business days, use selected range
      if (workDays === 10) {
        setDateRange(range);
      } else {
        // Otherwise, revert to calculated dates
        const calculatedDates = calculateSprintDates(existingSprints);
        setDateRange(calculatedDates);
        setError("Sprint must be exactly 10 business days");
        setTimeout(() => setError(null), 3000);
      }
    } else {
      setDateRange(range);
    }
  };

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${projectId}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        setExistingSprints(response.data);
        const nextNumber = response.data.length + 1;
        setNextSprintName(`Sprint ${nextNumber}`);

        const calculatedDates = calculateSprintDates(response.data);
        setDateRange(calculatedDates);
      } catch (err) {
        setError("Failed to fetch sprint data");
        console.error("Error fetching sprint data:", err);
      }
    };

    fetchSprintData();
  }, [projectId, user.token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!dateRange.from || !dateRange.to) {
      setError("Sprint dates are required");
      setLoading(false);
      return;
    }

    try {
      const formData = {
        project_id: projectId,
        name: nextSprintName,
        start_date: dateRange.from.toISOString().split("T")[0],
        end_date: dateRange.to.toISOString().split("T")[0],
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/sprints`,
        formData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      navigate(`/sprints/${response.data.sprint_id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create sprint");
      console.error("Error creating sprint:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/sprints", {
      state: { selectedProjectId: parseInt(projectId) },
    });
  };

  // Disable weekends and dates that overlap with existing sprints
  const disabledDays = [
    { dayOfWeek: [0, 6] }, // Disable weekends
    ...existingSprints.map((sprint) => ({
      from: new Date(sprint.start_date),
      to: new Date(sprint.end_date),
    })),
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 lg:p-16">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Select Sprint</span>
        </button>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-100">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Plus className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Create New Sprint
              </h2>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Sprint Name Field */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Sprint Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nextSprintName}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <p className="text-sm text-gray-500">
                Sprint names are automatically generated in sequence
              </p>
            </div>

            {/* Sprint Duration Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Sprint Duration
                </label>
                <button
                  type="button"
                  onClick={() => setShowDateRanges(true)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Existing Sprints
                </button>
              </div>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={
                    dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                      : "Select sprint dates"
                  }
                  readOnly
                  className="w-full px-4 py-3 pl-12 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                  onClick={() => setShowDateRanges(true)}
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !dateRange?.from || !dateRange?.to}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creating...
                  </span>
                ) : (
                  "Create Sprint"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Date Selection Modal */}
      {showDateRanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                  Sprint Schedule
                </h3>
                <button
                  onClick={() => setShowDateRanges(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Existing Sprints */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Existing Sprints:
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                  {existingSprints.map((sprint, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <span className="font-medium text-gray-700">
                        {sprint.name}
                      </span>
                      <span className="text-gray-500">
                        {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                        {new Date(sprint.end_date).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Calendar */}
              <div className="border rounded-xl p-4 bg-white">
                <style>
                  {`
                    .rdp {
                      --rdp-cell-size: 40px;
                      --rdp-accent-color: #2563eb;
                      --rdp-background-color: #e0e7ff;
                      margin: 0;
                    }
                    .rdp-day_selected:not(.rdp-day_disabled):not(.rdp-day_outside) {
                      background-color: var(--rdp-accent-color);
                    }
                    .rdp-day_selected:hover:not(.rdp-day_disabled):not(.rdp-day_outside) {
                      background-color: #1d4ed8;
                    }
                    .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_outside) {
                      background-color: #e0e7ff;
                    }
                  `}
                </style>
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={handleRangeSelect}
                  disabled={disabledDays}
                  showOutsideDays={false}
                  className="w-full"
                />
              </div>

              {/* Footer */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowDateRanges(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSprint;
