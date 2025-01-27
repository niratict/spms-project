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
// import Projects from './pages/projects/Projects';
// import Sprints from './pages/sprints/Sprints';
// import TestFiles from './pages/test-files/TestFiles';
// import Users from './pages/users/Users';
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

                {/* Projects - accessible by all roles */}
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute>
                      <Projects />
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

                {/* Test Files - accessible by Admin and Tester */}
                <Route
                  path="/test-files"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester"]}>
                      <TestFiles />
                    </ProtectedRoute>
                  }
                />

                {/* Users Management - accessible by Admin only */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <Users />
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
