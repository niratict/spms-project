import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Filter,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  FileCode,
  CheckCircle,
  BarChart2,
  Clock,
  ActivityIcon,
  CheckCircle2,
  XCircle,
  PieChart as PieChartIcon, // Add this line
} from "lucide-react";
import SprintStackedChart from "./SprintStackedChart";
import TestResultsList from "./TestResultsList";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// API service for dashboard
const dashboardApi = {
  getProjects: (token) =>
    axios.get(`${API_BASE_URL}/api/dashboard/projects`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSprints: (projectId, token) =>
    axios.get(`${API_BASE_URL}/api/dashboard/projects/${projectId}/sprints`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDashboardStats: (token) =>
    axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getSprintTestFiles: (sprintId, token) =>
    axios.get(`${API_BASE_URL}/api/dashboard/test-files/${sprintId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAllTestResults: (projectId, token) =>
    axios.get(
      `${API_BASE_URL}/api/dashboard/projects/${projectId}/all-test-results`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  getSprintResults: (projectId, token) =>
    axios.get(
      `${API_BASE_URL}/api/dashboard/projects/${projectId}/sprint-results`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),

  getSprintStackedChartData: (projectId, token) =>
    axios.get(
      `${API_BASE_URL}/api/dashboard/projects/${projectId}/sprint-stacked-chart`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    ),
};

// Custom PieChart Component
const TestResultsPieChart = ({ passed, failed }) => {
  const data = [
    { name: "Passed", value: passed },
    { name: "Failed", value: failed },
  ];

  const COLORS = ["#4ADE80", "#F87171"];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="font-medium">{`${payload[0].name}: ${payload[0].value} tests`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={barChartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
          <XAxis
            dataKey="name"
            className="text-sm"
            tick={{ fill: "rgb(55, 65, 81)" }}
          />
          <YAxis className="text-sm" tick={{ fill: "rgb(55, 65, 81)" }} />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white shadow-lg rounded-lg p-4 border border-gray-200">
                    <div className="text-gray-800 font-semibold mb-2">
                      {payload[0].name}
                    </div>
                    <div className="text-gray-600">
                      Value: {payload[0].value.toLocaleString()}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="value"
            fill="#6366F1"
            radius={[8, 8, 0, 0]}
            barSize={40}
          >
            {barChartData.map((entry, index) => {
              const color =
                entry.name === "Passed"
                  ? "bg-green-500"
                  : entry.name === "Failed"
                  ? "bg-red-500"
                  : entry.name === "Total Tests"
                  ? "bg-blue-500"
                  : "bg-purple-500";

              return <Cell key={`cell-${index}`} fill={`${color}`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default function TestDashboard() {
  // State Management
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState("all");
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState("all");
  const [dashboardStats, setDashboardStats] = useState(null);
  const [sprintResults, setSprintResults] = useState([]);
  const [testResults, setTestResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredTests, setFilteredTests] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barChartData, setBarChartData] = useState([]);
  const [sprintStackedData, setSprintStackedData] = useState([]);
  const [isLoading, setIsLoading] = useState({
    projects: true,
    dashboardStats: true,
    sprints: false,
    testResults: false,
    sprintResults: true,
  });
  const [error, setError] = useState(null);
  const itemsPerPage = 3;

  // Fetch Projects
  useEffect(() => {
    const fetchProjects = async () => {
      if (!user) return;

      try {
        const response = await dashboardApi.getProjects(user.token);
        setProjects(response.data);
      } catch (error) {
        console.error("Error fetching projects:", error);
        setError(error.response?.data?.message || "Failed to load projects");
      } finally {
        setIsLoading((prev) => ({ ...prev, projects: false }));
      }
    };
    fetchProjects();
  }, [user]);

  // Fetch Sprints
  // แก้ไข useEffect ที่ทำงานเมื่อ selectedProject เปลี่ยน
  useEffect(() => {
    const fetchSprintData = async () => {
      if (selectedProject !== "all" && user) {
        setIsLoading((prev) => ({ ...prev, sprints: true }));
        try {
          const [
            sprintsResponse,
            sprintResultsResponse,
            sprintStackedResponse,
          ] = await Promise.all([
            dashboardApi.getSprints(selectedProject, user.token),
            dashboardApi.getSprintResults(selectedProject, user.token),
            dashboardApi.getSprintStackedChartData(selectedProject, user.token),
          ]);

          setSprints(sprintsResponse.data);
          setSprintResults(sprintResultsResponse.data);
          setSprintStackedData(sprintStackedResponse.data);
        } catch (error) {
          console.error(
            "Error details:",
            error.response?.data || error.message
          );
          setError(
            error.response?.data?.message || "Failed to load sprint data"
          );
        } finally {
          setIsLoading((prev) => ({ ...prev, sprints: false }));
        }
      }
    };
    fetchSprintData();
  }, [selectedProject, user]);

  // Fetch Dashboard Stats
  useEffect(() => {
    const fetchDashboardStats = async () => {
      if (!user) return;

      try {
        const response = await dashboardApi.getDashboardStats(user.token);
        setDashboardStats(response.data);
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setError(
          error.response?.data?.message || "Failed to load dashboard statistics"
        );
      } finally {
        setIsLoading((prev) => ({ ...prev, dashboardStats: false }));
      }
    };
    fetchDashboardStats();
  }, [user]);

  // Fetch Test Results Functions
  const fetchAllSprintResults = async (projectId) => {
    if (!user) return;

    setIsLoading((prev) => ({ ...prev, testResults: true }));
    try {
      const response = await dashboardApi.getAllTestResults(
        projectId,
        user.token
      );
      processTestResults(response.data);
    } catch (error) {
      console.error("Error fetching all sprint results:", error);
      setError(error.response?.data?.message || "Failed to load test results");
    } finally {
      setIsLoading((prev) => ({ ...prev, testResults: false }));
    }
  };

  const fetchTestResults = async (sprintId) => {
    if (!user) return;

    setIsLoading((prev) => ({ ...prev, testResults: true }));
    try {
      const response = await dashboardApi.getSprintTestFiles(
        sprintId,
        user.token
      );
      processTestResults(response.data);
    } catch (error) {
      console.error("Error fetching test results:", error);
      setError(error.response?.data?.message || "Failed to load test results");
    } finally {
      setIsLoading((prev) => ({ ...prev, testResults: false }));
    }
  };

  // Process Test Results
  const processTestResults = (data) => {
    const processedResults = data
      .map((file) => {
        try {
          const jsonContent = file.json_content;
          return {
            id: file.id,
            filename: file.filename,
            projectName: file.project_name,
            sprintName: file.sprint_name,
            uploadDate: file.upload_date,
            status: file.status,
            suites: jsonContent
              ? [
                  {
                    title: `${file.project_name} - ${file.sprint_name}`,
                    tests: jsonContent.results[0].suites[0].tests || [],
                  },
                ]
              : [],
          };
        } catch (error) {
          console.error(`Error processing file ${file.filename}:`, error);
          return null;
        }
      })
      .filter(Boolean);

    // Calculate statistics
    const totalTests = processedResults.reduce(
      (acc, result) => acc + result.suites[0]?.tests?.length || 0,
      0
    );
    const passedTests = processedResults.reduce(
      (acc, result) =>
        acc + (result.suites[0]?.tests?.filter((t) => t.pass)?.length || 0),
      0
    );
    const totalDuration = processedResults.reduce(
      (acc, result) =>
        acc +
          result.suites[0]?.tests?.reduce(
            (sum, test) => sum + (test.duration || 0),
            0
          ) || 0,
      0
    );

    setTestResults({
      results: processedResults,
      stats: {
        tests: totalTests,
        passes: passedTests,
        failures: totalTests - passedTests,
        duration: totalDuration,
      },
    });
    setFilteredTests(processedResults);
  };

  // Handle Project and Sprint Selection
  useEffect(() => {
    if (selectedProject !== "all") {
      if (selectedSprint === "all") {
        fetchAllSprintResults(selectedProject);
      } else {
        fetchTestResults(selectedSprint);
      }
    } else {
      setTestResults(null);
      setFilteredTests([]);
    }
  }, [selectedProject, selectedSprint]);

  // Update chart data when test results change
  useEffect(() => {
    if (testResults) {
      const stats = testResults.stats;
      const totalTests = stats?.tests || 0;
      const passedTests = stats?.passes || 0;
      const failedTests = stats?.failures || 0;
      const testDuration = stats?.duration || 0;

      setPieData([
        { name: "Passed", value: passedTests },
        { name: "Failed", value: failedTests },
      ]);

      setBarChartData([
        { name: "Total Tests", value: totalTests },
        { name: "Passed", value: passedTests },
        { name: "Failed", value: failedTests },
        {
          name: "Duration (s)",
          value: Number((testDuration / 1000).toFixed(2)),
        },
      ]);
    }
  }, [testResults]);

  // Filter Handling
  useEffect(() => {
    if (testResults) {
      // First filter out deleted records
      let filtered = testResults.results.filter(
        (result) => result.status !== "Deleted"
      );

      // Then apply search and status filters
      if (searchTerm) {
        filtered = filtered.filter(
          (result) =>
            result.suites[0]?.title
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            result.suites[0]?.tests.some((test) =>
              test.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
        );
      }

      if (filterStatus !== "all") {
        filtered = filtered.filter((result) => {
          const tests = result.suites[0]?.tests || [];
          if (filterStatus === "passed") {
            return tests.every((test) => test.pass);
          } else {
            return tests.some((test) => !test.pass);
          }
        });
      }

      setFilteredTests(filtered);
      setCurrentPage(1); // Reset to first page when filters change
    }
  }, [testResults, searchTerm, filterStatus]);

  // Pagination Function
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // Loading and Error Handling
  const isPageLoading = isLoading.projects || isLoading.dashboardStats;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl">{error}</div>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Calculate Statistics
  const stats = testResults?.stats || dashboardStats;
  const totalTests = stats?.tests || 0;
  const passedTests = stats?.passes || 0;
  const failedTests = stats?.failures || 0;
  const passedPercent = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const failedPercent = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;
  const testDuration = stats?.duration || 0;

  // Pagination Calculations
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const indexOfLastTest = currentPage * itemsPerPage;
  const indexOfFirstTest = indexOfLastTest - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstTest, indexOfLastTest);

  // Render Project and Sprint Selectors
  const renderSelectors = () => (
    <div className="flex gap-4 mb-6 bg-white p-4 rounded-lg shadow-md">
      <select
        value={selectedProject}
        onChange={(e) => {
          setSelectedProject(e.target.value);
          setSelectedSprint("all");
          setTestResults(null);
        }}
      >
        <option value="all">Select Project</option>
        {projects.map((project) => (
          <option key={project.project_id} value={project.project_id}>
            {project.name}
          </option>
        ))}
      </select>

      <select
        className="p-2 border rounded-md"
        value={selectedSprint}
        onChange={(e) => setSelectedSprint(e.target.value)}
        disabled={selectedProject === "all"}
      >
        <option value="all">All Sprints</option>
        {sprints.map((sprint) => (
          <option key={sprint.sprint_id} value={sprint.sprint_id}>
            {sprint.name}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-center text-white py-6 px-4">
            Test Results Dashboard
          </h1>
        </div>

        {/* Project and Sprint Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setSelectedSprint("all");
              setTestResults(null);
            }}
          >
            <option value="all">Select Project</option>
            {projects.map((project) => (
              <option key={project.project_id} value={project.project_id}>
                {project.name}
              </option>
            ))}
          </select>

          <select
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
            value={selectedSprint}
            onChange={(e) => setSelectedSprint(e.target.value)}
            disabled={selectedProject === "all"}
          >
            <option value="all">All Sprints</option>
            {sprints.map((sprint) => (
              <option key={sprint.sprint_id} value={sprint.sprint_id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </div>

        {testResults && (
          <div className="space-y-4 sm:space-y-6">
            {/* Statistics Grid */}
            {/* Conditional rendering based on sprint selection */}
            {selectedSprint !== "all" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Summary Statistics */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center">
                      <ActivityIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-500" />
                      Summary Statistics
                    </h2>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {[
                        {
                          label: "Total Tests",
                          value: totalTests,
                          color: "blue",
                          Icon: CheckCircle,
                        },
                        {
                          label: "Passed",
                          value: `${passedTests} (${passedPercent.toFixed(
                            1
                          )}%)`,
                          color: "green",
                          Icon: CheckCircle,
                        },
                        {
                          label: "Failed",
                          value: `${failedTests} (${failedPercent.toFixed(
                            1
                          )}%)`,
                          color: "red",
                          Icon: XCircle,
                        },
                        {
                          label: "Duration",
                          value: `${(testDuration / 1000).toFixed(2)}s`,
                          color: "purple",
                          Icon: Clock,
                        },
                      ].map(({ label, value, color, Icon }) => (
                        <div
                          key={label}
                          className={`p-3 sm:p-4 bg-${color}-50 rounded-lg flex items-center space-x-2 sm:space-x-3 shadow-sm hover:shadow-md transition-all duration-300`}
                        >
                          <Icon
                            className={`h-5 w-5 sm:h-6 sm:w-6 text-${color}-500`}
                          />
                          <div>
                            <p
                              className={`text-xs uppercase tracking-wider text-${color}-600 mb-1`}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-base sm:text-xl font-bold text-${color}-700`}
                            >
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Results Distribution Pie Chart */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center">
                      <PieChartIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-green-500" />
                      Results Distribution
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={1}
                          label={({ name, percent }) =>
                            `${name} ${(percent * 100).toFixed(0)}%`
                          }
                        >
                          <Cell fill="#4ADE80" />
                          <Cell fill="#F87171" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            borderRadius: "12px",
                            padding: "10px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Test Results Overview Bar Chart */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2">
                  <div className="p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center">
                      <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-indigo-500" />
                      Test Results Overview
                    </h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={barChartData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="stroke-gray-200"
                        />
                        <XAxis
                          dataKey="name"
                          className="text-xs sm:text-sm"
                          tick={{ fill: "rgb(55, 65, 81)" }}
                        />
                        <YAxis
                          className="text-xs sm:text-sm"
                          tick={{ fill: "rgb(55, 65, 81)" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255,255,255,0.9)",
                            borderRadius: "12px",
                            padding: "10px",
                          }}
                        />
                        <Bar
                          dataKey="value"
                          fill="#6366F1"
                          radius={[8, 8, 0, 0]}
                          barSize={40}
                        >
                          {barChartData.map((entry, index) => {
                            const color =
                              entry.name === "Passed"
                                ? "#4ADE80"
                                : entry.name === "Failed"
                                ? "#F87171"
                                : entry.name === "Total Tests"
                                ? "#3B82F6"
                                : "#8B5CF6";

                            return <Cell key={`cell-${index}`} fill={color} />;
                          })}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 sm:mt-4 text-center text-xs sm:text-sm text-gray-600">
                      Breakdown of {totalTests} tests:
                      {` ${passedTests} passed (${passedPercent.toFixed(1)}%), 
            ${failedTests} failed, total duration ${(
                        testDuration / 1000
                      ).toFixed(2)}s`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* เพิ่ม SprintStackedChart ตรงนี้ */}
            {selectedSprint === "all" && sprintResults && (
              <SprintStackedChart
                sprintResults={sprintStackedData.map((sprint) => ({
                  sprint_name: sprint.sprintName,
                  startDate: sprint.startDate,
                  endDate: sprint.endDate,
                  suites: [
                    {
                      tests: Array(sprint.totalTests)
                        .fill()
                        .map((_, index) => ({
                          pass: index < sprint.passedTests,
                        })),
                    },
                  ],
                }))}
              />
            )}

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tests..."
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-400" />
                  <select
                    className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Tests</option>
                    <option value="passed">Passed Only</option>
                    <option value="failed">Failed Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Test Results List */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="space-y-4">
                {currentTests.map((result, index) => {
                  const suiteTitle = result.suites[0]?.title;
                  const tests = result.suites[0]?.tests || [];
                  const passCount = tests.filter((test) => test.pass).length;
                  const failCount = tests.length - passCount;
                  const duration = tests.reduce(
                    (sum, test) => sum + (test.duration || 0),
                    0
                  );
                  const allPassed = failCount === 0;
                  return (
                    <div
                      key={index}
                      className={`border-l-4 p-4 rounded-lg ${
                        allPassed
                          ? "border-green-500 bg-green-50"
                          : "border-red-500 bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {suiteTitle}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Story: {result.filename}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 flex items-center">
                            <CheckCircle className="mr-1 h-4 w-4" />
                            {passCount} passed
                          </span>
                          {failCount > 0 && (
                            <span className="text-red-600 flex items-center">
                              <XCircle className="mr-1 h-4 w-4" />
                              {failCount} failed
                            </span>
                          )}
                        </div>
                      </div>

                      <TestResultsList tests={tests} />
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <div className="mt-6 flex justify-center items-center gap-2">
                {[
                  {
                    icon: ChevronFirst,
                    action: () => goToPage(1),
                    disabled: currentPage === 1,
                    title: "First Page",
                  },
                  {
                    icon: ChevronLeft,
                    action: () => goToPage(currentPage - 1),
                    disabled: currentPage === 1,
                    title: "Previous Page",
                  },
                ].map(({ icon: Icon, action, disabled, title }) => (
                  <button
                    key={title}
                    onClick={action}
                    disabled={disabled}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum =
                      totalPages <= 5
                        ? i + 1
                        : currentPage <= 3
                        ? i + 1
                        : currentPage >= totalPages - 2
                        ? totalPages - 4 + i
                        : currentPage - 2 + i;

                    return (
                      <button
                        key={i}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-500 text-white"
                            : "hover:bg-gray-100"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                {[
                  {
                    icon: ChevronRight,
                    action: () => goToPage(currentPage + 1),
                    disabled: currentPage === totalPages,
                    title: "Next Page",
                  },
                  {
                    icon: ChevronLast,
                    action: () => goToPage(totalPages),
                    disabled: currentPage === totalPages,
                    title: "Last Page",
                  },
                ].map(({ icon: Icon, action, disabled, title }) => (
                  <button
                    key={title}
                    onClick={action}
                    disabled={disabled}
                    className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={title}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
