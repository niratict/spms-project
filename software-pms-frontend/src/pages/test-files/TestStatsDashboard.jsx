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
      className={`bg-gradient-to-br ${bgColor} p-2 sm:p-3 md:p-4 rounded-xl shadow border ${borderColor} transition-all duration-300 hover:shadow-md`}
      data-cy={dataCy}
    >
      <div className="flex items-start justify-between mb-1">
        <div
          className={`text-2xs xs:text-xs sm:text-sm ${textColor} font-medium truncate`}
        >
          {title}
        </div>
        <div
          className={`${bgColor
            .replace("from-", "")
            .replace("to-", "")} rounded-full p-1`}
        >
          {React.cloneElement(icon, {
            className: `w-3 h-3 xs:w-3.5 xs:h-3.5 sm:w-4 sm:h-4 ${icon.props.className}`,
          })}
        </div>
      </div>
      <div
        className={`text-base xs:text-lg sm:text-xl md:text-2xl font-bold ${textColor.replace(
          "-700",
          "-800"
        )}`}
        data-cy={`stat-value-${dataCy}`}
      >
        {value}
        {subValue !== undefined && (
          <span className="text-2xs xs:text-xs sm:text-sm font-normal ml-1">
            {subValue}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div
      className={`
        bg-white shadow-lg rounded-xl overflow-hidden
        transform transition-all duration-500
        ${isVisible ? "opacity-100" : "opacity-75 hover:opacity-100"}
        max-w-screen-xl mx-auto
      `}
      data-cy="test-stats-dashboard"
    >
      {/* ส่วนหัวที่มีปุ่มเปิด/ปิดแผงควบคุม - ปรับขนาดให้ responsive */}
      <div
        className="p-2 xs:p-3 sm:p-4 md:p-6 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors"
        onClick={onToggle}
        data-cy="toggle-dashboard"
      >
        <div className="flex justify-between items-center">
          <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold flex items-center">
            <Target className="w-3 h-3 xs:w-4 xs:h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 xs:mr-2 text-indigo-500" />
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              สถิติการทดสอบ
            </span>
          </h2>
          {isVisible ? (
            <ChevronUp className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-indigo-500" />
          ) : (
            <ChevronDown className="w-3 h-3 xs:w-4 xs:h-4 md:w-5 md:h-5 text-indigo-500" />
          )}
        </div>
      </div>

      {/* ส่วนแสดงข้อมูลสถิติ */}
      <div
        className={`
          transition-all duration-500 overflow-hidden
          ${isVisible ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}
        `}
        data-cy="stats-content"
      >
        <div className="p-2 xs:p-3 sm:p-4 md:p-6">
          {/* Progress bar แสดงภาพรวม - แสดงตอนบนบนทุกอุปกรณ์ */}
          <div className="mb-3 md:mb-6" data-cy="progress-bar">
            <div className="text-2xs xs:text-xs sm:text-sm text-gray-700 mb-1 font-medium">
              ภาพรวมการทดสอบ
            </div>
            <div className="h-2 xs:h-3 sm:h-4 w-full bg-gray-200 rounded-full overflow-hidden">
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

            {/* คำอธิบายสี - ปรับขนาดให้ responsive */}
            <div
              className="flex flex-wrap gap-3 xs:gap-4 sm:gap-6 text-2xs xs:text-xs mt-1 xs:mt-2 justify-center sm:justify-start"
              data-cy="color-legend"
            >
              <div className="flex items-center justify-center">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full mr-1 xs:mr-1.5 sm:mr-2"></div>
                <span>ผ่าน</span>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-1.5 h-1.5 xs:w-2 xs:h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full mr-1 xs:mr-1.5 sm:mr-2"></div>
                <span>ไม่ผ่าน</span>
              </div>
            </div>
          </div>

          {/* แสดงสถิติหลักให้เด่นชัด - ปรับ grid เพื่อรองรับจอขนาดเล็กมากๆ */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5 xs:gap-2 md:gap-4 mb-2 xs:mb-3 md:mb-4">
            {/* สถิติหลัก: ไฟล์ทั้งหมด */}
            <div className="lg:col-span-2">
              <StatCard
                title="ไฟล์ทั้งหมด"
                value={stats.totalFiles || 0}
                bgColor="from-blue-50 to-indigo-50"
                borderColor="border-blue-100"
                textColor="text-blue-700"
                icon={<FileText className="text-blue-600" />}
                dataCy="stat-card-file-count"
              />
            </div>

            {/* สถิติหลัก: การทดสอบทั้งหมด */}
            <div className="lg:col-span-2">
              <StatCard
                title="การทดสอบทั้งหมด"
                value={aggregateStats.totalTests || 0}
                bgColor="from-cyan-50 to-blue-50"
                borderColor="border-cyan-100"
                textColor="text-cyan-700"
                icon={<Beaker className="text-cyan-600" />}
                dataCy="stat-card-tests-total"
              />
            </div>

            {/* สถิติหลัก: ชุดทดสอบ */}
            <div className="lg:col-span-2">
              <StatCard
                title="ชุดทดสอบ"
                value={aggregateStats.totalSuites || 0}
                bgColor="from-purple-50 to-violet-50"
                borderColor="border-purple-100"
                textColor="text-purple-700"
                icon={<BarChart2 className="text-purple-600" />}
                dataCy="stat-card-test-suites"
              />
            </div>
          </div>

          {/* แสดงผลลัพธ์การทดสอบ - ปรับให้แสดงเป็น 1 คอลัมน์บนจอขนาดเล็กมาก */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-1.5 xs:gap-2 md:gap-4">
            {/* ผ่านการทดสอบ */}
            <StatCard
              title="ผ่านการทดสอบ"
              value={stats.passCount || 0}
              subValue={`(${stats.passPercentage || 0}%)`}
              bgColor="from-green-50 to-emerald-50"
              borderColor="border-green-100"
              textColor="text-green-700"
              icon={<Check className="text-green-600" />}
              dataCy="stat-card-tests-passed"
            />

            {/* ไม่ผ่านการทดสอบ */}
            <StatCard
              title="ไม่ผ่านการทดสอบ"
              value={stats.failCount || 0}
              subValue={`(${stats.failPercentage || 0}%)`}
              bgColor="from-red-50 to-rose-50"
              borderColor="border-red-100"
              textColor="text-red-700"
              icon={<X className="text-red-600" />}
              dataCy="stat-card-tests-failed"
            />

            {/* อัตราความสำเร็จ (และรอดำเนินการ) */}
            <div className="xs:col-span-2 sm:col-span-1">
              <StatCard
                title="อัตราความสำเร็จ"
                value={`${stats.successRate || 0}%`}
                bgColor="from-emerald-50 to-teal-50"
                borderColor="border-emerald-100"
                textColor="text-emerald-700"
                icon={<Percent className="text-emerald-600" />}
                dataCy="stat-card-success-rate"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestStatsDashboard;
