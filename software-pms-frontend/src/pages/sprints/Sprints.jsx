import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Plus,
  Layers,
  Target,
  FileText,
  BarChart2,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Sprints = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [sprints, setSprints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch projects and handle project selection
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProjects(response.data);

        if (location.state?.selectedProjectId) {
          const project = response.data.find(
            (p) => p.project_id === location.state.selectedProjectId
          );
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch projects");
      }
    };

    if (user) fetchProjects();
  }, [user, location.state?.selectedProjectId]);

  // Fetch sprints for selected project
  useEffect(() => {
    const fetchSprints = async () => {
      if (!selectedProject) {
        setSprints([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/sprints?project_id=${selectedProject.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setSprints(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprints");
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, [selectedProject, user]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    navigate(".", { replace: true, state: {} });
  };

  const handleCreateSprint = () => {
    if (selectedProject) {
      navigate(`/sprints/create/${selectedProject.project_id}`);
    }
  };

  const calculateSprintStats = (sprint) => {
    const totalTests = sprint.total_tests || 0;
    const passedTests = sprint.passed_tests || 0;
    const passRate =
      totalTests > 0 ? ((passedTests / totalTests) * 100).toFixed(1) : "0.0";

    return {
      totalTests,
      passedTests,
      passRate,
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-extrabold text-gray-800 flex items-center">
            <Layers className="w-10 h-10 mr-4 text-blue-600" />
            Sprint Management
          </h1>
        </div>

        {/* Projects Section */}
        <div className="bg-white shadow-lg rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
            <Target className="w-6 h-6 mr-3 text-blue-500" />
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
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-md">
              <h2 className="text-2xl font-bold text-gray-800">
                Sprints for {selectedProject.name}
              </h2>
              <button
                onClick={handleCreateSprint}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Sprint
              </button>
            </div>

            {loading ? (
              <div className="text-center text-gray-600 py-12">
                Loading sprints...
              </div>
            ) : sprints.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-600 mb-6">
                  No sprints found for this project
                </p>
                <button
                  onClick={handleCreateSprint}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
                >
                  Create First Sprint
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sprints.map((sprint) => {
                  const { totalTests, passedTests, passRate } =
                    calculateSprintStats(sprint);

                  return (
                    <div
                      key={sprint.sprint_id}
                      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all"
                    >
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {sprint.name}
                          </h3>
                        </div>

                        <div className="space-y-3 text-sm text-gray-600 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span>
                              {new Date(sprint.start_date).toLocaleDateString()}{" "}
                              - {new Date(sprint.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-500" />
                            <div>
                              <div className="font-bold text-gray-800">
                                {totalTests}
                              </div>
                              <div className="text-xs text-gray-500">
                                Total Tests
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <BarChart2 className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="font-bold text-gray-800">
                                {passRate}%
                              </div>
                              <div className="text-xs text-gray-500">
                                Pass Rate
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            navigate(`/sprints/${sprint.sprint_id}`)
                          }
                          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Sprints;
