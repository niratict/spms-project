import React, { useEffect, useState, useCallback } from "react";
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
  PieChart as PieChartIcon,
  RefreshCw,
} from "lucide-react";
import SprintStackedChart from "./SprintStackedChart";
import TestResultsList from "./TestResultsList";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// API service สำหรับดึงข้อมูลแดชบอร์ด
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

export default function TestDashboard() {
  // === ส่วนจัดการ State === //
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

  // เพิ่ม state สำหรับ refresh
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // เพิ่มฟังก์ชัน refresh ที่สามารถใช้ได้กับทุก section
  const refreshData = useCallback(async () => {
    // ตรวจสอบว่ามี project ที่เลือกหรือไม่
    if (selectedProject !== "all" && user) {
      setIsRefreshing(true);
      try {
        // ดึงข้อมูลใหม่ด้วย Promise.all เหมือนเดิม
        const [sprintsResponse, sprintResultsResponse, sprintStackedResponse] =
          await Promise.all([
            dashboardApi.getSprints(selectedProject, user.token),
            dashboardApi.getSprintResults(selectedProject, user.token),
            dashboardApi.getSprintStackedChartData(selectedProject, user.token),
          ]);

        // อัปเดต state ต่างๆ
        setSprints(sprintsResponse.data);
        setSprintResults(sprintResultsResponse.data);
        setSprintStackedData(sprintStackedResponse.data);

        // หากมี sprint ที่เลือกอยู่ ให้ดึงผลการทดสอบของ sprint นั้น
        if (selectedSprint !== "all") {
          await fetchTestResults(selectedSprint);
        } else {
          await fetchAllSprintResults(selectedProject);
        }
      } catch (error) {
        console.error("Error refreshing data:", error);
        setError(
          error.response?.data?.message || "Failed to refresh dashboard data"
        );
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [selectedProject, selectedSprint, user]);

  // เรียกใช้การ refresh เมื่อ refreshTrigger เปลี่ยน
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshData();
    }
  }, [refreshTrigger, refreshData]);

  // เพิ่มปุ่ม Refresh ในส่วนของการเลือก Project และ Sprint
  const RefreshButton = () => (
    <button
      onClick={() => setRefreshTrigger((prev) => prev + 1)}
      disabled={selectedProject === "all" || isRefreshing}
      className={`p-2 sm:p-3 rounded-lg transition-all duration-300 ${
        selectedProject === "all" || isRefreshing
          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
          : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
      }`}
      title="Refresh Data"
      data-cy="refresh-dashboard"
    >
      <RefreshCw
        className={`h-4 w-4 sm:h-5 sm:w-5 ${
          isRefreshing ? "animate-spin" : ""
        }`}
      />
    </button>
  );

  // === ดึงข้อมูลโปรเจกต์เมื่อโหลดหน้า === //
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

  // === ดึงข้อมูลสถิติแดชบอร์ด === //
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

  // === ดึงข้อมูล Sprint เมื่อเลือกโปรเจกต์ === //
  useEffect(() => {
    const fetchSprintData = async () => {
      if (selectedProject !== "all" && user) {
        setIsLoading((prev) => ({ ...prev, sprints: true }));
        try {
          // ดึงข้อมูลพร้อมกัน 3 อย่าง: sprints, ผลลัพธ์, และข้อมูลแผนภูมิ
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

  // === ฟังก์ชั่นดึงผลการทดสอบทั้งหมด === //
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

  // === ฟังก์ชั่นดึงผลการทดสอบเฉพาะ Sprint === //
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

  // === ประมวลผลข้อมูลการทดสอบ === //
  const processTestResults = (data) => {
    // กรองไฟล์ที่ถูกลบออกก่อน
    const activeFiles = data.filter((file) => file.status !== "Deleted");

    const processedResults = activeFiles
      .map((file) => {
        try {
          const jsonContent = file.json_content;
          if (!jsonContent || !jsonContent.results) return null;

          // ประมวลผลชุดทดสอบทั้งหมดและการทดสอบของแต่ละชุด
          const processedTests = [];

          // ฟังก์ชั่นประมวลผลชุดทดสอบ (recursive)
          const processSuite = (suite) => {
            // เพิ่มการทดสอบจากชุดปัจจุบัน
            if (suite.tests && Array.isArray(suite.tests)) {
              processedTests.push(...suite.tests);
            }
            // ประมวลผลชุดทดสอบย่อยซ้อนในแบบ recursive
            if (suite.suites && Array.isArray(suite.suites)) {
              suite.suites.forEach(processSuite);
            }
          };

          // ประมวลผลแต่ละผลลัพธ์และชุดทดสอบของมัน
          jsonContent.results.forEach((result) => {
            if (result.suites && Array.isArray(result.suites)) {
              result.suites.forEach(processSuite);
            }
            // ตรวจสอบการทดสอบในระดับผลลัพธ์ด้วย
            if (result.tests && Array.isArray(result.tests)) {
              processedTests.push(...result.tests);
            }
          });

          return {
            id: file.file_id,
            filename: file.filename,
            projectName: file.project_name,
            sprintName: file.sprint_name,
            uploadDate: file.upload_date,
            status: file.status,
            suites: [
              {
                title: `${file.project_name} - ${file.sprint_name}`,
                tests: processedTests.map((test) => ({
                  title: test.title || "",
                  fullTitle: test.fullTitle || test.title || "",
                  duration: test.duration || 0,
                  state: test.state,
                  pass: test.state === "passed" || test.pass === true,
                  fail: test.state === "failed" || test.fail === true,
                  pending: test.pending || false,
                  skipped: test.skipped || false,
                  timedOut: test.timedOut || false,
                  err: test.err || null,
                })),
              },
            ],
          };
        } catch (error) {
          console.error(`Error processing file ${file.filename}:`, error);
          return null;
        }
      })
      .filter(Boolean);

    // คำนวณสถิติโดยรวม
    const stats = processedResults.reduce(
      (acc, result) => {
        const tests = result.suites[0]?.tests || [];
        const passedTests = tests.filter((t) => t.pass).length;
        const totalDuration = tests.reduce(
          (sum, test) => sum + (test.duration || 0),
          0
        );

        return {
          tests: acc.tests + tests.length,
          passes: acc.passes + passedTests,
          failures: acc.failures + (tests.length - passedTests),
          duration: acc.duration + totalDuration,
        };
      },
      { tests: 0, passes: 0, failures: 0, duration: 0 }
    );

    setTestResults({
      results: processedResults,
      stats: stats,
    });
    setFilteredTests(processedResults);
  };

  // === ดึงผลทดสอบเมื่อเลือกโปรเจกต์หรือ Sprint === //
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

  // === อัปเดตข้อมูลแผนภูมิเมื่อมีผลการทดสอบเปลี่ยนแปลง === //
  useEffect(() => {
    if (testResults) {
      const stats = testResults.stats;
      const totalTests = stats?.tests || 0;
      const passedTests = stats?.passes || 0;
      const failedTests = stats?.failures || 0;
      const testDuration = stats?.duration || 0;

      // อัปเดตข้อมูลแผนภูมิวงกลม
      setPieData([
        { name: "Passed", value: passedTests },
        { name: "Failed", value: failedTests },
      ]);

      // อัปเดตข้อมูลแผนภูมิแท่ง
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

  // === ใช้ตัวกรองและการค้นหาผลการทดสอบ === //
  useEffect(() => {
    if (testResults) {
      // กรองผลการทดสอบที่ถูกลบออกก่อน
      let filtered = testResults.results.filter(
        (result) => result.status !== "Deleted"
      );

      // จากนั้นใช้การค้นหาและตัวกรองสถานะ
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
      setCurrentPage(1); // รีเซ็ตกลับไปหน้าแรกเมื่อตัวกรองเปลี่ยน
    }
  }, [testResults, searchTerm, filterStatus]);

  // === ฟังก์ชั่นเปลี่ยนหน้า === //
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  // === การจัดการสถานะโหลดและข้อผิดพลาด === //
  const isPageLoading = isLoading.projects || isLoading.dashboardStats;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-xl" data-cy="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (isPageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"
          data-cy="loading-spinner"
        ></div>
      </div>
    );
  }

  // === คำนวณสถิติ === //
  const stats = testResults?.stats || dashboardStats;
  const totalTests = stats?.tests || 0;
  const passedTests = stats?.passes || 0;
  const failedTests = stats?.failures || 0;
  const passedPercent = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;
  const failedPercent = totalTests > 0 ? (failedTests / totalTests) * 100 : 0;
  const testDuration = stats?.duration || 0;

  // === คำนวณข้อมูลการแบ่งหน้า === //
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const indexOfLastTest = currentPage * itemsPerPage;
  const indexOfFirstTest = indexOfLastTest - itemsPerPage;
  const currentTests = filteredTests.slice(indexOfFirstTest, indexOfLastTest);

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 p-4 sm:p-8"
      data-cy="test-dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* หัวข้อแดชบอร์ด */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg mb-4 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-white py-4 sm:py-6 px-2 sm:px-4"
            data-cy="dashboard-title"
          >
            แดชบอร์ดแสดงผลการทดสอบ
          </h1>
        </div>

        {/* ตัวเลือกโปรเจกต์และ Sprint */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
              Select Project
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none bg-white px-4 py-3.5 rounded-xl border border-gray-200 text-gray-800 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 hover:border-blue-300 transition duration-300 ease-in-out cursor-pointer group-hover:shadow-md"
                value={selectedProject}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  setSelectedSprint("all");
                  setTestResults(null);
                }}
                data-cy="project-selector"
              >
                <option value="all" disabled>
                  Select Project
                </option>
                {projects.map((project) => (
                  <option
                    key={project.project_id}
                    value={project.project_id}
                    data-cy={`project-option-${project.project_id}`}
                  >
                    Project {project.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5">
                <div className="bg-blue-50 rounded-lg p-1.5 text-blue-600 group-hover:bg-blue-100 transition-all duration-300">
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="relative group">
            <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
              Sprint
            </label>
            <div className="relative">
              <select
                className={`w-full appearance-none px-4 py-3.5 rounded-xl border shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300 transition duration-300 ease-in-out ${
                  selectedProject === "all"
                    ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
                    : "bg-white text-gray-800 cursor-pointer border-gray-200 hover:border-blue-300 font-medium group-hover:shadow-md"
                }`}
                value={selectedSprint}
                onChange={(e) => setSelectedSprint(e.target.value)}
                disabled={selectedProject === "all"}
                data-cy="sprint-selector"
              >
                <option value="all">All Sprints</option>
                {sprints.map((sprint) => (
                  <option
                    key={sprint.sprint_id}
                    value={sprint.sprint_id}
                    data-cy={`sprint-option-${sprint.sprint_id}`}
                  >
                    {sprint.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3.5">
                <div
                  className={`rounded-lg p-1.5 transition-all duration-300 ${
                    selectedProject === "all"
                      ? "bg-gray-100 text-gray-400"
                      : "bg-blue-50 text-blue-600 group-hover:bg-blue-100"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {testResults && (
          <div className="space-y-4">
            {/* แสดงสถิติเมื่อเลือก Sprint เฉพาะ */}
            {selectedSprint !== "all" && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                data-cy="sprint-statistics"
              >
                {/* สรุปสถิติ */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h2
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center"
                      data-cy="summary-stats-title"
                    >
                      <ActivityIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 text-blue-500" />
                      สถิติสรุป
                    </h2>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                      {/* สถิติ 4 ประเภท: Total, Passed, Failed, และ Duration */}
                      {[
                        {
                          label: "Total Tests",
                          value: totalTests,
                          color: "blue",
                          Icon: CheckCircle,
                          dataCy: "total-tests",
                        },
                        {
                          label: "Passed",
                          value: `${passedTests} (${passedPercent.toFixed(
                            1
                          )}%)`,
                          color: "green",
                          Icon: CheckCircle,
                          dataCy: "passed-tests",
                        },
                        {
                          label: "Failed",
                          value: `${failedTests} (${failedPercent.toFixed(
                            1
                          )}%)`,
                          color: "red",
                          Icon: XCircle,
                          dataCy: "failed-tests",
                        },
                        {
                          label: "Duration",
                          value: `${(testDuration / 1000).toFixed(2)}s`,
                          color: "purple",
                          Icon: Clock,
                          dataCy: "test-duration",
                        },
                      ].map(({ label, value, color, Icon, dataCy }) => (
                        <div
                          key={label}
                          className={`p-2 sm:p-3 bg-${color}-50 rounded-lg flex items-center space-x-2 shadow-sm hover:shadow-md transition-all duration-300`}
                          data-cy={dataCy}
                        >
                          <Icon
                            className={`h-4 w-4 sm:h-5 sm:w-5 text-${color}-500`}
                          />
                          <div>
                            <p
                              className={`text-xs uppercase tracking-wider text-${color}-600 mb-0.5`}
                            >
                              {label}
                            </p>
                            <p
                              className={`text-sm sm:text-base md:text-lg font-bold text-${color}-700`}
                            >
                              {value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* แผนภูมิวงกลมแสดงการกระจายผลลัพธ์ */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h2
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center"
                      data-cy="pie-chart-title"
                    >
                      <PieChartIcon className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 text-green-500" />
                      การกระจายผลลัพธ์
                    </h2>
                    <div className="w-full h-48 sm:h-56 md:h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        data-cy="pie-chart-container"
                      >
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={window.innerWidth < 640 ? 40 : 60}
                            outerRadius={window.innerWidth < 640 ? 70 : 90}
                            paddingAngle={1}
                            labelLine={false}
                            label={({
                              cx,
                              cy,
                              midAngle,
                              innerRadius,
                              outerRadius,
                              percent,
                              name,
                              index,
                            }) => {
                              const RADIAN = Math.PI / 180;
                              // คำนวณตำแหน่งป้ายกำกับ
                              const radius =
                                innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x =
                                cx + radius * Math.cos(-midAngle * RADIAN);
                              const y =
                                cy + radius * Math.sin(-midAngle * RADIAN);

                              // กำหนดสไตล์ตามสถานะ passed/failed
                              const bgColor =
                                name === "Passed"
                                  ? "rgba(74, 222, 128, 0.9)"
                                  : "rgba(248, 113, 113, 0.9)";
                              const textColor = "white";

                              const content = `${name} ${(
                                percent * 100
                              ).toFixed(0)}%`;
                              const labelWidth =
                                window.innerWidth < 640 ? 70 : 80;
                              const labelHeight =
                                window.innerWidth < 640 ? 18 : 20;
                              const fontSize =
                                window.innerWidth < 640 ? "0.65rem" : "0.75rem";

                              return (
                                <>
                                  {/* สี่เหลี่ยมพื้นหลัง */}
                                  <rect
                                    x={x - labelWidth / 2}
                                    y={y - labelHeight / 2}
                                    width={labelWidth}
                                    height={labelHeight}
                                    rx="4"
                                    fill={bgColor}
                                    stroke="white"
                                    strokeWidth="0.5"
                                    className="text-label-bg"
                                    data-cy={`pie-label-${name.toLowerCase()}`}
                                  />
                                  {/* ข้อความ */}
                                  <text
                                    x={x}
                                    y={y}
                                    fill={textColor}
                                    textAnchor="middle"
                                    dominantBaseline="central"
                                    style={{ fontSize }}
                                    className="font-medium"
                                  >
                                    {content}
                                  </text>
                                </>
                              );
                            }}
                          >
                            <Cell fill="#4ADE80" data-cy="pie-cell-passed" />
                            <Cell fill="#F87171" data-cy="pie-cell-failed" />
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
                </div>

                {/* แผนภูมิแท่งแสดงภาพรวมผลการทดสอบ */}
                <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 sm:col-span-2 lg:col-span-1">
                  <div className="p-3 sm:p-4 md:p-6">
                    <h2
                      className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-center"
                      data-cy="bar-chart-title"
                    >
                      <BarChart2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 mr-2 text-indigo-500" />
                      ภาพรวมผลการทดสอบ
                    </h2>
                    <div className="w-full h-48 sm:h-56 md:h-64">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        data-cy="bar-chart-container"
                      >
                        <BarChart data={barChartData}>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            className="stroke-gray-200"
                          />
                          <XAxis
                            dataKey="name"
                            className="text-xs"
                            tick={{ fill: "rgb(55, 65, 81)" }}
                            tickSize={8}
                            height={40}
                            angle={window.innerWidth < 400 ? -45 : 0}
                            textAnchor={
                              window.innerWidth < 400 ? "end" : "middle"
                            }
                            fontSize={window.innerWidth < 640 ? 10 : 12}
                          />
                          <YAxis
                            className="text-xs"
                            tick={{ fill: "rgb(55, 65, 81)" }}
                            fontSize={window.innerWidth < 640 ? 10 : 12}
                            width={window.innerWidth < 350 ? 25 : 30}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(255,255,255,0.9)",
                              borderRadius: "12px",
                              padding: "10px",
                              fontSize:
                                window.innerWidth < 640 ? "12px" : "14px",
                            }}
                          />
                          <Bar
                            dataKey="value"
                            fill="#6366F1"
                            radius={[8, 8, 0, 0]}
                            barSize={
                              window.innerWidth < 400
                                ? 25
                                : window.innerWidth < 640
                                ? 30
                                : 40
                            }
                            data-cy="bar-chart-bars"
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

                              return (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={color}
                                  data-cy={`bar-cell-${entry.name
                                    .toLowerCase()
                                    .replace(/\s+/g, "-")}`}
                                />
                              );
                            })}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div
                      className="mt-2 sm:mt-3 text-center text-xs sm:text-sm text-gray-600"
                      data-cy="bar-chart-summary"
                    >
                      รายละเอียดของ {totalTests} การทดสอบ:
                      {` ${passedTests} ผ่าน (${passedPercent.toFixed(1)}%), 
${failedTests} ผิดพลาด, ระยะเวลารวม ${(testDuration / 1000).toFixed(2)} วินาที`}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* แสดงแผนภูมิแบบซ้อนเมื่อดูทุก Sprint */}
            {selectedSprint === "all" && sprintResults && (
              <div
                className="bg-white rounded-xl shadow-md p-6 mb-6"
                data-cy="sprint-stacked-chart-container"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-4 text-gray-800 flex items-center"
                  data-cy="sprint-chart-title"
                >
                  <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-blue-500" />
                  ภาพรวมผลการทดสอบแบ่งตาม Sprint
                </h2>
                {/* แสดงแผนภูมิแบบซ้อนสำหรับการเปรียบเทียบ Sprint */}
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
                  data-cy="sprint-stacked-chart"
                />
              </div>
            )}

            {/* ส่วนค้นหาและกรองผลการทดสอบ */}
            <div
              className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6"
              data-cy="search-filter-container"
            >
              <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
                {/* ช่องค้นหาผลการทดสอบ */}
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
                {/* ตัวกรองสถานะการทดสอบ */}
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
                <RefreshButton />
              </div>
            </div>

            {/* แสดงรายการผลการทดสอบ */}
            <div
              className="bg-white rounded-xl shadow-md p-4 sm:p-5 md:p-6 mt-4"
              data-cy="test-results-container"
            >
              {/* แสดงจำนวนผลลัพธ์ที่พบ */}
              <div
                className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4"
                data-cy="results-summary"
              >
                พบผลการทดสอบทั้งหมด {filteredTests.length} รายการ
              </div>

              {/* รายการผลการทดสอบ */}
              <div className="space-y-3 sm:space-y-4">
                {currentTests.length === 0 ? (
                  // แสดงเมื่อไม่พบข้อมูล
                  <div
                    className="p-4 sm:p-6 text-center text-gray-500 text-sm sm:text-base"
                    data-cy="no-results-message"
                  >
                    ไม่พบผลการทดสอบที่ตรงกับเงื่อนไข
                  </div>
                ) : (
                  // วนลูปแสดงผลการทดสอบแต่ละรายการ
                  currentTests.map((result, index) => {
                    const tests = result.suites[0]?.tests || [];
                    const passCount = tests.filter((test) => test.pass).length;
                    const failCount = tests.length - passCount;
                    const totalTests = tests.length;
                    const duration = tests.reduce(
                      (sum, test) => sum + (test.duration || 0),
                      0
                    );
                    const allPassed = failCount === 0;

                    return (
                      <div
                        key={index}
                        className={`border-l-4 p-3 sm:p-4 rounded-lg ${
                          allPassed
                            ? "border-green-500 bg-green-50"
                            : "border-red-500 bg-red-50"
                        }`}
                        data-cy={`test-result-item-${index}`}
                      >
                        {/* หัวข้อผลการทดสอบ */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                          <div className="w-full sm:w-auto">
                            <h3
                              className="text-base sm:text-lg font-semibold text-gray-800 break-words"
                              data-cy={`test-result-title-${index}`}
                            >
                              {result.projectName} - {result.sprintName}
                            </h3>
                            <p
                              className="text-xs sm:text-sm text-gray-600 break-words"
                              data-cy={`test-result-filename-${index}`}
                            >
                              ชื่อไฟล์ทดสอบ: {result.filename}
                            </p>
                          </div>
                          {/* แสดงสถิติการทดสอบ */}
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                            <span
                              className="text-xs sm:text-sm text-gray-700 flex items-center bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm"
                              data-cy={`test-count-${index}`}
                            >
                              <FileCode className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {totalTests} กรณีทดสอบ
                              </span>
                            </span>
                            {/* แสดงสถานะการทดสอบ */}
                            <span
                              className={`text-xs sm:text-sm flex items-center px-2 sm:px-3 py-1 rounded-full shadow-sm ${
                                allPassed
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                              data-cy={`test-status-${index}`}
                            >
                              {allPassed ? (
                                <>
                                  <CheckCircle2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    ผ่านทั้งหมด
                                  </span>
                                </>
                              ) : (
                                <>
                                  <XCircle className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                  <span className="whitespace-nowrap">
                                    ผิดพลาด {failCount} กรณี
                                  </span>
                                </>
                              )}
                            </span>
                            {/* แสดงเวลาที่ใช้ในการทดสอบ */}
                            <span
                              className="text-xs sm:text-sm text-gray-700 flex items-center bg-white px-2 sm:px-3 py-1 rounded-full shadow-sm"
                              data-cy={`test-duration-${index}`}
                            >
                              <Clock className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                              <span className="whitespace-nowrap">
                                {(duration / 1000).toFixed(2)}s
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* รายละเอียดผลการทดสอบ */}
                        <TestResultsList
                          tests={tests}
                          data-cy={`test-details-list-${index}`}
                        />
                      </div>
                    );
                  })
                )}
              </div>

              {/* ส่วนการแบ่งหน้า (Pagination) */}
              {totalPages > 0 && (
                <div
                  className="mt-4 sm:mt-6 flex justify-center items-center gap-1 sm:gap-2 flex-wrap"
                  data-cy="pagination-container"
                >
                  {/* ปุ่มไปหน้าแรก */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หน้าแรก"
                    data-cy="pagination-first"
                  >
                    <ChevronFirst className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* ปุ่มย้อนกลับ */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หน้าก่อนหน้า"
                    data-cy="pagination-prev"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* แสดงหมายเลขหน้า */}
                  <div className="flex items-center gap-1 flex-wrap">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      // คำนวณหมายเลขหน้าที่จะแสดง
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
                          className={`w-6 h-6 sm:w-8 sm:h-8 text-xs sm:text-sm rounded-md ${
                            currentPage === pageNum
                              ? "bg-blue-500 text-white"
                              : "hover:bg-gray-100"
                          }`}
                          data-cy={`pagination-page-${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* ปุ่มไปหน้าถัดไป */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หน้าถัดไป"
                    data-cy="pagination-next"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>

                  {/* ปุ่มไปหน้าสุดท้าย */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 sm:p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="หน้าสุดท้าย"
                    data-cy="pagination-last"
                  >
                    <ChevronLast className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              )}

              {/* แสดงข้อมูลการแบ่งหน้า */}
              {totalPages > 0 && (
                <div
                  className="mt-2 text-center text-xs sm:text-sm text-gray-600"
                  data-cy="pagination-info"
                >
                  หน้า {currentPage} จาก {totalPages} ({filteredTests.length}{" "}
                  รายการ)
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
