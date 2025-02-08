import React from "react";
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

const SprintTestResultsChart = ({ sprintResults }) => {
  // Transform sprint results into chart-friendly format
  const chartData = sprintResults.map((sprint) => ({
    name: sprint.sprint_name,
    passed: sprint.passed_tests || 0,
    failed: sprint.failed_tests || 0,
    totalTests: (sprint.passed_tests || 0) + (sprint.failed_tests || 0),
    passRate:
      sprint.passed_tests && sprint.total_tests
        ? ((sprint.passed_tests / sprint.total_tests) * 100).toFixed(1)
        : 0,
  }));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Sprint Test Results Overview
      </h2>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey="name" tick={{ fill: "rgb(55, 65, 81)" }} />
          <YAxis
            tick={{ fill: "rgb(55, 65, 81)" }}
            label={{
              value: "Number of Tests",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderRadius: "12px",
              padding: "10px",
            }}
            formatter={(value, name, props) => {
              if (name === "passed") return [`${value} Passed`, "Passed Tests"];
              if (name === "failed") return [`${value} Failed`, "Failed Tests"];
              if (name === "passRate") return [`${value}%`, "Pass Rate"];
              return [value, name];
            }}
          />
          <Legend />
          <Bar
            dataKey="passed"
            stackId="tests"
            fill="#4ADE80"
            name="Passed Tests"
          />
          <Bar
            dataKey="failed"
            stackId="tests"
            fill="#F87171"
            name="Failed Tests"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default SprintTestResultsChart;
