import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

// คอมโพเนนต์แสดงรายการสปรินต์ที่มีอยู่ในระบบ
const ExistingSprintsList = ({ sprints }) => {
  // สถานะการแสดงผลรายการ (เปิด/ปิด)
  const [isExpanded, setIsExpanded] = useState(false);

  // แบ่งข้อมูลสปรินต์เป็น 2 คอลัมน์สำหรับการแสดงผล
  const midPoint = Math.ceil(sprints.length / 2);
  const leftColumn = sprints.slice(0, midPoint);
  const rightColumn = sprints.slice(midPoint);

  // แสดงผลคอมโพเนนต์
  return (
    <div className="mb-4" data-cy="existing-sprints-container">
      {/* ปุ่มสำหรับเปิด/ปิดรายการ */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-gray-700 p-1.5 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
        data-cy="toggle-sprints-btn"
      >
        <span>สปรินต์ที่ดำเนินการอยู่ ({sprints.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
        )}
      </button>

      {/* รายการสปรินต์ (แสดงเมื่อเปิดดูเท่านั้น) */}
      {isExpanded && (
        <div
          className="mt-2 border rounded-md p-2 bg-gray-50"
          data-cy="sprints-expanded-list"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            {/* คอลัมน์ซ้าย */}
            <div className="space-y-2">
              {leftColumn.map((sprint) => (
                <SprintCard key={sprint.name} sprint={sprint} />
              ))}
            </div>

            {/* คอลัมน์ขวา */}
            <div className="space-y-2">
              {rightColumn.map((sprint) => (
                <SprintCard key={sprint.name} sprint={sprint} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// คอมโพเนนต์ย่อยสำหรับแสดงข้อมูลสปรินต์แต่ละรายการ
const SprintCard = ({ sprint }) => (
  <div
    className="text-xs bg-white p-2 rounded-md border border-gray-200 shadow-sm"
    data-cy={`sprint-card-${sprint.name}`}
  >
    <div className="font-medium text-blue-600">{sprint.name}</div>
    <div className="text-gray-600 text-xs">
      {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
      {new Date(sprint.end_date).toLocaleDateString("th-TH")}
    </div>
  </div>
);

export default ExistingSprintsList;
