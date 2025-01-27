import { useEffect, useState } from "react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Filter,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

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
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
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
  useEffect(() => {
    const fetchSprints = async () => {
      if (selectedProject !== "all" && user) {
        setIsLoading((prev) => ({ ...prev, sprints: true }));
        try {
          console.log("Fetching sprints for project:", selectedProject);
          const [sprintsResponse, sprintResultsResponse] = await Promise.all([
            dashboardApi.getSprints(selectedProject, user.token),
            dashboardApi.getSprintResults(selectedProject, user.token),
          ]);

          console.log("Sprints response:", sprintsResponse.data);
          setSprints(sprintsResponse.data);
          setSprintResults(sprintResultsResponse.data);
        } catch (error) {
          console.error(
            "Error details:",
            error.response?.data || error.message
          );
          setError(error.response?.data?.message || "Failed to load sprints");
        } finally {
          setIsLoading((prev) => ({ ...prev, sprints: false }));
        }
      }
    };
    fetchSprints();
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
      let filtered = testResults.results;

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
      setCurrentPage(1);
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
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Test Results Dashboard
        </h1>

        {renderSelectors()}

        {testResults && (
          <div>
            {/* Statistics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Summary Statistics
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Total Tests</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {totalTests}
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Passed</p>
                    <p className="text-2xl font-bold text-green-600">
                      {passedTests} ({passedPercent.toFixed(1)}%)
                    </p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">
                      {failedTests}
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {(testDuration / 1000).toFixed(2)}s
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Results Distribution
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill="#4ADE80" />
                      <Cell fill="#F87171" />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">
                  Test Results Overview
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={barChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#6366F1" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Search and Filter Bar */}
            <div className="mb-6 flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow-md">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  className="pl-10 w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  className="p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Tests</option>
                  <option value="passed">Passed Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>

            {/* Test Results List */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Test Results</h2>
                <p className="text-gray-600">
                  Showing {indexOfFirstTest + 1}-
                  {Math.min(indexOfLastTest, filteredTests.length)} of{" "}
                  {filteredTests.length} results
                </p>
              </div>

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
                      className={`border p-4 rounded-lg ${
                        allPassed
                          ? "bg-green-50 border-green-200"
                          : "bg-red-50 border-red-200"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {suiteTitle}
                          </h3>
                          <div className="mt-2 flex gap-4">
                            <span className="text-green-600">
                              ✓ {passCount} passed
                            </span>
                            {failCount > 0 && (
                              <span className="text-red-600">
                                ✗ {failCount} failed
                              </span>
                            )}
                            <span className="text-gray-600">
                              {(duration / 1000).toFixed(2)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2">
                        {tests.map((test, i) => (
                          <div
                            key={i}
                            className={`p-3 rounded-md ${
                              test.pass ? "bg-green-100" : "bg-red-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-lg ${
                                  test.pass ? "text-green-600" : "text-red-600"
                                }`}
                              >
                                {test.pass ? "✓" : "✗"}
                              </span>
                              <p className="font-medium">{test.title}</p>
                            </div>
                            <p className="text-gray-600 text-sm mt-1">
                              Duration: {(test.duration / 1000).toFixed(3)}s
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enhanced Pagination */}
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="First Page"
                >
                  <ChevronFirst className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Previous Page"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

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

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Next Page"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Last Page"
                >
                  <ChevronLast className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
