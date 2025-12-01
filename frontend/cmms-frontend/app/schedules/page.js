"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { Bars3Icon, CalendarIcon, ExclamationTriangleIcon, WrenchIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/solid";

export default function MaintenanceSchedule() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const res = await axiosInstance.get("http://localhost:5000/api/schedules");
      const sorted = res.data.sort((a, b) => b._id.localeCompare(a._id)); // terbaru di atas
      setSchedules(sorted);
      setLoading(false);
    } catch (err) {
      alert("Gagal memuat jadwal");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
    try {
      await axiosInstance.delete(`http://localhost:5000/api/schedules/${id}`);
      setSchedules(schedules.filter(s => s._id !== id));
      setDeleteConfirm(null);
    } catch (err) {
      alert("Gagal menghapus jadwal");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {
      machineId: editModal.machineId,
      machineName: editModal.machineName,
      task: formData.get("task"),
      frequency_days: formData.get("frequency_days"),
      last_done: formData.get("last_done")
    };

    try {
      await axiosInstance.put(`http://localhost:5000/api/schedules/${editModal._id}`, data);
      alert("Jadwal berhasil diperbarui!");
      setEditModal(null);
      fetchSchedules();
    } catch (err) {
      alert("Gagal update jadwal");
    }
  };

  const getStatusBadge = (status, days) => {
    if (status === "overdue") return <span className="bg-red-600 text-white px-4 py-2 rounded-full font-bold flex items-center gap-2"><ExclamationTriangleIcon className="w-5 h-5"/> OVERDUE {Math.abs(days)} hari</span>;
    if (status === "due_soon") return <span className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold">DUE SOON • {days} hari lagi</span>;
    return <span className="bg-green-600 text-white px-4 py-2 rounded-full font-bold">On Track</span>;
  };

     if (loading) {
    return <LoadingSpinner/>
  }

  const overdueCount = schedules.filter(s => s.status === "overdue").length;
  const dueSoonCount = schedules.filter(s => s.status === "due_soon").length;

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
              <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-5 rounded-2xl shadow-xl">
                <CalendarIcon className="w-11 h-11" />
              </div>
              Jadwal Preventive Maintenance
            </h1>
            <p className="text-gray-600 mt-2">Pantau & kelola jadwal perawatan berkala mesin</p>
          </div>

          {/* Alert Summary */}
          {(overdueCount > 0 || dueSoonCount > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {overdueCount > 0 && (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-red-800">{overdueCount} Jadwal TELAT!</h3>
                      <p className="text-red-700">Segera lakukan maintenance!</p>
                    </div>
                  </div>
                </div>
              )}
              {dueSoonCount > 0 && (
                <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
                  <div className="flex items-center gap-4">
                    <WrenchIcon className="w-12 h-12 text-orange-600" />
                    <div>
                      <h3 className="text-2xl font-bold text-orange-800">{dueSoonCount} Jadwal SEGERA JATUH TEMPO</h3>
                      <p className="text-orange-700">Dalam 7 hari ke depan</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tabel */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-teal-600 to-cyan-700 text-white p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Daftar Jadwal Maintenance Berkala</h2>
              <Link href="/schedules/create">
                <button className="bg-white text-teal-700 px-5 py-2 rounded-lg font-bold hover:bg-gray-100 transition">
                  + Jadwal Baru
                </button>
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-5 font-bold">Mesin</th>
                    <th className="text-left p-5 font-bold">Tugas</th>
                    <th className="text-left p-5 font-bold">Frekuensi</th>
                    <th className="text-left p-5 font-bold">Terakhir</th>
                    <th className="text-left p-5 font-bold">Jatuh Tempo</th>
                    <th className="text-left p-5 font-bold">Status</th>
                    <th className="text-left p-5 font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {schedules.map((s) => (
                    <tr key={s._id} className="border-b hover:bg-gray-50">
                      <td className="p-5 font-medium">{s.machineName}</td>
                      <td className="p-5">{s.task}</td>
                      <td className="p-5 text-center">{s.frequency_days} hari</td>
                      <td className="p-5 text-sm text-gray-600">{s.last_done}</td>
                      <td className="p-5 font-bold">{s.next_due}</td>
                      <td className="p-5">{getStatusBadge(s.status, s.days_left)}</td>
                      <td className="p-5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => router.push(`/schedules/edit/${s._id}`)}
                            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(s._id)}
                            className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition"
                            title="Hapus"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL EDIT */}
      {editModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-6">Edit Jadwal Maintenance</h2>
            <form onSubmit={handleUpdate}>
              <input type="hidden" name="machineId" value={editModal.machineId} />
              <div className="mb-4">
                <label className="block font-bold mb-2">Tugas</label>
                <input name="task" defaultValue={editModal.task} required className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div className="mb-4">
                <label className="block font-bold mb-2">Frekuensi (hari)</label>
                <select name="frequency_days" defaultValue={editModal.frequency_days} className="w-full px-4 py-3 border rounded-lg">
                  <option value="7">7 hari</option>
                  <option value="30">30 hari</option>
                  <option value="90">90 hari</option>
                  <option value="180">180 hari</option>
                  <option value="365">365 hari</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block font-bold mb-2">Terakhir Dilakukan</label>
                <input type="date" name="last_done" defaultValue={editModal.last_done.split(" ")[0]} required className="w-full px-4 py-3 border rounded-lg" />
              </div>
              <div className="flex gap-4">
                <button type="submit" className="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-teal-700">
                  Simpan Perubahan
                </button>
                <button type="button" onClick={() => setEditModal(null)} className="bg-gray-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-600">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}