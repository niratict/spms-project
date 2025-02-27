import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  UserCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users as UsersIcon,
  UserPlus,
  Filter,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

// ค่าคงที่สำหรับการตั้งค่า
const API_BASE_URL = import.meta.env.VITE_API_URL;
const USERS_PER_PAGE = 6;

// กำหนดสีตามบทบาทผู้ใช้
const ROLE_COLORS = {
  Admin: "bg-red-100 text-red-800",
  Tester: "bg-green-100 text-green-800",
  Viewer: "bg-blue-100 text-blue-800",
};

const Users = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // สถานะการจัดการข้อมูลผู้ใช้
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // สถานะสำหรับการค้นหาและกรองข้อมูล
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // ตรวจสอบสิทธิ์การเข้าถึง
  if (!user?.token) return <Navigate to="/login" />;
  if (user?.role !== "Admin") {
    return (
      <div
        className="text-center p-4 sm:p-6 bg-gray-100 min-h-screen flex items-center justify-center"
        data-cy="access-denied-container"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-md w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-red-500">
            Access Denied
          </h2>
          <p className="text-gray-600 mt-2">
            Only administrators can access this page.
          </p>
        </div>
      </div>
    );
  }

  // ดึงข้อมูลผู้ใช้งานจาก API
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/api/users`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        setUsers(response.data);
      } catch (err) {
        handleAuthError(err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.token) {
      fetchUsers();
    }
  }, [user, logout, navigate]);

  // จัดการข้อผิดพลาดเกี่ยวกับการยืนยันตัวตน
  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      logout();
      navigate("/login");
    } else {
      setError(err.response?.data?.message || "Failed to fetch users");
    }
  };

  // กรองข้อมูลผู้ใช้ตามคำค้นหาและบทบาท
  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        (searchTerm === "" ||
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (roleFilter === "" || u.role === roleFilter)
    );
  }, [users, searchTerm, roleFilter]);

  // แบ่งหน้าแสดงผลข้อมูล
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const roleOptions = ["Admin", "Tester", "Viewer"];

  // แสดงสถานะกำลังโหลด
  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div
        className="text-center text-red-500 text-lg p-4 sm:p-6 bg-red-50 min-h-screen"
        data-cy="error-container"
      >
        Error: {error}
      </div>
    );
  }

  return (
    <div
      className="bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6 lg:p-8"
      data-cy="users-page"
    >
      <div className="container mx-auto">
        {/* ส่วนหัวของหน้า - ปรับให้รองรับ Mobile */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-4 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center"
            data-cy="page-title"
          >
            <UsersIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-4 text-blue-600" />
            การจัดการผู้ใช้
          </h1>
          <button
            data-cy="add-user-button"
            onClick={() => navigate("/users/create")}
            className="flex items-center justify-center gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 transition w-full sm:w-auto"
          >
            <UserPlus className="w-5 h-5" />
            <span>เพิ่มผู้ใช้</span>
          </button>
        </div>

        {/* ส่วนค้นหาและกรองข้อมูล - ปรับให้ Collapsible บน Mobile */}
        <div
          className="bg-white shadow-md rounded-lg p-4 sm:p-6 mb-4 sm:mb-6"
          data-cy="search-filter-container"
        >
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  data-cy="search-input"
                  placeholder="ค้นหาผู้ใช้งานด้วย ชื่อ หรือ อีเมล"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-3 text-gray-400" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex sm:hidden items-center justify-center p-2 border rounded-lg"
                aria-expanded={showFilters}
                aria-label="Toggle filters"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* บน Desktop แสดงตลอด / บน Mobile แสดงเมื่อกดปุ่ม */}
            <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
              <select
                data-cy="role-filter"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              >
                <option value="">ทุกบทบาท</option>
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* แสดงรายการผู้ใช้ - ปรับ Grid ให้ตอบสนองกับขนาดหน้าจอ */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6"
          data-cy="users-grid"
        >
          {paginatedUsers.map((userData) => (
            <div
              key={userData.user_id}
              data-cy={`user-card-${userData.user_id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-4 sm:p-6"
            >
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 line-clamp-1">
                  {userData.name}
                </h3>
                <span
                  className={`text-sm ${
                    ROLE_COLORS[userData.role]
                  } px-2 py-1 rounded-full w-fit`}
                  data-cy={`user-role-${userData.user_id}`}
                >
                  {userData.role}
                </span>
              </div>
              <div className="space-y-2 mb-3 sm:mb-4">
                <p
                  className="text-gray-600 flex items-center gap-2 text-sm sm:text-base break-all"
                  data-cy={`user-email-${userData.user_id}`}
                >
                  <UserCircle className="w-4 h-4 flex-shrink-0" />{" "}
                  {userData.email}
                </p>
                <p
                  className="text-gray-600 text-sm sm:text-base"
                  data-cy={`user-created-at-${userData.user_id}`}
                >
                  เริ่มใช้งาน{" "}
                  {new Date(userData.created_at).toLocaleDateString("th-TH", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </p>
              </div>
              <div className="flex justify-start">
                <button
                  data-cy={`view-user-${userData.user_id}`}
                  onClick={() => navigate(`/users/${userData.user_id}`)}
                  className="flex items-center gap-1 sm:gap-2 text-blue-500 hover:text-blue-700 text-sm sm:text-base"
                >
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" /> ดูละเอียดเพิ่มเติม
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ข้อความแสดงเมื่อไม่พบข้อมูล */}
        {filteredUsers.length === 0 && (
          <div
            className="text-center text-gray-500 mt-6 sm:mt-8 p-4 bg-white rounded-lg shadow"
            data-cy="no-results-message"
          >
            ไม่พบผู้ใช้งานที่ตรงกับเกณฑ์การค้นหา
          </div>
        )}

        {/* ส่วนแสดงหมายเลขหน้า - ปรับให้ตอบสนอง */}
        {filteredUsers.length > USERS_PER_PAGE && (
          <div
            className="flex justify-center items-center space-x-2 sm:space-x-4 mt-4 sm:mt-6"
            data-cy="pagination-container"
          >
            <button
              data-cy="prev-page-button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-sm sm:text-base"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>
            <span
              className="text-gray-600 text-sm sm:text-base"
              data-cy="page-indicator"
            >
              หน้า {currentPage}/{totalPages}
            </span>
            <button
              data-cy="next-page-button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 rounded-lg disabled:opacity-50 text-sm sm:text-base"
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Users;
