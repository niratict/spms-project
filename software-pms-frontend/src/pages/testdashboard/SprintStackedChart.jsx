import React, { useMemo } from "react";
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
import { TrendingUp, TrendingDown } from "lucide-react";

const SprintStackedChart = ({ sprintResults }) => {
  // Calculate summary metrics and changes
  const summaryMetrics = useMemo(() => {
    const totalTests = sprintResults.reduce(
      (acc, sprint) => acc + (sprint.suites?.[0]?.tests?.length || 0),
      0
    );

    const totalPassed = sprintResults.reduce(
      (acc, sprint) =>
        acc +
        (sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0),
      0
    );

    // Calculate changes compared to previous sprint
    const currentSprint = sprintResults[sprintResults.length - 1];
    const previousSprint = sprintResults[sprintResults.length - 2];

    const currentTestCount = currentSprint?.suites?.[0]?.tests?.length || 0;
    const previousTestCount = previousSprint?.suites?.[0]?.tests?.length || 0;

    // Calculate total tests change
    const testsChange = previousTestCount
      ? (
          ((currentTestCount - previousTestCount) / previousTestCount) *
          100
        ).toFixed(1)
      : 0;

    // Calculate average per sprint change
    const currentAverage = currentTestCount;
    const previousAverage = previousTestCount;
    const averageChange = previousAverage
      ? (((currentAverage - previousAverage) / previousAverage) * 100).toFixed(
          1
        )
      : 0;

    const totalFailed = totalTests - totalPassed;
    const averagePerSprint = totalTests / sprintResults.length;
    const failureRate = ((totalFailed / totalTests) * 100).toFixed(1);
    const passRate = ((totalPassed / totalTests) * 100).toFixed(1);

    return {
      totalTests,
      averagePerSprint: averagePerSprint.toFixed(2),
      totalPassed,
      totalFailed,
      failureRate,
      passRate,
      testsChange: Number(testsChange),
      averageChange: Number(averageChange),
    };
  }, [sprintResults]);

  const getThaiMonth = (date) => {
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
  };

  const formatThaiDate = (isoDateString) => {
    try {
      if (!isoDateString) return "-";

      // Create a new Date object and adjust for timezone
      const date = new Date(isoDateString);

      // Get the date in Thai format
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear() + 543; // Convert to Buddhist year

      return `${day}-${month}-${year}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const chartData = useMemo(() => {
    return sprintResults.map((sprint, index, array) => {
      const totalTests = sprint.suites?.[0]?.tests?.length || 0;
      const passedTests =
        sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0;
      const failedTests = totalTests - passedTests;

      const startDate = sprint.startDate
        ? formatThaiDate(sprint.startDate)
        : "-";
      const endDate = sprint.endDate ? formatThaiDate(sprint.endDate) : "-";

      // Get month and year for current sprint
      const currentMonth = sprint.startDate
        ? getThaiMonth(sprint.startDate)
        : "";
      const currentYear = sprint.startDate
        ? new Date(sprint.startDate).getFullYear() + 543
        : "";

      // Check if this is the first sprint of the month
      const previousSprint = array[index - 1];
      const isFirstInMonth =
        !previousSprint ||
        new Date(sprint.startDate).getMonth() !==
          new Date(previousSprint.startDate).getMonth();

      // Check if next sprint exists and is in the same month
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sprintData = chartData.find((item) => item.sprint === label);
      const totalTests = payload.reduce((sum, entry) => sum + entry.value, 0);

      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          {/* Sprint title - largest and most prominent */}
          <p className="text-lg font-semibold text-gray-800 mb-3">{label}</p>

          {/* Dates - slightly smaller but still clearly readable */}
          <div className="text-sm text-gray-600 mb-3">
            <p className="mb-1">วันที่เริ่มต้น: {sprintData.startDate}</p>
            <p>วันที่สิ้นสุด: {sprintData.endDate}</p>
          </div>

          {/* Total Tests - emphasized but not overpowering */}
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Total Tests: {totalTests}
            </span>
          </div>

          {/* Individual test counts - same size as total for consistency */}
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm font-medium text-gray-700">
                {entry.name}: {entry.value} tests
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props) => {
    const { x, y, payload, index, width } = props;
    const currentSprintData = chartData[index];
    const previousSprintData = index > 0 ? chartData[index - 1] : null;

    // Check if current sprint is in the same month as the previous sprint
    const inSameMonth =
      previousSprintData &&
      currentSprintData.currentMonth === previousSprintData.currentMonth;

    // If we're showing the month label, shift it to center between sprints
    const offsetX = inSameMonth ? -50 : 0;

    return (
      <g transform={`translate(${x},${y})`}>
        {/* Sprint name */}
        <text
          x={0}
          y={20}
          textAnchor="middle"
          fill="#4B5563"
          className="text-sm"
        >
          {payload.value}
        </text>

        {/* Month display */}
        {currentSprintData.isLastInMonth && inSameMonth && (
          <text
            x={offsetX}
            y={60}
            textAnchor="middle"
            fill="#4B5563"
            className="text-xs font-medium"
          >
            {currentSprintData.monthDisplay}
          </text>
        )}
      </g>
    );
  };

  const MetricCard = ({ title, value, change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change !== undefined && (
          <span
            className={`flex items-center text-sm ${
              change > 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {change > 0 ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800">
            ผลการทดสอบของสปรินต์ทั้งหมด
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            อัตราการผ่าน {summaryMetrics.passRate}% - อัตราการผิดพลาด{" "}
            {summaryMetrics.failureRate}%
          </p>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200"
              />
              <XAxis dataKey="sprint" tick={<CustomXAxisTick />} height={100} />
              <YAxis tick={{ fill: "rgb(55, 65, 81)" }} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Passed" stackId="a" fill="#4ADE80" />
              <Bar dataKey="Failed" stackId="a" fill="#F87171" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
        <MetricCard title="จำนวนที่ผิดพลาด" value={summaryMetrics.totalFailed} />
      </div>
    </div>
  );
};

export default SprintStackedChart;
