import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Activity, Users, FileText, Target } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  color = "blue",
}) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    <div className="p-4 flex items-center justify-between">
      <div>
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 text-${color}-600`} />
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        </div>
        <div className="mt-2">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
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
      activeProjects: 0,
      totalProjects: 0,
      totalUsers: 0,
      totalFiles: 0,
      completedSprints: 0,
    },
    activityData: [],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const [statsResponse, activityResponse] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/dashboard/stats`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API_BASE_URL}/api/dashboard/project-activity`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        setDashboardData({
          stats: statsResponse.data,
          activityData: activityResponse.data.monthlyActivity,
        });
      } catch (err) {
        setError(err.response?.data?.error || "Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );

  if (error)
    return (
      <div
        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
        role="alert"
      >
        {error}
      </div>
    );

  const { stats } = dashboardData;
  const statsCards = [
    {
      title: "Active Projects",
      value: stats.activeProjects,
      description: `${(
        (stats.activeProjects / stats.totalProjects) *
        100
      ).toFixed(1)}% of total projects`,
      icon: Activity,
      color: "green",
    },
    {
      title: "Total Users",
      value: stats.totalUsers,
      description: "Team members",
      icon: Users,
      color: "blue",
    },
    {
      title: "Test Files",
      value: stats.totalFiles,
      description: "Total test files",
      icon: FileText,
      color: "indigo",
    },
    {
      title: "Completed Sprints",
      value: stats.completedSprints,
      description: "Successfully completed",
      icon: Target,
      color: "purple",
    },
  ];

  return (
    <div className="bg-gray-50 min-h-screen p-8">
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Dashboard Overview
          </h1>
          <p className="text-gray-600">Welcome back, {user?.name || "User"}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {statsCards.map((card, idx) => (
            <StatCard key={idx} {...card} />
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Project Activity
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dashboardData.activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="activity"
                stroke="#3B82F6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
