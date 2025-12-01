// src/app/wo/[id]/page.js — FINAL & ZERO ERROR
"use client";

import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useParams, useRouter } from "next/navigation";
import { format, isValid, parseISO } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function WorkOrderDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [wo, setWo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) fetchWO();
  }, [id]);

  const fetchWO = async () => {
    try {
      const res = await axiosInstance.get(`http://localhost:5000/api/workorders/${id}`);
      setWo(res.data);
      setLoading(false);
    } catch (err) {
      alert("Work Order tidak ditemukan!");
      router.push("/");
    }
  };

  const updateStatus = async (newStatus) => {
    if (updating) return;
    setUpdating(true);

    try {
      await axiosInstance.put(`http://localhost:5000/api/workorders/${id}/status`, {
        status: newStatus,
        by: "Teknisi Lapangan"
      });
      alert(`Status berhasil diubah ke ${newStatus.replace("_", " ").toUpperCase()}!`);
      fetchWO();
    } catch (err) {
      alert("Gagal update status: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case "open": return "bg-blue-100 text-blue-800 border-blue-300";
      case "in_progress": return "bg-orange-100 text-orange-800 border-orange-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      case "closed": return "bg-gray-100 text-gray-800 border-gray-300";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "emergency": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      default: return "bg-green-500 text-white";
    }
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "Tidak ada tanggal";
    let date;
    if (typeof dateInput === "string") {
      date = parseISO(dateInput);
    } else if (dateInput instanceof Date) {
      date = dateInput;
    } else {
      return "Invalid";
    }
    return isValid(date) ? format(date, "dd MMM yyyy HH:mm") : "Invalid date";
  };

    if (loading) {
    return <LoadingSpinner/>
  }
  if (!wo) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-t-2xl shadow-xl p-8 border-b-4 border-blue-600">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-800">{wo.woNumber}</h1>
              <p className="text-gray-600 mt-2">Work Order Detail</p>
            </div>
            <button
              onClick={() => router.back()}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold"
            >
              Kembali
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Informasi Work Order</h2>
              <div className="grid grid-cols-2 gap-6">
                <div><p className="text-sm text-gray-500">Mesin</p><p className="text-lg font-bold text-blue-700">{wo.machineName || "-"}</p></div>
                <div><p className="text-sm text-gray-500">Komponen</p><p className="text-lg font-semibold">{wo.componentName || "Tidak spesifik"}</p></div>
                <div><p className="text-sm text-gray-500">Tipe</p><p className="text-lg font-bold capitalize">{wo.type || "-"}</p></div>
                <div><p className="text-sm text-gray-500">Prioritas</p>
                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${getPriorityBadge(wo.priority)}`}>
                    {wo.priority?.toUpperCase() || "LOW"}
                  </span>
                </div>
              </div>
              <div className="mt-8">
                <p className="text-sm text-gray-500">Deskripsi</p>
                <div className="bg-gray-50 p-5 rounded-lg mt-2 border">
                  <p className="text-gray-800 leading-relaxed">{wo.description || "Tidak ada deskripsi"}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Riwayat Status</h2>
              <div className="space-y-4">
                {wo.history?.length > 0 ? (
                  wo.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700">{i + 1}</div>
                      <div className="flex-1">
                        <p className="font-bold capitalize">{h.status?.replace("_", " ") || "Unknown"}</p>
                        <p className="text-sm text-gray-600">Oleh: <span className="font-medium">{h.by || "System"}</span></p>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(h.timestamp)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center py-8 text-gray-500">Belum ada riwayat</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Update Status</h2>
              <div className="mb-6 text-center">
                <div className={`inline-block px-8 py-4 rounded-full text-2xl font-bold border-4 ${getStatusColor(wo.status)}`}>
                  {wo.status?.replace("_", " ").toUpperCase() || "UNKNOWN"}
                </div>
              </div>

              <div className="space-y-3">
                {wo.status === "open" && (
                  <button onClick={() => updateStatus("in_progress")} disabled={updating}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg disabled:opacity-50">
                    {updating ? "Memproses..." : "Mulai Pengerjaan"}
                  </button>
                )}
                {wo.status === "in_progress" && (
                  <button onClick={() => updateStatus("completed")} disabled={updating}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-lg disabled:opacity-50">
                    {updating ? "Memproses..." : "Selesai Dikerjakan"}
                  </button>
                )}
                {wo.status === "completed" && (
                  <button onClick={() => updateStatus("closed")} disabled={updating}
                    className="w-full bg-gray-600 hover:bg-gray-700 text-white font-bold py-4 rounded-lg disabled:opacity-50">
                    {updating ? "Memproses..." : "Tutup Work Order"}
                  </button>
                )}
                {wo.status === "closed" && (
                  <div className="text-center text-green-600 font-bold text-xl">Work Order Telah Ditutup</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}