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
  Clock,
  RefreshCw,
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

  // เลื่อนไปด้านบนสุดของหน้าเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
  // ฟังก์ชันแสดงไอคอนและสีตามสถานะของไฟล์ทดสอบ
  const getStatusDetails = () => {
    switch (testFile?.status) {
      case "Pass":
        return {
          icon: (
            <CheckCircle
              className="w-5 h-5 sm:w-6 sm:h-6"
              data-cy="status-icon-pass"
            />
          ),
          color: "bg-green-500",
          textColor: "text-white",
          label: "ผ่าน",
        };
      case "Fail":
        return {
          icon: (
            <AlertCircle
              className="w-5 h-5 sm:w-6 sm:h-6"
              data-cy="status-icon-fail"
            />
          ),
          color: "bg-red-500",
          textColor: "text-white",
          label: "ไม่ผ่าน",
        };
      default:
        return {
          icon: (
            <FileText
              className="w-5 h-5 sm:w-6 sm:h-6"
              data-cy="status-icon-default"
            />
          ),
          color: "bg-gray-400",
          textColor: "text-white",
          label: "ไม่มีสถานะ",
        };
    }
  };

  // ฟังก์ชันสำหรับจัดรูปแบบวันที่
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
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
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50"
        data-cy="loading-spinner"
      >
        <div className="text-center bg-white p-6 rounded-xl shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base font-medium">
            กำลังโหลดข้อมูลไฟล์ทดสอบ...
          </p>
        </div>
      </div>
    );

  // แสดงข้อความเมื่อเกิดข้อผิดพลาด
  if (error)
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center px-4"
        data-cy="error-message"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <AlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-red-600 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-red-500 text-base sm:text-lg">{error}</p>
          <button
            onClick={() => navigate("/test-files")}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base flex items-center justify-center mx-auto gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );

  // แสดงข้อความเมื่อไม่พบไฟล์ทดสอบ
  if (!testFile)
    return (
      <div
        className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center px-4"
        data-cy="not-found-message"
      >
        <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">
            ไม่พบไฟล์ทดสอบ
          </h2>
          <p className="text-gray-600 text-base sm:text-lg mb-4">
            ไม่พบข้อมูลไฟล์ทดสอบที่คุณต้องการดู
          </p>
          <button
            onClick={() => navigate("/test-files")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base flex items-center justify-center mx-auto gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าหลัก
          </button>
        </div>
      </div>
    );

  const statusDetails = getStatusDetails();

  // ======== Main Component Render ========
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 md:p-6"
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
                scrollToFileSection: true,
              },
            })
          }
          className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base text-gray-600 hover:text-gray-900 mb-4 sm:mb-6 transition-colors bg-white rounded-lg px-4 py-2 shadow-md hover:shadow-lg"
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
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4">
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

              {/* แสดงสถานะของไฟล์ทดสอบด้วย Badge */}
              <div
                className={`ml-2 flex-shrink-0 ${statusDetails.color} ${statusDetails.textColor} px-3 py-1 rounded-full flex items-center gap-2`}
                data-cy="status-badge"
              >
                {statusDetails.icon}
                <span className="font-medium text-sm sm:text-base">
                  {statusDetails.label}
                </span>
              </div>
            </div>

            {/* แสดงข้อมูลโปรเจกต์และสปรินต์ */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm sm:text-base text-blue-100">
              <div className="flex items-center gap-2" data-cy="header-project">
                <FileText className="w-4 h-4" />
                <span className="font-medium">โปรเจกต์: </span>
                <span className="truncate">{testFile.project_name}</span>
              </div>
              <div className="flex items-center gap-2" data-cy="header-sprint">
                <FileText className="w-4 h-4" />
                <span className="font-medium">สปรินต์: </span>
                <span className="truncate">{testFile.sprint_name}</span>
              </div>
            </div>
          </div>

          {/* รายละเอียดไฟล์ */}
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* คอลัมน์ซ้าย: ข้อมูลไฟล์ทดสอบ */}
              <div
                data-cy="file-primary-info"
                className="bg-blue-50 p-4 rounded-lg"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 border-b border-blue-200 pb-2 text-blue-700">
                  ข้อมูลไฟล์ทดสอบ
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">ชื่อไฟล์</span>{" "}
                      <span
                        data-cy="original-filename"
                        className="block sm:inline truncate text-gray-700"
                        title={testFile.original_filename}
                      >
                        {testFile.original_filename}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">วันที่อัพโหลด</span>{" "}
                      <span data-cy="upload-date" className="text-gray-700">
                        {formatDate(testFile.upload_date)}
                      </span>
                    </div>
                  </div>
                  {/* เพิ่มวันที่อัพเดท */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">วันที่อัพเดท</span>{" "}
                      <span data-cy="update-date" className="text-gray-700">
                        {formatDate(
                          testFile.last_modified_date || testFile.upload_date
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">อัพโหลดโดย</span>{" "}
                      <span
                        data-cy="uploader"
                        className="block sm:inline truncate text-gray-700"
                        title={testFile.last_modified_by}
                      >
                        {testFile.last_modified_by}
                      </span>
                    </div>
                  </div>
                  {/* เพิ่มอัพเดทล่าสุดโดย */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">อัพเดทล่าสุดโดย</span>{" "}
                      <span
                        data-cy="last-modified-by"
                        className="block sm:inline truncate text-gray-700"
                        title={testFile.last_modified_by}
                      >
                        {testFile.last_modified_by}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* คอลัมน์ขวา: รายละเอียดเพิ่มเติม */}
              <div
                data-cy="file-secondary-info"
                className="bg-indigo-50 p-4 rounded-lg"
              >
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 border-b border-indigo-200 pb-2 text-indigo-700">
                  รายละเอียดเพิ่มเติม
                </h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">ขนาดไฟล์</span>{" "}
                      <span data-cy="file-size" className="text-gray-700">
                        {(testFile.file_size / 1024).toFixed(2)} KB
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">โปรเจกต์</span>{" "}
                      <span
                        data-cy="project-name"
                        className="block sm:inline truncate text-gray-700"
                        title={testFile.project_name}
                      >
                        {testFile.project_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
                    <div className="min-w-0 text-sm sm:text-base">
                      <span className="font-semibold">สปรินต์</span>{" "}
                      <span
                        data-cy="sprint-name"
                        className="block sm:inline truncate text-gray-700"
                        title={testFile.sprint_name}
                      >
                        {testFile.sprint_name}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 flex-shrink-0" />
                    <div className="text-sm sm:text-base">
                      <span className="font-semibold">สถานะ</span>{" "}
                      <span
                        data-cy="status-text"
                        className={`inline-block px-2 py-1 rounded-md font-medium ${statusDetails.color} ${statusDetails.textColor}`}
                      >
                        {statusDetails.label}
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
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base shadow-md"
              >
                <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                แก้ไขไฟล์ทดสอบ
              </button>
              <button
                data-cy="delete-button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base shadow-md"
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
          overlayClassName="fixed inset-0 bg-black bg-opacity-70"
          data-cy="delete-modal"
        >
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 w-full max-w-xs sm:max-w-md">
            <div className="text-center">
              <div className="bg-red-100 rounded-full p-3 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Trash2 className="w-8 h-8 sm:w-10 sm:h-10 text-red-500" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold mb-2">
                ยืนยันการลบไฟล์ทดสอบ
              </h2>
              <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์ทดสอบ "
                {testFile.original_filename}"?
                <br />
                การดำเนินการนี้ไม่สามารถย้อนกลับได้
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4">
                <button
                  data-cy="cancel-delete"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors order-2 sm:order-1 text-sm sm:text-base font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  data-cy="confirm-delete"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors order-1 sm:order-2 text-sm sm:text-base font-medium"
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
