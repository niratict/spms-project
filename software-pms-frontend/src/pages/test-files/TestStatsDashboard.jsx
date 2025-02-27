import React from "react";
import {
  CheckCircle,
  XCircle,
  Beaker,
  FileText,
  BarChart2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// คอมโพเนนต์สำหรับแสดงสถิติการทดสอบจากไฟล์ JSON
const TestStatsDashboard = ({ testFiles, isVisible = true, onToggle }) => {
  // คำนวณสถิติรวมจากไฟล์ทั้งหมด
  const aggregateStats = testFiles.reduce(
    (acc, file) => {
      try {
        const content =
          typeof file.json_content === "string"
            ? JSON.parse(file.json_content)
            : file.json_content;

        if (content?.stats) {
          acc.totalSuites += content.stats.suites || 0;
          acc.totalTests += content.stats.tests || 0;
          acc.totalPasses += content.stats.passes || 0;
          acc.totalFailures += content.stats.failures || 0;
          acc.fileCount += 1;
        }
      } catch (error) {
        console.error("Error parsing JSON content:", error);
      }
      return acc;
    },
    {
      totalSuites: 0,
      totalTests: 0,
      totalPasses: 0,
      totalFailures: 0,
      fileCount: 0,
    }
  );

  // คำนวณอัตราส่วนการผ่านและล้มเหลว
  const passRate =
    aggregateStats.totalTests > 0
      ? (
          (aggregateStats.totalPasses / aggregateStats.totalTests) *
          100
        ).toFixed(1)
      : 0;

  const failRate =
    aggregateStats.totalTests > 0
      ? (
          (aggregateStats.totalFailures / aggregateStats.totalTests) *
          100
        ).toFixed(1)
      : 0;

  // กำหนดข้อมูลสถิติที่จะแสดงในการ์ด
  const stats = [
    {
      icon: <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-teal-500" />,
      value: aggregateStats.totalSuites,
      label: "ชุดทดสอบ",
      dataCy: "test-suites",
    },
    {
      icon: <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      value: aggregateStats.totalPasses,
      label: "การทดสอบที่ผ่าน",
      dataCy: "tests-passed",
    },
    {
      icon: <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />,
      value: aggregateStats.totalFailures,
      label: "การทดสอบที่ผิดพลาด",
      dataCy: "tests-failed",
    },
    {
      icon: <Beaker className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500" />,
      value: aggregateStats.totalTests,
      label: "การทดสอบทั้งหมด",
      dataCy: "tests-total",
    },
    {
      icon: <BarChart2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />,
      value: `${passRate}%`,
      label: "อัตราการผ่าน",
      dataCy: "pass-rate",
    },
    {
      icon: <BarChart2 className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />,
      value: `${failRate}%`,
      label: "อัตราการผิดพลาด",
      dataCy: "fail-rate",
    },
  ];

  // คอมโพเนนต์ย่อยสำหรับแสดงการ์ดสถิติแต่ละรายการ
  const StatCard = ({ icon, value, label, dataCy }) => (
    <div
      className="bg-gray-50 rounded-xl p-3 sm:p-4 md:p-6 flex items-center space-x-2 sm:space-x-4 hover:shadow-md transition-all"
      data-cy={`stat-card-${dataCy}`}
    >
      {icon}
      <div>
        <div
          className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800"
          data-cy={`stat-value-${dataCy}`}
        >
          {value}
        </div>
        <div className="text-xs sm:text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );

  return (
    <div
      className="bg-white rounded-xl shadow-md overflow-hidden w-full"
      data-cy="test-stats-dashboard"
    >
      {/* ส่วนหัวที่มีปุ่มเปิด/ปิดแผงควบคุม */}
      <button
        onClick={onToggle}
        className="w-full p-3 sm:p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
        data-cy="toggle-dashboard"
      >
        <span className="text-lg sm:text-xl md:text-2xl font-bold text-gray-700 flex items-center gap-1 sm:gap-2">
          <BarChart2 className="w-5 h-5 sm:w-6 sm:h-6 mr-1 text-blue-500" />
          สถิติการทดสอบ
        </span>
        {isVisible ? (
          <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
        )}
      </button>

      {/* ส่วนแสดงข้อมูลสถิติ */}
      {isVisible && (
        <div className="p-3 sm:p-4 md:p-6" data-cy="stats-content">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <StatCard
                key={index}
                icon={stat.icon}
                value={stat.value}
                label={stat.label}
                dataCy={stat.dataCy}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStatsDashboard;
