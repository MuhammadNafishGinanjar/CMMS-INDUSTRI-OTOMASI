"use client";
import { useState, useEffect, useRef } from "react";
import axiosInstance from "@/lib/axiosInstance";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Bars3Icon, DocumentTextIcon, PrinterIcon } from "@heroicons/react/24/solid";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";

export default function MaintenanceHistory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState([]);
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState("");
  const [loading, setLoading] = useState(true);

  const componentRef = useRef();

// GANTI JADI INI — PAKAI componentRef, BUKAN contentRef!
const handlePrint = useReactToPrint({
  contentRef: componentRef,  // INI YANG BENAR!!!
  documentTitle: `Laporan_Maintenance_${new Date().toLocaleDateString('id-ID')}`,
  onAfterPrint: () => alert("PDF berhasil di-download!"),
});

  useEffect(() => {
    fetchMachines();
    fetchHistory();
  }, [selectedMachine]);

  const fetchMachines = async () => {
    const res = await axiosInstance.get("http://localhost:5000/api/machines");
    setMachines(res.data);
  };

  const fetchHistory = async () => {
    try {
      const params = selectedMachine ? { machineId: selectedMachine } : {};
      const res = await axiosInstance.get("http://localhost:5000/api/maintenance-history", { params });
      setHistory(res.data);
      setLoading(false);
    } catch (err) {
      alert("Gagal memuat riwayat");
      setLoading(false);
    }
  };

  const selectedMachineName = machines.find(m => m._id === selectedMachine)?.machineName || "Semua Mesin";

      if (loading) {
    return <LoadingSpinner/>
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-xl shadow-lg">
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8" ref={componentRef}>
          {/* HEADER LAPORAN */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 border-4 border-indigo-600">
            <div className="text-center mb-8">
              <h1 className="text-5xl font-bold text-indigo-800">LAPORAN RIWAYAT MAINTENANCE</h1>
              <p className="text-2xl text-gray-700 mt-4">CMMS Industri Otomasi 2025</p>
              <p className="text-xl text-gray-600 mt-2">Periode: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>

            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Filter Mesin:</h2>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="mt-2 px-6 py-3 border-2 border-indigo-600 rounded-xl text-lg font-medium"
                >
                  <option value="">Semua Mesin</option>
                  {machines.map(m => (
                    <option key={m._id} value={m._id}>{m.machineCode} - {m.machineName}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handlePrint}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-bold text-xl shadow-lg flex items-center gap-3 transform hover:scale-105 transition"
              >
                <PrinterIcon className="w-8 h-8" />
                Export ke PDF
              </button>
            </div>

            <div className="text-right text-sm text-gray-600">
              Total Riwayat: <span className="font-bold text-2xl text-indigo-600">{history.length}</span> kegiatan
            </div>
          </div>

          {/* TABEL RIWAYAT */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white p-6">
              <h2 className="text-3xl font-bold flex items-center gap-4">
                <DocumentTextIcon className="w-12 h-12" />
                Riwayat Preventive Maintenance - {selectedMachineName}
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-indigo-50">
                  <tr>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">No</th>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">Mesin</th>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">Tugas</th>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">Terakhir Dilakukan</th>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">Jadwal Berikutnya</th>
                    <th className="text-left p-6 font-bold text-indigo-800 text-lg">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={h._id} className="border-b hover:bg-indigo-50 transition">
                      <td className="p-6 font-bold text-gray-800">{i + 1}</td>
                      <td className="p-6 font-semibold">{h.machineName}</td>
                      <td className="p-6">{h.task}</td>
                      <td className="p-6 text-green-600 font-bold">{h.last_done}</td>
                      <td className="p-6 text-blue-600 font-bold">{h.next_due}</td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-full font-bold ${h.status === "Selesai" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-12 text-center text-gray-600">
            <p className="text-lg">Laporan ini digenerate otomatis oleh sistem CMMS 2025</p>
            <p className="text-sm mt-2">© 2025 - Dibuat dengan Next.js + Flask + MongoDB</p>
          </div>
        </div>
      </div>
    </div>
  );
}