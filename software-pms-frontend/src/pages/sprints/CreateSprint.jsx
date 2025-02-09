import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ArrowLeft, Plus, Calendar, AlertCircle, Lock } from "lucide-react";
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

  const handleRangeSelect = (range) => {
    // ถ้า range เป็น null หรือ undefined ให้ reset เป็น initial state
    if (!range) {
      setDateRange({
        from: undefined,
        to: undefined,
      });
      return;
    }

    // ถ้ามีค่าจึงค่อย update
    setDateRange({
      from: range.from,
      to: range.to,
    });
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
      } catch (err) {
        setError("Failed to fetch sprint data");
      }
    };

    fetchSprintData();
  }, [projectId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!dateRange.from || !dateRange.to) {
      setError("Please select both start and end dates");
      setLoading(false);
      return;
    }

    try {
      const formData = {
        project_id: projectId,
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
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/sprints", {
      state: { selectedProjectId: parseInt(projectId) },
    });
  };

  // Disable dates that overlap with existing sprints
  const disabledDays = existingSprints.map((sprint) => ({
    from: new Date(sprint.start_date),
    to: new Date(sprint.end_date),
  }));

  return (
    <div className="bg-gray-50 p-16">
      <div className="w-full max-w-2xl mx-auto">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 p-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Select Sprint</span>
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-50 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Plus className="w-10 h-10 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                Create New Sprint
              </h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {error && (
              <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sprint Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nextSprintName}
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                />
                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Sprint names are automatically generated in sequence
              </p>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Sprint Duration
                </label>
                <button
                  type="button"
                  onClick={() => setShowDateRanges(true)}
                  className="text-sm text-blue-600 hover:text-blue-700"
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
                      : "Select date range"
                  }
                  onClick={() => setShowDateRanges(true)}
                  readOnly
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={handleBack}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !dateRange?.from || !dateRange?.to}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                <span>{loading ? "Creating..." : "Create Sprint"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal using Tailwind */}
      {showDateRanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Sprint Dates</h3>
              <button
                onClick={() => setShowDateRanges(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Existing Sprints:
              </h4>
              <div className="space-y-2">
                {existingSprints.map((sprint) => (
                  <div key={sprint.name} className="text-sm text-gray-600">
                    {sprint.name}:{" "}
                    {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </div>
                ))}
              </div>
            </div>

            <DayPicker
              mode="range"
              selected={dateRange}
              onSelect={handleRangeSelect}
              disabled={disabledDays}
              className="border rounded-md p-4"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSprint;
