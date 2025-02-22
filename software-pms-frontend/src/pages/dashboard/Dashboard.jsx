import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { Activity, Calendar, FileText, Clock } from "lucide-react";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="p-6">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-50 rounded-lg">
          <Icon className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value || 0}</h3>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

const ProjectCard = ({ project }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200">
    <div className="p-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
            {project.name}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Created on{" "}
            {new Date(project.created_at).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            project.status === "Active"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {project.status}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {project.sprintCount || 0} Sprints
          </span>
        </div>
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">
            {project.fileCount  || 0} Test Files
          </span>
        </div>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalProjects: 0,
      totalSprints: 0,
      totalFiles: 0,
      activeProjects: 0,
    },
    latestProjects: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/main-dashboard/stats`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        // Ensure the response data has the expected structure
        const stats = response.data?.stats || {
          totalProjects: 0,
          totalSprints: 0,
          totalFiles: 0,
          activeProjects: 0,
        };

        const latestProjects = response.data?.latestProjects || [];

        setDashboardData({
          stats,
          latestProjects,
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.error || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
        {error}
      </div>
    );
  }

  const { stats, latestProjects } = dashboardData;
  const percentageActive =
    stats.totalProjects > 0
      ? ((stats.activeProjects / stats.totalProjects) * 100).toFixed(1)
      : 0;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Welcome back, {user?.name || "User"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={Activity}
            description={`${stats.activeProjects} active projects`}
          />
          <StatCard
            title="Total Sprints"
            value={stats.totalSprints}
            icon={Calendar}
            description="Across all projects"
          />
          <StatCard
            title="Test Files"
            value={stats.totalFiles}
            icon={FileText}
            description="Active test files"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Clock}
            description={`${percentageActive}% of total`}
          />
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Latest Projects
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestProjects.map((project, index) => (
              <ProjectCard key={index} project={project} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
