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
        className="flex items-center justify-between w-full text-sm font-medium text-gray-700 mb-2 hover:text-gray-900"
      >
        <span>Existing Sprints ({sprints.length})</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-4 mt-2 max-h-32 overflow-y-auto">
          <div className="space-y-2">
            {leftColumn.map((sprint) => (
              <div key={sprint.name} className="text-sm text-gray-600">
                {sprint.name}:<br></br>
                {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
                {new Date(sprint.end_date).toLocaleDateString("th-TH")}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {rightColumn.map((sprint) => (
              <div key={sprint.name} className="text-sm text-gray-600">
                {sprint.name}:<br></br>
                {new Date(sprint.start_date).toLocaleDateString("th-TH")} -{" "}
                {new Date(sprint.end_date).toLocaleDateString("th-TH")}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExistingSprintsList;
