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
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";

// ค่าคงที่สำหรับการตั้งค่า
const API_BASE_URL = import.meta.env.VITE_API_URL;
const USERS_PER_PAGE = 6;
const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1586374579358-9d19d632b6df?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"; // รูปโปรไฟล์เริ่มต้น

// กำหนดสีตามบทบาทผู้ใช้
const ROLE_COLORS = {
  Admin: "bg-red-100 text-red-800 border border-red-200",
  Tester: "bg-green-100 text-green-800 border border-green-200",
  Viewer: "bg-blue-100 text-blue-800 border border-blue-200",
};

// กำหนดไอคอนสำหรับแต่ละบทบาท
const ROLE_ICONS = {
  Admin: "⚙️",
  Tester: "🧑‍💻",
  Viewer: "👁️",
};

const Users = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // สถานะการจัดการข้อมูลผู้ใช้
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

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
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchUsers();
    }
  }, [user]);

  // จัดการข้อผิดพลาดเกี่ยวกับการยืนยันตัวตน
  const handleAuthError = (err) => {
    if (err.response?.status === 401) {
      logout();
      navigate("/login");
    } else {
      setError(err.response?.data?.message || "Failed to fetch users");
    }
  };

  // รีเฟรชข้อมูลผู้ใช้
  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
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
        className="flex flex-col justify-center items-center min-h-screen bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        <p className="mt-4 text-gray-600 font-medium">
          กำลังโหลดข้อมูลผู้ใช้...
        </p>
      </div>
    );
  }

  // แสดงข้อผิดพลาด
  if (error) {
    return (
      <div
        className="text-center p-6 sm:p-8 bg-red-50 min-h-screen flex items-center justify-center"
        data-cy="error-container"
      >
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl sm:text-2xl font-bold text-red-600 mb-4">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
            ลองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-gray-50 min-h-screen p-3 sm:p-4 md:p-6 lg:p-8"
      data-cy="users-page"
    >
      <div className="container mx-auto">
        {/* ส่วนหัวของหน้า - ปรับให้รองรับ Mobile และเพิ่มการตกแต่ง */}
        {/* ส่วนหัวของหน้า */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <h1
            className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center"
            data-cy="page-title"
          >
            <UsersIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 mr-2 sm:mr-3 md:mr-4 text-blue-600" />
            การจัดการผู้ใช้
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              data-cy="refresh-button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center justify-center gap-2 bg-blue-100 text-blue-700 px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-200 transition"
            >
              <RefreshCw
                className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>
            <button
              data-cy="add-user-button"
              onClick={() => navigate("/users/create")}
              className="flex-1 sm:flex-auto flex items-center justify-center gap-2 bg-green-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-green-600 transition"
            >
              <UserPlus className="w-5 h-5" />
              <span>เพิ่มผู้ใช้</span>
            </button>
          </div>
        </div>

        {/* ส่วนค้นหาและกรองข้อมูล - ปรับการออกแบบให้น่าใช้ */}
        <div
          className="bg-white shadow-md rounded-xl p-4 sm:p-6 mb-6"
          data-cy="search-filter-container"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ค้นหาและกรองข้อมูล
          </h2>
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
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <Search className="absolute left-3 top-3 text-gray-400" />
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex sm:hidden items-center justify-center p-3 border rounded-lg"
                aria-expanded={showFilters}
                aria-label="Toggle filters"
              >
                <Filter className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* บน Desktop แสดงตลอด / บน Mobile แสดงเมื่อกดปุ่ม */}
            <div className={`${showFilters ? "block" : "hidden"} sm:block`}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="role-filter"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    กรองตามบทบาท
                  </label>
                  <select
                    id="role-filter"
                    data-cy="role-filter"
                    value={roleFilter}
                    onChange={(e) => {
                      setRoleFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full"
                  >
                    <option value="">ทุกบทบาท</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role} {ROLE_ICONS[role]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-end">
                  <div className="bg-blue-50 rounded-lg p-3 w-full">
                    <p className="text-sm text-blue-700">
                      <span className="font-medium">การค้นหา:</span>{" "}
                      พบผู้ใช้ทั้งหมด {users.length} คน, กำลังแสดง{" "}
                      {filteredUsers.length} คนที่ตรงตามเงื่อนไข
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* แสดงรายการผู้ใช้ - ปรับ Cards ให้สวยงามและแสดงรูปโปรไฟล์ */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6 mb-6"
          data-cy="users-grid"
        >
          {paginatedUsers.map((userData) => (
            <div
              key={userData.user_id}
              data-cy={`user-card-${userData.user_id}`}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 h-20"></div>
              <div className="px-4 sm:px-6 pt-0 pb-4 sm:pb-6 -mt-12">
                <div className="flex justify-between">
                  {/* ส่วนการแสดงรูปภาพโปรไฟล์ */}
                  <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md">
                    <img
                      src={userData.profile_image || DEFAULT_AVATAR}
                      alt={userData.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <span
                    className={`text-sm ${
                      ROLE_COLORS[userData.role]
                    } px-3 py-1 rounded-full h-fit mt-14`}
                    data-cy={`user-role-${userData.user_id}`}
                  >
                    {ROLE_ICONS[userData.role]} {userData.role}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mt-4 line-clamp-1">
                  {userData.name}
                </h3>

                <div className="space-y-3 my-4">
                  <p
                    className="text-gray-600 flex items-center gap-2 break-all"
                    data-cy={`user-email-${userData.user_id}`}
                  >
                    <UserCircle className="w-4 h-4 flex-shrink-0 text-gray-400" />{" "}
                    {userData.email}
                  </p>
                  <p
                    className="text-gray-600 text-sm"
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

                <button
                  data-cy={`view-user-${userData.user_id}`}
                  onClick={() => navigate(`/users/${userData.user_id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 py-2 rounded-lg transition"
                >
                  <Eye className="w-5 h-5" /> ดูรายละเอียดเพิ่มเติม
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ข้อความแสดงเมื่อไม่พบข้อมูล */}
        {filteredUsers.length === 0 && (
          <div
            className="text-center p-8 bg-white rounded-xl shadow my-6"
            data-cy="no-results-message"
          >
            <div className="inline-flex items-center justify-center bg-gray-100 rounded-full p-4 mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">
              ไม่พบผู้ใช้งาน
            </h3>
            <p className="text-gray-500">
              ไม่พบผู้ใช้งานที่ตรงกับเกณฑ์การค้นหา
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setRoleFilter("");
              }}
              className="mt-4 text-blue-600 hover:text-blue-800"
            >
              ล้างการค้นหา
            </button>
          </div>
        )}

        {/* ส่วนแสดงหมายเลขหน้า - ปรับให้สวยงาม */}
        {filteredUsers.length > USERS_PER_PAGE && (
          <div
            className="flex justify-center items-center space-x-2 sm:space-x-4 mt-6"
            data-cy="pagination-container"
          >
            <button
              data-cy="prev-page-button"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:bg-gray-100 hover:bg-gray-50 transition"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              data-cy="next-page-button"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:bg-gray-100 hover:bg-gray-50 transition"
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
