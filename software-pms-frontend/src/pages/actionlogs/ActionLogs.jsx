import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Filter } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ActionLogs = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTypes, setActionTypes] = useState([]);
  const [targetTables, setTargetTables] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [filters, setFilters] = useState({
    action_type: "",
    target_table: "",
    start_date: "",
    end_date: "",
    limit: 10,
  });

  // New function to format details
  const formatDetails = (details, targetTable, actionType) => {
    if (!details) return "-";

    if (typeof details === "object") {
      // Create a copy of details to modify
      const displayDetails = { ...details };

      // Remove json_content if target is test_files and action is update or delete
      if (
        targetTable === "test_files" &&
        (actionType === "update" || actionType === "delete") &&
        displayDetails.json_content
      ) {
        delete displayDetails.json_content;
      }

      return Object.entries(displayDetails)
        .filter(([_, value]) => value !== null && value !== undefined)
        .map(([key, value]) => (
          <div key={key} className="whitespace-normal">
            <span className="font-medium">{key}:</span>{" "}
            {typeof value === "object"
              ? JSON.stringify(value)
              : value.toString()}
          </div>
        ));
    }

    return details;
  };

  // Format date to Thai Buddhist calendar (DD/MM/YYYY+543)
  const formatThaiDate = (date) => {
    if (!date) return "";
    const buddhistYear = parseInt(format(date, "yyyy", { locale: th })) + 543;
    return format(date, "dd/MM/") + buddhistYear;
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!selectedRange.from && !selectedRange.to) return "เลือกช่วงเวลา";
    if (selectedRange.from && !selectedRange.to)
      return formatThaiDate(selectedRange.from);
    return `${formatThaiDate(selectedRange.from)} ถึง ${formatThaiDate(
      selectedRange.to
    )}`;
  };

  // Handle date selection
  const handleDateRangeSelect = (range) => {
    setSelectedRange(range || { from: undefined, to: undefined });
    if (range?.from) {
      setFilters((prev) => ({
        ...prev,
        start_date: format(range.from, "yyyy-MM-dd"),
      }));
    }
    if (range?.to) {
      setFilters((prev) => ({
        ...prev,
        end_date: format(range.to, "yyyy-MM-dd"),
      }));
    }
    if (!range) {
      setFilters((prev) => ({
        ...prev,
        start_date: "",
        end_date: "",
      }));
    }
  };

  // Fetch action types and target tables
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [typesRes, tablesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/action-logs/types`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
          axios.get(`${API_BASE_URL}/api/action-logs/tables`, {
            headers: { Authorization: `Bearer ${user?.token}` },
          }),
        ]);
        setActionTypes(typesRes.data);
        setTargetTables(tablesRes.data);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
        }
      }
    };

    if (user?.token) {
      fetchFilterOptions();
    }
  }, [user, logout, navigate]);

  // Adjust dates to include full day range
  const adjustDateRange = (startDate, endDate) => {
    if (!startDate && !endDate) return { startDate: "", endDate: "" };

    let adjustedStart = startDate;
    let adjustedEnd = endDate;

    if (startDate) {
      adjustedStart = new Date(startDate);
      adjustedStart.setUTCHours(0, 0, 0, 0);
      adjustedStart = adjustedStart.toISOString();
    }

    if (endDate) {
      adjustedEnd = new Date(endDate);
      adjustedEnd.setUTCHours(23, 59, 59, 999);
      adjustedEnd = adjustedEnd.toISOString();
    }

    return { startDate: adjustedStart, endDate: adjustedEnd };
  };

  // Fetch logs with filters
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const offset = (currentPage - 1) * filters.limit;

        const { startDate, endDate } = adjustDateRange(
          filters.start_date,
          filters.end_date
        );

        const queryParams = new URLSearchParams({
          ...filters,
          start_date: startDate,
          end_date: endDate,
          offset: offset.toString(),
        });

        const response = await axios.get(
          `${API_BASE_URL}/api/action-logs?${queryParams}`,
          {
            headers: { Authorization: `Bearer ${user?.token}` },
          }
        );

        setLogs(response.data.logs);
        setTotalLogs(response.data.total);
        setError(null);
      } catch (err) {
        if (err.response?.status === 401) {
          logout();
          navigate("/login");
          return;
        }
        setError(
          err.response?.data?.message || "การดึงข้อมูลบันทึกการดำเนินการล้มเหลว"
        );
        setLogs([]);
        setTotalLogs(0);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchLogs();
    }
  }, [user, currentPage, filters, logout, navigate]);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
    setError(null);
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      action_type: "",
      target_table: "",
      start_date: "",
      end_date: "",
      limit: 10,
    });
    setSelectedRange({ from: undefined, to: undefined });
    setCurrentPage(1);
    setError(null);
  };

  // Calculate pagination
  const totalPages = Math.ceil(totalLogs / filters.limit);
  const canGoToNextPage = currentPage < totalPages && logs.length > 0;
  const canGoToPreviousPage = currentPage > 1 && logs.length > 0;

  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8" data-cy="action-logs-page">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1
            className="text-3xl font-extrabold text-gray-900"
            data-cy="action-logs-title"
          >
            บันทึกการดำเนินการ
          </h1>
        </div>

        {/* Filters */}
        <div
          className="bg-white shadow-md rounded-lg p-6 border border-gray-200"
          data-cy="filters-section"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action Type Filter */}
            <div className="relative">
              <select
                data-cy="action-type-filter"
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ประเภทการดำเนินการทั้งหมด</option>
                {actionTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                    data-cy={`action-type-option-${type}`}
                  >
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Table Filter */}
            <div className="relative">
              <select
                data-cy="target-table-filter"
                name="target_table"
                value={filters.target_table}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ตารางเป้าหมายทั้งหมด</option>
                {targetTables.map((table) => (
                  <option
                    key={table}
                    value={table}
                    data-cy={`target-table-option-${table}`}
                  >
                    {table}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Picker */}
            <div className="relative">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-cy="date-range-picker"
                >
                  <span className="text-gray-700">{formatDateRange()}</span>
                  <Calendar className="h-4 w-4 text-gray-400" />
                </button>

                {isDatePickerOpen && (
                  <div className="absolute z-10 mt-1 bg-white rounded-md shadow-lg p-4 border border-gray-200">
                    <DayPicker
                      mode="range"
                      selected={selectedRange}
                      onSelect={handleDateRangeSelect}
                      locale={th}
                      formatters={{
                        formatYear: (year) => `${year + 543}`,
                      }}
                      modifiers={{
                        selected: [selectedRange.from, selectedRange.to],
                      }}
                      modifiersStyles={{
                        selected: {
                          backgroundColor: "#3b82f6",
                          color: "white",
                        },
                      }}
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setIsDatePickerOpen(false)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Clear Filters */}
          {(filters.action_type ||
            filters.target_table ||
            filters.start_date ||
            filters.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                data-cy="clear-filters-button"
                onClick={clearFilters}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition duration-200"
              >
                <Filter className="h-4 w-4 mr-2" /> ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {/* Logs Table */}
        <div
          className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
          data-cy="logs-table"
        >
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  data-cy="column-header-date"
                >
                  วันที่
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  data-cy="column-header-user"
                >
                  ผู้ใช้
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  data-cy="column-header-action"
                >
                  การดำเนินการ
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  data-cy="column-header-target"
                >
                  เป้าหมาย
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  data-cy="column-header-details"
                >
                  รายละเอียด
                </th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr
                  key={log.log_id}
                  data-cy={`log-row-${log.log_id}`}
                  className="hover:bg-gray-50 transition-colors duration-100 border-b last:border-b-0"
                >
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-600"
                    data-cy="log-date"
                  >
                    {formatThaiDate(new Date(log.action_date))}
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-cy="log-user"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {log.user_name}
                    </div>
                    <div className="text-sm text-gray-500">{log.user_role}</div>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap"
                    data-cy="log-action"
                  >
                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.action_type}
                    </span>
                  </td>
                  <td
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                    data-cy="log-target"
                  >
                    {log.target_table} #{log.target_id}
                    {log.target_name && (
                      <div className="text-sm font-medium text-gray-900">
                        {log.target_name}
                      </div>
                    )}
                  </td>
                  <td
                    className="px-6 py-4 text-sm text-gray-500"
                    data-cy="log-details"
                  >
                    {formatDetails(
                      log.details,
                      log.target_table,
                      log.action_type
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Empty state */}
          {logs.length === 0 && (
            <div
              className="text-center py-10 text-gray-500 bg-gray-50"
              data-cy="empty-state"
            >
              ไม่พบบันทึกการดำเนินการ
            </div>
          )}
        </div>

        {/* Pagination */}
        <div
          className="flex justify-between items-center mt-4"
          data-cy="pagination"
        >
          <div className="text-sm text-gray-700" data-cy="pagination-info">
            แสดง {logs.length > 0 ? (currentPage - 1) * filters.limit + 1 : 0}{" "}
            ถึง {Math.min(currentPage * filters.limit, totalLogs)} จาก{" "}
            {totalLogs} รายการ
          </div>
          <div className="flex space-x-2">
            <button
              data-cy="previous-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!canGoToPreviousPage}
              className="px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ก่อนหน้า
            </button>
            <button
              data-cy="next-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canGoToNextPage}
              className="px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ถัดไป
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionLogs;
