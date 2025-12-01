// components/MachineList.jsx
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { ChevronDownIcon, ChevronUpIcon, WrenchIcon } from "@heroicons/react/24/solid";

export default function MachineList({ machines: initialMachines }) {
  const [machines, setMachines] = useState(initialMachines || []);
  const [componentCounts, setComponentCounts] = useState({}); // { machineId: count }
  const [expandedMachine, setExpandedMachine] = useState(null); // machineId yang dibuka
  const [expandedComponents, setExpandedComponents] = useState({}); // { machineId: [components] }

  // Ambil jumlah komponen real-time untuk semua mesin
  useEffect(() => {
    const fetchComponentCounts = async () => {
      const counts = {};
      for (const m of machines) {
        try {
          const res = await axiosInstance.get(`http://localhost:5000/api/machines/${m._id}/components`);
          counts[m._id] = res.data.length;
        } catch (err) {
          counts[m._id] = 0;
        }
      }
      setComponentCounts(counts);
    };

    if (machines.length > 0) {
      fetchComponentCounts();
    }
  }, [machines]);

  // Toggle dropdown detail komponen
  const toggleExpand = async (machineId) => {
    if (expandedMachine === machineId) {
      setExpandedMachine(null);
    } else {
      setExpandedMachine(machineId);
      // Kalau belum ada data komponen, ambil dulu
      if (!expandedComponents[machineId]) {
        try {
          const res = await axiosInstance.get(`http://localhost:5000/api/machines/${machineId}/components`);
          setExpandedComponents(prev => ({
            ...prev,
            [machineId]: res.data
          }));
        } catch (err) {
          console.error(err);
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Mesin Utama</h2>
      <div className="space-y-4">
        {machines.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Belum ada data mesin</p>
        ) : (
          machines.map((m) => (
            <div key={m._id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border-l-4 border-blue-600 hover:shadow-md transition">
              {/* CARD UTAMA — TAMPILAN TETAP SAMA */}
              <div 
                className="p-5 cursor-pointer flex justify-between items-start"
                onClick={() => toggleExpand(m._id)}
              >
                <div>
                  <h3 className="font-bold text-lg">{m.machineName}</h3>
                  <p className="text-sm text-gray-600">{m.machineCode}</p>
                  <p className="text-xs text-gray-500 mt-1">Tipe: {m.machineType || "-"}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    <span className="text-xs text-gray-600">
                      {componentCounts[m._id] !== undefined ? componentCounts[m._id] : "..."} komponen
                    </span>
                  </div>
                </div>
                <div className="text-blue-600">
                  {expandedMachine === m._id ? (
                    <ChevronUpIcon className="w-6 h-6" />
                  ) : (
                    <ChevronDownIcon className="w-6 h-6" />
                  )}
                </div>
              </div>

              {/* DROPDOWN DETAIL KOMPONEN — HIDDEN KALAU GAK DIKLIK */}
              {expandedMachine === m._id && (
                <div className="border-t border-gray-200 bg-white rounded-b-lg px-5 pb-5 pt-4 -mt-2">
                  <div className="flex items-center gap-2 mb-3 text-blue-600 font-semibold">
                    <WrenchIcon className="w-5 h-5" />
                    <span>Daftar Komponen</span>
                  </div>
                  {expandedComponents[m._id]?.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {expandedComponents[m._id].map((c) => (
                        <div key={c._id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-gray-800">{c.componentName}</p>
                              <p className="text-xs text-gray-500">{c.componentCode}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full text-white font-bold ${
                              c.status === "good" ? "bg-emerald-500" :
                              c.status === "warning" ? "bg-amber-500" : "bg-red-600"
                            }`}>
                              {c.status === "good" ? "Baik" : c.status === "warning" ? "Perhatian" : "Kritis"}
                            </span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Jam:</span> {c.lifetimeHours.toLocaleString()}
                            </div>
                            <div>
                              <span className="font-medium">Siklus:</span> {c.lifetimeCycles.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Belum ada komponen</p>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}