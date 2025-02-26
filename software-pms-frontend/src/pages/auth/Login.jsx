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
      navigate("/dashboard");
    } catch (err) {
      // จัดการกับ error กรณีเข้าสู่ระบบไม่สำเร็จ
      setError(err.response?.data?.message || "Login failed");
    }
  };

  // === UI Rendering ===
  return (
    // Container หลัก
    <div
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      data-cy="login-container"
    >
      {/* === Login Card === */}
      <div className="max-w-md w-full space-y-8">
        {/* === Header Section === */}
        <div>
          <h2
            className="mt-6 text-center text-3xl font-extrabold text-gray-900"
            data-cy="login-title"
          >
            Project Management System
          </h2>
          <p
            className="mt-2 text-center text-sm text-gray-600"
            data-cy="login-subtitle"
          >
            ลงชื่อเข้าใช้บัญชีของคุณ
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
            <div className="rounded-md bg-red-50 p-4" data-cy="login-error">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          {/* === Input Fields === */}
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Email Input */}
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-cy="login-email"
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-cy="login-password"
              />
            </div>
          </div>

          {/* === Submit Button === */}
          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              data-cy="login-submit"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
