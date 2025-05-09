import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Trash2,
  Shield,
  AlertTriangle,
  X,
  ChevronDown,
  CheckCircle2,
  User,
  UserCheck,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// คอมโพเนนต์ DropdownSelect สำหรับใช้ในฟอร์ม
const DropdownSelect = ({
  label,
  value,
  onChange,
  options,
  disabled = false,
  placeholder,
  dataCy,
  icon,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleSelect = (optionValue) => {
    onChange({ target: { value: optionValue } });
    setIsOpen(false);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center justify-between w-full rounded-md border ${
            disabled
              ? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
              : "bg-white text-gray-800 cursor-pointer border-gray-300 hover:border-blue-500"
          } p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200`}
          data-cy={dataCy}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate text-left pr-8">
            {options.find(opt => opt.value === value)?.label || placeholder}
          </span>
          <div
            className={`absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none`}
          >
            <div
              className={`rounded-lg p-1 transition-all duration-300 ${
                disabled
                  ? "text-gray-400"
                  : "text-blue-600"
              }`}
            >
              {icon || <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
            </div>
          </div>
        </button>
        
        {isOpen && !disabled && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setIsOpen(false)}
            ></div>
            <div 
              className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-1 max-h-60 overflow-auto"
              style={{ scrollbarWidth: 'thin' }}
              data-cy={`${dataCy}-dropdown`}
            >
              <ul role="listbox">
                {placeholder && (
                  <li
                    className="py-2 px-4 text-gray-500 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center text-sm"
                    onClick={() => handleSelect("")}
                    data-cy={`${dataCy}-option-placeholder`}
                  >
                    {placeholder}
                  </li>
                )}
                {options.map((option) => (
                  <li
                    key={option.value}
                    className={`py-2 px-4 hover:bg-blue-50 cursor-pointer transition-colors duration-150 flex items-center text-sm ${
                      option.value === value ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-800"
                    }`}
                    onClick={() => handleSelect(option.value)}
                    data-cy={`${dataCy}-option-${option.value}`}
                    role="option"
                    aria-selected={option.value === value}
                  >
                    {option.value === value && (
                      <CheckCircle2 className="h-4 w-4 mr-2 text-blue-600" />
                    )}
                    <span className={option.value === value ? "ml-0" : "ml-6"}>
                      {option.label}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const ProjectPermissions = () => {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [members, setMembers] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [userProjectRole, setUserProjectRole] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, user: null });

  // ดึงข้อมูลโปรเจกต์
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setProject(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "ไม่สามารถดึงข้อมูลโปรเจกต์ได้"
        );
      }
    };

    if (user) fetchProject();
  }, [id, user]);

  // ดึงรายชื่อสมาชิกในโปรเจกต์
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `${API_BASE_URL}/api/project-members/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setMembers(response.data);

        // ตรวจสอบบทบาทของผู้ใช้ในโปรเจกต์นี้
        const currentUserMember = response.data.find(
          (member) => member.user_id === user.user_id
        );
        if (currentUserMember) {
          setUserProjectRole(currentUserMember.role);
        }
      } catch (err) {
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลสมาชิกได้");
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchProjectMembers();
  }, [id, user]);

  // ดึงรายชื่อผู้ใช้ที่สามารถเพิ่มเป็นสมาชิกได้
  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/project-members/${id}/available-users`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      
      // กรองผู้ใช้งานที่มีบทบาทเป็น Viewer ออก
      const filteredUsers = response.data.filter(user => user.role !== "Viewer");
      setAvailableUsers(filteredUsers);

      // Set default selected role based on user's role
      if (user.role === "Admin") {
        setSelectedRole("Product Owner");
      } else if (user.role === "Product Owner") {
        setSelectedRole("Tester");
      } else {
        setSelectedRole("Member");
      }
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    }
  };

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบบทบาทของผู้ใช้ที่เลือก
  const getSelectedUserRole = () => {
    if (!selectedUser) return null;
    const selected = availableUsers.find(user => user.user_id === selectedUser);
    return selected ? selected.role : null;
  };

  // เพิ่มฟังก์ชันใหม่สำหรับตรวจสอบบทบาทที่สามารถเลือกได้
  const getAvailableRoles = () => {
    const selectedUserRole = getSelectedUserRole();
    
    if (user.role === "Admin") {
      // Admin สามารถกำหนด Product Owner หรือ Tester ได้
      // แต่ถ้าเลือกผู้ใช้ที่เป็น Tester ให้แสดงเฉพาะ Tester
      if (selectedUserRole === "Tester") {
        return [{ value: "Tester", label: "Tester" }];
      }
      return [
        { value: "Product Owner", label: "Product Owner" },
        { value: "Tester", label: "Tester" }
      ];
    } else if (user.role === "Product Owner") {
      // Product Owner สามารถกำหนดได้แค่ Tester
      return [{ value: "Tester", label: "Tester" }];
    }
    
    return [];
  };

  // เปิดฟอร์มเพิ่มสมาชิก
  const handleOpenAddMember = async () => {
    await fetchAvailableUsers();
    setShowAddMember(true);
  };

  // ปิดฟอร์มเพิ่มสมาชิก
  const handleCloseAddMember = () => {
    setShowAddMember(false);
    setSelectedUser("");
    setSelectedRole("");
  };

  // เพิ่มสมาชิกใหม่
  const handleAddMember = async (e) => {
    e.preventDefault();

    if (!selectedUser) {
      setError("กรุณาเลือกผู้ใช้");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/api/project-members`,
        {
          project_id: id,
          user_id: selectedUser,
          role: selectedRole,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // รีเฟรชรายชื่อสมาชิก
      const response = await axios.get(
        `${API_BASE_URL}/api/project-members/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setMembers(response.data);

      // รีเซ็ตฟอร์ม
      setSelectedUser("");
      setSelectedRole("");
      setShowAddMember(false);
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถเพิ่มสมาชิกได้");
    }
  };

  // แสดง modal ยืนยันการลบ
  const showDeleteConfirmation = (userId, memberRole, memberName) => {
    setDeleteModal({
      show: true,
      user: {
        id: userId,
        role: memberRole,
        name: memberName,
      },
    });
  };

  // ลบสมาชิก
  const handleRemoveMember = async () => {
    // ตรวจสอบสิทธิ์ในการลบสมาชิก
    if (user.role !== "Admin" && deleteModal.user.role === "Product Owner") {
      setError(
        "เฉพาะ Admin เท่านั้นที่สามารถลบ Product Owner ออกจากโปรเจกต์ได้"
      );
      setDeleteModal({ show: false, user: null });
      return;
    }

    try {
      await axios.delete(
        `${API_BASE_URL}/api/project-members/${id}/${deleteModal.user.id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // รีเฟรชรายชื่อสมาชิก
      const response = await axios.get(
        `${API_BASE_URL}/api/project-members/${id}`,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      setMembers(response.data);
      setDeleteModal({ show: false, user: null });
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถลบสมาชิกได้");
      setDeleteModal({ show: false, user: null });
    }
  };

  // ปิด modal
  const closeDeleteModal = () => {
    setDeleteModal({ show: false, user: null });
  };

  // กลับไปหน้าโปรเจกต์
  const handleBack = () => {
    navigate(`/projects/${id}`);
  };

  // ตรวจสอบว่าผู้ใช้มีสิทธิ์จัดการโปรเจกต์หรือไม่
  const canManageMembers = () => {
    return user.role === "Admin" || user.role === "Product Owner";
  };

  useEffect(() => {
    // เมื่อเลือกผู้ใช้ใหม่ ให้ปรับค่า selectedRole ตามบทบาทที่สามารถเลือกได้
    if (selectedUser) {
      const availableRoles = getAvailableRoles();
      if (availableRoles.length > 0) {
        setSelectedRole(availableRoles[0].value);
      }
    }
  }, [selectedUser]);

  // แสดงตัวโหลดขณะกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-10 w-10 sm:h-16 sm:w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // ถ้าผู้ใช้ไม่มีสิทธิ์จัดการโปรเจกต์
  if (!loading && !canManageMembers()) {
    return (
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="container mx-auto max-w-6xl">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            data-cy="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับไปหน้ารายละเอียดโปรเจกต์
          </button>

          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative mb-4">
            <strong className="font-bold">ข้อผิดพลาด: </strong>
            <span className="block sm:inline">
              คุณไม่มีสิทธิ์ในการจัดการสมาชิกของโปรเจกต์นี้
            </span>
          </div>
        </div>
      </div>
    );
  }

  // แปลงรูปแบบวันที่เป็น DD/MM/YYYY และเวลา
  const formatDateThai = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  return (
    <div
      className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6 lg:p-8"
      data-cy="project-permissions-page"
    >
      <div className="container mx-auto max-w-6xl">
        {/* ส่วนหัวของหน้า */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            data-cy="back-button"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับไปหน้ารายละเอียดโปรเจกต์
          </button>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
            <h1
              className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center"
              data-cy="page-title"
            >
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 mr-2 sm:mr-3 text-blue-600" />
              จัดการสิทธิ์โปรเจกต์
            </h1>
          </div>
          {project && (
            <h2
              className="text-xl font-semibold text-gray-700 mt-2"
              data-cy="project-name"
            >
              โปรเจกต์ {project.name}
            </h2>
          )}
        </div>

        {/* แสดงข้อความเมื่อเกิดข้อผิดพลาด */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 sm:px-4 sm:py-3 rounded-lg relative mb-4 flex items-center"
            role="alert"
            data-cy="error-message"
          >
            <AlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="block">{error}</span>
          </div>
        )}

        {/* ส่วนของการจัดการสมาชิก */}
        <div className="bg-white shadow rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4">
            <h2
              className="text-xl font-semibold text-gray-800"
              data-cy="members-section-title"
            >
              รายชื่อสมาชิก
            </h2>
            <button
              onClick={handleOpenAddMember}
              className="w-full sm:w-auto flex items-center justify-center bg-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
              data-cy="add-member-button"
            >
              <UserPlus className="mr-1 sm:mr-2 w-4 h-4 sm:w-5 sm:h-5" />
              เพิ่มสมาชิก
            </button>
          </div>

          {/* ฟอร์มเพิ่มสมาชิก */}
          {showAddMember && (
            <div
              className="bg-blue-50 p-4 mb-4 rounded-lg border border-blue-100"
              data-cy="add-member-form"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-medium text-blue-800">
                  เพิ่มสมาชิกใหม่
                </h3>
                <button
                  onClick={handleCloseAddMember}
                  className="text-gray-500 hover:text-gray-700 focus:outline-none"
                  data-cy="close-add-member-form"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddMember}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <DropdownSelect
                      label="เลือกผู้ใช้"
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      options={availableUsers.map(user => ({
                        value: user.user_id,
                        label: `${user.name} - ${user.role}`
                      }))}
                      placeholder="-- เลือกผู้ใช้ --"
                      dataCy="user-select"
                    />
                  </div>
                  {user.role === "Admin" && (
                    <div>
                      <DropdownSelect
                        label="บทบาทในโปรเจกต์"
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        options={getAvailableRoles()}
                        dataCy="role-select"
                      />
                    </div>
                  )}
                  {user.role === "Product Owner" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        บทบาทในโปรเจกต์
                      </label>
                      <input
                        type="text"
                        value="Tester"
                        readOnly
                        className="w-full rounded-md border border-gray-300 p-2 text-sm bg-gray-50"
                        data-cy="role-readonly"
                      />
                    </div>
                  )}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      data-cy="submit-add-member"
                    >
                      เพิ่มสมาชิก
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* ตารางรายชื่อสมาชิก */}
          <div className="overflow-x-auto" data-cy="members-table-container">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อผู้ใช้
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    บทบาทในโปรเจกต์
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    บทบาทในระบบ
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    เพิ่มเมื่อ
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">
                    เพิ่มโดย
                  </th>
                  <th className="px-4 py-2 text-center text-sm font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody>
                {members.length > 0 ? (
                  members.map((member) => (
                    <tr
                      key={member.user_id}
                      className="border-t hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="font-medium">{member.name}</div>
                        <div className="text-gray-500 text-xs">
                          {member.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.role === "Product Owner"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            member.user_role === "Admin"
                              ? "bg-red-100 text-red-800"
                              : member.user_role === "Product Owner"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-green-100 text-green-800"
                          }`}
                        >
                          {member.user_role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDateThai(member.assigned_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <span className="font-medium">
                            {member.assigned_by_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        {/* ไม่แสดงปุ่มลบสำหรับตัวเอง */}
                        {member.user_id !== user.user_id && (
                          <button
                            onClick={() =>
                              showDeleteConfirmation(
                                member.user_id,
                                member.role,
                                member.name
                              )
                            }
                            className="inline-flex items-center justify-center p-2 text-red-600 bg-red-50 rounded-full hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-300"
                            data-cy="remove-member-button"
                            title="ลบสมาชิก"
                            disabled={
                              user.role !== "Admin" &&
                              member.role === "Product Owner"
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-4 py-4 text-center text-gray-500"
                    >
                      ไม่พบข้อมูลสมาชิกในโปรเจกต์นี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal ยืนยันการลบสมาชิก */}
        {deleteModal.show && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
              <div className="text-center">
                <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-3">
                  ยืนยันการลบสมาชิก
                </h2>
                <p className="text-gray-600 mb-6">
                  คุณต้องการลบ{" "}
                  <span className="font-medium text-gray-900">
                    {deleteModal.user?.name}
                  </span>{" "}
                  ที่มีบทบาทเป็น <br></br>
                  <span className="font-medium text-gray-900">
                    {deleteModal.user?.role}
                  </span>{" "}
                  <br />
                  ออกจากโปรเจกต์นี้?
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  data-cy="delete-modal-cancel"
                  onClick={closeDeleteModal}
                  className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  data-cy="delete-modal-confirm"
                  onClick={handleRemoveMember}
                  className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  ลบสมาชิก
                </button>
              </div>
            </div>
          </div>
        )}

        {/* คำแนะนำและข้อมูลเพิ่มเติม */}
        <div className="bg-white shadow rounded-xl p-4 sm:p-6">
          <h2
            className="text-xl font-semibold text-gray-800 mb-3"
            data-cy="info-section-title"
          >
            ข้อมูลเกี่ยวกับบทบาทในโปรเจกต์
          </h2>
          <div className="space-y-3 text-sm sm:text-base text-gray-700">
            <div className="flex items-start p-3 bg-purple-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                <span className="text-purple-800 font-bold">PO</span>
              </div>
              <div>
                <p className="font-medium text-purple-800">Product Owner</p>
                <p className="text-gray-700 mt-1">
                  เป็นเจ้าของโปรเจกต์ สามารถจัดการสมาชิก Tester
                  และดำเนินการทุกอย่างในโปรเจกต์ได้
                </p>
              </div>
            </div>

            <div className="flex items-start p-3 bg-blue-50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                <span className="text-blue-800 font-bold">T</span>
              </div>
              <div>
                <p className="font-medium text-blue-800">Tester</p>
                <p className="text-gray-700 mt-1">
                  สามารถจัดการไฟล์ทดสอบภายในโปรเจกต์ได้
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="font-medium text-blue-800 mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              ข้อจำกัดในการจัดการสิทธิ์
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-red-100 text-red-800 flex-shrink-0 mr-2 text-center text-xs font-bold mt-0.5">
                  A
                </span>
                <span>
                  ผู้ใช้ที่มีบทบาทเป็น <b>Admin</b> สามารถจัดการสิทธิ์ของ
                  Product Owner และ Tester ได้
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-purple-100 text-purple-800 flex-shrink-0 mr-2 text-center text-xs font-bold mt-0.5">
                  P
                </span>
                <span>
                  ผู้ใช้ที่มีบทบาทเป็น <b>Product Owner</b>{" "}
                  สามารถจัดการสิทธิ์ของ Tester ได้เท่านั้น
                </span>
              </li>
              <li className="flex items-start">
                <span className="inline-block w-4 h-4 rounded-full bg-gray-100 text-gray-800 flex-shrink-0 mr-2 text-center text-xs font-bold mt-0.5">
                  i
                </span>
                <span>
                  มีการบันทึกประวัติการกำหนดสิทธิ์ว่าใครเป็นผู้มอบหมายสิทธิ์
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectPermissions;
