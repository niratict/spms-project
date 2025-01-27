import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  FileText,
  Calendar,
  Upload,
  Check,
  X,
  Clock,
  Search,
  Layers,
  Target,
  BarChart2,
  Folder,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TestFiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [projects, setProjects] = useState([]);
  const [sprints, setSprints] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [testFiles, setTestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // ตรวจสอบว่ามี projects แล้วและมีการเก็บ project ใน localStorage
    if (projects.length > 0) {
      const storedProject = localStorage.getItem("selectedProject");
      const storedSprint = localStorage.getItem("selectedSprint");

      if (storedProject) {
        const parsedProject = JSON.parse(storedProject);
        const matchedProject = projects.find(
          (p) => p.project_id === parsedProject.project_id
        );

        if (matchedProject) {
          setSelectedProject(matchedProject);

          // หากมี sprint ที่เก็บไว้ ให้ค้นหา sprint ที่ตรงกันใน project ปัจจุบัน
          if (storedSprint && sprints.length > 0) {
            const parsedSprint = JSON.parse(storedSprint);
            const matchedSprint = sprints.find(
              (s) => s.sprint_id === parsedSprint.sprint_id
            );

            if (matchedSprint) {
              setSelectedSprint(matchedSprint);
            }
          }
        }
      }
    }
  }, [projects, sprints]);

  useEffect(() => {
    // เพิ่ม event listener สำหรับการเปลี่ยนเส้นทาง
    const handleRouteChange = () => {
      const currentPath = window.location.pathname;

      // ล้าง localStorage เฉพาะเมื่อออกจากหน้า test-files
      if (!currentPath.includes("/test-files")) {
        localStorage.removeItem("selectedProject");
        localStorage.removeItem("selectedSprint");
      }
    };

    // เพิ่มและลบ event listener
    window.addEventListener("popstate", handleRouteChange);

    return () => {
      window.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };

    if (user) fetchProjects();
  }, [user]);

  // Fetch sprints for selected project
  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProject) {
        setSprints([]);
        return;
      }

      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/sprints?project_id=${selectedProject.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setSprints(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprints");
      }
    };

    fetchSprints();
  }, [selectedProject, user]);

  // Fetch test files for selected sprint
  useEffect(() => {
    const fetchTestFiles = async () => {
      if (!selectedSprint) {
        setTestFiles([]);
        return;
      }

      try {
        setLoading(true);
        const queryParams = new URLSearchParams({
          sprint_id: selectedSprint.sprint_id,
          filename: searchTerm,
        }).toString();

        const [filesResponse, statsResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/test-files?${queryParams}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(
            `${API_BASE_URL}/api/test-files/stats?sprint_id=${selectedSprint.sprint_id}`,
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          ),
        ]);

        setTestFiles(filesResponse.data);
        setStats(statsResponse.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch test files");
      } finally {
        setLoading(false);
      }
    };

    if (selectedSprint) {
      fetchTestFiles();
    }
  }, [selectedSprint, searchTerm, user]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedSprint(null);
    localStorage.setItem("selectedProject", JSON.stringify(project));
    localStorage.removeItem("selectedSprint");

    // Clear location state to prevent interference
    navigate(".", { replace: true, state: {} });
  };

  const handleSprintSelect = (sprint) => {
    setSelectedSprint(sprint);
    localStorage.setItem("selectedSprint", JSON.stringify(sprint));

    // Clear location state to prevent interference
    navigate(".", { replace: true, state: {} });
  };
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCreateTestFile = () => {
    if (selectedSprint) {
      navigate(`/test-files/create/${selectedSprint.sprint_id}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pass":
        return <Check className="w-5 h-5 text-green-500" />;
      case "Fail":
        return <X className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 flex items-center">
            <Layers className="w-10 h-10 mr-4 text-blue-600" />
            Test Files Management
          </h1>
        </div>

        {/* Projects Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Folder className="w-6 h-6 mr-3 text-blue-500" />
            Select Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.project_id}
                onClick={() => handleProjectSelect(project)}
                className={`
                  cursor-pointer 
                  border-2 rounded-lg p-5 
                  transition-all duration-300 
                  hover:shadow-lg
                  ${
                    selectedProject?.project_id === project.project_id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 hover:border-blue-300"
                  }
                `}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {project.name}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sprints Section */}
        {selectedProject && (
          <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Target className="w-6 h-6 mr-3 text-green-500" />
              Select Sprint for {selectedProject.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sprints.map((sprint) => (
                <div
                  key={sprint.sprint_id}
                  onClick={() => handleSprintSelect(sprint)}
                  className={`
                    cursor-pointer 
                    border-2 rounded-lg p-5 
                    transition-all duration-300 
                    hover:shadow-lg
                    ${
                      selectedSprint?.sprint_id === sprint.sprint_id
                        ? "border-green-500 bg-green-50 shadow-md"
                        : "border-gray-200 hover:border-green-300"
                    }
                  `}
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {sprint.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Files & Stats Section */}
        {selectedSprint && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  icon: <FileText className="w-8 h-8 text-blue-500" />,
                  value: stats?.total_files || 0,
                  label: "Total Files",
                },
                {
                  icon: <Check className="w-8 h-8 text-green-500" />,
                  value: stats?.passed_files || 0,
                  label: "Passed Files",
                },
                {
                  icon: <X className="w-8 h-8 text-red-500" />,
                  value: stats?.failed_files || 0,
                  label: "Failed Files",
                },
                {
                  icon: <BarChart2 className="w-8 h-8 text-purple-500" />,
                  value: `${stats?.pass_rate || 0}%`,
                  label: "Pass Rate",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-md p-6 flex items-center space-x-4 hover:shadow-lg transition-all"
                >
                  {stat.icon}
                  <div>
                    <div className="text-3xl font-bold text-gray-800">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Test Files Header */}
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800">
                Test Files for {selectedSprint.name}
              </h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search test files..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <Search className="absolute left-3 top-3 text-gray-400" />
                </div>
                <button
                  onClick={handleCreateTestFile}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Upload className="w-5 h-5" />
                  Upload Test File
                </button>
              </div>
            </div>

            {/* Test Files Grid */}
            {loading ? (
              <div className="text-center text-gray-600 py-12">
                Loading test files...
              </div>
            ) : testFiles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-600 mb-6">
                  No test files found for this sprint
                </p>
                <button
                  onClick={handleCreateTestFile}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Upload First Test File
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {testFiles.map((file) => (
                  <div
                    key={file.file_id}
                    className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {file.filename}
                        </h3>
                        {getStatusIcon(file.status)}
                      </div>
                      <div className="space-y-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          <span>{(file.file_size / 1024).toFixed(2)} KB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(file.upload_date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate(`/test-files/${file.file_id}`)}
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestFiles;
