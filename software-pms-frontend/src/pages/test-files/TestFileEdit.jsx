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
  Save,
  ChevronLeft,
  FileUp,
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
  const [existingFiles, setExistingFiles] = useState([]); // ไฟล์ที่มีอยู่ในระบบทั้งหมด
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // แสดง/ซ่อนหน้าต่างยืนยันไฟล์ซ้ำในสปรินต์เดียวกัน
  const [showErrorDialog, setShowErrorDialog] = useState(false); // แสดง/ซ่อนหน้าต่างแจ้งเตือนไฟล์ซ้ำในสปรินต์อื่น
  const [existingSprintName, setExistingSprintName] = useState(null); // ชื่อสปรินต์ที่มีไฟล์ซ้ำ
  const [existingProjectName, setExistingProjectName] = useState(null); // ชื่อโปรเจกต์ที่มีไฟล์ซ้ำ
  const [pendingFileId, setPendingFileId] = useState(null); // ID ของไฟล์ซ้ำในสปรินต์เดียวกัน
  const [isUpdateMode, setIsUpdateMode] = useState(false); // สถานะการอัพเดตไฟล์
  const [formData, setFormData] = useState({
    filename: "",
  });

  // ฟังก์ชันสำหรับแปลงข้อความ error จากภาษาอังกฤษเป็นภาษาไทย
  const translateError = (errorMsg) => {
    // ตรวจสอบและแปลงข้อความเฉพาะ
    if (errorMsg === "This file has already been uploaded to another sprint") {
      return "ไฟล์นี้ถูกอัพโหลดไปยัง sprint อื่นแล้ว";
    }
    // เพิ่มเงื่อนไขสำหรับข้อความ error อื่นๆ ที่ต้องการแปลเพิ่มเติมได้ที่นี่

    // หากไม่ตรงกับเงื่อนไขใดๆ ให้ใช้ข้อความ error เดิม
    return errorMsg;
  };

  // ดึงข้อมูลไฟล์ทดสอบและไฟล์ที่มีอยู่เมื่อโหลดหน้า
  useEffect(() => {
    const fetchData = async () => {
      try {
        // ดึงข้อมูลไฟล์ทดสอบที่กำลังแก้ไข
        const fileResponse = await axios.get(
          `${API_BASE_URL}/api/test-files/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setTestFile(fileResponse.data);
        setFormData({
          filename: fileResponse.data.filename,
        });

        // ดึงข้อมูลไฟล์ทั้งหมดในระบบ
        const filesResponse = await axios.get(
          `${API_BASE_URL}/api/test-files`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        setExistingFiles(filesResponse.data);
      } catch (err) {
        const errorMsg =
          err.response?.data?.message || "Failed to fetch test file";
        setError(translateError(errorMsg));
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchData();
  }, [id, user]);

  // ตรวจสอบว่าไฟล์มีอยู่แล้วหรือไม่
  const checkExistingFile = (file) => {
    const existingFile = existingFiles.find(
      (ef) =>
        ef.original_filename === file.name &&
        ef.status !== "Deleted" &&
        ef.file_id !== parseInt(id)
    );

    if (existingFile) {
      if (existingFile.sprint_id === testFile.sprint_id) {
        // ไฟล์มีอยู่แล้วในสปรินต์เดียวกัน - แสดงหน้าต่างยืนยันการอัพเดต
        setPendingFileId(existingFile.file_id);
        setShowConfirmDialog(true);
        return "SAME_SPRINT";
      } else {
        // ไฟล์มีอยู่แล้วในสปรินต์อื่น - แสดงหน้าต่างแจ้งเตือนข้อผิดพลาด
        setExistingSprintName(existingFile.sprint_name);
        setExistingProjectName(existingFile.project_name);
        setShowErrorDialog(true);
        return "DIFFERENT_SPRINT";
      }
    }
    return "NEW_FILE";
  };

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

    const fileStatus = checkExistingFile(file);
    if (fileStatus === "NEW_FILE" || fileStatus === "SAME_SPRINT") {
      setSelectedFile(file);
    } else {
      setSelectedFile(null);
    }
  };

  // ฟังก์ชันเปิดหน้าต่างยืนยันการบันทึก
  const handleSubmitConfirm = (e) => {
    e.preventDefault();
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
      const endpoint =
        isUpdateMode && pendingFileId
          ? `${API_BASE_URL}/api/test-files/update/${pendingFileId}`
          : `${API_BASE_URL}/api/test-files/${id}/upload`;

      await axios.put(endpoint, submitData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // นำทางกลับไปยังหน้ารายละเอียดไฟล์
      navigate(`/test-files/${id}`);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Failed to update test file";
      setError(translateError(errorMsg));
    } finally {
      setSaving(false);
      setIsUpdateMode(false);
    }
  };

  // จัดการการยืนยันการอัพเดตไฟล์ที่มีอยู่
  const handleConfirmUpdate = () => {
    setShowConfirmDialog(false);
    setIsUpdateMode(true);
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
        className="min-h-screen bg-gray-50 flex flex-col"
        data-cy="test-file-edit-page"
      >
        <div className="w-full px-4 sm:px-6 py-6 sm:py-8 mx-auto max-w-lg sm:max-w-xl md:max-w-2xl">
          {/* ส่วนหัวและปุ่มย้อนกลับ */}
          <button
            onClick={() => navigate(`/test-files/${id}`)}
            className="flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors"
            data-cy="back-button"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base font-medium">
              กลับไปหน้ารายละเอียดไฟล์ทดสอบ
            </span>
          </button>

          <div className="bg-white shadow-md sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden">
            {/* ส่วนหัวของแบบฟอร์ม */}
            <div className="bg-blue-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-blue-100">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
                <FileUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
                แก้ไขไฟล์ทดสอบ
              </h2>
              <p
                className="text-sm text-gray-600 mt-1 break-words"
                data-cy="edit-file-name"
              >
                กำลังแก้ไข {testFile.original_filename}
              </p>
            </div>

            {/* แบบฟอร์มแก้ไขไฟล์ */}
            <form
              onSubmit={handleSubmitConfirm}
              className="p-4 sm:p-6 space-y-4 sm:space-y-6"
              data-cy="edit-form"
            >
              {/* แสดงข้อความแจ้งเตือนข้อผิดพลาด */}
              {error && (
                <div
                  className="bg-red-50 border border-red-200 text-red-600 p-3 sm:p-4 rounded-lg flex items-center text-sm sm:text-base"
                  data-cy="error-message"
                >
                  <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 text-red-500 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* ส่วนป้อนชื่อไฟล์ */}
                <div>
                  <label
                    htmlFor="filename"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    ชื่อไฟล์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="filename"
                    value={formData.filename}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        filename: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                    placeholder="ระบุชื่อไฟล์"
                    required
                    data-cy="filename-input"
                  />
                </div>

                {/* ส่วนการอัพโหลดไฟล์ */}
                <div>
                  <label
                    htmlFor="testFile"
                    className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2"
                  >
                    อัพโหลดไฟล์ใหม่ (เลือกได้)
                  </label>
                  <div className="mt-1">
                    <input
                      type="file"
                      id="testFile"
                      accept=".json,application/json"
                      onChange={handleFileChange}
                      className="hidden"
                      data-cy="file-input"
                    />
                    <label
                      htmlFor="testFile"
                      className={`
                  w-full flex items-center justify-center px-3 sm:px-6 py-3 sm:py-4 
                  border-2 border-dashed rounded-lg cursor-pointer 
                  transition-all duration-300
                  ${
                    selectedFile
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-300 hover:border-blue-500 text-gray-600 hover:text-blue-700"
                  }
                `}
                      data-cy="file-drop-area"
                    >
                      <FileUp className="mr-2 sm:mr-3 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">
                        {selectedFile
                          ? selectedFile.name
                          : "คลิกเพื่ออัพโหลดไฟล์ใหม่"}
                      </span>
                    </label>

                    {/* แสดงข้อความแจ้งเตือนข้อผิดพลาดของไฟล์ */}
                    {fileError && (
                      <p
                        className="mt-2 text-xs sm:text-sm text-red-500 flex items-center"
                        data-cy="file-error"
                      >
                        <AlertTriangle className="mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                        {fileError}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">
                      อนุญาตให้ใช้เฉพาะไฟล์ JSON ที่ได้จากการทดสอบจาก Cypress
                      เท่านั้น (ขนาดสูงสุด 5MB)
                    </p>
                  </div>
                </div>

                {/* แสดงสถานะไฟล์ทดสอบ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    สถานะไฟล์ทดสอบ
                  </label>
                  <div className="px-3 py-2 border border-gray-200 rounded-lg bg-gray-50">
                    {testFile.status === "Pass" ? (
                      <div
                        className="flex items-center gap-2 text-green-600 text-sm"
                        data-cy="status-pass"
                      >
                        <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Passed</span>
                      </div>
                    ) : testFile.status === "Fail" ? (
                      <div
                        className="flex items-center gap-2 text-red-600 text-sm"
                        data-cy="status-fail"
                      >
                        <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Failed</span>
                      </div>
                    ) : (
                      <div
                        className="flex items-center gap-2 text-yellow-600 text-sm"
                        data-cy="status-pending"
                      >
                        <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span>Pending</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ปุ่มการทำงาน */}
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={saving}
                  className={`
              w-full py-2 sm:py-3 rounded-lg text-white text-sm sm:text-base font-semibold transition-all duration-300
              ${
                saving
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
              }
            `}
                  data-cy="save-button"
                >
                  {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/test-files/${id}`)}
                  className="
              w-full py-2 sm:py-3 rounded-lg text-gray-600 bg-gray-100 
              hover:bg-gray-200 text-sm sm:text-base font-semibold transition-all duration-300
            "
                  data-cy="cancel-button"
                >
                  ยกเลิก
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* หน้าต่างยืนยันการบันทึก */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-cy="confirm-modal"
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowConfirmModal(false);
            }
          }}
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                ยืนยันการเปลี่ยนแปลง
              </h2>
              <p className="text-gray-600 mb-3 md:mb-4">
                คุณแน่ใจหรือไม่ว่าต้องการบันทึกการเปลี่ยนแปลงนี้<br></br>
                ในไฟล์ทดสอบ?
                {selectedFile && (
                  <span
                    className="block mt-2 font-medium break-words"
                    data-cy="confirm-new-file"
                  >
                    คุณกำลังจะอัพโหลดไฟล์ใหม่: {selectedFile.name}
                  </span>
                )}
              </p>

              <div className="text-left bg-gray-50 p-3 rounded-lg text-sm text-gray-500 mb-2">
                <p data-cy="confirm-filename" className="break-words">
                  • ชื่อไฟล์จะเป็น:{" "}
                  <span className="font-medium">{formData.filename}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3 md:space-x-4">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400"
                data-cy="confirm-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                data-cy="confirm-submit"
              >
                {saving ? (
                  <>
                    <span className="animate-spin">↻</span>
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 md:w-5 md:h-5" />
                    ยืนยันการเปลี่ยนแปลง
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* กล่องข้อความแจ้งเตือนไฟล์ซ้ำในสปรินต์อื่น */}
      {showErrorDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-cy="error-dialog"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-red-500 mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                ไม่สามารถอัพโหลดไฟล์ได้
              </h2>
              <p className="text-gray-600 mb-4 md:mb-6 whitespace-pre-line">
                ไฟล์ทดสอบนี้ถูกอัพโหลดแล้วใน {existingSprintName} ในโปรเจกต์{" "}
                <span className="font-medium">{existingProjectName} </span>
                ไม่สามารถอัพโหลดไฟล์เดียวกันในหลายสปรินต์ได้
              </p>
            </div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowErrorDialog(false)}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                data-cy="error-dialog-close"
              >
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      {/* กล่องข้อความยืนยันการอัพเดตไฟล์ */}
      {showConfirmDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          data-cy="confirm-dialog"
        >
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="text-center">
              <CheckCircle className="mx-auto h-12 w-12 md:h-16 md:w-16 text-blue-500 mb-3 md:mb-4" />
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                ต้องการอัพเดตไฟล์ทดสอบที่มีอยู่?
              </h2>
              <p className="text-gray-600 mb-4 md:mb-6">
                มีไฟล์ทดสอบที่ชื่อเดียวกันอยู่แล้วในสปรินต์นี้<br></br>
                คุณต้องการอัพเดตไฟล์นี้ด้วยผลลัพธ์ใหม่หรือไม่?
              </p>
            </div>
            <div className="flex justify-center space-x-3 md:space-x-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 md:px-6 md:py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                data-cy="confirm-dialog-cancel"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmUpdate}
                className="px-4 py-2 md:px-6 md:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 transition-colors"
                data-cy="confirm-dialog-update"
              >
                <Save className="w-4 h-4 md:w-5 md:h-5" />
                อัพเดตไฟล์
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestFileEdit;
