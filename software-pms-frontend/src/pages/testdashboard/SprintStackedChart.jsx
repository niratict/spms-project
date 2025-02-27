import React, { useMemo, useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ฟังก์ชันช่วยสำหรับจัดการกับวันที่ในรูปแบบไทย
const dateHelpers = {
  // แปลงเดือนเป็นภาษาไทย
  getThaiMonth: (date) => {
    const thaiMonths = [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ];
    return thaiMonths[new Date(date).getMonth()];
  },

  // แปลงวันที่เป็นรูปแบบไทย (วัน-เดือน-ปี พ.ศ.)
  formatThaiDate: (isoDateString) => {
    try {
      if (!isoDateString) return "-";

      const date = new Date(isoDateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear() + 543; // แปลงเป็นปี พ.ศ.

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  },
};

// คอมโพเนนต์ย่อยสำหรับแสดงการ์ดสรุปข้อมูล
const MetricCard = ({ title, value, change }) => (
  <div
    className="bg-white rounded-lg shadow p-3 sm:p-4 lg:p-6"
    data-cy="metric-card"
  >
    <p className="text-xs sm:text-sm text-gray-500 truncate">{title}</p>
    <div className="mt-1 sm:mt-2 flex items-baseline gap-1 sm:gap-2">
      <p
        className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900"
        data-cy="metric-value"
      >
        {value}
      </p>
      {change !== undefined && (
        <span
          className={`flex items-center text-xs sm:text-sm ${
            change > 0 ? "text-green-600" : "text-red-600"
          }`}
          data-cy="metric-change"
        >
          {change > 0 ? (
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          {Math.abs(change)}%
        </span>
      )}
    </div>
  </div>
);

// คอมโพเนนต์ย่อยสำหรับแสดง tooltip ในกราฟ
const CustomTooltip = ({ active, payload, label, chartData }) => {
  if (active && payload && payload.length) {
    const sprintData = chartData.find((item) => item.sprint === label);
    const totalTests = payload.reduce((sum, entry) => sum + entry.value, 0);

    return (
      <div
        className="bg-white p-2 sm:p-4 rounded-lg shadow-lg border border-gray-200 max-w-xs sm:max-w-sm"
        data-cy="chart-tooltip"
      >
        {/* ชื่อสปรินต์ */}
        <p className="text-base sm:text-lg font-semibold text-gray-800 mb-2 sm:mb-3 truncate">
          {label}
        </p>

        {/* วันที่ของสปรินต์ */}
        <div className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
          <p className="mb-1">วันที่เริ่มต้น: {sprintData.startDate}</p>
          <p>วันที่สิ้นสุด: {sprintData.endDate}</p>
        </div>

        {/* จำนวนการทดสอบทั้งหมด */}
        <div className="flex items-center gap-2 mb-2 sm:mb-3">
          <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-gray-400" />
          <span className="text-xs sm:text-sm font-medium text-gray-700">
            Total Tests: {totalTests}
          </span>
        </div>

        {/* รายละเอียดแต่ละประเภทการทดสอบ */}
        <div className="space-y-1">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-2 h-2 sm:w-3 sm:h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-xs sm:text-sm font-medium text-gray-700">
                {entry.name}: {entry.value} tests
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// คอมโพเนนต์ย่อยสำหรับกำหนดการแสดงผลของแกน X
const CustomXAxisTick = (props) => {
  const { x, y, payload, index, chartData, isMobile } = props;
  const currentSprintData = chartData[index];
  const previousSprintData = index > 0 ? chartData[index - 1] : null;

  // ตรวจสอบว่าสปรินต์ปัจจุบันอยู่ในเดือนเดียวกับสปรินต์ก่อนหน้า
  const inSameMonth =
    previousSprintData &&
    currentSprintData.currentMonth === previousSprintData.currentMonth;

  // ถ้าแสดงเดือน ให้เลื่อนตำแหน่งเพื่อให้อยู่ตรงกลางระหว่างสปรินต์
  const offsetX = inSameMonth ? -50 : 0;

  // ปรับขนาดและการแสดงผลตามขนาดหน้าจอ
  const fontSize = isMobile ? "8px" : "12px";
  const yOffset = isMobile ? 12 : 20;
  const monthYOffset = isMobile ? 30 : 60;

  // ปรับความยาวของชื่อสปรินต์บนมือถือ
  let displayName = payload.value;
  if (isMobile && displayName.length > 8) {
    displayName = displayName.substring(0, 7) + "...";
  }

  return (
    <g transform={`translate(${x},${y})`} data-cy="x-axis-tick">
      {/* ชื่อสปรินต์ */}
      <text
        x={0}
        y={yOffset}
        textAnchor="middle"
        fill="#4B5563"
        style={{ fontSize }}
        transform={isMobile ? "rotate(-45, 0, 0)" : ""}
        dominantBaseline={isMobile ? "hanging" : "auto"}
      >
        {displayName}
      </text>

      {/* แสดงเดือน */}
      {currentSprintData.isLastInMonth && inSameMonth && !isMobile && (
        <text
          x={offsetX}
          y={monthYOffset}
          textAnchor="middle"
          fill="#4B5563"
          style={{ fontSize }}
          fontWeight="medium"
          data-cy="month-label"
        >
          {currentSprintData.monthDisplay}
        </text>
      )}
    </g>
  );
};

const SprintStackedChart = ({ sprintResults }) => {
  // State สำหรับจัดการการเลื่อนดูข้อมูล
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(false);
  const [chartHeight, setChartHeight] = useState(400);

  // ปรับขนาดกราฟตามขนาดหน้าจอ
  useEffect(() => {
    const handleResize = () => {
      const screenWidth = window.innerWidth;

      // ตั้งค่าจำนวนรายการต่อหน้าตามขนาดจอ
      if (screenWidth < 640) {
        setItemsPerPage(3); // แสดง 3 Sprint บนมือถือ
        setIsMobile(true);
        setChartHeight(300); // ลดความสูงบนมือถือ
      } else if (screenWidth < 1024) {
        setItemsPerPage(6); // แสดง 6 Sprint บนแท็บเล็ต
        setIsMobile(false);
        setChartHeight(350);
      } else {
        setItemsPerPage(10); // แสดง 10 Sprint บนเดสก์ท็อป
        setIsMobile(false);
        setChartHeight(400);
      }

      // รีเซ็ตหน้าเป็นหน้าแรกถ้าจำนวนหน้าเปลี่ยน
      const totalPages = Math.ceil(sprintResults.length / itemsPerPage);
      if (currentPage >= totalPages) {
        setCurrentPage(0);
      }
    };

    handleResize(); // เรียกใช้ในครั้งแรก
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [sprintResults.length, currentPage, itemsPerPage]);

  // คำนวณข้อมูลสรุปและการเปลี่ยนแปลง
  const summaryMetrics = useMemo(() => {
    // นับจำนวนการทดสอบทั้งหมด
    const totalTests = sprintResults.reduce(
      (acc, sprint) => acc + (sprint.suites?.[0]?.tests?.length || 0),
      0
    );

    // นับจำนวนที่ผ่านการทดสอบ
    const totalPassed = sprintResults.reduce(
      (acc, sprint) =>
        acc +
        (sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0),
      0
    );

    // คำนวณการเปลี่ยนแปลงเทียบกับสปรินต์ก่อนหน้า
    const currentSprint = sprintResults[sprintResults.length - 1];
    const previousSprint = sprintResults[sprintResults.length - 2];

    const currentTestCount = currentSprint?.suites?.[0]?.tests?.length || 0;
    const previousTestCount = previousSprint?.suites?.[0]?.tests?.length || 0;

    // คำนวณการเปลี่ยนแปลงของจำนวนการทดสอบทั้งหมด
    const testsChange =
      previousTestCount && previousTestCount !== 0
        ? (
            ((currentTestCount - previousTestCount) / previousTestCount) *
            100
          ).toFixed(1)
        : "0"; // ใช้ string "0" เมื่อไม่สามารถคำนวณได้

    // คำนวณการเปลี่ยนแปลงของค่าเฉลี่ยต่อสปรินต์
    const currentAverage = currentTestCount;
    const previousAverage = previousTestCount;
    const averageChange =
      previousAverage && previousAverage !== 0
        ? (
            ((currentAverage - previousAverage) / previousAverage) *
            100
          ).toFixed(1)
        : "0"; // ใช้ string "0" เมื่อไม่สามารถคำนวณได้

    const totalFailed = totalTests - totalPassed;
    const averagePerSprint = totalTests / sprintResults.length;
    const failureRate =
      totalTests > 0 ? ((totalFailed / totalTests) * 100).toFixed(1) : "0";
    const passRate =
      totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : "0";

    return {
      totalTests,
      averagePerSprint: totalTests > 0 ? averagePerSprint.toFixed(2) : "0",
      totalPassed,
      totalFailed,
      failureRate,
      passRate,
      testsChange: isNaN(Number(testsChange)) ? 0 : Number(testsChange),
      averageChange: isNaN(Number(averageChange)) ? 0 : Number(averageChange),
    };
  }, [sprintResults]);

  // แปลงข้อมูลสำหรับใช้ในการแสดงกราฟ
  const chartData = useMemo(() => {
    return sprintResults.map((sprint, index, array) => {
      const totalTests = sprint.suites?.[0]?.tests?.length || 0;
      const passedTests =
        sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0;
      const failedTests = totalTests - passedTests;

      // จัดรูปแบบวันที่
      const startDate = sprint.startDate
        ? dateHelpers.formatThaiDate(sprint.startDate)
        : "-";
      const endDate = sprint.endDate
        ? dateHelpers.formatThaiDate(sprint.endDate)
        : "-";

      // ดึงเดือนและปีของสปรินต์ปัจจุบัน
      const currentMonth = sprint.startDate
        ? dateHelpers.getThaiMonth(sprint.startDate)
        : "";
      const currentYear = sprint.startDate
        ? new Date(sprint.startDate).getFullYear() + 543
        : "";

      // ตรวจสอบว่าเป็นสปรินต์แรกของเดือนหรือไม่
      const previousSprint = array[index - 1];
      const isFirstInMonth =
        !previousSprint ||
        new Date(sprint.startDate).getMonth() !==
          new Date(previousSprint.startDate).getMonth();

      // ตรวจสอบว่ามีสปรินต์ถัดไปและอยู่ในเดือนเดียวกันหรือไม่
      const nextSprint = array[index + 1];
      const isLastInMonth =
        !nextSprint ||
        new Date(sprint.startDate).getMonth() !==
          new Date(nextSprint.startDate).getMonth();

      return {
        sprint: `${sprint.sprint_name || "Unknown Sprint"}`,
        startDate,
        endDate,
        Passed: passedTests,
        Failed: failedTests,
        "Timed Out": 0,
        Errored: 0,
        Canceled: 0,
        monthDisplay: `(${currentMonth} ${currentYear})`,
        isFirstInMonth,
        isLastInMonth,
        currentMonth: sprint.startDate
          ? new Date(sprint.startDate).getMonth()
          : null,
      };
    });
  }, [sprintResults]);

  // ข้อมูลที่จะแสดงในหน้าปัจจุบัน
  const paginatedData = useMemo(() => {
    const startIndex = currentPage * itemsPerPage;
    return chartData.slice(startIndex, startIndex + itemsPerPage);
  }, [chartData, currentPage, itemsPerPage]);

  // คำนวณจำนวนหน้าทั้งหมด
  const totalPages = Math.ceil(chartData.length / itemsPerPage);

  // ฟังก์ชันสำหรับการนำทางระหว่างหน้า
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6" data-cy="sprint-chart-container">
      {/* ส่วนแสดงกราฟ */}
      <div
        className="bg-white rounded-xl shadow-lg p-3 sm:p-4 lg:p-6"
        data-cy="sprint-chart"
      >
        <div className="mb-3 sm:mb-6">
          <h2
            className="text-lg sm:text-xl font-bold text-gray-800"
            data-cy="chart-title"
          >
            ผลการทดสอบของสปรินต์ทั้งหมด
          </h2>
          <p
            className="text-xs sm:text-sm text-gray-500 mt-1"
            data-cy="chart-subtitle"
          >
            อัตราการผ่าน {summaryMetrics.passRate}% - อัตราการผิดพลาด{" "}
            {summaryMetrics.failureRate}%
          </p>
        </div>

        {/* ปุ่มนำทางและตัวแสดงหน้า */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mb-2 sm:mb-4">
            <button
              onClick={handlePrevPage}
              disabled={currentPage === 0}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm ${
                currentPage === 0
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              data-cy="prev-page-button"
            >
              <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">ก่อนหน้า</span>
            </button>

            <div
              className="text-xs sm:text-sm text-gray-600"
              data-cy="pagination-info"
            >
              หน้า {currentPage + 1} จาก {totalPages}
            </div>

            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages - 1}
              className={`flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-2 rounded-md text-xs sm:text-sm ${
                currentPage >= totalPages - 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-blue-600 hover:bg-blue-50"
              }`}
              data-cy="next-page-button"
            >
              <span className="hidden sm:inline">ถัดไป</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>
        )}

        <div
          className={`h-[${chartHeight}px] w-full`}
          style={{ height: `${chartHeight}px` }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={paginatedData}
              margin={{
                top: 20,
                right: isMobile ? 10 : 30,
                left: isMobile ? 0 : 20,
                bottom: isMobile ? 60 : 10,
              }}
              data-cy="stacked-bar-chart"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200"
                vertical={!isMobile}
              />
              <XAxis
                dataKey="sprint"
                height={isMobile ? 60 : 100}
                tick={
                  <CustomXAxisTick
                    chartData={paginatedData}
                    isMobile={isMobile}
                  />
                }
                tickLine={!isMobile}
                axisLine={!isMobile}
                interval={0}
                data-cy="x-axis"
              />
              <YAxis
                tick={{ fill: "rgb(55, 65, 81)", fontSize: isMobile ? 10 : 12 }}
                tickFormatter={(value) =>
                  isMobile
                    ? value > 999
                      ? `${(value / 1000).toFixed(1)}k`
                      : value
                    : value
                }
                width={isMobile ? 30 : 40}
                data-cy="y-axis"
              />
              <Tooltip content={<CustomTooltip chartData={chartData} />} />
              <Legend
                data-cy="chart-legend"
                verticalAlign={isMobile ? "top" : "bottom"}
                wrapperStyle={{ fontSize: isMobile ? "10px" : "12px" }}
              />
              <Bar
                dataKey="Passed"
                stackId="a"
                fill="#4ADE80"
                data-cy="passed-bar"
              />
              <Bar
                dataKey="Failed"
                stackId="a"
                fill="#F87171"
                data-cy="failed-bar"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ส่วนแสดงการ์ดข้อมูลสรุป */}
      <div
        className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4"
        data-cy="metrics-grid"
      >
        <MetricCard
          title="จำนวนการทดสอบทั้งหมด"
          value={summaryMetrics.totalTests}
          change={summaryMetrics.testsChange}
        />
        <MetricCard
          title="จำนวนการทดสอบเฉลี่ยต่อสปรินต์"
          value={summaryMetrics.averagePerSprint}
          change={summaryMetrics.averageChange}
        />
        <MetricCard
          title="จำนวนที่ผ่านการทดสอบ"
          value={summaryMetrics.totalPassed}
        />
        <MetricCard
          title="จำนวนที่ผิดพลาด"
          value={summaryMetrics.totalFailed}
        />
      </div>
    </div>
  );
};

export default SprintStackedChart;
