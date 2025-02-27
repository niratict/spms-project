import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// คอมโพเนนต์แสดงรายการสปรินต์ที่มีอยู่ในระบบ
const ExistingSprintsList = ({ sprints }) => {
  // สถานะการแสดงผลรายการ (เปิด/ปิด)
  const [isExpanded, setIsExpanded] = useState(false);
  // สถานะสำหรับตรวจสอบขนาดหน้าจอ
  const [columnLayout, setColumnLayout] = useState(getColumnLayout());

  // ฟังก์ชันสำหรับคำนวณจำนวนคอลัมน์ตามขนาดหน้าจอ
  function getColumnLayout() {
    if (typeof window !== "undefined") {
      return window.innerWidth < 640
        ? 1
        : window.innerWidth < 1024
        ? 2
        : window.innerWidth < 1280
        ? 3
        : 4;
    }
    return 2; // ค่าเริ่มต้น
  }

  // จัดการการเปลี่ยนแปลงขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      setColumnLayout(getColumnLayout());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // แบ่งข้อมูลสปรินต์ตามจำนวนคอลัมน์
  const sprintColumns = [];
  const itemsPerColumn = Math.ceil(sprints.length / columnLayout);

  for (let i = 0; i < columnLayout; i++) {
    sprintColumns.push(
      sprints.slice(i * itemsPerColumn, (i + 1) * itemsPerColumn)
    );
  }

  // แสดงผลคอมโพเนนต์
  return (
    <div className="mb-4 w-full" data-cy="existing-sprints-container">
      {/* ปุ่มสำหรับเปิด/ปิดรายการ */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-xs sm:text-sm md:text-base font-medium text-gray-700 p-1.5 sm:p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
        data-cy="toggle-sprints-btn"
      >
        <span>สปรินต์ที่ดำเนินการอยู่ ({sprints.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500" />
        )}
      </button>

      {/* รายการสปรินต์ (แสดงเมื่อเปิดดูเท่านั้น) */}
      {isExpanded && (
        <div
          className="mt-2 border rounded-md p-2 sm:p-3 bg-gray-50"
          data-cy="sprints-expanded-list"
        >
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-${Math.min(
              columnLayout,
              3
            )} xl:grid-cols-${columnLayout} gap-2 sm:gap-3 max-h-36 sm:max-h-48 md:max-h-56 overflow-y-auto pr-1`}
          >
            {/* แสดงคอลัมน์ตามจำนวนที่คำนวณได้ */}
            {sprintColumns.map((column, columnIndex) => (
              <div key={`column-${columnIndex}`} className="space-y-2">
                {column.map((sprint) => (
                  <SprintCard key={sprint.name} sprint={sprint} />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// คอมโพเนนต์ย่อยสำหรับแสดงข้อมูลสปรินต์แต่ละรายการ
const SprintCard = ({ sprint }) => (
  <div
    className="text-xs sm:text-sm bg-white p-2 sm:p-3 rounded-md border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
    data-cy={`sprint-card-${sprint.name}`}
  >
    <div className="font-medium text-blue-600 truncate">{sprint.name}</div>
    <div className="text-gray-600 text-xs sm:text-sm">
      {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
      {new Date(sprint.end_date).toLocaleDateString("th-TH")}
    </div>
  </div>
);

export default ExistingSprintsList;
