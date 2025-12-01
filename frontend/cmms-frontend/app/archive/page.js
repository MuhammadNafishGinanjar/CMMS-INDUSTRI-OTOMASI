// app/archive/page.js — HALAMAN ARSIP DENGAN SIDEBAR PREMIUM (LEVEL INDUSTRI!)
"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { format, parseISO, isValid } from "date-fns";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Bars3Icon, ArchiveBoxIcon } from "@heroicons/react/24/outline";

export default function ArchivePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [archivedWO, setArchivedWO] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    try {
      const res = await axiosInstance.get("http://localhost:5000/api/workorders/archive");
      setArchivedWO(res.data);
      setLoading(false);
    } catch (err) {
      alert("Gagal memuat arsip: " + (err.response?.data?.error || err.message));
      setLoading(false);
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "-";
    const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    return isValid(date) ? format(date, "dd MMM yyyy HH:mm") : "-";
  };

  const getTimestamp = (wo, status) => {
    if (!wo.history) return "-";
    const entry = wo.history.find(h => h.status === status);
    return entry && entry.timestamp ? formatDate(entry.timestamp) : "-";
  };

  const handleRestore = async (wo) => {
    if (!confirm(`Kembalikan ${wo.woNumber} ke daftar aktif?`)) return;

    try {
      await axiosInstance.post(`http://localhost:5000/api/workorders/archive/${wo._id}/restore`);
      alert(`${wo.woNumber} berhasil dikembalikan ke aktif!`);
      fetchArchived(); // refresh tabel
    } catch (err) {
      alert("Gagal restore: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) {
    return <LoadingSpinner/>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR SAMA PERSIS DENGAN DASHBOARD */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* MAIN CONTENT */}
      <div className="flex-1">
        {/* Tombol Hamburger untuk Mobile */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-gray-800 text-white p-3 rounded-xl shadow-lg hover:bg-gray-900 transition"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          {/* Header Arsip */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-4">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-2xl border border-gray-700">
                <ArchiveBoxIcon className="w-10 h-10" />
              </div>
              Arsip Work Order
            </h1>
            <p className="text-gray-600 mt-2">Work Order yang telah selesai & ditutup • Total: {archivedWO.length} WO</p>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl shadow-xl p-8 mb-8">
            <h2 className="text-4xl font-bold">Total Arsip: {archivedWO.length} Work Order</h2>
            <p className="mt-2 opacity-90">Semua WO yang telah berhasil diselesaikan. Bisa dikembalikan kapan saja.</p>
          </div>

          {/* Tabel Arsip */}
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white p-6">
              <h2 className="text-2xl font-bold">Daftar Work Order yang Telah Ditutup</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="text-left p-4 font-bold text-gray-700">WO Number</th>
                    <th className="text-left p-4 font-bold text-gray-700">Mesin</th>
                    <th className="text-left p-4 font-bold text-gray-700">Tipe</th>
                    <th className="text-left p-4 font-bold text-gray-700">Dibuat</th>
                    <th className="text-left p-4 font-bold text-gray-700">Mulai</th>
                    <th className="text-left p-4 font-bold text-gray-700">Selesai</th>
                    <th className="text-left p-4 font-bold text-gray-700">Ditutup</th>
                    <th className="text-left p-4 font-bold text-gray-700">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {archivedWO.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-16 text-gray-500 text-lg">
                        Belum ada Work Order yang diarsipkan.
                      </td>
                    </tr>
                  ) : (
                    archivedWO.map((wo) => (
                      <tr key={wo._id} className="border-b hover:bg-gray-50 transition group">
                        <td className="p-4">
                          <span className="font-mono font-bold text-gray-800">
                            {wo.woNumber}
                          </span>
                        </td>
                        <td className="p-4 text-sm">{wo.machineName || "Unknown"}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-gray-200 rounded-full text-xs font-medium">
                            {wo.type || "-"}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-600">{formatDate(wo.createdAt)}</td>
                        <td className="p-4 text-xs text-orange-600 font-medium">{getTimestamp(wo, "in_progress")}</td>
                        <td className="p-4 text-xs text-green-600 font-medium">{getTimestamp(wo, "completed")}</td>
                        <td className="p-4 text-xs text-gray-700 font-medium">{getTimestamp(wo, "closed")}</td>
                        <td className="p-4">
                          <button
                            onClick={() => handleRestore(wo)}
                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-md transition transform hover:scale-105 group-hover:opacity-100"
                          >
                            Restore
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}