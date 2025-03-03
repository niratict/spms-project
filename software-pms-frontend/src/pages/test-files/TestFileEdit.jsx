import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Upload,
  ArrowLeft,
  FileText,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// คอมโพเนนต์สำหรับแก้ไขไฟล์ทดสอบ
const TestFileEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // สถานะของคอมโพเนนต์
  const [testFile, setTestFile] = useState(null); // ข้อมูลไฟล์ทดสอบ
  const [loading, setLoading] = useState(true); // สถานะการโหลดข้อมูล
  const [saving, setSaving] = useState(false); // สถานะการบันทึกข้อมูล
  const [error, setError] = useState(null); // ข้อความแสดงข้อผิดพลาด
  const [fileError, setFileError] = useState(null); // ข้อผิดพลาดของไฟล์
  const [selectedFile, setSelectedFile] = useState(null); // ไฟล์ที่เลือกใหม่
  const [showConfirmModal, setShowConfirmModal] = useState(false); // แสดง/ซ่อนหน้าต่างยืนยัน
  const [formData, setFormData] = useState({
    filename: "",
  });

  // ดึงข้อมูลไฟล์ทดสอบเมื่อโหลดหน้า
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
        setFormData({
          filename: response.data.filename,
        });
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch test file");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchTestFile();
  }, [id, user]);

  // ฟังก์ชันตรวจสอบและเลือกไฟล์
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setFileError(null);
    setError(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    // ตรวจสอบประเภทไฟล์
    if (file.type !== "application/json") {
      setFileError("Only JSON files are allowed");
      setSelectedFile(null);
      return;
    }

    // ตรวจสอบขนาดไฟล์
    if (file.size > 5 * 1024 * 1024) {
      setFileError("File size must be less than 5MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  // ฟังก์ชันเปิดหน้าต่างยืนยันการบันทึก
  const handleSubmitConfirm = () => {
    setShowConfirmModal(true);
  };

  // ฟังก์ชันบันทึกข้อมูล
  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);
      setShowConfirmModal(false);

      // เตรียมข้อมูลสำหรับส่งไปยัง API
      const submitData = new FormData();
      if (selectedFile) {
        submitData.append("testFile", selectedFile);
        // ไม่ต้องส่ง status เดิมไปเมื่อมีการอัพโหลดไฟล์ใหม่
        // เพื่อให้ backend กำหนดสถานะจาก JSON content ใหม่อัตโนมัติ
      } else {
        // ใช้สถานะเดิมจาก testFile เฉพาะกรณีที่ไม่มีการอัพโหลดไฟล์ใหม่
        if (testFile && testFile.status) {
          submitData.append("status", testFile.status);
        }
      }

      submitData.append("filename", formData.filename);

      // ส่งข้อมูลไปยัง API
      await axios.put(
        `${API_BASE_URL}/api/test-files/${id}/upload`,
        submitData,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // นำทางกลับไปยังหน้ารายละเอียดไฟล์
      navigate(`/test-files/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update test file");
    } finally {
      setSaving(false);
    }
  };

  // แสดงตัวโหลดขณะกำลังดึงข้อมูล
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-t-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            กำลังโหลดรายละเอียดไฟล์...
          </p>
        </div>
      </div>
    );
  }

  // แสดงข้อความเมื่อไม่พบไฟล์
  if (!testFile) {
    return (
      <div
        className="min-h-screen bg-gray-50 flex items-center justify-center px-4"
        data-cy="file-not-found"
      >
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg text-center w-full max-w-md">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">ไม่พบไฟล์ทดสอบ</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* หน้าแก้ไขไฟล์ทดสอบ */}
      <div
        className="min-h-screen bg-gray-50 py-6 sm:py-8 md:py-12"
        data-cy="test-file-edit-page"
      >
        <div className="container mx-auto max-w-2xl px-4">
          {/* ส่วนหัวและปุ่มกลับ */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <button
              onClick={() => navigate(`/test-files/${id}`)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
              data-cy="back-button"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>กลับไปหน้ารายละเอียด</span>
            </button>

            {/* แสดงสถานะไฟล์ทดสอบ (ไม่สามารถแก้ไขได้) */}
            {testFile.status === "Pass" ? (
              <div
                className="flex items-center gap-2 text-green-600 text-sm sm:text-base"
                data-cy="status-pass"
              >
                <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Passed</span>
              </div>
            ) : testFile.status === "Fail" ? (
              <div
                className="flex items-center gap-2 text-red-600 text-sm sm:text-base"
                data-cy="status-fail"
              >
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Failed</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-2 text-yellow-600 text-sm sm:text-base"
                data-cy="status-pending"
              >
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Pending</span>
              </div>
            )}
          </div>

          {/* แบบฟอร์มแก้ไขไฟล์ */}
          <div className="bg-white shadow-xl rounded-xl overflow-hidden">
            {/* ส่วนหัวแบบฟอร์ม */}
            <div className="bg-blue-600 text-white p-4 sm:p-6">
              <h1
                className="text-xl sm:text-2xl font-bold"
                data-cy="edit-form-title"
              >
                แก้ไขไฟล์ทดสอบ
              </h1>
              <p
                className="text-blue-100 mt-1 text-sm sm:text-base break-words"
                data-cy="edit-file-name"
              >
                กำลังแก้ไข {testFile.original_filename}
              </p>
            </div>

            {/* เนื้อหาแบบฟอร์ม */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* ข้อความแสดงข้อผิดพลาด */}
              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base"
                  data-cy="error-message"
                >
                  <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6">
                {/* ส่วนอัพโหลดไฟล์ */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    อัพโหลดไฟล์ใหม่ (เลือกได้)
                  </label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <label className="relative cursor-pointer inline-block">
                      <input
                        type="file"
                        accept="application/json"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        data-cy="file-upload-input"
                      />
                      <div
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
                        data-cy="file-upload-button"
                      >
                        <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>เลือกไฟล์</span>
                      </div>
                    </label>
                    {selectedFile && (
                      <span
                        className="text-xs sm:text-sm text-gray-600 truncate max-w-full"
                        data-cy="selected-file-name"
                      >
                        {selectedFile.name}
                      </span>
                    )}
                  </div>
                  {/* ข้อผิดพลาดของไฟล์ */}
                  {fileError && (
                    <p
                      className="mt-2 text-xs sm:text-sm text-red-500"
                      data-cy="file-error-message"
                    >
                      {fileError}
                    </p>
                  )}
                </div>

                {/* ช่องกรอกชื่อไฟล์ */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    ชื่อไฟล์
                  </label>
                  <input
                    type="text"
                    value={formData.filename}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        filename: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                    data-cy="filename-input"
                  />
                </div>
              </div>

              {/* ปุ่มดำเนินการ */}
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-reverse space-y-2 sm:space-y-0 sm:space-x-4 pt-4 sm:pt-6">
                <button
                  onClick={() => navigate(`/test-files/${id}`)}
                  className="w-full sm:w-auto px-4 py-2 text-center text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base border border-gray-300"
                  data-cy="cancel-button"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitConfirm}
                  disabled={saving}
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                  data-cy="save-button"
                >
                  {saving ? (
                    <>
                      <span className="animate-spin">↻</span>
                      Saving...
                    </>
                  ) : (
                    "บันทึก"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* หน้าต่างยืนยันการบันทึก */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          data-cy="confirm-modal"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto overflow-hidden transform transition-all">
            {/* ส่วนหัวหน้าต่างยืนยัน */}
            <div className="bg-blue-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-100">
              <div className="flex items-center gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  ยืนยันการเปลี่ยนแปลง
                </h3>
              </div>
            </div>

            {/* เนื้อหาหน้าต่างยืนยัน */}
            <div className="px-4 sm:px-6 py-3 sm:py-4">
              <p className="text-gray-600 text-sm sm:text-base">
                คุณแน่ใจหรือไม่ว่าต้องการบันทึกการเปลี่ยนแปลงนี้ในไฟล์ทดสอบ?
                {selectedFile && (
                  <span
                    className="block mt-2 font-medium text-sm sm:text-base break-words"
                    data-cy="confirm-new-file"
                  >
                    คุณกำลังจะอัพโหลดไฟล์ใหม่: {selectedFile.name}
                  </span>
                )}
              </p>

              <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-500">
                <p data-cy="confirm-filename" className="break-words">
                  • ชื่อไฟล์จะเป็น:{" "}
                  <span className="font-medium">{formData.filename}</span>
                </p>
              </div>
            </div>

            {/* ปุ่มในหน้าต่างยืนยัน */}
            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full sm:w-auto px-4 py-2 text-center text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 text-sm sm:text-base"
                data-cy="confirm-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
                data-cy="confirm-submit"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">↻</span>
                    กำลังบันทึก...
                  </>
                ) : (
                  "ยืนยันการเปลี่ยนแปลง"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestFileEdit;
