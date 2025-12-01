// app/create-wo/page.js — FIX 100% TIDAK MERAH LAGI!
"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Bars3Icon, DocumentPlusIcon } from "@heroicons/react/24/outline";

export default function CreateWorkOrder() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [machines, setMachines] = useState([]);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentDate = format(new Date(), "dd MMMM yyyy, HH:mm");

  const [form, setForm] = useState({
    machineId: "",
    componentId: "",
    type: "corrective",
    priority: "medium",
    description: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machRes, compRes] = await Promise.all([
          axiosInstance.get("http://localhost:5000/api/machines"),
          axiosInstance.get("http://localhost:5000/api/components")
        ]);
        setMachines(machRes.data);
        setComponents(compRes.data);
        setLoading(false);
      } catch (err) {
        alert("Gagal memuat data mesin/komponen");
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.machineId) {
      alert("Pilih mesin dulu!");
      return;
    }
    try {
      const res = await axiosInstance.post("http://localhost:5000/api/workorders", {
        machineId: form.machineId,
        componentId: form.componentId || null,
        type: form.type,
        priority: form.priority,
        description: form.description
      });
      alert(`Work Order berhasil dibuat!\nNomor: ${res.data.woNumber}`);
      router.push("/");
    } catch (err) {
      alert("Gagal: " + (err.response?.data?.error || err.message));
    }
  };

  const filteredComponents = components.filter(c => c.machineId === form.machineId);

  if (loading) {
    return <LoadingSpinner/>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-4">
              {/* ICON PLUS PREMIUM */}
              <div className="bg-blue-800 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-2xl border border-blue-700">
                <DocumentPlusIcon className="w-10 h-10" />
              </div>
              
              <div>
                <div>Buat Work Order Baru</div>
              </div>
            </h1>
                            <p className="text-lg text-gray-600 font-medium mt-1">
                  Isi form untuk membuat Work Order maintenance
                </p>
          </div>

          <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-md">
            <p className="text-sm font-medium text-blue-700">Tanggal & Waktu Dibuat</p>
            <p className="text-3xl font-bold text-blue-900">{currentDate}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-8">

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Pilih Mesin <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.machineId}
                  onChange={(e) => setForm({ ...form, machineId: e.target.value, componentId: "" })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-blue-500 focus:border-blue-500 transition"
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.machineCode} - {m.machineName} ({m.machineType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Pilih Komponen (Opsional)
                </label>
                <select
                  value={form.componentId}
                  onChange={(e) => setForm({ ...form, componentId: e.target.value })}
                  disabled={!form.machineId}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg disabled:bg-gray-100"
                >
                  <option value="">-- Tanpa Komponen Spesifik --</option>
                  {filteredComponents.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.componentCode} - {c.componentName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-4">Tipe Maintenance</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {["preventive", "corrective", "breakdown"].map((t) => (
                    <label key={t} className="flex items-center space-x-4 cursor-pointer p-5 border-2 rounded-xl hover:border-blue-500 transition">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="w-6 h-6 text-blue-600"
                      />
                      <span className="text-lg font-medium capitalize">{t}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">Prioritas</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-blue-500"
                >
                  <option value="low">Low - Rendah</option>
                  <option value="medium">Medium - Sedang</option>
                  <option value="high">High - Tinggi</option>
                  <option value="emergency">Emergency - Darurat!</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Deskripsi Kerusakan / Tugas <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows="6"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-blue-500 resize-none"
                  placeholder="Jelaskan secara detail masalah atau tugas yang harus dilakukan..."
                />
              </div>

              <div className="flex gap-6 pt-8 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-xl transform hover:scale-105 transition"
                >
                  Buat Work Order
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-10 py-4 rounded-xl font-bold text-xl transition"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}