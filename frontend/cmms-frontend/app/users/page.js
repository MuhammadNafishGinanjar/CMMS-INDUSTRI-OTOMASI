"use client";
import { useState, useEffect } from "react";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { 
  TrashIcon, 
  PencilIcon, 
  PlusIcon, 
  ShieldCheckIcon,
  UserIcon,
  KeyIcon,
  Bars3Icon
} from "@heroicons/react/24/solid";
import Sidebar from "@/components/Sidebar";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function UsersManagement() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "create" | "edit"
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("http://localhost:5000/api/users");
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        alert("Akses ditolak! Hanya Admin yang boleh mengelola user.");
        router.push("/machines");
      } else {
        alert("Gagal memuat data user");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      username: form.username.value.trim(),
      password: form.password.value,
      role: form.role.value
    };

    try {
      if (modal === "create") {
        await axiosInstance.post("http://localhost:5000/api/register", data);
      } else {
        await axiosInstance.put(`http://localhost:5000/api/users/${selectedUser._id}`, {
          role: data.role,
          password: data.password || undefined // hanya kirim kalau diisi
        });
      }
      setModal(null);
      setSelectedUser(null);
      form.reset();
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan user");
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm("Hapus user ini? Tidak bisa dikembalikan!")) return;
    try {
      await axiosInstance.delete(`http://localhost:5000/api/users/${userId}`);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menghapus user");
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed top-4 left-4 z-50 bg-teal-600 text-white p-3 rounded-xl shadow-lg">
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="p-8">
          {/* HEADER */}
          <div className="bg-white rounded-3xl shadow-2xl p-10 mb-10">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-6">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5 rounded-2xl">
                  <ShieldCheckIcon className="w-16 h-16 text-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-black text-gray-800">Manajemen User</h1>
                  <p className="text-xl text-gray-600 mt-2">Hanya Admin yang bisa mengakses halaman ini</p>
                </div>
              </div>
              <button
                onClick={() => { setModal("create"); setSelectedUser(null); }}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-105 transition flex items-center gap-3"
              >
                <PlusIcon className="w-8 h-8" /> Buat User Baru
              </button>
            </div>
          </div>

          {/* TABEL USER */}
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <tr>
                    <th className="px-8 py-6 text-left font-black">Username</th>
                    <th className="px-8 py-6 text-left font-black">Role</th>
                    <th className="px-8 py-6 text-left font-black">Dibuat</th>
                    <th className="px-8 py-6 text-center font-black">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} className="border-b hover:bg-gray-50 transition">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-10 h-10 text-gray-400" />
                          <div>
                            <p className="font-bold text-lg">{u.username}</p>
                            <p className="text-sm text-gray-500">{u._id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-4 py-2 rounded-full text-white font-bold text-sm ${
                          u.role === "admin" ? "bg-red-600" :
                          u.role === "supervisor" ? "bg-purple-600" :
                          u.role === "technician" ? "bg-blue-600" : "bg-green-600"
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-gray-600">
                        {(u.createdAt || u.created_at) ? (
                          <div>
                            <div className="font-semibold">
                              {new Date(u.createdAt || u.created_at).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric"
                              })}
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(u.createdAt || u.created_at).toLocaleTimeString("id-ID", {
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Tidak tersedia</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center gap-4">
                          <button
                            onClick={() => { setSelectedUser(u); setModal("edit"); }}
                            className="bg-blue-600 text-white p-4 rounded-xl hover:bg-blue-700 transition"
                          >
                            <PencilIcon className="w-6 h-6" />
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={() => handleDelete(u._id)}
                              className="bg-red-600 text-white p-4 rounded-xl hover:bg-red-700 transition"
                            >
                              <TrashIcon className="w-6 h-6" />
                            </button>
                          )}
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

      {/* MODAL CREATE / EDIT */}
      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-4xl w-full max-w-2xl p-10">
            <h2 className="text-4xl font-black text-center mb-10 text-purple-600">
              {modal === "create" ? "BUAT USER BARU" : "EDIT USER"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-3">Username</label>
                <input
                  name="username"
                  defaultValue={modal === "edit" ? selectedUser?.username : ""}
                  required={modal === "create"}
                  disabled={modal === "edit"}
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg disabled:bg-gray-100"
                  placeholder="ex: technician01"
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-3">
                  {modal === "create" ? "Password" : "Password Baru (kosongkan jika tidak ingin ganti)"}
                </label>
                <input
                  name="password"
                  type="password"
                  required={modal === "create"}
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg"
                  placeholder={modal === "create" ? "Minimal 6 karakter" : "Kosongkan jika tidak diganti"}
                />
              </div>

              <div>
                <label className="block text-lg font-bold text-gray-700 mb-3">Role</label>
                <select
                  name="role"
                  defaultValue={selectedUser?.role || "operator"}
                  className="w-full px-6 py-5 border-2 border-gray-300 rounded-2xl text-lg"
                >
                  <option value="operator">Operator</option>
                  <option value="technician">Technician</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex gap-6 justify-center mt-10">
                <button
                  type="submit"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-16 py-6 rounded-2xl font-black text-2xl shadow-2xl hover:scale-110 transition"
                >
                  {modal === "create" ? "BUAT USER" : "SIMPAN PERUBAHAN"}
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
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