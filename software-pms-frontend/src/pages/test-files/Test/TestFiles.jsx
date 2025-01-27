import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  FileText,
  Calendar,
  Upload,
  Check,
  X,
  Clock,
  Search,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const TestFiles = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [selectedSprint, setSelectedSprint] = useState(null);
  const [testFiles, setTestFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    setSelectedSprint(null); // ล้าง Sprint เมื่อเปลี่ยน Project
    localStorage.setItem("selectedProject", JSON.stringify(project)); // เก็บ Project ใน localStorage
    localStorage.removeItem("selectedSprint"); // ล้าง Sprint ใน localStorage
    navigate(".", { replace: true, state: {} });
  };

  const handleSprintSelect = (sprint) => {
    setSelectedSprint(sprint);
    localStorage.setItem("selectedSprint", JSON.stringify(sprint)); // เก็บ Sprint ใน localStorage
    navigate(".", { replace: true, state: {} });
  };

  useEffect(() => {
    // โหลดข้อมูลจาก localStorage เมื่อหน้า Sprint.jsx ถูกโหลด
    const savedProject = localStorage.getItem("selectedProject");
    const savedSprint = localStorage.getItem("selectedSprint");
    if (savedProject) setSelectedProject(JSON.parse(savedProject));
    if (savedSprint) setSelectedSprint(JSON.parse(savedSprint));
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);

        // If there's a saved project, find and select it from the fetched projects
        const savedProject = localStorage.getItem("selectedProject");
        if (savedProject) {
          const parsed = JSON.parse(savedProject);
          const foundProject = response.data.find(
            (p) => p.project_id === parsed.project_id
          );
          if (foundProject) {
            setSelectedProject(foundProject);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };

    if (user) fetchProjects();
  }, [user]);

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

        // If there's a saved sprint, find and select it from the fetched sprints
        const savedSprint = localStorage.getItem("selectedSprint");
        if (savedSprint) {
          const parsed = JSON.parse(savedSprint);
          const foundSprint = response.data.find(
            (s) => s.sprint_id === parsed.sprint_id
          );
          if (foundSprint) {
            setSelectedSprint(foundSprint);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprints");
      }
    };

    fetchSprints();
  }, [selectedProject, user]);

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
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Files</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Select Project</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.project_id}
              onClick={() => handleProjectSelect(project)}
              className={`p-4 rounded-lg border transition-all ${
                selectedProject?.project_id === project.project_id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Select Sprint</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sprints.map((sprint) => (
              <button
                key={sprint.sprint_id}
                onClick={() => handleSprintSelect(sprint)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedSprint?.sprint_id === sprint.sprint_id
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <h3 className="font-semibold">{sprint.name}</h3>
                <div className="text-sm text-gray-600 mt-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(sprint.start_date).toLocaleDateString()} -{" "}
                      {new Date(sprint.end_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedSprint && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-semibold">
              Test Files for {selectedSprint.name}
            </h2>
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-grow md:flex-grow-0">
                <input
                  type="text"
                  placeholder="Search test files..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full md:w-64 px-4 py-2 pl-10 border rounded-lg"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              {testFiles.length > 0 && (
                <button
                  onClick={handleCreateTestFile}
                  className="px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 flex items-center gap-2 whitespace-nowrap"
                >
                  <Upload className="w-5 h-5" />
                  Upload Test File
                </button>
              )}
            </div>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{stats.total_files}</div>
                  <div className="text-sm text-gray-600">Total Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.passed_files}
                  </div>
                  <div className="text-sm text-gray-600">Passed Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.failed_files}
                  </div>
                  <div className="text-sm text-gray-600">Failed Files</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.pass_rate}%
                  </div>
                  <div className="text-sm text-gray-600">Pass Rate</div>
                </CardContent>
              </Card>
            </div>
          )}

          {loading ? (
            <div className="text-center p-6">Loading test files...</div>
          ) : testFiles.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 mb-4">
                  No test files found for this sprint
                </p>
                <button
                  onClick={handleCreateTestFile}
                  className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Upload First Test File
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {testFiles.map((file) => (
                <Card
                  key={file.file_id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">
                      {file.filename}
                    </CardTitle>
                    {getStatusIcon(file.status)}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {(file.file_size / 1024).toFixed(2)} KB
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {new Date(file.upload_date).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => navigate(`/test-files/${file.file_id}`)}
                        className="w-full mt-2 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                      >
                        View Details
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TestFiles;
