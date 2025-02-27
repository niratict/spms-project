import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  Users,
  FileText,
  ArrowLeft,
  Edit,
  Trash2,
  AlertCircle,
  X,
  Menu,
} from "lucide-react";

// กำหนด URL หลักของ API จาก environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

const SprintDetail = () => {
  // ส่วนของการกำหนดตัวแปรและ state
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // State หลักสำหรับข้อมูลและสถานะของหน้า
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLatestSprint, setIsLatestSprint] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // State สำหรับ Modal ต่างๆ
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditWarningModal, setShowEditWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  // ดึงข้อมูล Sprint เมื่อ Component โหลด
  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // ดึงข้อมูล Sprint ปัจจุบัน
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        // ดึงข้อมูล Sprint ทั้งหมดของโปรเจกต์เพื่อตรวจสอบว่าเป็น Sprint ล่าสุดหรือไม่
        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;

        // ตรวจสอบว่าเป็น Sprint ล่าสุดหรือไม่โดยเปรียบเทียบหมายเลข Sprint
        const currentSprintNumber = parseInt(sprintData.name.split(" ")[1]);
        const latestSprintNumber = Math.max(
          ...sprints.map((s) => parseInt(s.name.split(" ")[1]))
        );
        setIsLatestSprint(currentSprintNumber === latestSprintNumber);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch sprint data");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchSprintData();
  }, [id, user]);

  // ฟังก์ชันจัดการการนำทาง
  const handleBackToSprints = () => {
    navigate("/sprints", {
      state: {
        selectedProjectId: sprint.project_id,
      },
      replace: true,
    });
  };

  // ฟังก์ชันจัดการการแก้ไข Sprint
  const handleEditClick = () => {
    if (!isLatestSprint) {
      setShowEditWarningModal(true);
    } else {
      navigate(`/sprints/${id}/edit`);
    }
  };

  // ฟังก์ชันจัดการการลบ Sprint
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sprints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // กลับไปยังหน้า Sprints โดยเก็บ project ที่เลือกไว้
      navigate("/sprints", {
        state: {
          selectedProjectId: sprint.project_id,
        },
        replace: true,
      });
    } catch (err) {
      setShowDeleteModal(false);
      setDeleteWarningMessage(
        err.response?.data?.message || "Failed to delete sprint"
      );
      setShowDeleteWarningModal(true);
    }
  };

  // ส่วนแสดงผลกรณีกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  // ส่วนแสดงผลกรณีเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="flex justify-center items-center min-h-screen p-4"
        data-cy="error-container"
      >
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium" data-cy="error-message">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ส่วนแสดงผลกรณีไม่พบข้อมูล Sprint
  if (!sprint) {
    return (
      <div
        className="flex justify-center items-center min-h-screen"
        data-cy="sprint-not-found"
      >
        <p className="text-gray-600 font-medium">Sprint not found</p>
      </div>
    );
  }

  // ส่วนแสดงผลหลักเมื่อโหลดข้อมูลสำเร็จ
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6"
      data-cy="sprint-detail-page"
    >
      <div className="container mx-auto max-w-5xl">
        {/* แถบนำทาง - ปรับแต่งสำหรับทั้ง Desktop และ Mobile */}
        <div
          className="bg-white rounded-xl shadow-sm mb-4 sm:mb-6 p-3 sm:p-4"
          data-cy="navigation-bar"
        >
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToSprints}
              className="flex items-center gap-1 sm:gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              data-cy="back-button"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-medium hidden xs:inline">
                กลับไปที่หน้าเลือกสปรินต์
              </span>
              <span className="font-medium xs:hidden">กลับ</span>
            </button>

            {/* ปุ่มเมนูสำหรับมือถือ */}
            <div className="sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                data-cy="mobile-menu-button"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* ปุ่มสำหรับ Desktop */}
            <div className="hidden sm:flex gap-3">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                data-cy="edit-sprint-button"
              >
                <Edit className="w-4 h-4" />
                <span>แก้ไขสปรินต์</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                data-cy="delete-sprint-button"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบ</span>
              </button>
            </div>
          </div>

          {/* เมนูแบบ Drop down สำหรับมือถือ */}
          {showMobileMenu && (
            <div
              className="mt-3 pt-3 border-t border-gray-100 sm:hidden"
              data-cy="mobile-menu"
            >
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleEditClick}
                  className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm"
                  data-cy="mobile-edit-sprint-button"
                >
                  <Edit className="w-4 h-4" />
                  <span>แก้ไขสปรินต์</span>
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm"
                  data-cy="mobile-delete-sprint-button"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>ลบ</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* เนื้อหาหลัก */}
        <div
          className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6"
          data-cy="sprint-details-container"
        >
          <div className="p-4 sm:p-6">
            {/* ส่วนหัว */}
            <div className="mb-6 sm:mb-8" data-cy="sprint-header">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2"
                data-cy="sprint-name"
              >
                {sprint.name}
              </h1>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span
                  className="text-sm sm:text-base md:text-lg"
                  data-cy="project-name"
                >
                  Project: {sprint.project_name}
                </span>
              </div>
            </div>

            {/* ตารางข้อมูล Sprint - ปรับแต่งให้รองรับทุกขนาดหน้าจอ */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6"
              data-cy="sprint-info-grid"
            >
              {/* ข้อมูลวันที่เริ่มต้น */}
              <div
                className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300"
                data-cy="start-date-card"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      วันที่เริ่มต้น
                    </p>
                    <p
                      className="text-sm sm:text-base font-semibold text-gray-900"
                      data-cy="sprint-start-date"
                    >
                      {new Date(sprint.start_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลวันที่สิ้นสุด */}
              <div
                className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300"
                data-cy="end-date-card"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">
                      วันที่สิ้นสุด
                    </p>
                    <p
                      className="text-sm sm:text-base font-semibold text-gray-900"
                      data-cy="sprint-end-date"
                    >
                      {new Date(sprint.end_date).toLocaleDateString("th-TH", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลผู้สร้าง */}
              <div
                className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300 sm:col-span-2 lg:col-span-1"
                data-cy="created-by-card"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-100 rounded-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">สร้างโดย</p>
                    <p
                      className="text-sm sm:text-base font-semibold text-gray-900"
                      data-cy="sprint-created-by"
                    >
                      {sprint.created_by}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal ยืนยันการลบ - ปรับแต่งให้รองรับทุกขนาดหน้าจอ */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            data-cy="delete-confirmation-modal"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-3 sm:mx-auto">
              <div className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                      ลบสปรินต์
                    </h2>
                  </div>
                  <p
                    className="text-sm sm:text-base text-gray-600"
                    data-cy="delete-confirmation-message"
                  >
                    คุณแน่ใจหรือไม่ว่าต้องการลบสปรินต์นี้?
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                    และข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวร
                  </p>
                </div>
                <div className="flex justify-end gap-2 sm:gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    data-cy="cancel-delete-button"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-600 text-white text-sm sm:text-base rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                    data-cy="confirm-delete-button"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบสปรินต์
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal แจ้งเตือนการแก้ไข - ปรับแต่งให้รองรับทุกขนาดหน้าจอ */}
        {showEditWarningModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            data-cy="edit-warning-modal"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-3 sm:mx-auto">
              <div className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        ไม่สามารถแก้ไขสปรินต์ได้
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowEditWarningModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                      data-cy="close-edit-warning-button"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <p
                    className="text-sm sm:text-base text-gray-600"
                    data-cy="edit-warning-message"
                  >
                    สามารถแก้ไขได้เฉพาะสปรินต์ล่าสุดเท่านั้น
                    สปรินต์นี้ไม่สามารถแก้ไขได้เนื่องจากมีสปรินต์ใหม่กว่าภายในโปรเจกต์
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowEditWarningModal(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    data-cy="close-edit-warning-modal-button"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal แจ้งเตือนเมื่อลบไม่สำเร็จ - ปรับแต่งให้รองรับทุกขนาดหน้าจอ */}
        {showDeleteWarningModal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            data-cy="delete-warning-modal"
          >
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-3 sm:mx-auto">
              <div className="p-4 sm:p-6">
                <div className="mb-4 sm:mb-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
                      </div>
                      <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                        ไม่สามารถลบสปรินต์ได้
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowDeleteWarningModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                      data-cy="close-delete-warning-button"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                  <p
                    className="text-sm sm:text-base text-gray-600"
                    data-cy="delete-warning-message"
                  >
                    {deleteWarningMessage}
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDeleteWarningModal(false)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                    data-cy="close-delete-warning-modal-button"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintDetail;
