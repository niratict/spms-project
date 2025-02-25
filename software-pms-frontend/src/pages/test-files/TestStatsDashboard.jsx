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

const TestStatsDashboard = ({ testFiles, isVisible = true, onToggle }) => {
  // Aggregate stats from all JSON files
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

  // Calculate pass and fail rates
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

  const stats = [
    {
      icon: <FileText className="w-8 h-8 text-teal-500" />,
      value: aggregateStats.totalSuites,
      label: "ชุดทดสอบ",
    },
    {
      icon: <CheckCircle className="w-8 h-8 text-green-500" />,
      value: aggregateStats.totalPasses,
      label: "การทดสอบที่ผ่าน",
    },
    {
      icon: <XCircle className="w-8 h-8 text-red-500" />,
      value: aggregateStats.totalFailures,
      label: "การทดสอบที่ผิดพลาด",
    },
    {
      icon: <Beaker className="w-8 h-8 text-blue-500" />,
      value: aggregateStats.totalTests,
      label: "การทดสอบทั้งหมด",
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-green-500" />,
      value: `${passRate}%`,
      label: "อัตราการผ่าน",
    },
    {
      icon: <BarChart2 className="w-8 h-8 text-red-500" />,
      value: `${failRate}%`,
      label: "อัตราการผิดพลาด",
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-2xl font-bold text-gray-700 flex items-center gap-2">
          <BarChart2 className="w-6 h-6 mr-1 text-blue-500" />
          สถิติการทดสอบ
        </span>
        {isVisible ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      
      {isVisible && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-6 flex items-center space-x-4 hover:shadow-md transition-all"
              >
                {stat.icon}
                <div>
                  <div className="text-3xl font-bold text-gray-800">{stat.value}</div>
                  <div className="text-sm text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TestStatsDashboard;