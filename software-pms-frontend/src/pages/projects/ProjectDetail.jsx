import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Clock,
  Users,
  Activity,
  ArrowLeft,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Shield,
  MoreVertical,
  FolderX,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ====== โมดัลยืนยันการลบ ======
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
        <div className="text-center">
          <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            ยืนยันการลบโปรเจกต์
          </h2>
          <p className="text-gray-600 mb-6">
            คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้?
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            data-cy="delete-modal-cancel"
            onClick={onClose}
            className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            data-cy="delete-modal-confirm"
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="w-5 h-5" />
            ลบโปรเจกต์
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== โมดัลข้อผิดพลาดการลบ ======
const DeleteErrorModal = ({ isOpen, onClose, sprintCount }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            ไม่สามารถลบโปรเจกต์ได้
          </h2>
          <p className="text-gray-600">
            ไม่สามารถลบโปรเจกต์นี้ได้ เนื่องจากมี {sprintCount}{" "}
            {sprintCount === 1 ? "สปรินต์" : "สปรินต์"} ที่กำลังดำเนินการ
          </p>
        </div>
        <button
          data-cy="delete-error-modal-close"
          onClick={onClose}
          className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          เข้าใจแล้ว
        </button>
      </div>
    </div>
  );
};

// ====== คอมโพเนนต์เมนูแบบ Dropdown สำหรับอุปกรณ์มือถือ ======
const MobileActionsMenu = ({ onEdit, onDelete, onManagePermissions }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        data-cy="mobile-actions-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-full hover:bg-gray-100 transition-colors"
      >
        <MoreVertical className="w-6 h-6 text-gray-700" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 animate-fadeIn">
          <div className="py-1">
            <button
              data-cy="mobile-manage-permissions"
              onClick={() => {
                onManagePermissions();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 text-gray-700"
            >
              <Shield className="w-5 h-5 text-purple-600" />
              จัดการสิทธิ์
            </button>
            <button
              data-cy="mobile-edit-project"
              onClick={() => {
                onEdit();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 text-gray-700"
            >
              <Edit className="w-5 h-5 text-blue-600" />
              แก้ไขโปรเจกต์
            </button>
            <button
              data-cy="mobile-delete-project"
              onClick={() => {
                onDelete();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-gray-50 text-gray-700"
            >
              <Trash2 className="w-5 h-5 text-red-600" />
              ลบโปรเจกต์
            </button>
          </div>
        </div>
      )}

      {/* Overlay เพื่อปิด dropdown เมื่อคลิกที่อื่น */}
      {isOpen && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};

// ====== คอมโพเนนต์รายการสปรินต์ ======
const SprintItem = ({ sprint, onNavigate }) => {
  // ฟังก์ชันกำหนดสีตามสถานะ
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-600 border-green-200";
      case "in progress":
        return "bg-blue-100 text-blue-600 border-blue-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  return (
    <div
      data-cy={`sprint-item-${sprint.sprint_id}`}
      onClick={() => onNavigate(sprint.sprint_id)}
      className="bg-white border rounded-xl p-4 hover:shadow-lg transition-all group cursor-pointer hover:border-blue-300"
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
          {sprint.name}
        </h3>
      </div>
      <div className="flex justify-between items-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-500" />
          <span>
            {new Date(sprint.start_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span>
            {new Date(sprint.end_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
};

// ====== หน้ารายละเอียดโปรเจกต์ ======
const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
  const [sprintCount, setSprintCount] = useState(0);

  // ฟังก์ชันกำหนดสีสถานะโปรเจกต์
  const getProjectStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-blue-500 text-white border-blue-300";
      case "on hold":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-green-100 text-green-800 border-green-300";
    }
  };

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
          err.response?.data?.message || "ไม่สามารถโหลดรายละเอียดโปรเจกต์ได้"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchProject();
  }, [id, user]);

  // จัดการลบโปรเจกต์
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/projects/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/projects");
    } catch (err) {
      if (
        err.response?.data?.message ===
        "Cannot delete project with existing sprints"
      ) {
        setSprintCount(err.response.data.sprint_count);
        setShowDeleteModal(false);
        setShowDeleteErrorModal(true);
      } else {
        setError(err.response?.data?.message || "ไม่สามารถลบโปรเจกต์ได้");
      }
    }
  };

  // สถานะโหลดข้อมูล
  if (loading) {
    return (
      <div
        data-cy="project-detail-loading"
        className="flex justify-center items-center min-h-screen bg-gray-50"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // การจัดการข้อผิดพลาด
  if (error) {
    return (
      <div
        data-cy="project-detail-error"
        className="container mx-auto px-4 py-8 max-w-2xl"
      >
        <div className="bg-red-50 border border-red-200 text-red-800 p-6 rounded-xl flex items-center gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <div>
            <h2 className="font-bold text-lg mb-2">เกิดข้อผิดพลาด</h2>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // ไม่พบโปรเจกต์
  if (!project) {
    return (
      <div
        data-cy="project-detail-not-found"
        className="flex justify-center items-center min-h-screen bg-gray-50"
      >
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <Info className="mx-auto w-16 h-16 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            ไม่พบข้อมูลโปรเจกต์
          </h2>
          <p className="text-gray-600">
            โปรเจกต์ที่คุณค้นหาอาจถูกลบหรือไม่มีอยู่
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      data-cy="project-detail-page"
      className="min-h-screen bg-gray-50 py-4 md:py-8 px-4"
    >
      {/* โมดัลยืนยันการลบ */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
      />

      {/* โมดัลข้อผิดพลาดการลบ */}
      <DeleteErrorModal
        isOpen={showDeleteErrorModal}
        onClose={() => setShowDeleteErrorModal(false)}
        sprintCount={sprintCount}
      />

      <div className="max-w-6xl mx-auto space-y-6">
        {/* แถบนำทางและปุ่มจัดการ */}
        <div className="flex justify-between items-center mb-6">
          <button
            data-cy="back-to-projects"
            onClick={() => navigate("/projects")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">กลับไปหน้าเลือกโปรเจกต์</span>
          </button>

          {/* ปุ่มสำหรับหน้าจอขนาดใหญ่ */}
          <div className="hidden sm:flex space-x-3">
            <button
              data-cy="manage-permissions"
              onClick={() => navigate(`/projects/${id}/permissions`)}
              className="flex items-center gap-2 bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 transition-colors text-sm md:text-base"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5" />
              จัดการสิทธิ์
            </button>
            <button
              data-cy="edit-project"
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="flex items-center gap-2 bg-blue-500 text-white px-3 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm md:text-base"
            >
              <Edit className="w-4 h-4 md:w-5 md:h-5" />
              แก้ไขโปรเจกต์
            </button>
            <button
              data-cy="delete-project"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm md:text-base"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
              ลบโปรเจกต์
            </button>
          </div>

          {/* เมนู Dropdown สำหรับอุปกรณ์มือถือ */}
          <div className="sm:hidden">
            <MobileActionsMenu
              onManagePermissions={() =>
                navigate(`/projects/${id}/permissions`)
              }
              onEdit={() => navigate(`/projects/${id}/edit`)}
              onDelete={() => setShowDeleteModal(true)}
            />
          </div>
        </div>

        {/* คาร์ดรายละเอียดโปรเจกต์ */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ส่วนหัวโปรเจกต์ */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 md:p-6">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                โปรเจกต์ {project.name}
              </h1>
              <span
                data-cy="project-status"
                className={`px-3 py-1 md:px-4 md:py-2 rounded-full text-sm font-medium border ${getProjectStatusColor(
                  project.status
                )}`}
              >
                สถานะ {project.status}
              </span>
            </div>
          </div>

          {/* เนื้อหารายละเอียด */}
          <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* ข้อมูลโปรเจกต์ */}
            <div className="order-2 md:order-1">
              <h2 className="text-xl font-semibold mb-4 border-b pb-2">
                รายละเอียด
              </h2>
              <p className="text-gray-600 mb-4">{project.description}</p>

              {/* ข้อมูลเพิ่มเติมของโปรเจกต์ */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">
                    <span className="font-semibold">สร้างโดย:</span>{" "}
                    {project.created_by}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-700">
                        วันเริ่มต้น
                      </h3>
                    </div>
                    <p data-cy="project-start-date" className="text-gray-600">
                      {new Date(project.start_date).toLocaleDateString(
                        "th-TH",
                        {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <h3 className="font-semibold text-gray-700">
                        วันสิ้นสุด
                      </h3>
                    </div>
                    <p data-cy="project-end-date" className="text-gray-600">
                      {new Date(project.end_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* รูปภาพโปรเจกต์ */}
            <div className="order-1 md:order-2">
              {project.photo ? (
                <div
                  data-cy="project-image"
                  className="rounded-xl overflow-hidden shadow-lg h-56 md:h-64 lg:h-72 hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src={project.photo}
                    alt={project.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.png";
                    }}
                  />
                </div>
              ) : (
                <div
                  data-cy="project-no-image"
                  className="bg-gray-100 rounded-xl h-56 md:h-64 lg:h-72 flex items-center justify-center border-2 border-dashed border-gray-300"
                >
                  <p className="text-gray-500 flex items-center gap-2">
                    <Info className="w-6 h-6" />
                    ไม่มีรูปภาพ
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ส่วนสปรินต์ */}
          <div className="p-4 md:p-6 border-t">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl md:text-2xl font-semibold">สปรินต์</h2>
            </div>

            {project.sprints && project.sprints.length > 0 ? (
              <div
                data-cy="sprint-list"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {project.sprints.map((sprint) => (
                  <SprintItem
                    key={sprint.sprint_id}
                    sprint={sprint}
                    onNavigate={(sprintId) => navigate(`/sprints/${sprintId}`)}
                  />
                ))}
              </div>
            ) : (
              <div
                data-cy="no-sprints"
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
              >
                <FolderX className="w-12 h-12 text-gray-400 mb-3" />
                <h2 className="text-lg font-medium text-gray-700 mb-2">
                  ยังไม่มีสปรินต์ในโปรเจกต์นี้
                </h2>
                <p className="text-sm text-gray-500 text-center">
                  สปรินต์จะปรากฏที่นี่เมื่อถูกสร้างขึ้น
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

// เอนิเมชัน Tailwind CSS (เพิ่มลงใน global CSS หรือ Tailwind config)
const tailwindAnimations = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out;
}
`;
