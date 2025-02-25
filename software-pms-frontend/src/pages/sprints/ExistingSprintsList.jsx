import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const ExistingSprintsList = ({ sprints }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // แบ่ง sprints เป็น 2 columns
  const midPoint = Math.ceil(sprints.length / 2);
  const leftColumn = sprints.slice(0, midPoint);
  const rightColumn = sprints.slice(midPoint);

  return (
    <div className="mb-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-xs sm:text-sm font-medium text-gray-700 p-1.5 rounded-md hover:bg-gray-50 transition-colors border border-gray-200"
      >
        <span>สปรินต์ที่ดำเนินการอยู่ ({sprints.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-blue-500" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-2 border rounded-md p-2 bg-gray-50">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
            <div className="space-y-2">
              {leftColumn.map((sprint) => (
                <div
                  key={sprint.name}
                  className="text-xs bg-white p-2 rounded-md border border-gray-200 shadow-sm"
                >
                  <div className="font-medium text-blue-600">{sprint.name}</div>
                  <div className="text-gray-600 text-xs">
                    {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString("th-TH")}
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {rightColumn.map((sprint) => (
                <div
                  key={sprint.name}
                  className="text-xs bg-white p-2 rounded-md border border-gray-200 shadow-sm"
                >
                  <div className="font-medium text-blue-600">{sprint.name}</div>
                  <div className="text-gray-600 text-xs">
                    {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
                    {new Date(sprint.end_date).toLocaleDateString("th-TH")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingSprintsList;
