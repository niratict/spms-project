import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Modal from "react-modal";
import { useAuth } from "../../context/AuthContext";
import {
  Calendar,
  FileText,
  Users,
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

// ค่า API URL จาก environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL;

const TestFileDetail = () => {
  // ======== States & Hooks ========
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // สถานะของข้อมูลไฟล์และการแสดงผล
  const [testFile, setTestFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ======== Side Effects ========
  // ดึงข้อมูลไฟล์ทดสอบเมื่อเริ่มต้นหรือเมื่อ id หรือ user เปลี่ยน
  useEffect(() => {
    const fetchTestFile = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/test-files/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setTestFile(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Failed to fetch test file details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchTestFile();
  }, [id, user]);

  // ======== Helper Functions ========
  // ฟังก์ชันแสดงไอคอนตามสถานะของไฟล์ทดสอบ
  const getStatusIcon = () => {
    switch (testFile?.status) {
      case "Pass":
        return (
          <CheckCircle
            className="w-5 h-5 sm:w-6 sm:h-6 text-green-500"
            data-cy="status-icon-pass"
          />
        );
      case "Fail":
        return (
          <AlertCircle
            className="w-5 h-5 sm:w-6 sm:h-6 text-red-500"
            data-cy="status-icon-fail"
          />
        );
      default:
        return (
          <FileText
            className="w-5 h-5 sm:w-6 sm:h-6 text-white"
            data-cy="status-icon-default"
          />
        );
    }
  };

  // ======== Event Handlers ========
  // ฟังก์ชันสำหรับลบไฟล์ทดสอบ
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/api/test-files/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      navigate("/test-files");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete test file");
    }
  };

  // ======== Conditional Rendering ========
  // แสดง loading spinner ระหว่างกำลังโหลดข้อมูล
  if (loading)
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            Loading file details...
          </p>
        </div>
      </div>
    );

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error)
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        data-cy="error-message"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 text-base sm:text-lg">{error}</p>
        </div>
      </div>
    );

  // แสดงข้อความเมื่อไม่พบไฟล์ทดสอบ
  if (!testFile)
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        data-cy="not-found-message"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">
            Test file not found
          </p>
        </div>
      </div>
    );

  // ======== Main Component Render ========
  return (
    <div
      className="min-h-screen bg-gray-50 py-6 sm:py-12"
      data-cy="test-file-detail-container"
    >
      <div className="container mx-auto max-w-4xl px-4">
        {/* ปุ่มกลับไปหน้าหลัก */}
        <button
          data-cy="back-button"
          onClick={() =>
            navigate("/test-files", {
              state: {
                selectedProjectId: testFile.project_id,
                projectName: testFile.project_name,
                selectedSprintId: testFile.sprint_id,
                sprintName: testFile.sprint_name,
              },
            })
          }
          className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>กลับหน้าเลือกไฟล์ทดสอบ</span>
        </button>

        {/* ข้อมูลรายละเอียดไฟล์ทดสอบ */}
        <div
          className="bg-white shadow-lg sm:shadow-xl rounded-xl overflow-hidden"
          data-cy="test-file-card"
        >
          {/* ส่วนหัวการ์ด */}
          <div className="bg-blue-600 text-white p-4 sm:p-6 flex justify-between items-center">
            <div className="flex-1 min-w-0">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold truncate"
                data-cy="file-name"
                title={testFile.filename}
              >
                {testFile.filename}
              </h1>
              <p className="text-blue-100 text-sm sm:text-base">
                รายละเอียดไฟล์ทดสอบ
              </p>
            </div>
            <div className="ml-2 flex-shrink-0">{getStatusIcon()}</div>
          </div>

          {/* รายละเอียดไฟล์ */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* คอลัมน์ซ้าย: ข้อมูลไฟล์ทดสอบ */}
              <div data-cy="file-primary-info">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 border-b pb-2">
                  ข้อมูลไฟล์ทดสอบ
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">ชื่อไฟล์</span>{" "}
                      <span
                        data-cy="original-filename"
                        className="block sm:inline truncate"
                        title={testFile.original_filename}
                      >
                        {testFile.original_filename}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">วันที่อัพโหลด</span>{" "}
                      <span data-cy="upload-date">
                        {new Date(testFile.upload_date).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">อัพโหลดโดย</span>{" "}
                      <span
                        data-cy="uploader"
                        className="block sm:inline truncate"
                        title={testFile.last_modified_by}
                      >
                        {testFile.last_modified_by}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* คอลัมน์ขวา: รายละเอียดเพิ่มเติม */}
              <div data-cy="file-secondary-info">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 border-b pb-2">
                  รายละเอียดเพิ่มเติม
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">ขนาดไฟล์</span>{" "}
                      <span data-cy="file-size">
                        {(testFile.file_size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">โปรเจกต์</span>{" "}
                      <span
                        data-cy="project-name"
                        className="block sm:inline truncate"
                        title={testFile.project_name}
                      >
                        {testFile.project_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">สปรินต์</span>{" "}
                      <span
                        data-cy="sprint-name"
                        className="block sm:inline truncate"
                        title={testFile.sprint_name}
                      >
                        {testFile.sprint_name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ปุ่มการทำงาน */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-end gap-3 sm:space-x-4">
              <button
                data-cy="edit-button"
                onClick={() => navigate(`/test-files/${id}/edit`)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm sm:text-base"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                แก้ไขไฟล์ทดสอบ
              </button>
              <button
                data-cy="delete-button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm sm:text-base"
              >
                <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                ลบไฟล์ทดสอบ
              </button>
            </div>
          </div>
        </div>

        {/* Modal ยืนยันการลบไฟล์ */}
        <Modal
          isOpen={showDeleteModal}
          onRequestClose={() => setShowDeleteModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50"
          data-cy="delete-modal"
        >
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <div className="text-center">
              <Trash2 className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-3 sm:mb-4" />
              <h2 className="text-lg sm:text-xl font-bold mb-2">ลบไฟล์ทดสอบ</h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ทดสอบนี้?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
                <button
                  data-cy="cancel-delete"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100 transition-colors order-2 sm:order-1 text-sm sm:text-base"
                >
                  ยกเลิก
                </button>
                <button
                  data-cy="confirm-delete"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors order-1 sm:order-2 text-sm sm:text-base"
                >
                  ลบไฟล์ทดสอบ
                </button>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default TestFileDetail;
