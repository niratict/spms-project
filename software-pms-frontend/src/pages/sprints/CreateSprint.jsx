import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ArrowLeft, Plus, Calendar, AlertCircle, Lock, X } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import ExistingSprintsList from "./ExistingSprintsList";

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
    if (!range) {
      setDateRange({
        from: undefined,
        to: undefined,
      });
      return;
    }

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
  }, [projectId, user.token]);

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
      // Fix timezone offset by setting time to noon (12:00) in local time
      const startDate = new Date(dateRange.from);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(dateRange.to);
      endDate.setHours(12, 0, 0, 0);

      const formData = {
        project_id: projectId,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
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

  // Disable dates that overlap with existing sprints and weekends
  const disabledDays = [
    ...existingSprints.map((sprint) => ({
      from: new Date(sprint.start_date),
      to: new Date(sprint.end_date),
    })),
    // Disable weekends
    (date) => {
      const day = date.getDay();
      return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    },
  ];

  // Custom CSS classes for DayPicker
  const dayPickerClassNames = {
    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
    month: "space-y-4",
    caption: "flex justify-center pt-1 relative items-center",
    caption_label: "text-sm font-medium",
    nav: "space-x-1 flex items-center",
    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
    nav_button_previous: "absolute left-1",
    nav_button_next: "absolute right-1",
    table: "w-full border-collapse space-y-1",
    head_row: "flex",
    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
    row: "flex w-full mt-2",
    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
    day_selected:
      "bg-blue-600 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
    day_today: "bg-accent text-accent-foreground",
    day_outside: "text-muted-foreground opacity-50",
    day_disabled: "text-muted-foreground opacity-50 cursor-not-allowed",
    day_range_middle:
      "aria-selected:bg-accent aria-selected:text-accent-foreground",
    day_hidden: "invisible",
  };

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
              </div>

              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={
                    dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString(
                          "th-TH"
                        )} - ${dateRange.to.toLocaleDateString("th-TH")}`
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

      {/* Date Picker Modal */}
      {showDateRanges && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Select Sprint Dates</h3>
              <button
                onClick={() => setShowDateRanges(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <ExistingSprintsList sprints={existingSprints} />

            <div className="flex justify-center">
              <DayPicker
                mode="range"
                selected={dateRange}
                onSelect={handleRangeSelect}
                disabled={disabledDays}
                className="border rounded-md p-4"
                classNames={dayPickerClassNames}
                footer={
                  <p className="text-sm text-gray-500 mt-4 text-center">
                    Weekends are disabled
                  </p>
                }
              />
            </div>

            {/* Add buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowDateRanges(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (dateRange.from && dateRange.to) {
                    setShowDateRanges(false);
                  }
                }}
                disabled={!dateRange.from || !dateRange.to}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateSprint;
