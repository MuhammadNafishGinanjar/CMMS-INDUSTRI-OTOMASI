"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { PencilIcon, TrashIcon, PlusIcon, WrenchIcon, Bars3Icon, Cog6ToothIcon } from "@heroicons/react/24/solid";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useRouter } from "next/navigation"; // TAMBAHAN INI

export default function MachinesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  
  const router = useRouter(); // INI YANG BARU

  useEffect(() => {
    fetchMachines();
  }, []);

  const fetchMachines = async () => {
    try {
      const res = await axiosInstance.get("http://localhost:5000/api/machines");
      setMachines(res.data);
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data mesin");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      machineCode: form.machineCode.value.trim(),
      machineName: form.machineName.value.trim(),
      machineType: form.machineType.value.trim(),
      location: form.location.value.trim(),
      installDate: form.installDate.value,
    };

    try {
      if (modal === "create") {
        await axiosInstance.post("http://localhost:5000/api/machines", data);
      } else {
        await axiosInstance.put(
          `http://localhost:5000/api/machines/${selectedMachine._id}`,
          data
        );
      }
      setModal(null);
      setSelectedMachine(null);
      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan mesin");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus mesin ini dan semua komponennya?")) return;
    try {
      await axiosInstance.delete(`http://localhost:5000/api/machines/${id}`);
      fetchMachines();
    } catch (err) {
      alert("Gagal menghapus mesin");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 bg-indigo-600 text-white p-3 rounded-xl shadow-lg"
        >
          <Bars3Icon className="h-6 w-6" />
        </button>

        <div className="p-6 lg:p-8">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-4">
                <WrenchIcon className="w-12 h-12 text-teal-600" />
                Daftar Mesin Produksi
              </h1>
              <button
                onClick={() => {
                  setModal("create");
                  setSelectedMachine(null);
                }}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-teal-700 flex items-center gap-2"
              >
                <PlusIcon className="w-6 h-6" /> Tambah Mesin
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {machines.map((m) => (
                <div
                  key={m._id}
                  className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200 shadow-lg"
                >
                  <h3 className="text-2xl font-bold text-gray-800">
                    {m.machineName}
                  </h3>
                  <p className="text-gray-600">
                    Kode: <span className="font-bold">{m.machineCode}</span>
                  </p>
                  <p className="text-gray-600">Tipe: {m.machineType}</p>
                  <p className="text-gray-600">Lokasi: {m.location}</p>
                  <p className="text-gray-600">
                    Tanggal Pasang:{" "}
                    {m.installDate ? (
                      <span>
                        {new Date(m.installDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    ) : (
                      "-"
                    )}
                  </p>
                  <p className="text-sm text-gray-500 mt-3">
                    Status:{" "}
                    <span
                      className={`font-bold ${
                        m.status === "active" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {m.status?.toUpperCase()}
                    </span>
                  </p>

                  {/* TOMBOL-TOMBOL — TAMPILAN TETAP SAMA, CUMA DITAMBAH SATU */}
                  <div className="flex gap-3 mt-5">
                    {/* TOMBOL BARU: LIHAT KOMPONEN */}
                    <button
                      onClick={() => router.push(`/machines/${m._id}`)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-2 rounded-lg font-bold text-sm hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-1 shadow-md"
                      title="Lihat Komponen"
                    >
                      <Cog6ToothIcon className="w-5 h-5" />
                      Komponen
                    </button>

                    {/* TOMBOL EDIT (LAMA) */}
                    <button
                      onClick={() => {
                        setSelectedMachine(m);
                        setModal("edit");
                      }}
                      className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>

                    {/* TOMBOL HAPUS (LAMA) */}
                    <button
                      onClick={() => handleDelete(m._id)}
                      className="bg-red-600 text-white p-3 rounded-lg hover:bg-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MODAL CREATE/EDIT — TETAP SAMA */}
        {(modal === "create" || modal === "edit") && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-6">
                {modal === "create" ? "Tambah Mesin Baru" : "Edit Mesin"}
              </h2>
              <form onSubmit={handleSubmit}>
                <input
                  name="machineCode"
                  defaultValue={selectedMachine?.machineCode}
                  required
                  placeholder="Kode (ex: CNC-01)"
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />
                <input
                  name="machineName"
                  defaultValue={selectedMachine?.machineName}
                  required
                  placeholder="Nama Mesin"
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />
                <input
                  name="machineType"
                  defaultValue={selectedMachine?.machineType}
                  required
                  placeholder="Tipe (CNC, Injection, dll)"
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />
                <input
                  name="location"
                  defaultValue={selectedMachine?.location}
                  required
                  placeholder="Lokasi"
                  className="w-full mb-4 px-4 py-3 border rounded-lg"
                />
                <input
                  type="date"
                  name="installDate"
                  defaultValue={
                    selectedMachine?.installDate
                      ? new Date(selectedMachine.installDate).toISOString().split("T")[0]
                      : ""
                  }
                  required
                  className="w-full mb-6 px-4 py-3 border rounded-lg"
                />
                <div className="flex gap-4">
                  <button
                    type="submit"
                    className="bg-teal-600 text-white px-6 py-3 rounded-lg font-bold"
                  >
                    Simpan
                  </button>
                  <button
                    type="button"
                    onClick={() => setModal(null)}
                    className="bg-gray-500 text-white px-6 py-3 rounded-lg"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}