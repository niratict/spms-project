import React from "react";
import {
  CheckCircle,
  XCircle,
  Beaker,
  FileText,
  BarChart2,
  ChevronDown,
  ChevronUp,
  Target,
  Check,
  X,
  Percent,
} from "lucide-react";

// คอมโพเนนต์สำหรับแสดงสถิติการทดสอบจากไฟล์ JSON ที่มีการปรับแต่ง UI ให้สวยงามและ responsive
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
          acc.totalPending += content.stats.pending || 0;
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
      totalPending: 0,
      fileCount: 0,
    }
  );

  // คำนวณอัตราส่วนต่างๆ
  const passPercentage =
    aggregateStats.totalTests > 0
      ? (
          (aggregateStats.totalPasses / aggregateStats.totalTests) *
          100
        ).toFixed(1)
      : 0;

  const failPercentage =
    aggregateStats.totalTests > 0
      ? (
          (aggregateStats.totalFailures / aggregateStats.totalTests) *
          100
        ).toFixed(1)
      : 0;

  const pendingPercentage =
    aggregateStats.totalTests > 0
      ? (
          (aggregateStats.totalPending / aggregateStats.totalTests) *
          100
        ).toFixed(1)
      : 0;

  // สร้างออบเจ็กต์ stats เพื่อให้เข้ากับโครงสร้างเดิม
  const stats = {
    totalFiles: aggregateStats.fileCount,
    passCount: aggregateStats.totalPasses,
    failCount: aggregateStats.totalFailures,
    pendingCount: aggregateStats.totalPending,
    passPercentage: passPercentage,
    failPercentage: failPercentage,
    pendingPercentage: pendingPercentage,
    successRate: passPercentage, // อัตราความสำเร็จตรงกับเปอร์เซ็นต์ที่ผ่าน
  };

  // StatCard คอมโพเนนต์เพื่อลดความซ้ำซ้อนของโค้ด - ปรับปรุงให้ responsive มากขึ้น
  const StatCard = ({
    title,
    value,
    subValue,
    bgColor,
    borderColor,
    textColor,
    icon,
    dataCy,
  }) => (
    <div
      className={`bg-gradient-to-br ${bgColor} p-3 md:p-4 rounded-xl shadow border ${borderColor} transition-all duration-300 hover:shadow-md flex flex-col h-full`}
      data-cy={dataCy}
    >
      <div className="flex items-start justify-between mb-1">
        <div className={`text-xs sm:text-sm ${textColor} font-medium truncate`}>
          {title}
        </div>
        <div
          className={`${bgColor
            .replace("from-", "")
            .replace("to-", "")} rounded-full p-1`}
        >
          {React.cloneElement(icon, {
            className: `w-4 h-4 sm:w-5 sm:h-5 ${icon.props.className}`,
          })}
        </div>
      </div>
      <div
        className={`text-xl sm:text-2xl md:text-3xl font-bold ${textColor.replace(
          "-700",
          "-800"
        )} mt-auto`}
        data-cy={`stat-value-${dataCy}`}
      >
        {value}
        {subValue !== undefined && (
          <span className="text-xs sm:text-sm font-normal ml-1">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <section
      className="bg-white shadow rounded-xl p-4 sm:p-5 mb-5 transition-all hover:shadow-md"
      data-cy="test-stats-dashboard"
    >
      <div
        className="flex justify-between items-center cursor-pointer"
        onClick={onToggle}
        data-cy="toggle-dashboard"
      >
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
          <Target className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-500 flex-shrink-0" />
          <span className="truncate">สถิติไฟล์ทดสอบของ Sprint</span>
        </h2>
        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
          {/* เพิ่มตัวเลือกสำหรับแสดงสถานะให้สอดคล้องกับ Sprint Section */}
          {isVisible && (
            <span className="hidden md:inline text-sm text-blue-600 font-medium">
              แสดงสถิติ
            </span>
          )}
          {isVisible ? (
            <ChevronUp className="w-5 h-5 text-blue-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-blue-500" />
          )}
        </div>
      </div>

      <div
        className={`transition-all duration-300 overflow-hidden ${
          isVisible ? "max-h-screen opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"
        }`}
        data-cy="stats-content"
      >
        <div>
          {/* Progress bar แสดงภาพรวม */}
          <div className="mb-4 md:mb-6" data-cy="progress-bar">
            <div className="text-xs sm:text-sm text-gray-700 mb-1 font-medium">
              ภาพรวมการทดสอบ
            </div>
            <div className="h-3 sm:h-4 w-full bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 float-left transition-all duration-500 ease-in-out"
                style={{ width: `${stats.passPercentage || 0}%` }}
                data-cy="progress-bar-pass"
              ></div>
              <div
                className="h-full bg-red-500 float-left transition-all duration-500 ease-in-out"
                style={{ width: `${stats.failPercentage || 0}%` }}
                data-cy="progress-bar-fail"
              ></div>
              <div
                className="h-full bg-yellow-500 float-left transition-all duration-500 ease-in-out"
                style={{ width: `${stats.pendingPercentage || 0}%` }}
                data-cy="progress-bar-pending"
              ></div>
            </div>

            {/* คำอธิบายสี */}
            <div
              className="flex flex-wrap gap-4 text-xs mt-2 justify-center sm:justify-start"
              data-cy="color-legend"
            >
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 bg-green-500 rounded-full mr-1.5"></div>
                <span>ผ่าน</span>
              </div>
              <div className="flex items-center">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full mr-1.5"></div>
                <span>ไม่ผ่าน</span>
              </div>
            </div>
          </div>

          {/* แสดงสถิติแบบกริด */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
            {/* ไฟล์ทั้งหมด */}
            <div className="col-span-1">
              <div className="bg-blue-50 rounded-xl p-3 shadow-sm border border-blue-100">
                <div className="text-xs text-blue-700 font-medium mb-1">
                  ไฟล์ทั้งหมด
                </div>
                <div
                  className="text-2xl font-bold text-blue-800"
                  data-cy="stat-file-count"
                >
                  {stats.totalFiles || 0}
                </div>
              </div>
            </div>

            {/* ชุดทดสอบ */}
            <div className="col-span-1">
              <div className="bg-purple-50 rounded-xl p-3 shadow-sm border border-purple-100">
                <div className="text-xs text-purple-700 font-medium mb-1">
                  ชุดทดสอบ
                </div>
                <div
                  className="text-2xl font-bold text-purple-800"
                  data-cy="stat-test-suites"
                >
                  {aggregateStats.totalSuites || 0}
                </div>
              </div>
            </div>

            {/* การทดสอบทั้งหมด */}
            <div className="col-span-2">
              <div className="bg-cyan-50 rounded-xl p-3 shadow-sm border border-cyan-100">
                <div className="text-xs text-cyan-700 font-medium mb-1">
                  การทดสอบทั้งหมด
                </div>
                <div
                  className="text-2xl font-bold text-cyan-800"
                  data-cy="stat-tests-total"
                >
                  {aggregateStats.totalTests || 0}
                </div>
              </div>
            </div>
          </div>

          {/* แถวสุดท้ายของการ์ด - ผ่าน/ไม่ผ่าน/อัตราความสำเร็จ */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {/* ผ่านการทดสอบ */}
            <div className="col-span-1">
              <div className="bg-green-50 rounded-xl p-3 shadow-sm border border-green-100">
                <div className="text-xs text-green-700 font-medium mb-1">
                  ผ่านการทดสอบ
                </div>
                <div
                  className="text-2xl font-bold text-green-800 flex items-end"
                  data-cy="stat-tests-passed"
                >
                  {stats.passCount || 0}
                  <span className="text-xs font-normal ml-1">
                    ({stats.passPercentage || 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* ไม่ผ่านการทดสอบ */}
            <div className="col-span-1">
              <div className="bg-red-50 rounded-xl p-3 shadow-sm border border-red-100">
                <div className="text-xs text-red-700 font-medium mb-1">
                  ไม่ผ่านการทดสอบ
                </div>
                <div
                  className="text-2xl font-bold text-red-800 flex items-end"
                  data-cy="stat-tests-failed"
                >
                  {stats.failCount || 0}
                  <span className="text-xs font-normal ml-1">
                    ({stats.failPercentage || 0}%)
                  </span>
                </div>
              </div>
            </div>

            {/* อัตราความสำเร็จ */}
            <div className="col-span-2">
              <div className="bg-emerald-50 rounded-xl p-3 shadow-sm border border-emerald-100">
                <div className="text-xs text-emerald-700 font-medium mb-1">
                  อัตราความสำเร็จ
                </div>
                <div
                  className="text-2xl font-bold text-emerald-800"
                  data-cy="stat-success-rate"
                >
                  {stats.successRate || 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestStatsDashboard;
