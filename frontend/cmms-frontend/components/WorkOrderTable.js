// components/WorkOrderTable.jsx
"use client";

import axios from "axios";
import Link from "next/link";
import { format, parseISO, isValid } from "date-fns";

export default function WorkOrderTable({ workorders, onRefresh }) {
  const formatDate = (dateInput) => {
    if (!dateInput) return "-";
    const date = typeof dateInput === "string" ? parseISO(dateInput) : dateInput;
    return isValid(date) ? format(date, "dd MMM yyyy HH:mm") : "-";
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "emergency": return "bg-red-600 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-black";
      default: return "bg-green-500 text-white";
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case "open": return "bg-blue-100 text-blue-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "completed": return "bg-green-100 text-green-800";
      case "closed": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleArchiveOrDelete = async (wo) => {
    const isOpen = wo.status === "open";
    const verb = isOpen ? "dihapus" : "diarsipkan";
    if (!window.confirm(`Yakin ingin ${isOpen ? "HAPUS" : "ARSIPKAN"} ${wo.woNumber}?`)) return;

    try {
      if (isOpen) {
        await axios.delete(`http://localhost:5000/api/workorders/${wo._id}`);
      } else {
        await axios.post(`http://localhost:5000/api/workorders/${wo._id}/archive`);
      }
      alert(`Work Order ${wo.woNumber} berhasil ${verb}!`);
      onRefresh();
    } catch (err) {
      alert("Gagal: " + (err.response?.data?.error || err.message));
    }
  };

  const getTimestamp = (wo, status) => {
    if (!wo.history) return "-";
    const entry = wo.history.find(h => h.status === status);
    return entry && entry.timestamp ? formatDate(entry.timestamp) : "-";
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5">
        <h2 className="text-2xl font-bold">Work Order Terbaru</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-4 font-semibold">WO Number</th>
              <th className="text-left p-4 font-semibold">Mesin</th>
              <th className="text-left p-4 font-semibold">Tipe</th>
              <th className="text-left p-4 font-semibold">Prioritas</th>
              <th className="text-left p-4 font-semibold">Status</th>
              <th className="text-left p-4 font-semibold">Dibuat</th>
              <th className="text-left p-4 font-semibold text-orange-600">Mulai</th>
              <th className="text-left p-4 font-semibold text-green-600">Selesai</th>
              <th className="text-left p-4 font-semibold text-gray-600">Ditutup</th>
              <th className="text-right p-4 font-semibold">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {workorders.map((wo) => (
              <tr key={wo._id} className="border-b hover:bg-gray-50 transition group">
                <td className="p-4">
                  <a href={`/wo/${wo._id}`} className="font-mono font-bold text-blue-700 hover:underline">
                    {wo.woNumber}
                  </a>
                </td>
                <td className="p-4 text-sm">{wo.machineName}</td>
                <td className="p-4">
                  <span className="px-3 py-1 bg-gray-200 rounded-full text-xs font-medium">{wo.type}</span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPriorityColor(wo.priority)}`}>
                    {wo.priority.toUpperCase()}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(wo.status)}`}>
                    {wo.status.replace("_", " ").toUpperCase()}
                  </span>
                </td>
                <td className="p-4 text-xs text-gray-600">{formatDate(wo.createdAt)}</td>
                <td className="p-4 text-xs text-orange-600">{getTimestamp(wo, "in_progress")}</td>
                <td className="p-4 text-xs text-green-600">{getTimestamp(wo, "completed")}</td>
                <td className="p-4 text-xs text-gray-600">{getTimestamp(wo, "closed")}</td>
                <td className="p-4 text-right">
                  {wo.status === "open" || wo.status === "closed" ? (
                    <button
                      onClick={() => handleArchiveOrDelete(wo)}
                      className={`${
                        wo.status === "open" ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
                      } text-white px-5 py-2 rounded-lg text-sm font-bold shadow-md hover:shadow-lg
                        transition-all duration-200 transform hover:scale-105`}
                    >
                      {wo.status === "open" ? "Delete" : "Archive"}
                    </button>
                  ) : (
                    <span className="text-gray-400 text-xs italic">Locked</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}