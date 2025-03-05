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
  } from "lucide-react";

  const API_BASE_URL = import.meta.env.VITE_API_URL;

  // ====== Modal Components ======

  // โมดัลยืนยันการลบโปรเจกต์
  const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        data-cy="delete-confirm-modal"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center">
            <Trash2 className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-red-500 mb-2 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              ลบโปรเจกต์
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้
              ระบบจะลบข้อมูลที่เกี่ยวข้องทั้งหมดของโปรเจกต์นี้!
            </p>
          </div>
          <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors w-full sm:w-auto"
              data-cy="cancel-delete-button"
            >
              ยกเลิก
            </button>
            <button
              onClick={onConfirm}
              className="px-4 sm:px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
              data-cy="confirm-delete-button"
            >
              <Trash2 className="w-5 h-5" />
              ต้องการลบ
            </button>
          </div>
        </div>
      </div>
    );
  };

  // โมดัลแสดงข้อผิดพลาดกรณีไม่สามารถลบโปรเจกต์ที่มีสปรินต์อยู่
  const DeleteErrorModal = ({ isOpen, onClose, sprintCount }) => {
    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        data-cy="delete-error-modal"
      >
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mb-2 sm:mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              ไม่สามารถลบโปรเจกต์นี้ได้
            </h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
              ไม่สามารถลบโปรเจกต์นี้ได้ เนื่องจากมี {sprintCount}
              {sprintCount === 1 ? "สปรินต์" : "สปรินต์"} ที่กำลังดำเนินการอยู่
              กรุณาลบทุกสปรินต์ก่อนที่จะลบโปรเจกต์นี้
            </p>
          </div>
          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-4 sm:px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors w-full sm:w-auto"
              data-cy="error-modal-close-button"
            >
              เข้าใจ
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ====== Sprint Item Component ======

  // คอมโพเนนต์แสดงข้อมูลสปรินต์แต่ละรายการในโปรเจกต์
  const SprintItem = ({ sprint, onNavigate }) => {
    // ฟังก์ชันสำหรับแสดงไอคอนตามสถานะของสปรินต์
    const getStatusIcon = (status) => {
      switch (status?.toLowerCase()) {
        case "completed":
          return <CheckCircle className="w-5 h-5 text-green-500" />;
        case "in progress":
          return <Activity className="w-5 h-5 text-blue-500" />;
        default:
          return <Clock className="w-5 h-5 text-gray-500" />;
      }
    };

    return (
      <div
        onClick={() => onNavigate(sprint.sprint_id)}
        className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
        data-cy={`sprint-item-${sprint.sprint_id}`}
      >
        <div className="mb-2 sm:mb-0">
          <h3 className="font-semibold">{sprint.name}</h3>
          <div className="text-sm text-gray-600">
            {new Date(sprint.start_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}{" "}
            -{" "}
            {new Date(sprint.end_date).toLocaleDateString("th-TH", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="flex items-center gap-4 w-full sm:w-auto justify-end">
          {sprint.status && (
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                sprint.status.toLowerCase() === "completed"
                  ? "bg-green-100 text-green-800"
                  : sprint.status.toLowerCase() === "in progress"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
              data-cy="sprint-status"
            >
              {sprint.status}
            </span>
          )}
          {getStatusIcon(sprint.status)}
        </div>
      </div>
    );
  };

  // ====== Main Component ======

  const ProjectDetail = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();

    // สเตทสำหรับเก็บข้อมูลโปรเจกต์และสถานะต่างๆ
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false);
    const [sprintCount, setSprintCount] = useState(0);

    // ดึงข้อมูลโปรเจกต์เมื่อคอมโพเนนต์ถูกโหลด
    useEffect(() => {
      const fetchProject = async () => {
        try {
          const response = await axios.get(`${API_BASE_URL}/api/projects/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` },
          });
          setProject(response.data);
        } catch (err) {
          setError(
            err.response?.data?.message || "Failed to fetch project details"
          );
        } finally {
          setLoading(false);
        }
      };

      if (user && id) fetchProject();
    }, [id, user]);

    // ฟังก์ชันสำหรับลบโปรเจกต์
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
          setError(err.response?.data?.message || "Failed to delete project");
        }
      }
    };

    // แสดง loading indicator ระหว่างโหลดข้อมูล
    if (loading) {
      return (
        <div
          className="flex justify-center items-center h-screen"
          data-cy="loading-indicator"
        >
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-4 border-blue-500"></div>
        </div>
      );
    }

    // แสดงข้อความผิดพลาดกรณีเกิด error
    if (error) {
      return (
        <div
          className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl"
          data-cy="error-container"
        >
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 sm:px-6 py-4 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        </div>
      );
    }

    // แสดงข้อความกรณีไม่พบโปรเจกต์
    if (!project) {
      return (
        <div
          className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl"
          data-cy="project-not-found"
        >
          <div className="text-center p-4 sm:p-6 bg-gray-100 rounded-lg">
            Project not found
          </div>
        </div>
      );
    }

    // แสดงรายละเอียดโปรเจกต์
    return (
      <div
        className="container mx-auto px-4 py-4 sm:py-8 max-w-4xl"
        data-cy="project-detail-container"
      >
        {/* โมดัลต่างๆ */}
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
        />

        <DeleteErrorModal
          isOpen={showDeleteErrorModal}
          onClose={() => setShowDeleteErrorModal(false)}
          sprintCount={sprintCount}
        />

        {/* ส่วนหัวของหน้า - ปุ่มย้อนกลับและปุ่มจัดการโปรเจกต์ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0 mb-4 sm:mb-6">
          <button
            onClick={() => navigate("/projects")}
            className="group flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            data-cy="back-to-projects-button"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            กลับไปที่หน้าเลือกโปรเจกต์
          </button>

          <div className="flex flex-col xs:flex-row w-full sm:w-auto space-y-2 xs:space-y-0 xs:space-x-3">
            <button
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              data-cy="edit-project-button"
            >
              <Edit className="w-5 h-5" />
              <span className="hidden xs:inline">แก้ไขโปรเจกต์</span>
              <span className="xs:hidden">แก้ไข</span>
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              data-cy="delete-project-button"
            >
              <Trash2 className="w-5 h-5" />
              ลบ
            </button>
          </div>
        </div>

        {/* เนื้อหาหลักของหน้า */}
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          {/* ส่วนหัวของโปรเจกต์ - ชื่อและสถานะ */}
          <div
            className="p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-blue-100"
            data-cy="project-header"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <div>
                <h1
                  className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2"
                  data-cy="project-name"
                >
                  โปรเจกต์ {project.name}
                </h1>
                <div className="flex items-center gap-2">
                  {project.status && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        project.status.toLowerCase() === "completed"
                          ? "bg-green-100 text-green-800"
                          : project.status.toLowerCase() === "in progress"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                      data-cy="project-status-badge"
                    >
                      สถานะ {project.status}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* ส่วนรายละเอียดโปรเจกต์ */}
            <div className="mb-6 sm:mb-8" data-cy="project-description-section">
              <h2 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-3">
                รายละเอียด
              </h2>
              <p
                className="text-gray-600 text-sm sm:text-base"
                data-cy="project-description"
              >
                {project.description}
              </p>
            </div>

            {/* ส่วนแสดงรูปภาพและข้อมูลสำคัญของโปรเจกต์ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
              {/* ส่วนแสดงรูปภาพโปรเจกต์ */}
              <div data-cy="project-image-container">
                {project.photo ? (
                  <div className="aspect-video w-full rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm">
                    <img
                      src={`${API_BASE_URL}/api/uploads/projects/${project.photo}`}
                      alt={project.name}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/placeholder-image.png";
                      }}
                      data-cy="project-image"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-video w-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center"
                    data-cy="project-no-image"
                  >
                    <p className="text-gray-400 text-sm sm:text-base">
                      No image available
                    </p>
                  </div>
                )}
              </div>

              {/* ส่วนแสดงข้อมูลสำคัญของโปรเจกต์ */}
              <div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2 gap-4 content-start"
                data-cy="project-info-container"
              >
                <div
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                  data-cy="project-start-date"
                >
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      วันที่เริ่มต้น
                    </div>
                    <div className="text-sm sm:text-base font-semibold">
                      {new Date(project.start_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                  data-cy="project-end-date"
                >
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      วันที่สิ้นสุด
                    </div>
                    <div className="text-sm sm:text-base font-semibold">
                      {new Date(project.end_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                  data-cy="project-status"
                >
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">สถานะ</div>
                    <div className="text-sm sm:text-base font-semibold">
                      {project.status}
                    </div>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
                  data-cy="project-creator"
                >
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500 flex-shrink-0" />
                  <div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      ถูกสร้างโดย
                    </div>
                    <div className="text-sm sm:text-base font-semibold">
                      {project.created_by}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ส่วนแสดงสปรินต์ในโปรเจกต์ */}
            <div
              className="border-t pt-6 sm:pt-8"
              data-cy="project-sprints-section"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">
                  Sprints (สปรินต์)
                </h2>
              </div>

              {/* แสดงรายการสปรินต์หรือข้อความว่างเปล่า */}
              {project.sprints && project.sprints.length > 0 ? (
                <div className="grid gap-4" data-cy="sprints-list">
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
                  className="flex flex-col items-center justify-center p-4 sm:p-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
                  data-cy="empty-sprints"
                >
                  <h2 className="text-gray-600 mb-2 sm:mb-4 text-center">
                    ยังไม่มี Sprint ในโปรเจกต์นี้
                  </h2>
                  <p className="text-gray-500 text-sm sm:text-base text-center">
                    Sprint จะปรากฏที่นี่เมื่อถูกสร้างขึ้น
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
