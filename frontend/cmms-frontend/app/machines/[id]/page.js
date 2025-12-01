"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeftIcon, 
  PlusIcon, 
  WrenchIcon, 
  TrashIcon, 
  PencilIcon,
  Cog6ToothIcon,
  Bars3Icon 
} from "@heroicons/react/24/solid";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function MachineDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [machine, setMachine] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "create" | "edit"
  const [selectedComp, setSelectedComp] = useState(null);

  useEffect(() => {
    if (id) {
      fetchMachine();
      fetchComponents();
    }
  }, [id]);

  const fetchMachine = async () => {
    try {
      const res = await axiosInstance.get(`http://localhost:5000/api/machines/${id}`);
      setMachine(res.data);
    } catch (err) {
      alert("Mesin tidak ditemukan");
      router.push("/machines");
    }
  };

  const fetchComponents = async () => {
    try {
      const res = await axiosInstance.get(`http://localhost:5000/api/machines/${id}/components`);
      setComponents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;

    const data = {
      componentCode: form.componentCode.value.trim().toUpperCase(),
      componentName: form.componentName.value.trim(),
      installDate: form.installDate.value || new Date().toISOString().split("T")[0],
      status: form.status.value,
      lifetimeHours: parseInt(form.lifetimeHours.value) || 0,
      lifetimeCycles: parseInt(form.lifetimeCycles.value) || 0,
      notes: form.notes.value.trim()
    };

    try {
      if (modal === "create") {
        await axiosInstance.post(`http://localhost:5000/api/machines/${id}/components`, data);
      } else {
        await axiosInstance.put(`http://localhost:5000/api/components/${selectedComp._id}`, data);
      }
      setModal(null);
      setSelectedComp(null);
      fetchComponents();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan komponen");
    }
  };

  const handleDelete = async (compId) => {
    if (!confirm("Hapus komponen ini?")) return;
    await axiosInstance.delete(`http://localhost:5000/api/components/${compId}`);
    fetchComponents();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <div className="flex-1">
        <div className="p-8">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-xl shadow-lg"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
        
          <button
            onClick={() => router.push("/machines")}
            className="mb-8 flex items-center gap-3 text-teal-600 hover:text-teal-800 font-bold text-xl"
          >
            <ArrowLeftIcon className="w-8 h-8" /> Kembali ke Daftar Mesin
          </button>

          {/* HEADER MESIN */}
          <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-3xl p-10 shadow-2xl mb-10">
            <h1 className="text-5xl font-black">{machine?.machineName}</h1>
            <p className="text-2xl mt-2 opacity-90">{machine?.machineCode} • {machine?.machineType}</p>
            <p className="mt-4 text-lg">Lokasi: {machine?.location}</p>
          </div>

          {/* TOMBOL TAMBAH KOMPONEN */}
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-4xl font-black text-gray-800 flex items-center gap-4">
              <WrenchIcon className="w-12 h-12 text-teal-600" />
              Daftar Komponen
            </h2>
            <button
              onClick={() => { setModal("create"); setSelectedComp(null); }}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-8 py-4 rounded-2xl font-bold text-xl shadow-xl hover:scale-105 transition flex items-center gap-3"
            >
              <PlusIcon className="w-8 h-8" /> Tambah Komponen
            </button>
          </div>

          {/* GRID KOMPONEN */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {components.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white rounded-3xl">
                <WrenchIcon className="w-32 h-32 text-gray-300 mx-auto mb-6" />
                <p className="text-3xl text-gray-500">Belum ada komponen</p>
              </div>
            ) : (
              components.map((c) => (
                <div key={c._id} className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-200 hover:border-teal-500 transition">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">{c.componentName}</h3>
                      <p className="text-teal-600 font-mono text-lg font-bold">{c.componentCode}</p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                      c.status === "good" ? "bg-emerald-500" :
                      c.status === "warning" ? "bg-amber-500" : "bg-red-600"
                    }`}>
                      {c.status === "good" ? "BAIK" : c.status === "warning" ? "PERHATIAN" : "KRITIS"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-6">
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-gray-500">Umur (Jam)</p>
                      <p className="text-2xl font-bold text-teal-600">{c.lifetimeHours.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-center">
                      <p className="text-sm text-gray-500">Umur (Siklus)</p>
                      <p className="text-2xl font-bold text-teal-600">{c.lifetimeCycles.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="mt-6 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <Cog6ToothIcon className="w-5 h-5" />
                      Terpasang: {new Date(c.installDate).toLocaleDateString("id-ID", { 
                        day: "2-digit", month: "long", year: "numeric" 
                      })}
                    </p>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button
                      onClick={() => { setSelectedComp(c); setModal("edit"); }}
                      className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <PencilIcon className="w-6 h-6" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="flex-1 bg-red-600 text-white py-4 rounded-xl font-bold hover:bg-red-700 flex items-center justify-center gap-2"
                    >
                      <TrashIcon className="w-6 h-6" /> Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL TAMBAH/EDIT KOMPONEN — TAMPILAN TETAP SAMA, ISI SESUAI FORMAT BARU */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-4xl w-full max-w-4xl max-h-screen overflow-y-auto p-10">
            <h2 className="text-4xl font-black text-center mb-10 text-teal-600">
              {modal === "create" ? "TAMBAH KOMPONEN" : "EDIT KOMPONEN"}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Kode Komponen</label>
                <input 
                  name="componentCode" 
                  defaultValue={selectedComp?.componentCode}
                  required 
                  placeholder="ex: ROBOT-CMP-010"
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Komponen</label>
                <input 
                  name="componentName" 
                  defaultValue={selectedComp?.componentName}
                  required 
                  placeholder="ex: Teach Pendant"
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tanggal Pemasangan</label>
                <input 
                  type="date" 
                  name="installDate" 
                  defaultValue={selectedComp?.installDate ? new Date(selectedComp.installDate).toISOString().split("T")[0] : ""}
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Status</label>
                <select 
                  name="status" 
                  defaultValue={selectedComp?.status || "good"}
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                >
                  <option value="good">Good (Baik)</option>
                  <option value="warning">Warning (Perlu Perhatian)</option>
                  <option value="critical">Critical (Harus Diganti)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Umur Pakai (Jam)</label>
                <input 
                  type="number" 
                  name="lifetimeHours" 
                  defaultValue={selectedComp?.lifetimeHours || ""}
                  placeholder="ex: 50000"
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Umur Pakai (Siklus)</label>
                <input 
                  type="number" 
                  name="lifetimeCycles" 
                  defaultValue={selectedComp?.lifetimeCycles || ""}
                  placeholder="ex: 1000000"
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Catatan (Opsional)</label>
                <textarea 
                  name="notes" 
                  defaultValue={selectedComp?.notes || ""}
                  rows="4" 
                  placeholder="Catatan tambahan..."
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg focus:border-teal-600 outline-none"
                />
              </div>

              <div className="md:col-span-2 flex gap-6 justify-center mt-8">
                <button 
                  type="submit" 
                  className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-110 transition"
                >
                  {modal === "create" ? "TAMBAH" : "SIMPAN"}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setModal(null); setSelectedComp(null); }}
                  className="bg-gray-600 text-white px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-110 transition"
                >
                  BATAL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}