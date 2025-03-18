import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../context/AuthContext";
import { Calendar, Filter, ClipboardList } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

// ตั้งค่า URL พื้นฐานของ API จาก environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

const ActionLogs = () => {
  // --------- สถานะและการจัดการข้อมูลผู้ใช้ ---------
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // --------- สถานะสำหรับข้อมูลการดำเนินการและการโหลด ---------
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionTypes, setActionTypes] = useState([]);
  const [targetTables, setTargetTables] = useState([]);
  const [filteredTargetTables, setFilteredTargetTables] = useState([]);
  const [projects, setProjects] = useState({});
  const [sprints, setSprints] = useState({}); // เพิ่มสถานะเก็บข้อมูล sprints
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  // --------- สถานะสำหรับการแบ่งหน้าและการกรอง ---------
  const [currentPage, setCurrentPage] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [filters, setFilters] = useState({
    action_type: "",
    target_table: "",
    start_date: "",
    end_date: "",
    limit: 5,
  });

  // แมปปิ้งประเภทการดำเนินการเป็นภาษาไทยและจัดเรียงตามความสำคัญ
  const actionTypeMapping = {
    create: "สร้าง",
    update: "อัพเดต",
    delete: "ลบ",
    upload: "อัพโหลด",
    update_profile: "อัพเดตโปรไฟล์",
    update_profile_image: "อัพโหลดรูปโปรไฟล์",
    delete_profile_image: "ลบรูปโปรไฟล์",
    password_change: "เปลี่ยนรหัสผ่าน",
    assign: "มอบหมาย",
    remove: "เลิกมอบหมาย",
  };

  // กำหนดลำดับความสำคัญของประเภทการดำเนินการ
  const actionTypePriority = [
    "create",
    "update",
    "delete",
    "upload",
    "assign",
    "remove",
    "update_profile",
    "update_profile_image",
    "delete_profile_image",
    "password_change",
  ];

  // แมปปิ้งตารางเป้าหมายเป็นภาษาไทยและจัดเรียงตามความสำคัญ
  const targetTableMapping = {
    projects: "โปรเจกต์",
    sprints: "สปรินต์",
    test_files: "ไฟล์ทดสอบ",
    users: "ผู้ใช้",
    project_members: "สมาชิกในโปรเจกต์",
  };

  // กำหนดลำดับความสำคัญของตารางเป้าหมาย
  const targetTablePriority = [
    "projects",
    "project_members",
    "sprints",
    "test_files",
    "users",
  ];

  // กำหนดความสัมพันธ์ระหว่างประเภทการดำเนินการกับตารางเป้าหมาย
  const actionTypeToTargetTableMap = {
    create: ["projects", "sprints", "test_files", "users", "project_members"],
    update: ["projects", "sprints", "test_files", "users", "project_members"],
    delete: ["projects", "sprints", "test_files", "users", "project_members"],
    upload: ["test_files"],
    update_profile: ["users"],
    update_profile_image: ["users"],
    delete_profile_image: ["users"],
    password_change: ["users"],
    assign: ["project_members"],
    remove: ["project_members"],
  };

  // --------- ฟังก์ชัน Helper ---------

  // ปรับวันที่เริ่มต้นและสิ้นสุดให้ครอบคลุมทั้งวัน
  const adjustDateRange = useCallback((startDate, endDate) => {
    if (!startDate && !endDate) return { startDate: "", endDate: "" };

    let adjustedStart = startDate;
    let adjustedEnd = endDate;

    if (startDate) {
      adjustedStart = new Date(startDate);
      adjustedStart.setUTCHours(0, 0, 0, 0);
      adjustedStart = adjustedStart.toISOString();
    }

    if (endDate) {
      adjustedEnd = new Date(endDate);
      adjustedEnd.setUTCHours(23, 59, 59, 999);
      adjustedEnd = adjustedEnd.toISOString();
    }

    return { startDate: adjustedStart, endDate: adjustedEnd };
  }, []);

  // แปลงวันที่เป็นรูปแบบปฏิทินไทย (วัน/เดือน/พ.ศ.)
  const formatThaiDate = (date, includeTime = false) => {
    if (!date) return "";
    const buddhistYear = parseInt(format(date, "yyyy", { locale: th })) + 543;
    const dateFormatted = format(date, "dd/MM/") + buddhistYear;

    if (includeTime) {
      const timeFormatted = format(date, "HH:mm");
      return dateFormatted;
    }

    return dateFormatted;
  };

  // เพิ่มฟังก์ชันใหม่สำหรับแสดงเฉพาะเวลา
  const formatTime = (date) => {
    if (!date) return "";
    return format(date, "HH:mm");
  };

  // จัดรูปแบบช่วงวันที่สำหรับแสดงผล
  const formatDateRange = () => {
    if (!selectedRange.from && !selectedRange.to) return "เลือกช่วงวันที่";
    if (selectedRange.from && !selectedRange.to)
      return formatThaiDate(selectedRange.from);
    return `${formatThaiDate(selectedRange.from)} ถึง ${formatThaiDate(
      selectedRange.to
    )}`;
  };

  // ฟังก์ชันสำหรับแสดงชื่อ Sprint (แม้จะถูกลบไปแล้ว)
  const getSprintName = (sprintId) => {
    if (sprints[sprintId]) {
      return sprints[sprintId];
    }
    return `สปรินต์ #${sprintId} (ถูกลบแล้ว)`;
  };

  // ฟังก์ชันสำหรับแสดงชื่อโปรเจกต์ (แม้จะถูกลบไปแล้ว)
  const getProjectName = (projectId) => {
    if (projects[projectId]) {
      return projects[projectId];
    }
    return `โปรเจกต์ #${projectId} (ถูกลบแล้ว)`;
  };

  // แสดงรายละเอียดการดำเนินการในรูปแบบที่อ่านง่าย
  const formatDetails = (details, targetTable, actionType) => {
    if (!details) return "-";

    if (typeof details === "object") {
      // สร้างสำเนาของ details เพื่อแก้ไข
      const displayDetails = { ...details };

      // ลบ json_content ถ้าเป้าหมายเป็น test_files และการดำเนินการเป็น update หรือ delete
      if (
        targetTable === "test_files" &&
        (actionType === "update" || actionType === "delete") &&
        displayDetails.json_content
      ) {
        delete displayDetails.json_content;
      }

      // ลบข้อมูล password ไม่ให้แสดง
      if (displayDetails.password) {
        delete displayDetails.password;
      }

      // ลบข้อมูล member ถ้าเป้าหมายเป็น project_members
      if (targetTable === "project_members" && displayDetails.member) {
        delete displayDetails.member;
      }

      // สร้างแผนที่สำหรับแปลงชื่อฟิลด์ภาษาอังกฤษเป็นภาษาไทย
      const fieldNameMapping = {
        name: "ชื่อ",
        user_name: "ชื่อผู้ใช้งาน",
        end_date: "วันที่สิ้นสุด",
        sprint_id: "รหัสสปรินต์",
        created_at: "วันที่สร้าง",
        changed_at: "วันที่เปลี่ยน",
        created_by: "สร้างโดย",
        project_id: "รหัสโปรเจกต์",
        upload_date: "วันที่อัพโหลด",
        updated_by: "แก้ไขโดย",
        last_modified_by: "แก้ไขล่าสุดโดย",
        start_date: "วันที่เริ่มต้น",
        updated_at: "แก้ไขโดย",
        file_size: "ขนาดไฟล์",
        custom_filename: "ชื่อไฟล์",
        original_filename: "ชื่อไฟล์ที่อัพโหลด",
        photo: "รูปภาพ",
        description: "รายละเอียด",
        role: "บทบาท",
        email: "อีเมล",
        user_id: "รหัสผู้ใช้",
        status: "สถานะ",
        file_id: "รหัสไฟล์",
        filename: "ชื่อไฟล์",
        new_image: "รูปภาพใหม่",
        new_image_public_id: "รหัสสาธารณะของรูปภาพใหม่",
        old_image: "รูปภาพเก่า",
        photo_public_id: "รหัสสาธารณะของรูปภาพ",
        deleted_image: "ลบรูปภาพ",
        deleted_image_public_id: "รหัสสาธารณะของรูปภาพที่ถูกลบ",
        last_modified_date: "วันที่แก้ไขล่าสุด",
      };

      // กำหนดลำดับความสำคัญของฟิลด์ที่ต้องการแสดงก่อน
      const fieldDisplayOrder = [
        "status", // สถานะ
        "file_id", // รหัสไฟล์
        "filename", // ชื่อไฟล์
        "original_filename", // ชื่อไฟล์ที่อัพโหลด
        "custom_filename", // ชื่อไฟล์
        "file_size", // ขนาดไฟล์
        "upload_date", // วันที่อัพโหลด
        "last_modified_by", // แก้ไขล่าสุดโดย
        "last_modified_date", // วันที่แก้ไขล่าสุด
        "name", // ชื่อ
        "description", // รายละเอียด
        "role", // บทบาท
        "email", // อีเมล
        "user_id", // รหัสผู้ใช้
        "created_by", // สร้างโดย
        "created_at", // วันที่สร้าง
        "updated_at", // แก้ไขโดย
        "start_date", // วันที่เริ่มต้น
        "end_date", // วันที่สิ้นสุด
        "sprint_id", // รหัสสปรินต์
        "project_id", // รหัสโปรเจกต์
        "changed_at", // วันที่เปลี่ยน
        "photo", // รูปภาพ
      ];

      // เก็บฟิลด์ที่มีค่าไม่เป็น null หรือ undefined
      const validFields = Object.entries(displayDetails).filter(
        ([key, value]) => value !== null && value !== undefined
      );

      // จัดเรียงฟิลด์ตามลำดับที่กำหนด
      const sortedFields = validFields.sort((a, b) => {
        const indexA = fieldDisplayOrder.indexOf(a[0]);
        const indexB = fieldDisplayOrder.indexOf(b[0]);

        // ถ้าฟิลด์ไม่อยู่ในรายการลำดับ ให้แสดงอยู่ท้ายๆ
        const priorityA = indexA === -1 ? 999 : indexA;
        const priorityB = indexB === -1 ? 999 : indexB;

        return priorityA - priorityB;
      });

      return sortedFields.map(([key, value]) => {
        // ตรวจสอบว่าชื่อ field เป็นฟิลด์วันที่หรือไม่
        const isDateField =
          [
            "created_at",
            "updated_at",
            "start_date",
            "end_date",
            "action_date",
            "upload_date",
            "changed_at",
            "last_modified_date",
          ].includes(key) && typeof value === "string";

        // ตรวจสอบรูปแบบวันที่แบบ ISO date (YYYY-MM-DDThh:mm:ss...)
        const isISODateFormat =
          isDateField && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);

        // ตรวจสอบรูปแบบวันที่แบบ YYYY-MM-DD
        const isSimpleDateFormat =
          isDateField && /^\d{4}-\d{2}-\d{2}$/.test(value);

        // แปลงค่าตามรูปแบบที่พบ
        let displayValue;

        // แสดงชื่อ Sprint แทนเลข ID
        if (key === "sprint_id") {
          displayValue = getSprintName(value);
        }
        // แสดงชื่อ Project แทนเลข ID
        else if (key === "project_id") {
          displayValue = getProjectName(value);
        } else if (isISODateFormat) {
          displayValue = formatThaiDate(new Date(value));
        } else if (isSimpleDateFormat) {
          displayValue = formatThaiDate(new Date(value));
        } else if (typeof value === "object") {
          displayValue = JSON.stringify(value);
        } else {
          displayValue = value.toString();
        }

        // แปลงชื่อฟิลด์ภาษาอังกฤษเป็นภาษาไทย (ถ้ามีใน mapping)
        const displayKey = fieldNameMapping[key] || key;

        return (
          <div
            key={key}
            className="whitespace-normal break-words"
            data-cy={`detail-item-${key}`}
          >
            <span className="font-bold text-gray-700">{displayKey}:</span>{" "}
            {displayValue}
          </div>
        );
      });
    }

    return details;
  };

  // --------- ฟังก์ชันสำหรับจัดการข้อมูล ---------

  // สร้าง axios instance ที่มี token และการจัดการข้อผิดพลาด
  const createAuthAxios = useCallback(() => {
    const authAxios = axios.create({
      baseURL: API_BASE_URL,
      headers: { Authorization: `Bearer ${user?.token}` },
    });

    // Add response interceptor สำหรับจัดการข้อผิดพลาด 401
    authAxios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          navigate("/login");
        }
        return Promise.reject(error);
      }
    );

    return authAxios;
  }, [user?.token, logout, navigate]);

  // ดึงข้อมูลเริ่มต้น (ตัวเลือกตัวกรองและโปรเจกต์)
  const fetchInitialResources = useCallback(async () => {
    if (!user?.token || resourcesLoaded) return;

    try {
      setLoading(true);
      const authAxios = createAuthAxios();

      // ดึงข้อมูลพร้อมกันทั้งหมดในครั้งเดียว
      const [typesRes, tablesRes, projectsRes, sprintsRes] = await Promise.all([
        authAxios.get("/api/action-logs/types"),
        authAxios.get("/api/action-logs/tables"),
        authAxios.get("/api/projects"),
        authAxios.get("/api/sprints"), // เพิ่มการดึงข้อมูล sprints
      ]);

      // จัดเรียงประเภทการดำเนินการตามลำดับความสำคัญ
      const sortedTypes = [...typesRes.data].sort((a, b) => {
        const indexA = actionTypePriority.indexOf(a);
        const indexB = actionTypePriority.indexOf(b);
        // ถ้าไม่มีในรายการให้อยู่ท้ายสุด
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      // จัดเรียงตารางเป้าหมายตามลำดับความสำคัญ
      const sortedTables = [...tablesRes.data].sort((a, b) => {
        const indexA = targetTablePriority.indexOf(a);
        const indexB = targetTablePriority.indexOf(b);
        // ถ้าไม่มีในรายการให้อยู่ท้ายสุด
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
      });

      // สร้าง map ของ project_id เป็น project_name
      const projectMap = {};
      projectsRes.data.forEach((project) => {
        projectMap[project.project_id] = project.name;
      });

      // สร้าง map ของ sprint_id เป็น sprint_name
      const sprintMap = {};
      sprintsRes.data.forEach((sprint) => {
        sprintMap[sprint.sprint_id] = sprint.name;
      });

      // อัปเดตสถานะพร้อมกันหลังจากได้รับข้อมูลทั้งหมด
      setActionTypes(sortedTypes);
      setTargetTables(sortedTables);
      setFilteredTargetTables(sortedTables); // เริ่มต้นกับทุกตาราง
      setProjects(projectMap);
      setSprints(sprintMap);
      setResourcesLoaded(true);
    } catch (err) {
      setError("ไม่สามารถโหลดข้อมูลพื้นฐานได้");
      console.error("Error loading initial resources:", err);
    } finally {
      setLoading(false);
    }
  }, [
    user?.token,
    resourcesLoaded,
    createAuthAxios,
    actionTypePriority,
    targetTablePriority,
  ]);

  // ดึกบันทึกการดำเนินการจาก API พร้อมตัวกรอง
  const fetchLogs = useCallback(async () => {
    if (!user?.token || !resourcesLoaded) return;

    try {
      setLoading(true);
      const authAxios = createAuthAxios();
      const offset = (currentPage - 1) * filters.limit;

      const { startDate, endDate } = adjustDateRange(
        filters.start_date,
        filters.end_date
      );

      // สร้าง query params สำหรับ API
      const queryParams = new URLSearchParams({
        ...filters,
        start_date: startDate,
        end_date: endDate,
        offset: offset.toString(),
      });

      const response = await authAxios.get(`/api/action-logs?${queryParams}`);

      // เพิ่มข้อมูลโปรเจกต์และสปรินต์เข้าไปใน logs
      const enhancedLogs = response.data.logs.map((log) => {
        let enhancedLog = { ...log };

        // เพิ่มข้อมูลโปรเจกต์สำหรับ project_members
        if (
          log.target_table === "project_members" &&
          log.details &&
          log.details.project_id
        ) {
          enhancedLog = {
            ...enhancedLog,
            project_id: log.details.project_id,
            project_name: projects[log.details.project_id] || null,
          };
        }

        // เพิ่มข้อมูลสปรินต์ถ้ามี sprint_id ในรายละเอียด
        if (log.details && log.details.sprint_id) {
          enhancedLog.sprint_name =
            sprints[log.details.sprint_id] ||
            `สปรินต์ #${log.details.sprint_id} (ถูกลบแล้ว)`;
        }

        return enhancedLog;
      });

      setLogs(enhancedLogs);
      setTotalLogs(response.data.total);
      setError(null);
      setIsInitialLoad(false);
    } catch (err) {
      setError(
        err.response?.data?.message || "การดึงข้อมูลบันทึกการดำเนินการล้มเหลว"
      );
      setLogs([]);
      setTotalLogs(0);
    } finally {
      setLoading(false);
    }
  }, [
    user?.token,
    resourcesLoaded,
    currentPage,
    filters,
    createAuthAxios,
    adjustDateRange,
    projects,
    sprints,
  ]);

  // ฟังก์ชันสำหรับดึงชื่อเดิมจาก details ตามประเภทของเป้าหมาย
  const getOriginalName = (log, targetType) => {
    // ถ้าเป็นการลบ ให้ดึงชื่อจาก details โดยตรง
    if (log.action_type === "delete" && log.details && log.details.name) {
      return log.details.name;
    }

    // กรณีมีการอัพเดท ชื่ออาจจะอยู่ในรูปแบบต่างกันตามประเภท
    if (log.action_type === "update") {
      if (targetType === "sprint" && log.details) {
        return (
          log.details.name ||
          (log.details.new && log.details.new.name) ||
          (log.details.old && log.details.old.name)
        );
      }
      if (targetType === "project" && log.details) {
        return (
          log.details.name ||
          (log.details.new && log.details.new.name) ||
          (log.details.old && log.details.old.name)
        );
      }
      if (targetType === "user" && log.details) {
        return (
          log.details.user_name ||
          log.details.name ||
          (log.details.new &&
            (log.details.new.user_name || log.details.new.name)) ||
          (log.details.old &&
            (log.details.old.user_name || log.details.old.name))
        );
      }
    }

    return null;
  };

  // --------- Event handlers ---------

  // จัดการการเลือกช่วงวันที่และอัปเดตตัวกรอง
  const handleDateRangeSelect = (range) => {
    setSelectedRange(range || { from: undefined, to: undefined });

    // อัปเดตตัวกรอง
    setFilters((prev) => {
      const newFilters = { ...prev };

      if (range?.from) {
        newFilters.start_date = format(range.from, "yyyy-MM-dd");
      } else {
        newFilters.start_date = "";
      }

      if (range?.to) {
        newFilters.end_date = format(range.to, "yyyy-MM-dd");
      } else {
        newFilters.end_date = "";
      }

      return newFilters;
    });
  };

  // จัดการเปลี่ยนแปลงในตัวกรองและรีเซ็ตหน้าปัจจุบัน
  // เมื่อมีการเปลี่ยนแปลง action_type
  const handleFilterChange = (e) => {
    const { name, value } = e.target;

    // อัปเดตตัวกรอง
    setFilters((prev) => {
      const newFilters = { ...prev, [name]: value };

      // ถ้าเปลี่ยนประเภทการดำเนินการ ให้รีเซ็ตตารางเป้าหมาย
      if (name === "action_type" && value !== prev.action_type) {
        newFilters.target_table = "";
      }

      return newFilters;
    });

    // ถ้าเปลี่ยนประเภทการดำเนินการ อัปเดตตัวเลือกตารางเป้าหมายที่เกี่ยวข้อง
    if (name === "action_type") {
      if (value) {
        // กรองตารางเป้าหมายที่เกี่ยวข้องกับประเภทการดำเนินการที่เลือก
        const relevantTables = actionTypeToTargetTableMap[value] || [];
        const filteredTables = targetTables.filter((table) =>
          relevantTables.includes(table)
        );
        setFilteredTargetTables(filteredTables);
      } else {
        // ถ้าไม่มีประเภทการดำเนินการที่เลือก แสดงทุกตารางเป้าหมาย
        setFilteredTargetTables(targetTables);
      }
    }

    setCurrentPage(1);
    setError(null);
  };

  // ล้างตัวกรองทั้งหมดและรีเซ็ตการแบ่งหน้า
  const clearFilters = () => {
    setFilters({
      action_type: "",
      target_table: "",
      start_date: "",
      end_date: "",
      limit: 10,
    });
    setFilteredTargetTables(targetTables); // รีเซ็ตตารางเป้าหมายให้แสดงทั้งหมด
    setSelectedRange({ from: undefined, to: undefined });
    setCurrentPage(1);
    setError(null);
  };

  // --------- useEffect hooks ---------

  // โหลดข้อมูลทรัพยากรเริ่มต้นเมื่อ component mount
  useEffect(() => {
    if (user?.token && !resourcesLoaded) {
      fetchInitialResources();
    }
  }, [user?.token, resourcesLoaded, fetchInitialResources]);

  // โหลดข้อมูลบันทึกเมื่อทรัพยากรเริ่มต้นถูกโหลดหรือตัวกรองเปลี่ยน
  useEffect(() => {
    if (user?.token && resourcesLoaded) {
      fetchLogs();
    }
  }, [user?.token, resourcesLoaded, currentPage, filters, fetchLogs]);

  // --------- คำนวณข้อมูลการแบ่งหน้า ---------
  const totalPages = Math.ceil(totalLogs / filters.limit);
  const canGoToNextPage = currentPage < totalPages && logs.length > 0;
  const canGoToPreviousPage = currentPage > 1 && logs.length > 0;

  // --------- ตรวจสอบการเข้าสู่ระบบ ---------
  if (!user?.token) {
    return <Navigate to="/login" />;
  }

  // --------- แสดงสถานะกำลังโหลด ---------
  if (loading && isInitialLoad) {
    return (
      <div
        className="flex justify-center items-center h-screen bg-gray-50"
        data-cy="loading-spinner"
      >
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // --------- การแสดงผลหลัก ---------
  return (
    <div
      className="min-h-screen bg-gray-50 p-4 sm:p-6 md:p-8"
      data-cy="action-logs-page"
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* --------- ส่วนหัว --------- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center mb-4 sm:mb-0">
            <ClipboardList className="w-7 h-7 sm:w-10 sm:h-10 mr-2 sm:mr-4 text-blue-600" />
            บันทึกการกระทำ
          </h1>
        </div>

        {/* --------- ส่วนตัวกรอง --------- */}
        <div
          className="bg-white shadow-md rounded-lg p-4 sm:p-6 border border-gray-200"
          data-cy="filters-section"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* ตัวกรองประเภทการกระทำ */}
            <div className="relative" data-cy="action-type-filter-container">
              <select
                data-cy="action-type-filter"
                name="action_type"
                value={filters.action_type}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ประเภทการกระทำทั้งหมด</option>
                {actionTypes.map((type) => (
                  <option
                    key={type}
                    value={type}
                    data-cy={`action-type-option-${type}`}
                  >
                    {actionTypeMapping[type] || type}
                  </option>
                ))}
              </select>
            </div>

            {/* ตัวกรองตารางเป้าหมาย */}
            <div className="relative" data-cy="target-table-filter-container">
              <select
                data-cy="target-table-filter"
                name="target_table"
                value={filters.target_table}
                onChange={handleFilterChange}
                className="w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">ตารางเป้าหมายทั้งหมด</option>
                {/* ใช้ filteredTargetTables แทน targetTables */}
                {filteredTargetTables.map((table) => (
                  <option
                    key={table}
                    value={table}
                    data-cy={`target-table-option-${table}`}
                  >
                    {targetTableMapping[table] || table}
                  </option>
                ))}
              </select>
            </div>

            {/* ตัวเลือกช่วงวันที่ */}
            <div className="relative" data-cy="date-range-container">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  data-cy="date-range-picker"
                >
                  <span className="text-gray-700 truncate">
                    {formatDateRange()}
                  </span>
                  <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                </button>

                {isDatePickerOpen && (
                  <div
                    className="absolute z-10 mt-1 bg-white rounded-md shadow-lg p-2 sm:p-4 border border-gray-200 left-0 right-0 sm:right-auto"
                    data-cy="date-picker-popup"
                  >
                    <div
                      className="overflow-x-auto"
                      style={{ maxWidth: "100%" }}
                    >
                      <DayPicker
                        mode="range"
                        selected={selectedRange}
                        onSelect={handleDateRangeSelect}
                        locale={th}
                        formatters={{
                          formatYear: (year) => `${year + 543}`,
                        }}
                        modifiers={{
                          selected: [selectedRange.from, selectedRange.to],
                        }}
                        modifiersStyles={{
                          selected: {
                            backgroundColor: "#3b82f6",
                            color: "white",
                          },
                        }}
                      />
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => setIsDatePickerOpen(false)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        data-cy="date-picker-confirm"
                      >
                        ตกลง
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ปุ่มล้างตัวกรอง */}
          {(filters.action_type ||
            filters.target_table ||
            filters.start_date ||
            filters.end_date) && (
            <div className="mt-4 flex justify-end">
              <button
                data-cy="clear-filters-button"
                onClick={clearFilters}
                className="flex items-center text-sm text-red-600 hover:text-red-800 transition duration-200"
              >
                <Filter className="h-4 w-4 mr-2" /> ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )}
        </div>

        {/* --------- ข้อความแสดงข้อผิดพลาด --------- */}
        {error && (
          <div
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative"
            role="alert"
            data-cy="error-message"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* --------- ตารางบันทึกการดำเนินการ (แบบ responsive) --------- */}
        <div
          className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200"
          data-cy="logs-table-container"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-full" data-cy="logs-table">
              <thead className="bg-gray-100 border-b">
                <tr>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-date"
                  >
                    วันที่
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-user"
                  >
                    ผู้ใช้
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-action"
                  >
                    การดำเนินการ
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32 sm:w-auto"
                    data-cy="column-header-target"
                  >
                    เป้าหมาย
                  </th>
                  <th
                    className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    data-cy="column-header-details"
                  >
                    รายละเอียด
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.log_id}
                    data-cy={`log-row-${log.log_id}`}
                    className="hover:bg-gray-50 transition-colors duration-100 border-b last:border-b-0"
                  >
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-600"
                      data-cy={`log-date-${log.log_id}`}
                    >
                      <div>{formatThaiDate(new Date(log.action_date))}</div>
                      <div className="text-gray-400 text-xs">
                        เวลา {formatTime(new Date(log.action_date))}
                      </div>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4"
                      data-cy={`log-user-${log.log_id}`}
                    >
                      <div
                        className="text-xs sm:text-sm font-medium text-gray-900"
                        data-cy={`user-name-${log.log_id}`}
                      >
                        {log.user_name}
                      </div>
                      <div
                        className="text-xs sm:text-sm text-gray-500"
                        data-cy={`user-role-${log.log_id}`}
                      >
                        {log.user_role}
                      </div>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4"
                      data-cy={`log-action-${log.log_id}`}
                    >
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {actionTypeMapping[log.action_type] || log.action_type}
                      </span>
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 break-words"
                      data-cy={`log-target-${log.log_id}`}
                    >
                      <span data-cy={`target-info-${log.log_id}`}>
                        {targetTableMapping[log.target_table] ||
                          log.target_table}{" "}
                        #{log.target_id}
                      </span>

                      {/* ตรวจสอบและแสดงชื่อจากหลายแหล่งข้อมูล */}
                      {(log.target_name ||
                        (log.details && log.details.name) ||
                        (log.target_table === "sprints" &&
                          log.details &&
                          getOriginalName(log, "sprint")) ||
                        (log.target_table === "projects" &&
                          log.details &&
                          getOriginalName(log, "project")) ||
                        (log.target_table === "users" &&
                          log.details &&
                          getOriginalName(log, "user"))) && (
                        <div
                          className="text-xs sm:text-sm font-medium text-gray-900"
                          data-cy={`target-name-${log.log_id}`}
                        >
                          {log.target_name ||
                            (log.details && log.details.name) ||
                            (log.target_table === "sprints" &&
                              log.details &&
                              getOriginalName(log, "sprint")) ||
                            (log.target_table === "projects" &&
                              log.details &&
                              getOriginalName(log, "project")) ||
                            (log.target_table === "users" &&
                              log.details &&
                              getOriginalName(log, "user"))}
                          {!log.target_name && " (ถูกลบแล้ว)"}
                        </div>
                      )}
                    </td>
                    <td
                      className="px-3 sm:px-6 py-2 sm:py-4 text-xs sm:text-sm text-gray-500 max-w-xs sm:max-w-sm md:max-w-md"
                      data-cy={`log-details-${log.log_id}`}
                    >
                      {formatDetails(
                        log.details,
                        log.target_table,
                        log.action_type
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* --------- สถานะว่างเปล่า --------- */}
          {logs.length === 0 && (
            <div
              className="text-center py-8 sm:py-10 text-gray-500 bg-gray-50"
              data-cy="empty-state"
            >
              ไม่พบบันทึกการดำเนินการ
            </div>
          )}
        </div>

        {/* --------- การแบ่งหน้า --------- */}
        <div
          className="flex flex-col items-center mt-4"
          data-cy="pagination-container"
        >
          <div
            className="text-xs sm:text-sm text-gray-700 mb-2"
            data-cy="pagination-info"
          >
            รายการที่{" "}
            {logs.length > 0 ? (currentPage - 1) * filters.limit + 1 : 0} ถึง{" "}
            {Math.min(currentPage * filters.limit, totalLogs)} จากทั้งหมด{" "}
            {totalLogs} รายการ
          </div>
          <div className="flex items-center space-x-2 justify-center">
            {/* ปุ่มหน้าแรก */}
            <button
              data-cy="first-page"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1 || logs.length === 0}
              className="hidden sm:block px-2 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <span className="sr-only">หน้าแรก</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M13.293 4.293a1 1 0 0 1 0 1.414L7.414 12l5.879 5.293a1 1 0 1 1-1.414 1.414l-7-6a1 1 0 0 1 0-1.414l7-6a1 1 0 0 1 1.414 0z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M7.293 4.293a1 1 0 0 1 0 1.414L1.414 12l5.879 5.293a1 1 0 1 1-1.414 1.414l-7-6a1 1 0 0 1 0-1.414l7-6a1 1 0 0 1 1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* ปุ่มก่อนหน้า */}
            <button
              data-cy="previous-page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!canGoToPreviousPage}
              className="px-3 sm:px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1 sm:mr-2"
              >
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              ก่อนหน้า
            </button>

            {/* แสดงปุ่มตัวเลขหน้า - ปรับปรุงตรรกะการแสดงหน้า */}
            <div className="hidden sm:flex space-x-1">
              {Array.from({ length: totalPages }).map((_, index) => {
                const pageNumber = index + 1;

                // ปรับตรรกะการแสดงหน้า
                // 1. แสดงหน้าแรกเสมอ
                // 2. แสดงหน้าสุดท้ายเสมอ
                // 3. แสดงหน้าปัจจุบันและหน้าถัดไปอีก 2 หน้า
                const isFirstPage = pageNumber === 1;
                const isLastPage = pageNumber === totalPages;
                const isWithinRange =
                  pageNumber >= Math.max(1, currentPage) &&
                  pageNumber <= Math.min(totalPages, currentPage + 2);

                // เงื่อนไขการแสดงจุดไข่ปลา
                const showLeftEllipsis = pageNumber === 2 && currentPage > 2;
                const showRightEllipsis =
                  pageNumber === totalPages - 1 && currentPage + 2 < totalPages;

                // แสดงหน้าเมื่อเป็นไปตามเงื่อนไข
                if (isFirstPage || isLastPage || isWithinRange) {
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`w-8 h-8 flex items-center justify-center rounded-md text-xs transition-colors duration-200
                ${
                  pageNumber === currentPage
                    ? "bg-blue-600 text-white font-medium shadow-sm"
                    : "border bg-white text-gray-700 hover:bg-gray-50"
                }`}
                      data-cy={`page-number-${pageNumber}`}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                    >
                      {pageNumber}
                    </button>
                  );
                } else if (showLeftEllipsis || showRightEllipsis) {
                  return (
                    <div
                      key={`ellipsis-${pageNumber}`}
                      className="w-8 h-8 flex items-center justify-center text-gray-500"
                    >
                      &hellip;
                    </div>
                  );
                }

                return null;
              })}
            </div>

            {/* แสดงตัวแสดงหน้าปัจจุบันบนมือถือ */}
            <div className="flex sm:hidden items-center px-3 py-1 bg-gray-100 rounded-md text-sm font-medium">
              <span>
                {currentPage} / {Math.max(1, totalPages)}
              </span>
            </div>

            {/* ปุ่มถัดไป */}
            <button
              data-cy="next-page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={!canGoToNextPage}
              className="px-3 sm:px-4 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm flex items-center"
            >
              ถัดไป
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 ml-1 sm:ml-2"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* ปุ่มหน้าสุดท้าย */}
            <button
              data-cy="last-page"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages || logs.length === 0}
              className="hidden sm:block px-2 py-2 border rounded-md bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
            >
              <span className="sr-only">หน้าสุดท้าย</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path
                  fillRule="evenodd"
                  d="M6.707 4.293a1 1 0 0 1 1.414 0l7 6a1 1 0 0 1 0 1.414l-7 6a1 1 0 0 1-1.414-1.414L12.586 10 6.707 4.707a1 1 0 0 1 0-1.414z"
                  clipRule="evenodd"
                />
                <path
                  fillRule="evenodd"
                  d="M12.707 4.293a1 1 0 0 1 1.414 0l7 6a1 1 0 0 1 0 1.414l-7 6a1 1 0 0 1-1.414-1.414L18.586 10 12.707 4.707a1 1 0 0 1 0-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActionLogs;
