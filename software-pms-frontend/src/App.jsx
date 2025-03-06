// src/App.jsx
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

// นำเข้าคอมโพเนนต์หลัก
import Layout from "./components/layout/Layout";

// นำเข้าหน้าการยืนยันตัวตน
import Login from "./pages/auth/Login";

// นำเข้าหน้าแดชบอร์ดหลัก
import MainPage from "./pages/main/MainPage";
import TestDashboard from "./pages/testdashboard/TestDashboard";
import Profile from "./pages/profile/Profile";

// นำเข้าหน้าจัดการโปรเจกต์
import Projects from "./pages/projects/Projects";
import CreateProject from "./pages/projects/CreateProject";
import ProjectDetail from "./pages/projects/ProjectDetail";
import ProjectEdit from "./pages/projects/ProjectEdit";
import ProjectPermissions from "./pages/projects/ProjectPermissions ";

// นำเข้าหน้าจัดการสปรินท์
import Sprints from "./pages/sprints/Sprints";
import CreateSprint from "./pages/sprints/CreateSprint";
import SprintDetail from "./pages/sprints/SprintDetail";
import SprintEdit from "./pages/sprints/SprintEdit";

// นำเข้าหน้าจัดการไฟล์ทดสอบ
import TestFiles from "./pages/test-files/TestFiles";
import TestFileDetail from "./pages/test-files/TestFileDetail";
import TestFileEdit from "./pages/test-files/TestFileEdit";
import CreateTestFile from "./pages/test-files/CreateTestFile";

// นำเข้าหน้าจัดการผู้ใช้
import Users from "./pages/users/Users";
import UserDetail from "./pages/users/UserDetail";
import UserEdit from "./pages/users/UserEdit";
import CreateUser from "./pages/users/CreateUser";

// นำเข้าหน้าบันทึกการทำงาน
import ActionLogs from "./pages/actionlogs/ActionLogs";

// คอมโพเนนต์สำหรับการป้องกันเส้นทาง
// ตรวจสอบการเข้าถึงตามสิทธิ์ของผู้ใช้
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();  // ดึงข้อมูลผู้ใช้จาก Context

  // ถ้าไม่ได้ล็อกอิน ให้ไปหน้าล็อกอิน
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ถ้าไม่ได้กำหนดสิทธิ์ หรือผู้ใช้มีสิทธิ์ตามที่กำหนด
  if (allowedRoles.length === 0 || allowedRoles.includes(user.role)) {
    return children;
  }

  // ถ้าผู้ใช้ไม่มีสิทธิ์ ให้ไปหน้าหลัก
  return <Navigate to="/mainpage" replace />;
};

// คอมโพเนนต์สำหรับจัดการเส้นทางทั้งหมดในแอพ
const AppRoutes = () => {
  return (
    <Routes>
      {/* เส้นทางสำหรับหน้าล็อกอิน */}
      <Route path="/login" element={<Login />} />
      
      {/* เส้นทางหลัก ให้ไปยังหน้าหลัก */}
      <Route path="/" element={<Navigate to="/mainpage" replace />} />

      {/* เส้นทางที่ต้องล็อกอินก่อนเข้าถึง */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                {/* --- หน้าที่ทุกคนเข้าถึงได้ --- */}
                
                {/* หน้าหลัก */}
                <Route path="/mainpage" element={<MainPage />} />
                
                {/* แดชบอร์ดสำหรับการทดสอบ */}
                <Route path="/test-dashboard" element={<TestDashboard />} />
                
                {/* หน้าโปรไฟล์ส่วนตัว */}
                <Route path="/profile" element={<Profile />} />

                {/* --- หน้าที่เฉพาะแอดมินเข้าถึงได้ --- */}
                
                {/* จัดการโปรเจกต์ - เฉพาะแอดมิน */}
                <Route
                  path="/projects"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <Projects />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/create"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <CreateProject />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <ProjectDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <ProjectEdit />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/projects/:id/permissions"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <ProjectPermissions />
                    </ProtectedRoute>
                  }
                />

                {/* จัดการสปรินท์ - เฉพาะแอดมิน */}
                <Route
                  path="/sprints"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <Sprints />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/create/:projectId"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <CreateSprint />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <SprintDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sprints/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Product Owner"]}>
                      <SprintEdit />
                    </ProtectedRoute>
                  }
                />

                {/* จัดการผู้ใช้ - เฉพาะแอดมิน */}
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

                {/* บันทึกการทำงาน - เฉพาะแอดมิน */}
                <Route
                  path="/action-logs"
                  element={
                    <ProtectedRoute allowedRoles={["Admin"]}>
                      <ActionLogs />
                    </ProtectedRoute>
                  }
                />

                {/* --- หน้าที่แอดมินและผู้ทดสอบเข้าถึงได้ --- */}
                
                {/* จัดการไฟล์ทดสอบ - แอดมินและผู้ทดสอบ */}
                <Route
                  path="/test-files"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester", "Product Owner"]}>
                      <TestFiles />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/create/:sprintId"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester", "Product Owner"]}>
                      <CreateTestFile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/:id"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester", "Product Owner"]}>
                      <TestFileDetail />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/test-files/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={["Admin", "Tester", "Product Owner"]}>
                      <TestFileEdit />
                    </ProtectedRoute>
                  }
                />

                {/* จัดการเส้นทางที่ไม่ได้ระบุ */}
                <Route
                  path="*"
                  element={<Navigate to="/mainpage" replace />}
                />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

// คอมโพเนนต์หลักของแอพพลิเคชัน
export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}