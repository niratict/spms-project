import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Calendar, Activity } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
        
        // Handle project selection from location state
        if (location.state?.selectedProjectId) {
          const project = response.data.find(
            p => p.project_id === location.state.selectedProjectId
          );
          if (project) {
            setSelectedProject(project);
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch projects');
      }
    };

    if (user) fetchProjects();
  }, [user, location.state?.selectedProjectId]); // Add selectedProjectId to dependencies

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
        setError(err.response?.data?.message || 'Failed to fetch sprints');
      } finally {
        setLoading(false);
      }
    };

    fetchSprints();
  }, [selectedProject, user]);

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
    // Clear location state after manual selection
    navigate('.', { replace: true, state: {} });
  };

  const handleCreateSprint = () => {
    if (selectedProject) {
      navigate(`/sprints/create/${selectedProject.project_id}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Manage Sprints</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Select Project</h2>
        <div className="grid grid-cols-3 gap-4">
          {projects.map((project) => (
            <button
              key={project.project_id}
              onClick={() => handleProjectSelect(project)}
              className={`p-4 rounded-lg border transition-all ${
                selectedProject?.project_id === project.project_id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
            </button>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold">
              Sprints for {selectedProject.name}
            </h2>
            <button
              onClick={handleCreateSprint}
              className="px-6 py-2 text-white bg-green-500 rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Create Sprint
            </button>
          </div>

          {loading ? (
            <div className="text-center p-6">Loading sprints...</div>
          ) : sprints.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-600 mb-4">No sprints found for this project</p>
                <button
                  onClick={handleCreateSprint}
                  className="px-6 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600"
                >
                  Create First Sprint
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sprints.map((sprint) => (
                <Card key={sprint.sprint_id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{sprint.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-gray-500" />
                        <span>{new Date(sprint.start_date).toLocaleDateString()} - {new Date(sprint.end_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-gray-500" />
                        <span>{sprint.total_tests || 0} Tests</span>
                      </div>
                      <button
                        onClick={() => navigate(`/sprints/${sprint.sprint_id}`)}
                        className="w-full mt-4 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
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

export default Sprints;