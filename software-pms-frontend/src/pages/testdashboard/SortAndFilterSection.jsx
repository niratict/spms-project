import React, { useState } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const SortAndFilterSection = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onRefresh,
}) => {
  // State for sorting options
  const [sortOption, setSortOption] = useState("latest");
  const [sortDirection, setSortDirection] = useState("desc");

  // Sorting options
  const sortOptions = [
    { value: "latest", label: "อัปโหลดล่าสุด" },
    { value: "oldest", label: "อัปโหลดเก่าสุด" },
    { value: "filename", label: "ชื่อไฟล์" },
  ];

  const handleSortChange = (option) => {
    if (option === sortOption) {
      // Toggle sort direction if same option is selected
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortOption(option);
      setSortDirection("desc"); // Default to descending for new sort
    }

    // TODO: Add actual sorting logic in parent component
    // You'll need to pass down a function to handle sorting
  };

  return (
    <div
      className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6"
      data-cy="search-filter-container"
    >
      <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
        {/* Search Input */}
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาไฟล์ทดสอบ..."
            className="w-full pl-9 sm:pl-10 p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-cy="search-input"
          />
        </div>

        {/* Sorting Dropdown */}
        <div className="flex items-center gap-2 sm:min-w-[160px]">
          <ArrowUpDown className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
          <div className="relative w-full">
            <select
              className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300 appearance-none pr-8"
              value={sortOption}
              onChange={(e) => handleSortChange(e.target.value)}
              data-cy="sort-select"
            >
              {sortOptions.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  data-cy={`sort-option-${option.value}`}
                >
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={() =>
                setSortDirection(sortDirection === "asc" ? "desc" : "asc")
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              title={
                sortDirection === "asc"
                  ? "เรียงจากน้อยไปมาก"
                  : "เรียงจากมากไปน้อย"
              }
              data-cy="sort-direction-toggle"
            >
              {sortDirection === "asc" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 sm:min-w-[140px]">
          <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0" />
          <select
            className="w-full p-2 sm:p-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            data-cy="status-filter"
          >
            <option value="all" data-cy="filter-option-all">
              ทั้งหมด
            </option>
            <option value="passed" data-cy="filter-option-passed">
              เฉพาะที่ผ่าน
            </option>
            <option value="failed" data-cy="filter-option-failed">
              เฉพาะที่ผิดพลาด
            </option>
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center">
          <button
            onClick={onRefresh}
            className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition duration-300 flex items-center justify-center"
            title="รีเฟรชข้อมูล"
            data-cy="refresh-button"
          >
            <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SortAndFilterSection;
