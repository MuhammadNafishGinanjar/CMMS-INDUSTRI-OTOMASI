// app/page.js — VERSI FINAL & DEWA!
"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { Bars3Icon } from "@heroicons/react/24/outline";
import Sidebar from "@/components/Sidebar";
import StatsCard from "@/components/StatsCard";
import MachineList from "@/components/MachineList";
import WorkOrderTable from "@/components/WorkOrderTable";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ 
    total_wo: 0, 
    overdue_tasks: 0 
  });
  const [workorders, setWorkorders] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [statsRes, woRes, machineRes] = await Promise.all([
        axiosInstance.get("/maintenance-stats"),        // HAPUS FULL URL!
        axiosInstance.get("/workorders"),               // HAPUS FULL URL!
        axiosInstance.get("/machines")                  // HAPUS FULL URL!
      ]);

      // GABUNGKAN DATA DENGAN BENAR — HANYA SEKALI SET!
      setStats({
        total_wo: woRes.data.length,                           // dari workorders
        overdue_tasks: statsRes.data.overdue_maintenance || 0   // dari stats
      });

      setWorkorders(woRes.data.slice(0, 10));
      setMachines(machineRes.data);

    } catch (err) {
      console.error("Error fetching data:", err);
      // Kalau error, tetap kasih nilai default biar tidak blank
      setStats(prev => ({ ...prev, total_wo: workorders.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner/>; 
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-blue-600 text-white p-3 rounded-xl shadow-lg hover:bg-blue-700 transition"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          {stats.overdue_tasks > 0 && (
            <div className="mb-8 bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="text-4xl">Warning</div>
                <h3 className="text-xl font-bold text-red-800">
                  Ada {stats.overdue_tasks} Jadwal Maintenance TELAT!
                </h3>
              </div>
            </div>
          )}

          {/* SEKARANG TOTAL WO PASTI MUNCUL 100%! */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <StatsCard title="Total WO" value={stats.total_wo} gradient="from-blue-500 to-blue-700" iconText="All" />
            <StatsCard title="Open" value={workorders.filter(w => w.status === "open").length} gradient="from-indigo-500 to-indigo-700" iconText="New" />
            <StatsCard title="In Progress" value={workorders.filter(w => w.status === "in_progress").length} gradient="from-orange-500 to-orange-600" iconText="Start" />
            <StatsCard title="Completed" value={workorders.filter(w => w.status === "completed").length} gradient="from-green-500 to-green-700" iconText="Done" />
            <StatsCard title="Closed" value={workorders.filter(w => w.status === "closed").length} gradient="from-gray-600 to-gray-800" iconText="Closed" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <WorkOrderTable workorders={workorders} onRefresh={fetchData} />
            </div>
            <div>
              <MachineList machines={machines} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}