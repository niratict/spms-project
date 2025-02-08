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
  // Calculate summary metrics
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

    const totalFailed = totalTests - totalPassed;
    const averagePerSprint = totalTests / sprintResults.length;
    const failureRate = ((totalFailed / totalTests) * 100).toFixed(1);

    return {
      totalTests,
      averagePerSprint: averagePerSprint.toFixed(2),
      totalPassed,
      totalFailed,
      failureRate,
    };
  }, [sprintResults]);

  // Process the sprint results data for the stacked bar chart
  const chartData = sprintResults.map((sprint) => {
    const totalTests = sprint.suites?.[0]?.tests?.length || 0;
    const passedTests =
      sprint.suites?.[0]?.tests?.filter((test) => test.pass)?.length || 0;
    const failedTests = totalTests - passedTests;

    return {
      sprint: sprint.sprint_name,
      Passed: passedTests,
      Failed: failedTests,
      "Timed Out": 0,
      Errored: 0,
      Canceled: 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
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

  const MetricCard = ({ title, value, change }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-500">{title}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="text-2xl font-semibold text-gray-900">{value}</p>
        {change && (
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
            Failure Rate: {summaryMetrics.failureRate}%
          </p>
        </div>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                className="stroke-gray-200"
              />
              <XAxis
                dataKey="sprint"
                tick={{ fill: "rgb(55, 65, 81)" }}
                className="text-sm"
              />
              <YAxis tick={{ fill: "rgb(55, 65, 81)" }} className="text-sm" />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="Passed" stackId="a" fill="#4ADE80" />
              <Bar dataKey="Failed" stackId="a" fill="#F87171" />
              <Bar dataKey="Timed Out" stackId="a" fill="#94A3B8" />
              <Bar dataKey="Errored" stackId="a" fill="#FB923C" />
              <Bar dataKey="Canceled" stackId="a" fill="#FCD34D" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Tests"
          value={summaryMetrics.totalTests}
          change={18}
        />
        <MetricCard
          title="Average per Sprint"
          value={summaryMetrics.averagePerSprint}
          change={26}
        />
        <MetricCard title="Passed Tests" value={summaryMetrics.totalPassed} />
        <MetricCard title="Failed Tests" value={summaryMetrics.totalFailed} />
      </div>
    </div>
  );
};

export default SprintStackedChart;
