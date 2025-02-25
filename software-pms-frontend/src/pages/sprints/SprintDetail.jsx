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
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SprintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditWarningModal, setShowEditWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");
  const [isLatestSprint, setIsLatestSprint] = useState(false);

  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // Fetch current sprint
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        // Fetch all sprints for the project to check if this is the latest
        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;

        // Check if this is the latest sprint
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

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/sprints/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      // Navigate back to sprints page with the project selection preserved
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
          <div className="text-center">
            <AlertCircle className="mx-auto w-12 h-12 text-red-500 mb-4" />
            <p className="text-red-600 font-medium">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sprint) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-600 font-medium">Sprint not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="container mx-auto max-w-5xl">
        {/* Navigation Bar */}
        <div className="bg-white rounded-xl shadow-sm mb-6 p-4">
          <div className="flex justify-between items-center">
            <button
              onClick={handleBackToSprints}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">กลับไปที่หน้าเลือกสปรินต์</span>
            </button>
            <div className="flex gap-3">
              <button
                onClick={handleEditClick}
                className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                <span>แก้ไขสปรินต์</span>
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบ</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {sprint.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-5 h-5" />
                <span className="text-lg">Project: {sprint.project_name}</span>
              </div>
            </div>

            {/* Sprint Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
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
              </div>

              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
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

              <div className="bg-gray-50 rounded-xl p-6 hover:shadow-md transition-shadow duration-300">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">สร้างโดย</p>
                    <p className="font-semibold text-gray-900">
                      {sprint.created_by}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Trash2 className="w-6 h-6 text-red-600" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      ลบสปรินต์
                    </h2>
                  </div>
                  <p className="text-gray-600">
                    คุณแน่ใจหรือไม่ว่าต้องการลบสปรินต์นี้?
                    การกระทำนี้ไม่สามารถย้อนกลับได้
                    และข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบอย่างถาวร
                  </p>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    ลบสปรินต์
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Warning Modal */}
        {showEditWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        ไม่สามารถแก้ไขสปรินต์ได้
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowEditWarningModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-gray-600">
                    สามารถแก้ไขได้เฉพาะสปรินต์ล่าสุดเท่านั้น
                    สปรินต์นี้ไม่สามารถแก้ไขได้เนื่องจากมีสปรินต์ใหม่กว่าภายในโปรเจกต์
                  </p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowEditWarningModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    ปิด
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Warning Modal */}
        {showDeleteWarningModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-orange-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        ไม่สามารถลบสปรินต์ได้
                      </h2>
                    </div>
                    <button
                      onClick={() => setShowDeleteWarningModal(false)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <p className="text-gray-600">{deleteWarningMessage}</p>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowDeleteWarningModal(false)}
                    className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
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
