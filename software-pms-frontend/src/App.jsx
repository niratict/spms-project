// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./context/AuthContext";

// Pages
import Login from "./pages/auth/Login";
import Dashboard from "./pages/dashboard/Dashboard";
import TestDashboard from "./pages/testdashboard/TestDashboard";
import Projects from "./pages/projects/Projects";
import CreateProject from "./pages/projects/CreateProject";
import ProjectDetail from "./pages/projects/ProjectDetail";
import ProjectEdit from "./pages/projects/ProjectEdit";
import Sprints from "./pages/sprints/Sprints";
import CreateSprint from "./pages/sprints/CreateSprint";
import SprintDetail from "./pages/sprints/SprintDetail";
import SprintEdit from "./pages/sprints/SprintEdit";
import TestFiles from "./pages/test-files/TestFiles";
import TestFileDetail from "./pages/test-files/TestFileDetail";
import TestFileEdit from "./pages/test-files/TestFileEdit";
import CreateTestFile from "./pages/test-files/CreateTestFile";
import Users from "./pages/users/Users";
import UserDetail from "./pages/users/UserDetail";
import UserEdit from "./pages/users/UserEdit";
import CreateUser from "./pages/users/CreateUser";
import ActionLogs from "./pages/actionlogs/ActionLogs";
import Layout from "./components/layout/Layout";

// Protected Route with Role Check
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If no specific roles are required, or user's role is allowed
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return children;
  }

  // If user's role is not allowed, redirect to dashboard
  return <Navigate to="/dashboard" replace />;
};

// Updated Routes section in App.jsx
const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* Dashboard - accessible by all roles */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Test Dashboard - accessible by all roles */}
                <Route path="/test-dashboard" element={<TestDashboard />} />

                {/* Projects - accessible by Admin only */}
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <Projects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/create"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <CreateProject />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <ProjectDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <ProjectEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Sprints - accessible by Admin only */}
                <Route
                  path="/sprints"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <Sprints />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/create/:projectId"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <CreateSprint />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <SprintDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <SprintEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Test Files - accessible by Admin and Tester */}
                <Route
                  path="/test-files"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester"]}>
                      <TestFiles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/create/:sprintId"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester"]}>
                      <CreateTestFile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester"]}>
                      <TestFileDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester"]}>
                      <TestFileEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Users - accessible by Admin only */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/create"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <CreateUser />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <UserDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/users/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <UserEdit />
                    </ProtectedRoute>
                  }
                />

                {/* Action Logs - accessible by Admin only */}
                <Route
                  path="/action-logs"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <ActionLogs />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all route - redirect to dashboard */}
                <Route
                  path="*"
                  element={<Navigate to="/dashboard" replace />}
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}
