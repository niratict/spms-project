import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Edit, X, Save, Calendar, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SprintEdit = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [existingSprints, setExistingSprints] = useState([]);
  const [isLatestSprint, setIsLatestSprint] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // Fetch current sprint
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        // Fetch all sprints for the project to check if this is the latest
        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;
        setExistingSprints(sprints);

        // Check if this is the latest sprint
        const currentSprintNumber = parseInt(sprintData.name.split(" ")[1]);
        const latestSprintNumber = Math.max(
          ...sprints.map((s) => parseInt(s.name.split(" ")[1]))
        );
        setIsLatestSprint(currentSprintNumber === latestSprintNumber);

        // Set initial date range
        setDateRange({
          from: new Date(sprintData.start_date),
          to: new Date(sprintData.end_date),
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprint data");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchSprintData();
  }, [id, user]);

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

  const handleSubmit = async () => {
    if (!dateRange.from || !dateRange.to) {
      setError("Please select both start and end dates");
      return;
    }

    try {
      // Fix timezone offset
      const startDate = new Date(dateRange.from);
      startDate.setHours(12, 0, 0, 0);

      const endDate = new Date(dateRange.to);
      endDate.setHours(12, 0, 0, 0);

      const formData = {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      await axios.put(`${API_BASE_URL}/api/sprints/${id}`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate(`/sprints/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update sprint");
    }
  };

  // Disable dates that overlap with existing sprints (excluding current sprint)
  const disabledDays = [
    ...existingSprints
      .filter((sprint) => sprint.name !== (sprint?.name || ""))
      .map((sprint) => ({
        from: new Date(sprint.start_date),
        to: new Date(sprint.end_date),
      })),
    // Disable weekends
    (date) => {
      const day = date.getDay();
      return day === 0 || day === 6;
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

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  if (!isLatestSprint)
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <p className="text-red-600 text-lg">
            Only the latest sprint can be edited
          </p>
          <button
            onClick={() => navigate(`/sprints/${id}`)}
            className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Sprint Details
          </button>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center min-h-screen bg-red-50">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-4" />
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );

  if (!sprint)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600">Sprint not found</p>
      </div>
    );

  return (
    <div className="bg-gray mt-16 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-50 p-6 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Edit className="w-10 h-10 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">Edit Sprint</h2>
            </div>
            <button
              onClick={() => navigate(`/sprints/${id}`)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
          </div>

          <form className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sprint Name
              </label>
              <input
                type="text"
                value={sprint.name}
                disabled
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sprint Duration
              </label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={
                    dateRange?.from && dateRange?.to
                      ? `${dateRange.from.toLocaleDateString()} - ${dateRange.to.toLocaleDateString()}`
                      : "Select date range"
                  }
                  onClick={() => setShowDatePicker(true)}
                  readOnly
                  className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(`/sprints/${id}`)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                disabled={!dateRange.from || !dateRange.to}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:bg-blue-300"
              >
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>

        {/* Date Picker Modal */}
        {showDatePicker && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Select Sprint Dates</h3>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
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
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
              <div className="text-center">
                <AlertCircle className="mx-auto w-16 h-16 text-blue-500 mb-4" />
                <h2 className="text-2xl font-bold mb-4">Confirm Changes</h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to save these changes to the sprint?
                </p>
              </div>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintEdit;
