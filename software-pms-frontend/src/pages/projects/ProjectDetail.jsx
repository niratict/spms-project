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
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// ====== โมดัลยืนยันการลบ ======
const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
        <div className="text-center">
          <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            ยืนยันการลบโปรเจกต์
          </h2>
          <p className="text-gray-600 mb-6">
            คุณแน่ใจหรือไม่ว่าต้องการลบโปรเจกต์นี้?
            ข้อมูลทั้งหมดจะถูกลบอย่างถาวร
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-3">
            ไม่สามารถลบโปรเจกต์ได้
          </h2>
          <p className="text-gray-600 mb-6">
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
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "on hold":
        return "bg-amber-100 text-amber-800 border-amber-300";
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
      className="min-h-screen bg-gray-50 py-8 px-4"
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
            กลับสู่โปรเจกต์
          </button>
          <div className="flex space-x-4">
            <button
              data-cy="edit-project"
              onClick={() => navigate(`/projects/${id}/edit`)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Edit className="w-5 h-5" />
              แก้ไขโปรเจกต์
            </button>
            <button
              data-cy="delete-project"
              onClick={() => setShowDeleteModal(true)}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              ลบโปรเจกต์
            </button>
          </div>
        </div>

        {/* คาร์ดรายละเอียดโปรเจกต์ */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* ส่วนหัวโปรเจกต์ */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold text-gray-800">
                โปรเจกต์ {project.name}
              </h1>
              <span
                data-cy="project-status"
                className={`px-4 py-2 rounded-full text-sm font-medium border ${getProjectStatusColor(
                  project.status
                )}`}
              >
                สถานะ {project.status}
              </span>
            </div>
          </div>

          {/* เนื้อหารายละเอียด */}
          <div className="p-6 grid md:grid-cols-2 gap-8">
            {/* ข้อมูลโปรเจกต์ */}
            <div>
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

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-6 h-6 text-blue-500" />
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
                      <Calendar className="w-6 h-6 text-blue-500" />
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
            <div>
              {project.photo ? (
                <div
                  data-cy="project-image"
                  className="rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300"
                >
                  <img
                    src={`${API_BASE_URL}/api/uploads/projects/${project.photo}`}
                    alt={project.name}
                    className="w-full h-64 object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/placeholder-image.png";
                    }}
                  />
                </div>
              ) : (
                <div
                  data-cy="project-no-image"
                  className="bg-gray-100 rounded-xl h-64 flex items-center justify-center border-2 border-dashed border-gray-300"
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
          <div className="p-6 border-t">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Sprints</h2>
            </div>

            {project.sprints && project.sprints.length > 0 ? (
              <div
                data-cy="sprint-list"
                className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
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
                className="text-center bg-gray-50 p-8 rounded-xl border border-gray-200"
              >
                <Info className="mx-auto w-12 h-12 text-gray-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  ยังไม่มี Sprint
                </h3>
                <p className="text-gray-600 mb-4">
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
