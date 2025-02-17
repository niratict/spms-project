import React, { useState, useMemo } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Search,
  Filter,
} from "lucide-react";

const TestResultsList = ({ tests }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const passCount = tests.filter((test) => test.pass).length;
  const failCount = tests.length - passCount;
  const allPassed = failCount === 0;

  const filteredTests = useMemo(() => {
    return tests.filter((test) => {
      const matchesSearch =
        test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        test.fullTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter =
        filterStatus === "all" ||
        (filterStatus === "passed" && test.pass) ||
        (filterStatus === "failed" && !test.pass);

      return matchesSearch && matchesFilter;
    });
  }, [tests, searchTerm, filterStatus]);

  return (
    <div className="space-y-4 transition-all duration-300 ease-in-out">
      <div
        className={`
        rounded-xl shadow-md hover:shadow-lg transition-all duration-300
        ${
          allPassed
            ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
            : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
        }
        p-4
      `}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
              <CheckCircle className="text-green-500 h-5 w-5" />
              <span className="text-green-700 font-medium">
                {passCount} passed
              </span>
            </div>
            {failCount > 0 && (
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg shadow-sm">
                <XCircle className="text-red-500 h-5 w-5" />
                <span className="text-red-700 font-medium">
                  {failCount} failed
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
                Hide Details
                <ChevronUp className="h-4 w-4" />
              </>
            ) : (
              <>
                Show Details
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="mt-6 mb-4 flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white rounded-lg border border-gray-200 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200"
                />
              </div>
              <div className="flex items-center gap-3 min-w-[200px]">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="flex-1 px-4 py-2 bg-white rounded-lg border border-gray-200
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200"
                >
                  <option value="all">All Results</option>
                  <option value="passed">Passed Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>

            <div className="space-y-3 transition-all duration-300 ease-in-out">
              {filteredTests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No test cases match your search criteria
                </div>
              ) : (
                filteredTests.map((test, i) => (
                  <div
                    key={i}
                    className={`
                      p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-200
                      transform hover:-translate-y-0.5 
                      ${
                        test.pass
                          ? "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
                          : "bg-gradient-to-r from-red-50 to-rose-50 border border-red-200"
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      {test.pass ? (
                        <CheckCircle className="text-green-500 h-5 w-5 mt-1" />
                      ) : (
                        <XCircle className="text-red-500 h-5 w-5 mt-1" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {test.title}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {test.fullTitle}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                          <div className="px-3 py-1 rounded-full bg-white shadow-sm">
                            Duration: {(test.duration / 1000).toFixed(3)}s
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TestResultsList;
