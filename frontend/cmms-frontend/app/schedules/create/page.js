"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Bars3Icon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

export default function CreateSchedule() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    machineId: "",
    task: "",
    frequency_days: "90",
    last_done: today   // FIXED: nama field benar
  });

  useEffect(() => {
    axiosInstance.get("http://localhost:5000/api/machines")
      .then(res => {
        setMachines(res.data);
        setLoading(false);
      })
      .catch(() => {
        alert("Gagal memuat data mesin");
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.machineId || !form.task) {
      alert("Mesin dan tugas wajib diisi!");
      return;
    }

    try {
      const selectedMachine = machines.find(m => m._id === form.machineId);

      await axiosInstance.post("http://localhost:5000/api/schedules", {
        machineId: form.machineId,
        machineName: selectedMachine.machineName,
        task: form.task,
        frequency_days: parseInt(form.frequency_days),
        last_done: form.last_done   // FIXED: pakai last_done
      });

      alert("Jadwal Preventive Maintenance berhasil dibuat!");
      router.push("/schedules");
    } catch (err) {
      alert("Gagal: " + (err.response?.data?.error || err.message));
    }
  };

      if (loading) {
    return <LoadingSpinner/>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-teal-600 text-white p-3 rounded-xl shadow-lg hover:bg-teal-700"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-5">
              <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white p-4 rounded-2xl shadow-xl border border-teal-700">
                <CalendarDaysIcon className="w-10 h-10" />
              </div>
              Buat Jadwal Preventive Maintenance
            </h1>
            <p className="text-gray-600 mt-2">Tambah jadwal perawatan berkala untuk mencegah kerusakan mesin</p>
          </div>

          {/* Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-8">

              {/* Mesin */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Pilih Mesin <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={form.machineId}
                  onChange={(e) => setForm({ ...form, machineId: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500 focus:border-teal-500 transition"
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.machineCode} - {m.machineName} ({m.machineType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tugas */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Tugas / Pekerjaan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  placeholder="Contoh: Ganti oli spindle, bersihkan filter, cek belt tension"
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                />
              </div>

              {/* Frekuensi */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Frekuensi Perawatan
                </label>
                <select
                  value={form.frequency_days}
                  onChange={(e) => setForm({ ...form, frequency_days: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                >
                  <option value="7">Setiap 7 hari (Mingguan)</option>
                  <option value="30">Setiap 30 hari (Bulanan)</option>
                  <option value="90">Setiap 90 hari (Kuartalan)</option>
                  <option value="180">Setiap 180 hari (Semesteran)</option>
                  <option value="365">Setiap 365 hari (Tahunan)</option>
                </select>
              </div>

              {/* Tanggal Terakhir */}
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Tanggal Terakhir Maintenance Dilakukan
                </label>
                <input
                  type="date"
                  value={form.last_done}  // FIXED: pakai last_done
                  onChange={(e) => setForm({ ...form, last_done: e.target.value })}
                  max={today}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Default: Hari ini ({format(new Date(), "dd MMMM yyyy")})
                </p>
              </div>

              {/* Tombol */}
              <div className="flex gap-6 pt-8 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-xl transform hover:scale-105 transition"
                >
                  Simpan Jadwal
                </button>
                <button
                  type="button"
                  onClick={() => router.push("/schedules")}
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