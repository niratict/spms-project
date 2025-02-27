import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

// กำหนด API Base URL จาก Environment Variables
const API_BASE_URL = import.meta.env.VITE_API_URL;

/**
 * Login Component
 * ทำหน้าที่แสดงหน้าจอลงชื่อเข้าใช้งานและจัดการ authentication
 */
export default function Login() {
  // === State Management ===
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // === Hooks ===
  const navigate = useNavigate();
  const { login } = useAuth();

  /**
   * จัดการการ submit form เพื่อลงชื่อเข้าใช้งาน
   * @param {Event} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // ล้างข้อความ error ก่อนทำการ login
    setIsLoading(true); // แสดงสถานะ loading

    try {
      // ส่งคำขอ login ไปยัง API
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      // รับข้อมูล token และ user จาก response
      const { token, user } = response.data;

      // บันทึกข้อมูลการเข้าสู่ระบบและนำทางไปยังหน้า dashboard
      login(token, user);

      // เพิ่มเอฟเฟกต์การเปลี่ยนหน้า
      setTimeout(() => {
        navigate("/dashboard");
      }, 500);
    } catch (err) {
      // จัดการกับ error กรณีเข้าสู่ระบบไม่สำเร็จ
      let errorMessage = "เข้าสู่ระบบไม่สำเร็จ โปรดตรวจสอบอีเมลและรหัสผ่าน";

      if (err.response?.data?.message) {
        // แปลงข้อความ error จากภาษาอังกฤษเป็นภาษาไทย
        const message = err.response.data.message.toLowerCase();
        if (message.includes("email invalid")) {
          errorMessage = "อีเมลไม่ถูกต้อง";
        } else if (message.includes("password invalid")) {
          errorMessage = "รหัสผ่านไม่ถูกต้อง";
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // === UI Rendering ===
  return (
    // Container หลัก พร้อมพื้นหลังแบบ gradient
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8"
      data-cy="login-container"
    >
      {/* === Login Card === */}
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg transform transition-all duration-300 hover:shadow-xl">
        {/* === Header Section === */}
        <div className="text-center">
          {/* Logo */}
          <div
            className="mx-auto h-16 w-16 rounded-full bg-indigo-600 flex items-center justify-center"
            data-cy="login-logo"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2
            className="mt-6 text-center text-3xl font-extrabold text-gray-900 transition-all duration-300"
            data-cy="login-title"
          >
            Project Management System
          </h2>
          <p
            className="mt-2 text-center text-sm text-gray-600"
            data-cy="login-subtitle"
          >
            ลงชื่อเข้าใช้บัญชีของคุณเพื่อเริ่มใช้งานระบบ
          </p>
        </div>

        {/* === Login Form === */}
        <form
          className="mt-8 space-y-6"
          onSubmit={handleSubmit}
          data-cy="login-form"
        >
          {/* === Error Message === */}
          {error && (
            <div
              className="rounded-md bg-red-50 p-4 border-l-4 border-red-500 animate-pulse"
              data-cy="login-error"
            >
              <div className="flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-red-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="text-sm text-red-700">{error}</div>
              </div>
            </div>
          )}

          {/* === Input Fields === */}
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
                data-cy="login-email-label"
              >
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-cy="login-email"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
                data-cy="login-password-label"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 sm:text-sm"
                  placeholder="รหัสผ่านของคุณ"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  data-cy="login-password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  data-cy="login-toggle-password"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400 hover:text-indigo-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* === Submit Button === */}
          <div>
            <button
              type="submit"
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading
                  ? "bg-indigo-400 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              } transition-all duration-200`}
              disabled={isLoading}
              data-cy="login-submit"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                <>
                  <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                    <svg
                      className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200 transition-colors duration-200"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  เข้าสู่ระบบ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
