// app/schedules/edit/[id]/page.js
"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter, useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Bars3Icon, CalendarDaysIcon } from "@heroicons/react/24/solid";
import { format } from "date-fns";

export default function EditSchedule() {
  const router = useRouter();
  const params = useParams(); // ambil ID dari URL
  const scheduleId = params.id;

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const [form, setForm] = useState({
    machineId: "",
    task: "",
    frequency_days: "90",
    last_done: today
  });

  // AMBIL DATA JADWAL LAMA
  useEffect(() => {
    if (!scheduleId) return;

    const fetchData = async () => {
      try {
        // Ambil jadwal yang akan diedit
        const schedRes = await axiosInstance.get(`http://localhost:5000/api/schedules/${scheduleId}`);
        const sched = schedRes.data;

        // Ambil daftar mesin
        const machinesRes = await axiosInstance.get("http://localhost:5000/api/machines");

        setMachines(machinesRes.data);
        setSchedule(sched);

        // Isi form dengan data lama
        setForm({
          machineId: sched.machineId,
          task: sched.task,
          frequency_days: sched.frequency_days.toString(),
          last_done: format(new Date(sched.last_done), "yyyy-MM-dd")
        });

        setLoading(false);
      } catch (err) {
        alert("Gagal memuat data jadwal");
        router.push("/schedules");
      }
    };

    fetchData();
  }, [scheduleId, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedMachine = machines.find(m => m._id === form.machineId);

      await axiosInstance.put(`http://localhost:5000/api/schedules/${scheduleId}`, {
        machineId: form.machineId,
        machineName: selectedMachine.machineName,
        task: form.task,
        frequency_days: parseInt(form.frequency_days),
        last_done: form.last_done
      });

      alert("Jadwal berhasil diperbarui!");
      router.push("/schedules");
    } catch (err) {
      alert("Gagal menyimpan: " + (err.response?.data?.error || err.message));
    }
  };

      if (loading) {
    return <LoadingSpinner/>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-teal-600 text-white p-3 rounded-xl shadow-lg">
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-5">
              <div className="bg-gradient-to-br from-teal-600 to-cyan-700 text-white p-5 rounded-2xl shadow-xl border border-teal-700">
                <CalendarDaysIcon className="w-11 h-11" />
              </div>
              Edit Jadwal Preventive Maintenance
            </h1>
            <p className="text-gray-600 mt-2">Perbarui jadwal perawatan berkala untuk {schedule?.machineName}</p>
          </div>

          {/* FORM SAMA PERSIS SEPERTI CREATE */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Pilih Mesin
                </label>
                <select
                  required
                  value={form.machineId}
                  onChange={(e) => setForm({ ...form, machineId: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
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
                  Tugas / Pekerjaan
                </label>
                <input
                  type="text"
                  required
                  value={form.task}
                  onChange={(e) => setForm({ ...form, task: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Frekuensi Perawatan
                </label>
                <select
                  value={form.frequency_days}
                  onChange={(e) => setForm({ ...form, frequency_days: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                >
                  <option value="7">Setiap 7 hari</option>
                  <option value="30">Setiap 30 hari</option>
                  <option value="90">Setiap 90 hari</option>
                  <option value="180">Setiap 180 hari</option>
                  <option value="365">Setiap 365 hari</option>
                </select>
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-800 mb-3">
                  Tanggal Terakhir Maintenance Dilakukan
                </label>
                <input
                  type="date"
                  value={form.last_done}
                  onChange={(e) => setForm({ ...form, last_done: e.target.value })}
                  max={today}
                  className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl text-lg focus:ring-4 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-6 pt-8 border-t border-gray-200">
                <button
                  type="submit"
                  className="bg-teal-600 hover:bg-teal-700 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-xl transform hover:scale-105 transition"
                >
                  Simpan Perubahan
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