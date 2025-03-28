import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  ChevronLeft,
  FileUp,
  AlertTriangle,
  CheckCircle,
  Save,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateTestFile = () => {
  const navigate = useNavigate();
  const { sprintId } = useParams();
  const { user } = useAuth();

  // สถานะของข้อมูลไฟล์และการอัพโหลด
  const [selectedFile, setSelectedFile] = useState(null);
  const [filename, setFilename] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [pendingFileId, setPendingFileId] = useState(null);

  // สถานะของข้อมูลที่มีอยู่
  const [existingFiles, setExistingFiles] = useState([]);
  const [existingSprintName, setExistingSprintName] = useState(null);
  const [existingProjectName, setExistingProjectName] = useState(null);

  // สถานะของการแสดงผล UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // เลื่อนไปด้านบนสุดของหน้าเมื่อคอมโพเนนต์ถูกโหลด
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ดึงข้อมูลไฟล์ที่มีอยู่เมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    const fetchExistingFiles = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/test-files`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setExistingFiles(response.data);
      } catch (err) {
        console.error("Error fetching existing files:", err);
      }
    };
    fetchExistingFiles();
  }, [user.token]);

  // ตรวจสอบว่าไฟล์มีอยู่แล้วหรือไม่
  const checkExistingFile = (file) => {
    const existingFile = existingFiles.find(
      (ef) => ef.original_filename === file.name && ef.status !== "Deleted"
    );

    if (existingFile) {
      if (existingFile.sprint_id === parseInt(sprintId)) {
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

  // การจัดการเมื่อเลือกไฟล์
  const handleFileChange = (e) => {
    const file = e.target.files[0];
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
      if (!filename) {
        setFilename(file.name.replace(".json", ""));
      }
    } else {
      setSelectedFile(null);
      if (!filename) {
        setFilename("");
      }
    }
  };

  // จัดการการอัพโหลดไฟล์
  const handleUpload = async () => {
    if (!selectedFile) {
      setFileError("Please select a file");
      return;
    }

    if (!filename.trim()) {
      setError("Please enter a filename");
      return;
    }

    setError(null);
    setLoading(true);

    const formData = new FormData();
    formData.append("testFile", selectedFile);
    formData.append("sprint_id", sprintId);
    formData.append("filename", filename);

    try {
      // เลือก endpoint ตามโหมดการอัพโหลด (สร้างใหม่หรืออัพเดต)
      const endpoint = isUpdateMode
        ? `${API_BASE_URL}/api/test-files/upload/${pendingFileId}`
        : `${API_BASE_URL}/api/test-files/upload`;

      const response = await axios.post(endpoint, formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // นำทางไปยังหน้าแสดงรายละเอียดไฟล์หลังอัพโหลดสำเร็จ
      navigate(`/test-files/${response.data.file_id || pendingFileId}`);
    } catch (err) {
      if (err.response?.status === 409 && err.response.data.sameSprint) {
        setPendingFileId(err.response.data.file_id);
        setShowConfirmDialog(true);
        setLoading(false);
        return;
      }

      setError(err.response?.data?.message || "Failed to upload test file");
      setLoading(false);
    }
  };

  // จัดการการส่งแบบฟอร์ม
  const handleSubmit = async (e) => {
    e.preventDefault();
    handleUpload();
  };

  // จัดการการยืนยันการอัพเดตไฟล์ที่มีอยู่
  const handleConfirmUpdate = () => {
    setShowConfirmDialog(false);
    setIsUpdateMode(true);
  };

  // กลับไปยังหน้าเลือกไฟล์ทดสอบ
  const handleGoBack = () => {
    navigate("/test-files");
  };

  return (
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      data-cy="create-test-file-page"
    >
      <div className="w-full px-4 sm:px-6 py-6 sm:py-8 mx-auto max-w-lg sm:max-w-xl md:max-w-2xl">
        {/* ส่วนหัวและปุ่มย้อนกลับ */}
        <button
          onClick={handleGoBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-4 sm:mb-6 transition-colors"
          data-cy="back-button"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
          <span className="text-sm sm:text-base font-medium">
            กลับไปที่หน้าเลือกไฟล์ทดสอบ
          </span>
        </button>

        <div className="bg-white shadow-md sm:shadow-xl rounded-xl sm:rounded-2xl overflow-hidden">
          {/* ส่วนหัวของแบบฟอร์ม */}
          <div className="bg-blue-50 px-4 sm:px-6 py-4 sm:py-5 border-b border-blue-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center">
              <FileUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-blue-600" />
              {isUpdateMode ? "อัพเดตไฟล์ทดสอบ" : "อัพโหลดไฟล์ทดสอบ"}
            </h2>
          </div>

          {/* แบบฟอร์มอัพโหลดไฟล์ */}
          <form
            onSubmit={handleSubmit}
            className="p-4 sm:p-6 space-y-4 sm:space-y-6"
            data-cy="upload-form"
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
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
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
                  ไฟล์ทดสอบ JSON <span className="text-red-500">*</span>
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
                        : "คลิกเพื่ออัพโหลดไฟล์"}
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
            </div>

            {/* ปุ่มการทำงาน */}
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
              <button
                type="button"
                onClick={handleGoBack}
                className="
                  w-full py-2 sm:py-3 rounded-lg text-gray-600 bg-gray-100 
                  hover:bg-gray-200 text-sm sm:text-base font-semibold transition-all duration-300
                "
                data-cy="cancel-button"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`
                  w-full py-2 sm:py-3 rounded-lg text-white text-sm sm:text-base font-semibold transition-all duration-300
                  ${
                    loading || !selectedFile
                      ? "bg-blue-300 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                  }
                `}
                data-cy="submit-button"
              >
                {loading
                  ? "กำลังอัพโหลด..."
                  : isUpdateMode
                  ? "อัพเดตไฟล์"
                  : "อัพโหลดไฟล์"}
              </button>
            </div>
          </form>
        </div>

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
      </div>
    </div>
  );
};

export default CreateTestFile;
