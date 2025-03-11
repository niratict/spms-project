import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  File,
  FileText,
  ChevronsUp,
  Clock,
  AlertTriangle,
  SkipForward,
  ChevronRight,
  InfoIcon,
} from "lucide-react";
import ErrorHandler from "./ErrorHandler";

// คอมโพเนนต์แสดงกรณีทดสอบแต่ละรายการ
const TestCase = ({ test }) => {
  const [showDetails, setShowDetails] = useState(false);

  // แปลงหน่วยเวลาจากมิลลิวินาทีเป็นวินาที
  const duration =
    typeof test.duration === "number"
      ? (test.duration / 1000).toFixed(3)
      : "N/A";

  const isPassed = test.pass || test.state === "passed";
  const hasError = !isPassed && test.err;

  return (
    <div
      data-cy="test-case-item"
      data-test-status={isPassed ? "passed" : "failed"}
      className={`
        border rounded-lg shadow-sm hover:shadow transition-all duration-200
        ${isPassed ? "bg-white border-green-200" : "bg-white border-red-200"}
        ${!isPassed ? "border-l-2 border-l-red-500" : ""}
      `}
    >
      <div
        className="p-3 cursor-pointer"
        onClick={() => hasError && setShowDetails(!showDetails)}
      >
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-full flex-shrink-0 ${
              isPassed ? "bg-green-50" : "bg-red-50"
            }`}
          >
            {isPassed ? (
              <CheckCircle
                className="text-green-500 h-4 w-4"
                data-cy="pass-icon"
              />
            ) : (
              <XCircle className="text-red-500 h-4 w-4" data-cy="fail-icon" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4
              className="font-medium text-gray-800 text-sm break-words"
              data-cy="test-title"
            >
              {test.title}
            </h4>
            <p
              className="text-xs text-gray-500 break-words mt-1"
              data-cy="test-full-title"
            >
              {test.fullTitle || test.title}
            </p>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <div
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-600"
                data-cy="test-duration"
              >
                <Clock className="h-3 w-3" />
                <span>{duration}s</span>
              </div>

              {test.timedOut && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-700"
                  data-cy="timeout-badge"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>หมดเวลา</span>
                </div>
              )}

              {test.skipped && (
                <div
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-600"
                  data-cy="skipped-badge"
                >
                  <SkipForward className="h-3 w-3" />
                  <span>ข้ามกรณีทดสอบ</span>
                </div>
              )}

              {hasError && (
                <div className="flex items-center gap-1 ml-auto text-red-500">
                  {showDetails ? (
                    <ChevronsUp className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <span className="text-xs">
                    {showDetails ? "ซ่อนรายละเอียด" : "แสดงรายละเอียด"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasError && showDetails && (
        <div
          className="border-t border-red-100 bg-red-50 p-3 rounded-b-lg"
          data-cy="error-details"
        >
          <div className="mb-2 flex items-center">
            <AlertTriangle className="text-red-600 h-4 w-4 mr-2" />
            <span className="text-sm font-medium text-red-700">
              รายละเอียดข้อผิดพลาด
            </span>
          </div>

          <div className="bg-white rounded-lg p-3 border border-red-100">
            {(() => {
              const { formattedError } = ErrorHandler.handleError(test.err);
              const errorDetails = formattedError
                .split("\n")
                .map((detail) => {
                  const [label, value] = detail.split(": ");
                  // กรองเฉพาะคู่ที่มีทั้ง label และ value ที่ไม่ใช่ค่าว่าง
                  if (label && value) {
                    return { label, value };
                  }
                  return null;
                })
                .filter(Boolean); // กรองค่า null ออก

              return (
                <div className="space-y-2">
                  {errorDetails.map(({ label, value }, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-1 sm:grid-cols-4 gap-1 sm:gap-2 items-start"
                    >
                      <span className="text-xs font-medium text-red-700 sm:col-span-1">
                        {label}:
                      </span>
                      <span className="text-xs text-red-600 sm:col-span-3 break-words font-mono bg-red-50 p-1 rounded">
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

// คอมโพเนนต์แสดงชุดการทดสอบ (suite) พร้อมกับลูกต่างๆ
const TestSuite = ({ suite, searchTerm, filterStatus, level = 0 }) => {
  // เปิดแสดงโดยอัตโนมัติเฉพาะระดับบนสุด
  const [isExpanded, setIsExpanded] = useState(level === 0);

  // กรองกรณีทดสอบตามเงื่อนไขการค้นหาและสถานะ
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

  // ตรวจสอบว่ามีเนื้อหาที่ตรงกับเงื่อนไขหรือไม่
  const hasMatchingContent =
    filteredTests.length > 0 ||
    (suite.suites || []).some((s) => s.tests?.length > 0);

  if (!hasMatchingContent) return null;

  // คำนวณจำนวนกรณีทดสอบที่ผ่านในชุดทดสอบนี้
  const passCount = filteredTests.filter(
    (test) => test.pass || test.state === "passed"
  ).length;
  const totalCount = filteredTests.length;
  const passRate =
    totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-2" data-cy="test-suite">
      {suite.title && (
        <div
          className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
          style={{ marginLeft: `${level * 0.5}rem` }}
          onClick={() => setIsExpanded(!isExpanded)}
          data-cy="suite-header"
        >
          <div className="flex items-center gap-2 min-w-0">
            <ChevronRight
              className={`h-4 w-4 text-gray-500 transition-transform ${
                isExpanded ? "rotate-90" : ""
              }`}
              data-cy="suite-toggle-icon"
            />

            {level === 0 ? (
              <FileText className="h-4 w-4 text-blue-500" />
            ) : (
              <File className="h-4 w-4 text-blue-400" />
            )}

            <span className="font-medium text-sm truncate">{suite.title}</span>
          </div>

          {filteredTests.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-200">
                {passCount}/{totalCount} ({passRate}%)
              </div>

              <div
                className={`w-2 h-2 rounded-full ${
                  passRate === 100
                    ? "bg-green-500"
                    : passRate >= 70
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
            </div>
          )}
        </div>
      )}

      {isExpanded && (
        <div className="space-y-2 ml-3" data-cy="suite-content">
          {/* แสดงกรณีทดสอบในชุดนี้ */}
          {filteredTests.map((test, index) => (
            <TestCase key={index} test={test} />
          ))}

          {/* แสดงชุดทดสอบย่อยแบบ recursive */}
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

// คอมโพเนนต์หลักสำหรับแสดงผลการทดสอบทั้งหมด
const TestResultsList = ({ tests }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isExpanded, setIsExpanded] = useState(false); // ซ่อนรายละเอียดตั้งต้น

  // คำนวณสถิติผลการทดสอบโดยรวม
  const stats = useMemo(() => {
    // ฟังก์ชั่นคำนวณสถิติแบบ recursive
    const calculateStats = (suite) => {
      let total = 0;
      let passed = 0;
      let duration = 0;

      // นับกรณีทดสอบในชุดปัจจุบัน
      (suite.tests || []).forEach((test) => {
        total++;
        if (test.pass || test.state === "passed") passed++;
        if (typeof test.duration === "number") duration += test.duration;
      });

      // นับกรณีทดสอบในชุดย่อยแบบ recursive
      (suite.suites || []).forEach((nestedSuite) => {
        const nestedStats = calculateStats(nestedSuite);
        total += nestedStats.total;
        passed += nestedStats.passed;
        duration += nestedStats.duration;
      });

      return { total, passed, duration };
    };

    const suiteStats = calculateStats({ tests, suites: [] });
    return {
      total: suiteStats.total,
      passed: suiteStats.passed,
      failed: suiteStats.total - suiteStats.passed,
      duration: (suiteStats.duration / 1000).toFixed(2),
    };
  }, [tests]);

  const allPassed = stats.failed === 0 && stats.total > 0;
  const passRate =
    stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0;

  // ตรวจสอบว่ามีผลลัพธ์จากการค้นหาหรือไม่
  const hasSearchResults = useMemo(() => {
    // ฟังก์ชั่นตรวจสอบผลลัพธ์การค้นหาแบบ recursive
    const checkForResults = (suite) => {
      // ตรวจสอบในกรณีทดสอบของชุดปัจจุบัน
      const hasMatchingTests = (suite.tests || []).some((test) => {
        const matchesSearch =
          test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (test.fullTitle || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const isPassed = test.pass || test.state === "passed";
        const matchesFilter =
          filterStatus === "all" ||
          (filterStatus === "passed" && isPassed) ||
          (filterStatus === "failed" && !isPassed);

        return matchesSearch && matchesFilter;
      });

      if (hasMatchingTests) return true;

      // ตรวจสอบในชุดย่อยแบบ recursive
      return (suite.suites || []).some((nestedSuite) =>
        checkForResults(nestedSuite)
      );
    };

    return checkForResults({ tests, suites: [] });
  }, [tests, searchTerm, filterStatus]);

  return (
    <div className="max-w-full" data-cy="test-results-container">
      <div
        className="rounded-xl shadow-md bg-white overflow-hidden"
        data-cy="results-summary-card"
        data-test-status={allPassed ? "passed" : "failed"}
      >
        {/* ส่วนแสดงสรุปผลการทดสอบ */}
        <div
          className={`p-4 ${allPassed ? "bg-green-50" : "bg-red-50"} border-b ${
            allPassed ? "border-green-100" : "border-red-100"
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h2 className="font-semibold text-lg">
                สรุปผลการทดสอบ
                {allPassed && stats.total > 0 && (
                  <span className="ml-2 text-green-600">✓</span>
                )}
              </h2>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {stats.duration} วินาที
                </span>
                <span>•</span>
                <span>{stats.total} กรณีทดสอบ</span>
                <span>•</span>
                <span
                  className={
                    passRate === 100
                      ? "text-green-600"
                      : passRate >= 70
                      ? "text-yellow-600"
                      : "text-red-600"
                  }
                >
                  {passRate}% ผ่าน
                </span>
              </div>
            </div>

            {/* ปุ่มเปิด/ปิดรายละเอียดการทดสอบ */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`
                flex items-center justify-center gap-1 px-4 py-2 rounded-lg
                font-medium text-sm transition-all duration-200 
                ${
                  isExpanded
                    ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }
                shadow-sm hover:shadow
              `}
              data-cy="toggle-details"
            >
              {isExpanded ? (
                <>
                  ซ่อนรายละเอียด
                  <ChevronUp className="h-4 w-4" />
                </>
              ) : (
                <>
                  ดูรายละเอียด
                  <ChevronDown className="h-4 w-4" />
                </>
              )}
            </button>
          </div>

          {/* ส่วนแสดงสถิติแบบกราฟิก - ปรับให้อยู่ในบรรทัดเดียวกัน */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-green-500 h-5 w-5" />
                  <span className="font-medium">ผ่านการทดสอบ</span>
                </div>
                <span className="text-green-600 font-semibold">
                  {stats.passed}
                </span>
              </div>

              {/* Progress bar สำหรับแสดงสัดส่วนที่ผ่าน */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full"
                  style={{ width: `${passRate}%` }}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <XCircle className="text-red-500 h-5 w-5" />
                  <span className="font-medium">ผิดพลาด</span>
                </div>
                <span className="text-red-600 font-semibold">
                  {stats.failed}
                </span>
              </div>

              {/* Progress bar สำหรับแสดงสัดส่วนที่ไม่ผ่าน */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full"
                  style={{
                    width: `${
                      stats.total > 0 ? (stats.failed / stats.total) * 100 : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* แสดงรายละเอียดเมื่อกดเปิด */}
        {isExpanded && (
          <div className="p-4">
            {/* ส่วนค้นหาและกรองผลการทดสอบ */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหากรณีทดสอบ..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  data-cy="search-input"
                />
              </div>
              <div className="sm:w-48 flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white rounded-lg border border-gray-200
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  data-cy="filter-select"
                >
                  <option value="all">ทั้งหมด</option>
                  <option value="passed">เฉพาะที่ผ่าน</option>
                  <option value="failed">เฉพาะที่ผิดพลาด</option>
                </select>
              </div>
            </div>

            {/* แสดงข้อความเมื่อไม่พบผลการค้นหา */}
            {!hasSearchResults && (searchTerm || filterStatus !== "all") && (
              <div
                className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200 text-gray-500"
                data-cy="no-results-message"
              >
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="p-3 bg-gray-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="font-medium">
                    ไม่พบผลการทดสอบที่ตรงกับเงื่อนไข
                  </p>
                  <p className="text-sm">
                    ลองเปลี่ยนคำค้นหาหรือตัวกรองเพื่อดูผลลัพธ์เพิ่มเติม
                  </p>
                  <button
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus("all");
                    }}
                    className="mt-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                    data-cy="clear-filters-button"
                  >
                    ล้างตัวกรอง
                  </button>
                </div>
              </div>
            )}

            {/* แสดงรายการผลการทดสอบทั้งหมด */}
            {hasSearchResults && (
              <div className="mt-4 space-y-4">
                <TestSuite
                  suite={{ tests, suites: [] }}
                  searchTerm={searchTerm}
                  filterStatus={filterStatus}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResultsList;
