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
  CheckCircle,
  Calendar as CalendarIcon,
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const SprintDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  // สถานะต่างๆ ของหน้า Sprint Detail
  const [sprint, setSprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLatestSprint, setIsLatestSprint] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditWarningModal, setShowEditWarningModal] = useState(false);
  const [showDeleteWarningModal, setShowDeleteWarningModal] = useState(false);
  const [deleteWarningMessage, setDeleteWarningMessage] = useState("");

  // เลื่อนไปที่ด้านบนของหน้าเมื่อโหลดหน้าใหม่
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // โหลดข้อมูลสปรินต์เมื่อมีการเปลี่ยน id หรือ user
  useEffect(() => {
    const fetchSprintData = async () => {
      try {
        // ดึงข้อมูลสปรินต์จาก API
        const sprintResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/${id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );
        const sprintData = sprintResponse.data;
        setSprint(sprintData);

        // ดึงข้อมูลช่วงวันที่ของสปรินต์ทั้งหมดในโปรเจกต์
        const allSprintsResponse = await axios.get(
          `${API_BASE_URL}/api/sprints/date-ranges?project_id=${sprintData.project_id}`,
          {
            headers: { Authorization: `Bearer ${user.token}` },
          }
        );

        const sprints = allSprintsResponse.data;

        // ตรวจสอบว่าเป็นสปรินต์ล่าสุดหรือไม่
        const currentSprintNumber = parseInt(sprintData.name.split(" ")[1]);
        const latestSprintNumber = Math.max(
          ...sprints.map((s) => parseInt(s.name.split(" ")[1]))
        );
        setIsLatestSprint(currentSprintNumber === latestSprintNumber);
      } catch (err) {
        setError(err.response?.data?.message || "ไม่สามารถดึงข้อมูลสปรินต์ได้");
      } finally {
        setLoading(false);
      }
    };

    if (user && id) fetchSprintData();
  }, [id, user]);

  // กลับไปหน้าสปรินต์ทั้งหมด
  const handleBackToSprints = () => {
    navigate("/sprints", {
      state: {
        selectedProjectId: sprint.project_id,
      },
      replace: true,
    });
  };

  // การจัดการเมื่อคลิกปุ่มแก้ไข
  const handleEditClick = () => {
    if (!isLatestSprint) {
      setShowEditWarningModal(true);
    } else {
      navigate(`/sprints/${id}/edit`);
    }
  };

  // การจัดการลบสปรินต์
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

      // ตรวจสอบข้อความข้อผิดพลาดเฉพาะ
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
          err.response?.data?.message || "ไม่สามารถลบสปรินต์ได้"
        );
      }

      setShowDeleteWarningModal(true);
    }
  };

  // หน้าแสดงตอนกำลังโหลดข้อมูล
  if (loading) {
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50"
        data-cy="loading-spinner"
      >
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
          <p className="text-indigo-600 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // หน้าแสดงเมื่อเกิดข้อผิดพลาด
  if (error) {
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-red-50 to-pink-50 p-4"
        data-cy="error-container"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="mx-auto w-16 h-16 text-red-500 mb-6" />
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            data-cy="back-to-projects-button"
            onClick={handleBackToSprints}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
          >
            กลับไปหน้าเลือกโปรเจกต์
          </button>
        </div>
      </div>
    );
  }

  // หน้าแสดงเมื่อไม่พบข้อมูลสปรินต์
  if (!sprint) {
    return (
      <div
        className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50"
        data-cy="no-sprint-data"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <Info className="mx-auto w-16 h-16 text-blue-500 mb-6" />
          <p className="text-2xl text-gray-700 font-medium mb-6">
            ไม่พบข้อมูลสปรินต์
          </p>
          <button
            data-cy="back-to-projects-no-data"
            onClick={() => navigate("/sprints")}
            className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-md hover:shadow-lg"
          >
            กลับไปหน้าเลือกโปรเจกต์
          </button>
        </div>
      </div>
    );
  }

  // คำนวณวันที่ผ่านไปและวันที่เหลือของสปรินต์
  const calculateSprintProgress = () => {
    const start = new Date(sprint.start_date).getTime();
    const end = new Date(sprint.end_date).getTime();
    const today = new Date().getTime();

    // คำนวณเปอร์เซ็นต์ความคืบหน้า
    let progress = 0;
    if (today < start) {
      progress = 0;
    } else if (today > end) {
      progress = 100;
    } else {
      const totalDuration = end - start;
      const elapsed = today - start;
      progress = Math.round((elapsed / totalDuration) * 100);
    }

    // คำนวณวันที่เหลือจนถึงวันสิ้นสุด
    let daysRemaining = 0;
    if (today <= end) {
      daysRemaining = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
    }

    // คำนวณวันก่อนเริ่มสปรินต์
    let daysUntilStart = 0;
    if (today < start) {
      daysUntilStart = Math.ceil((start - today) / (1000 * 60 * 60 * 24));
    }

    // คำนวณระยะเวลาทั้งหมดของสปรินต์เป็นวันแบบรวมวันเริ่มและวันสิ้นสุด
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // สถานะของสปรินต์ (ยังไม่เริ่ม, กำลังดำเนินการ, เสร็จสิ้น)
    let status = "in_progress";
    if (today < start) {
      status = "not_started";
    } else if (today > end) {
      status = "completed";
    }

    return { progress, daysRemaining, daysUntilStart, totalDays, status };
  };

  const { progress, daysRemaining, daysUntilStart, totalDays, status } =
    calculateSprintProgress();

  // รูปแบบการแสดงวันที่
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ตรวจสอบสถานะของสปรินต์ (ยังไม่เริ่ม, กำลังดำเนินการ, เสร็จสิ้น)
  const getSprintStatus = () => {
    if (status === "not_started") {
      return {
        text: "ยังไม่เริ่ม",
        color: "bg-yellow-500",
        textColor: "text-yellow-600",
        icon: <Clock className="w-5 h-5" />,
      };
    } else if (status === "completed") {
      return {
        text: "เสร็จสิ้น",
        color: "bg-green-500",
        textColor: "text-green-600",
        icon: <CheckCircle className="w-5 h-5" />,
      };
    } else {
      return {
        text: "กำลังดำเนินการ",
        color: "bg-blue-500",
        textColor: "text-blue-600",
        icon: <CalendarIcon className="w-5 h-5" />,
      };
    }
  };

  const sprintStatus = getSprintStatus();

  // ข้อความแสดงสถานะระยะเวลา
  const getTimeStatusLabel = () => {
    if (status === "not_started") {
      return "จะเริ่มภายในอีก";
    } else if (status === "in_progress") {
      return "เวลาที่เหลือ";
    } else {
      return "เสร็จสิ้นเมื่อ";
    }
  };

  // ค่าที่แสดงในสถานะระยะเวลา
  const getTimeStatusValue = () => {
    if (status === "not_started") {
      return `${daysUntilStart} วัน`;
    } else if (status === "in_progress") {
      return `${daysRemaining} วัน`;
    } else {
      // คำนวณว่าสปรินต์จบไปแล้วกี่วัน
      const today = new Date();

      // ใช้วิธีเปรียบเทียบวันที่ด้วย format เดียวกัน
      const todayFormatted = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      // แปลงวันที่สิ้นสุดให้อยู่ในรูปแบบเดียวกัน
      const endDateObj = new Date(sprint.end_date);
      const endDateFormatted = new Date(
        endDateObj.getFullYear(),
        endDateObj.getMonth(),
        endDateObj.getDate()
      );

      // ตรวจสอบว่าวันนี้ตรงกับวันสิ้นสุดหรือไม่
      if (todayFormatted.getTime() === endDateFormatted.getTime()) {
        return "วันนี้";
      }

      // คำนวณจำนวนวันที่ผ่านไปหลังจากวันสิ้นสุด
      // ใช้ Math.floor แทน Math.ceil เพื่อป้องกันการปัดขึ้น
      const daysSinceEnd = Math.floor(
        (todayFormatted - endDateFormatted) / (1000 * 60 * 60 * 24)
      );
      return `${daysSinceEnd} วันที่แล้ว`;
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br bg-gray-50 py-8 px-4"
      data-cy="sprint-detail-page"
    >
      <div className="container mx-auto max-w-6xl">
        {/* Navigation Header */}
        <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden transition-shadow duration-300 hover:shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-center p-5 md:p-6 border-b border-gray-100">
            <button
              data-cy="back-button"
              onClick={handleBackToSprints}
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>กลับไปหน้าเลือกสปรินต์</span>
            </button>

            <div className="flex space-x-3 mt-4 md:mt-0">
              <button
                data-cy="edit-sprint-button"
                onClick={handleEditClick}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all duration-300 shadow-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                <span>แก้ไขสปรินต์</span>
              </button>
              <button
                data-cy="delete-sprint-button"
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all duration-300 shadow-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                <span>ลบสปรินต์</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sprint Header Information */}
        <div
          className="bg-white rounded-2xl shadow-lg mb-8 p-6 transition-shadow duration-300 hover:shadow-xl"
          data-cy="sprint-header"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center flex-wrap gap-2"
                data-cy="sprint-name"
              >
                <span className="mr-1">{sprint.name}</span>
                <span
                  className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-full text-xs font-medium ${
                    isLatestSprint
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {isLatestSprint ? "สปรินต์ล่าสุด" : "สปรินต์เก่า"}
                </span>
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <FileText className="w-5 h-5" />
                <span className="text-lg" data-cy="project-name">
                  โปรเจกต์: {sprint.project_name}
                </span>
              </div>
            </div>

            <div
              className="mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 rounded-full"
              style={{ backgroundColor: `${sprintStatus.color}25` }}
            >
              {sprintStatus.icon}
              <span
                className={`font-medium ${sprintStatus.textColor}`}
                data-cy="sprint-active-status"
              >
                {sprintStatus.text}
              </span>
            </div>
          </div>

          {/* Sprint Progress Bar */}
          <div className="mb-8" data-cy="sprint-progress-section">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                ความคืบหน้า
              </span>
              <span
                className="text-sm font-medium text-indigo-600"
                data-cy="sprint-progress-percentage"
              >
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between mt-2">
              <span
                className="text-xs text-gray-500"
                data-cy="sprint-start-date"
              >
                เริ่ม: {formatDate(sprint.start_date)}
              </span>
              <span className="text-xs text-gray-500" data-cy="sprint-end-date">
                สิ้นสุด: {formatDate(sprint.end_date)}
              </span>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 mt-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">ระยะเวลาสปรินต์</p>
                  <p
                    className="font-semibold text-gray-900"
                    data-cy="sprint-duration"
                  >
                    {totalDays} วัน
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p
                    className="text-sm text-gray-500"
                    data-cy="time-status-label"
                  >
                    {getTimeStatusLabel()}
                  </p>
                  <p
                    className="font-semibold text-gray-900"
                    data-cy="time-status-value"
                  >
                    {getTimeStatusValue()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Sprint Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main Sprint Information */}
          <div
            className="md:col-span-2 bg-white rounded-2xl shadow-lg p-4 lg:p-5 transition-shadow duration-300 hover:shadow-xl"
            data-cy="sprint-main-info"
          >
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              รายละเอียดสปรินต์
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date Card */}
              <div className="bg-blue-50 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md">
                <div className="bg-blue-100 p-2 lg:p-3 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm text-gray-500">
                    วันที่เริ่มต้น
                  </p>
                  <p
                    className="font-semibold text-gray-900 text-sm lg:text-base"
                    data-cy="start-date-detail"
                  >
                    {formatDate(sprint.start_date)}
                  </p>
                </div>
              </div>

              {/* End Date Card */}
              <div className="bg-red-50 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md">
                <div className="bg-red-100 p-2 lg:p-3 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm text-gray-500">
                    วันที่สิ้นสุด
                  </p>
                  <p
                    className="font-semibold text-gray-900 text-sm lg:text-base"
                    data-cy="end-date-detail"
                  >
                    {formatDate(sprint.end_date)}
                  </p>
                </div>
              </div>

              {/* Sprint Status - Full Width */}
              <div className="col-span-1 sm:col-span-2 mt-2 bg-purple-50 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md">
                <div className="bg-purple-100 p-2 lg:p-3 rounded-lg flex items-center justify-center">
                  {sprintStatus.icon}
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm text-gray-500">
                    สถานะระยะเวลา
                  </p>
                  <p
                    className={`font-semibold ${sprintStatus.textColor} text-sm lg:text-base`}
                    data-cy="sprint-time-status"
                  >
                    {status === "not_started"
                      ? `อีก ${daysUntilStart} วันจะเริ่มสปรินต์`
                      : status === "in_progress"
                      ? `อีก ${daysRemaining} วันจะสิ้นสุดสปรินต์`
                      : "สปรินต์เสร็จสิ้นแล้ว"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Sprint Information */}
          <div
            className="bg-white rounded-2xl shadow-lg p-4 lg:p-5 transition-shadow duration-300 hover:shadow-xl"
            data-cy="sprint-additional-info"
          >
            <h2 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
              ข้อมูลเพิ่มเติม
            </h2>

            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md">
                <div className="bg-indigo-100 p-2 lg:p-3 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm text-gray-500">สร้างโดย</p>
                  <p
                    className="font-semibold text-gray-900 text-sm lg:text-base"
                    data-cy="created-by"
                  >
                    {sprint.created_by}
                  </p>
                </div>
              </div>

              <div className="bg-indigo-50 rounded-xl p-4 flex items-center gap-3 transition-all duration-300 hover:shadow-md">
                <div className="bg-indigo-100 p-2 lg:p-3 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs lg:text-sm text-gray-500">
                    วันที่สร้าง
                  </p>
                  <p
                    className="font-semibold text-gray-900 text-sm lg:text-base"
                    data-cy="created-date"
                  >
                    {new Date().toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          data-cy="delete-modal"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 animate-fadeIn">
            <div className="text-center">
              <Trash2 className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-3">
                ยืนยันการลบสปรินต์
              </h2>
              <p className="text-gray-600 mb-6">
                คุณแน่ใจหรือไม่ว่าต้องการลบสปรินต์นี้?
                การกระทำนี้ไม่สามารถเรียกคืนได้
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                data-cy="delete-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                ยกเลิก
              </button>
              <button
                data-cy="delete-modal-confirm"
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2 font-medium"
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
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          data-cy="edit-warning-modal"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ไม่สามารถแก้ไขสปรินต์ได้
            </h2>
            <p className="text-gray-600 mb-6">
              สามารถแก้ไขได้เฉพาะสปรินต์ล่าสุดเท่านั้น
            </p>
            <button
              data-cy="edit-warning-ok"
              onClick={() => setShowEditWarningModal(false)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
            >
              ตกลง
            </button>
          </div>
        </div>
      )}

      {/* Delete Warning Modal */}
      {showDeleteWarningModal && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          data-cy="delete-warning-modal"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-center">
            <AlertCircle className="mx-auto w-16 h-16 text-orange-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ไม่สามารถลบสปรินต์ได้
            </h2>
            <p className="text-gray-600 mb-6">{deleteWarningMessage}</p>
            <button
              data-cy="delete-warning-ok"
              onClick={() => setShowDeleteWarningModal(false)}
              className="px-6 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors font-medium"
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
