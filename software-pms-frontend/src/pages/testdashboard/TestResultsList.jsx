import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Folder,
  FolderOpen,
} from "lucide-react";

// Component to display individual test case
const TestCase = ({ test }) => {
  const duration =
    typeof test.duration === "number"
      ? (test.duration / 1000).toFixed(3)
      : "N/A";

  // Helper function to format error message
  const formatError = (err) => {
    if (!err) return null;
    if (typeof err === "string") return err;
    if (err.message) return err.message;
    if (Object.keys(err).length === 0) return "No error details available";
    return JSON.stringify(err, null, 2);
  };

  const isPassed = test.pass || test.state === "passed";

  return (
    <div
      className={`
      p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200
      transform hover:-translate-y-0.5 
      ${
        isPassed
          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
          : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
      }
    `}
    >
      <div className="flex items-start gap-3">
        {isPassed ? (
          <CheckCircle className="text-green-500 h-5 w-5 mt-1" />
        ) : (
          <XCircle className="text-red-500 h-5 w-5 mt-1" />
        )}
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 mb-1">{test.title}</h4>
          <p className="text-sm text-gray-600">
            {test.fullTitle || test.title}
          </p>
          {/* Only show error message for failed tests */}
          {!isPassed && test.err && (
            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-700 font-medium">Error Message:</p>
              <pre className="mt-1 text-xs text-red-600 whitespace-pre-wrap">
                {formatError(test.err)}
              </pre>
            </div>
          )}
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <div className="px-3 py-1 rounded-full bg-white shadow-sm">
              ใช้ระยะเวลา: {duration}s
            </div>
            {test.timedOut && (
              <div className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800">
                หมดเวลา
              </div>
            )}
            {test.skipped && (
              <div className="px-3 py-1 rounded-full bg-gray-100 text-gray-800">
                ข้ามกรณีทดสอบ
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to display a test suite
const TestSuite = ({ suite, searchTerm, filterStatus, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);

  const filteredTests = useMemo(() => {
    return (suite.tests || []).filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (test.fullTitle || "").toLowerCase().includes(searchTerm.toLowerCase());

      const isPassed = test.pass || test.state === "passed";
      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "passed" && isPassed) ||
        (filterStatus === "failed" && !isPassed);

      return matchesSearch && matchesFilter;
    });
  }, [suite.tests, searchTerm, filterStatus]);

  const hasMatchingContent =
    filteredTests.length > 0 ||
    (suite.suites || []).some((s) => s.tests?.length > 0);

  if (!hasMatchingContent) return null;

  return (
    <div className="space-y-2">
      {suite.title && (
        <div
          className="flex items-center gap-2 py-2 px-4 bg-gray-50 rounded-lg"
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            {isExpanded ? (
              <FolderOpen className="h-5 w-5" />
            ) : (
              <Folder className="h-5 w-5" />
            )}
            <span className="font-medium">{suite.title}</span>
          </button>
        </div>
      )}

      {isExpanded && (
        <div className="space-y-3 ml-4">
          {filteredTests.map((test, index) => (
            <TestCase key={index} test={test} />
          ))}

          {(suite.suites || []).map((nestedSuite, index) => (
            <TestSuite
              key={index}
              suite={nestedSuite}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Main TestResultsList component
const TestResultsList = ({ tests }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false); // Changed to false by default

  // Calculate overall statistics
  const stats = useMemo(() => {
    const calculateStats = (suite) => {
      let total = 0;
      let passed = 0;

      // Count tests in current suite
      (suite.tests || []).forEach((test) => {
        total++;
        if (test.pass || test.state === "passed") passed++;
      });

      // Recursively count tests in nested suites
      (suite.suites || []).forEach((nestedSuite) => {
        const nestedStats = calculateStats(nestedSuite);
        total += nestedStats.total;
        passed += nestedStats.passed;
      });

      return { total, passed };
    };

    const suiteStats = calculateStats({ tests, suites: [] });
    return {
      total: suiteStats.total,
      passed: suiteStats.passed,
      failed: suiteStats.total - suiteStats.passed,
    };
  }, [tests]);

  const allPassed = stats.failed === 0;

  return (
    <div className="space-y-4">
      <div
        className={`
        rounded-xl shadow-md p-4
        ${
          allPassed
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
        }
      `}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
              <CheckCircle className="text-green-500 h-5 w-5" />
              <span className="text-green-700 font-medium">
               ผ่านการทดสอบ {stats.passed} กรณีทดสอบ
              </span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                <XCircle className="text-red-500 h-5 w-5" />
                <span className="text-red-700 font-medium">
                ผิดพลาด {stats.failed} กรณีทดสอบ
                </span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              flex items-center justify-center gap-2 px-6 py-2 rounded-lg
              font-medium transition-all duration-200 
              ${
                allPassed
                  ? "bg-green-100 text-green-700 hover:bg-green-200"
                  : "bg-red-100 text-red-700 hover:bg-red-200"
              }
              shadow-sm hover:shadow transform hover:-translate-y-0.5
            `}
          >
            {isExpanded ? (
              <>
                ปิด
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                ดูเพิ่มเติม
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหากรณีทดสอบ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3 min-w-[200px]">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white rounded-lg border border-gray-200
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="passed">เฉพาะที่ผ่าน</option>
                  <option value="failed">เฉพาะที่ผิดพลาด</option>
                </select>
              </div>
            </div>

            <TestSuite
              suite={{ tests, suites: [] }}
              searchTerm={searchTerm}
              filterStatus={filterStatus}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default TestResultsList;
