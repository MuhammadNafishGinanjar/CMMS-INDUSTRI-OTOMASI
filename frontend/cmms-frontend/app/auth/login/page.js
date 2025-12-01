"use client";
import { useState } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("http://localhost:5000/api/login", {
        username,
        password,
      });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      alert(`Selamat datang, ${res.data.user.username}! (${res.data.user.role})`);
      router.push("/");
    } catch (err) {
      setError(err.response?.data?.error || "Login gagal!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card Login */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header Biru */}
          <div className="bg-gradient-to-r from-cyan-600 to-blue-700 px-10 py-12 text-center">
            <div className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-xl">
              <span className="text-4xl font-black text-blue-700">CMMS</span>
            </div>
            <h1 className="text-4xl font-bold text-white mt-6">LOGIN SISTEM</h1>
            <p className="text-cyan-100 text-lg mt-2">
              Computerized Maintenance Management System
            </p>
          </div>

          {/* Form */}
          <div className="px-10 pb-10 pt-8">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 px-6 py-4 rounded-xl mb-6 text-center font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-600 transition"
                  placeholder="Masukkan username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 border border-gray-300 rounded-xl text-lg focus:outline-none focus:ring-4 focus:ring-cyan-100 focus:border-cyan-600 transition"
                  placeholder="Masukkan password"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-700 hover:to-blue-800 text-white py-5 rounded-xl font-bold text-xl shadow-xl transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Sedang Login..." : "MASUK SEKARANG"}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-10 text-xs text-gray-500">
              © 2025 CMMS Industri Otomasi
              <br />
              Dibuat dengan Next.js + Flask + MongoDB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}