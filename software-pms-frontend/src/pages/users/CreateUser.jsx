import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import { ArrowLeft, User, Mail, Lock, ShieldCheck } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const CreateUser = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Viewer",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/users`, formData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      navigate("/users");
    } catch (err) {
      setError(err.response?.data?.message || "ไม่สามารถสร้างผู้ใช้ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-16">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center">
            <User className="mr-3 w-6 h-6" />
            สร้างผู้ใช้ใหม่
          </h2>
          <button
            onClick={() => navigate("/users")}
            className="text-white hover:bg-blue-700 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-lg flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Name Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                ชื่อ-นามสกุล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ระบุชื่อ-นามสกุล"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                อีเมล
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="ระบุอีเมล"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                รหัสผ่าน
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="สร้างรหัสผ่านที่รัดกุม"
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                บทบาทผู้ใช้
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="w-5 h-5 text-gray-400" />
                </div>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="Viewer">Viewer</option>
                  <option value="Tester">Tester</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                         transition-all transform active:scale-95 
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center"
            >
              {loading ? (
                <span className="animate-pulse">กำลังสร้าง...</span>
              ) : (
                "สร้างผู้ใช้"
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg 
                         hover:bg-gray-200 focus:outline-none focus:ring-2 
                         focus:ring-gray-300 focus:ring-opacity-50
                         transition-all transform active:scale-95"
            >
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUser;
