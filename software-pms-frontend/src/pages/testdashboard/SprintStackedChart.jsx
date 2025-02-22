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

  const formatThaiDate = (isoDateString) => {
    try {
      if (!isoDateString) return "-";
      const [datePart] = isoDateString.split("T");
      if (!datePart) return "-";
      const [year, month, day] = datePart.split("-");
      if (!year || !month || !day) return "-";
      // Convert to Buddhist year by adding 543 to the Christian year
      const buddhistYear = parseInt(year) + 543;
      return `${day}-${month}-${buddhistYear}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "-";
    }
  };

  const chartData = sprintResults.map((sprint) => {
    const totalTests = sprint.suites?.[0]?.tests?.length || 0;
    const passedTests =
      sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0;
    const failedTests = totalTests - passedTests;

    const startDate = sprint.startDate ? formatThaiDate(sprint.startDate) : "-";
    const endDate = sprint.endDate ? formatThaiDate(sprint.endDate) : "-";

    return {
      sprint: `${sprint.sprint_name || "Unknown Sprint"}`,
      startDate,
      endDate,
      Passed: passedTests,
      Failed: failedTests,
      "Timed Out": 0,
      Errored: 0,
      Canceled: 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const sprintData = chartData.find((item) => item.sprint === label);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <div className="text-sm text-gray-600 mb-2">
            <p>Start Date: {sprintData.startDate}</p>
            <p>End Date: {sprintData.endDate}</p>
          </div>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600">
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
    const { x, y, payload } = props;
    const sprint = chartData.find((item) => item.sprint === payload.value);

    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={16}
          textAnchor="middle"
          fill="#374151"
          className="text-sm font-medium"
        >
          {payload.value}
        </text>
        <text
          x={0}
          y={16}
          dy={16}
          textAnchor="middle"
          fill="#6B7280"
          className="text-xs"
        >
        </text>
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
            Sprint Test Results Over Time
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Pass Rate: {summaryMetrics.passRate}% - Failure Rate:{" "}
            {summaryMetrics.failureRate}%
          </p>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 65 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200"
              />
              <XAxis dataKey="sprint" tick={<CustomXAxisTick />} height={65} />
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
          title="Total Tests"
          value={summaryMetrics.totalTests}
          change={summaryMetrics.testsChange}
        />
        <MetricCard
          title="Average per Sprint"
          value={summaryMetrics.averagePerSprint}
          change={summaryMetrics.averageChange}
        />
        <MetricCard title="Passed Tests" value={summaryMetrics.totalPassed} />
        <MetricCard title="Failed Tests" value={summaryMetrics.totalFailed} />
      </div>
    </div>
  );
};

export default SprintStackedChart;
