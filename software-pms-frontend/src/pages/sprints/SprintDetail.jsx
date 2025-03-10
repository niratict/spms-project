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
  Clock,
  Info,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SprintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLatestSprint, setIsLatestSprint] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditWarningModal, setShowEditWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;

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

  const handleBackToSprints = () => {
    navigate("/sprints", {
      state: {
        selectedProjectId: sprint.project_id,
      },
      replace: true,
    });
  };

  const handleEditClick = () => {
    if (!isLatestSprint) {
      setShowEditWarningModal(true);
    } else {
      navigate(`/sprints/${id}/edit`);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sprints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      navigate("/sprints", {
        state: {
          selectedProjectId: sprint.project_id,
        },
        replace: true,
      });
    } catch (err) {
      setShowDeleteModal(false);

      // Check for specific error message about later sprints
      if (
        err.response?.data?.message ===
        "Cannot delete sprint. Later sprints exist in sequence."
      ) {
        setDeleteWarningMessage(
          "ไม่สามารถลบสปรินต์ได้ เนื่องจากมีสปรินต์ที่ตามมาในลำดับ"
        );
      } else if (
        err.response?.data?.message ===
        "Cannot delete sprint with existing test files"
      ) {
        setDeleteWarningMessage("ไม่สามารถลบสปรินต์ที่มีไฟล์ทดสอบอยู่ได้");
      } else {
        setDeleteWarningMessage(
          err.response?.data?.message || "Failed to delete sprint"
        );
      }

      setShowDeleteWarningModal(true);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleBackToSprints}
            className="w-full py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            กลับไปหน้าเลือกโปรเจกต์
          </button>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <p className="text-2xl text-gray-500 font-medium">ไม่พบข้อมูลสปรินต์</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Navigation Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 p-4 md:p-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <button
              onClick={handleBackToSprints}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
              <span className="font-semibold">กลับไปหน้าเลือกโปรเจกต์</span>
            </button>

            <div className="flex space-x-4">
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-5 h-5" />
                <span>แก้ไขสปรินต์</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <span>ลบสปรินต์</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sprint Details */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Sprint Information */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-xl p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {sprint.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-5 h-5" />
                <span className="text-lg">โปรเจกต์: {sprint.project_name}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่เริ่มต้น</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(sprint.start_date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="bg-green-50 rounded-xl p-4 flex items-center gap-4">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">วันที่สิ้นสุด</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(sprint.end_date).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sprint Information */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">สร้างโดย</p>
                <p className="font-semibold text-gray-900">
                  {sprint.created_by}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="bg-orange-100 p-3 rounded-lg">
                <Info className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">สถานะสปรินต์</p>
                <p className="font-semibold text-gray-900">
                  {isLatestSprint ? "สปรินต์ล่าสุด" : "สปรินต์เก่า"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
            <div className="text-center">
              <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                ยืนยันการลบสปรินต์
              </h2>
              <p className="text-gray-600 mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบสปรินต์นี้?
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                data-cy="delete-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                data-cy="delete-modal-confirm"
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-5 h-5" />
                ลบสปรินต์
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Warning Modal */}
      {showEditWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ไม่สามารถแก้ไขสปรินต์ได้
            </h2>
            <p className="text-gray-600 mb-6">
              สามารถแก้ไขได้เฉพาะสปรินต์ล่าสุดเท่านั้น
            </p>
            <button
              onClick={() => setShowEditWarningModal(false)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarningModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ไม่สามารถลบสปรินต์ได้
            </h2>
            <p className="text-gray-600 mb-6">{deleteWarningMessage}</p>
            <button
              onClick={() => setShowDeleteWarningModal(false)}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SprintDetail;
