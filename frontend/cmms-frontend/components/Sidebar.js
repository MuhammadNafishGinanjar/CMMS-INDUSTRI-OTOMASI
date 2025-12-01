"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import {
  ClipboardDocumentListIcon,   // INI YANG BARU & PALING PAS BUAT WORK ORDERS!
  DocumentPlusIcon,
  ArchiveBoxIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  WrenchIcon,
  DocumentTextIcon,
  UsersIcon,                   // INI YANG BARU BUAT MANAJEMEN USER (super pas!)
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const user = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};
  const role = user.role || "operator";

  const getMenuItems = () => {
    const items = [];

    // 1. MENU UTAMA
    items.push({ type: "header", label: "MENU UTAMA" });
    items.push(
      { name: "Work Orders", href: "/", icon: ClipboardDocumentListIcon, roles: ["admin", "supervisor", "technician", "operator"] },
      { name: "Mesin & Komponen", href: "/machines", icon: WrenchScrewdriverIcon, roles: ["admin", "supervisor", "technician", "operator"] },
      { name: "Jadwal Maintenance", href: "/schedules", icon: CalendarIcon, roles: ["admin", "supervisor", "technician", "operator"] },
      { name: "Riwayat Maintenance", href: "/maintenance-history", icon: DocumentTextIcon, roles: ["admin", "supervisor", "technician", "operator"] }
    );

    // 2. WORK ORDER
    const canAccessWO = ["admin", "supervisor", "technician"].includes(role);
    if (canAccessWO) {
      items.push({ type: "divider" });
      items.push({ type: "header", label: "WORK ORDER" });
      items.push(
        { name: "Buat Work Order", href: "/create-wo", icon: DocumentPlusIcon, roles: ["admin", "supervisor", "technician"] },
        { name: "Arsip WO", href: "/archive", icon: ArchiveBoxIcon, roles: ["admin", "supervisor", "technician"] }
      );
    }

    // 3. JADWAL BARU
    const canCreateSchedule = ["admin", "supervisor"].includes(role);
    if (canCreateSchedule) {
      items.push({ type: "divider" });
      items.push({ type: "header", label: "JADWAL" });
      items.push(
        { name: "Buat Jadwal Baru", href: "/schedules/create", icon: WrenchIcon, roles: ["admin", "supervisor"] }
      );
    }

    // 4. ADMINISTRASI — HANYA ADMIN
    if (role === "admin") {
      items.push({ type: "divider" });
      items.push({ type: "header", label: "ADMINISTRASI" });
      items.push(
        { name: "Manajemen User", href: "/users", icon: UsersIcon, roles: ["admin"] }
      );
    }

    return items;
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axiosInstance.defaults.headers.common["Authorization"];
    window.location.href = "/auth/login";
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={onClose} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-blue-800 to-blue-900 text-white transform ${isOpen ? "translate-x-0" : "-translate-x-full"} transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0`}>
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-6 border-b border-blue-700">
          <div className="flex items-center gap-3">
            <div className="bg-white text-blue-800 p-3 rounded-xl font-bold text-2xl">CMMS</div>
            <div>
              <h1 className="text-xl font-bold">CMMS 2025</h1>
              <p className="text-xs opacity-80">Industri Otomasi</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white hover:bg-blue-700 p-2 rounded-lg">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* MENU DENGAN ICON BARU */}
        <nav className="mt-8 px-4 flex-1 overflow-y-auto">
          {menuItems.map((item, index) => {
            if (item.type === "header") {
              return (
                <div key={index} className="px-4 py-3 text-xs font-bold text-cyan-300 uppercase tracking-wider opacity-80">
                  {item.label}
                </div>
              );
            }
            if (item.type === "divider") {
              return <div key={index} className="my-4 border-t border-blue-700 opacity-50" />;
            }

            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-4 px-4 py-3 rounded-lg mb-2 transition-all ${
                  isActive
                    ? "bg-white text-blue-800 shadow-lg font-bold"
                    : "hover:bg-blue-700 text-blue-100"
                }`}
              >
                <Icon className="h-6 w-6" />
                <span>{item.name}</span>
                {isActive && <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>}
              </Link>
            );
          })}
        </nav>

        {/* USER INFO + LOGOUT */}
        <div className="mt-auto px-4 pb-8 border-t border-blue-700 pt-6">
          <div className="bg-blue-700/50 backdrop-blur-sm rounded-lg p-4 mb-4 border border-blue-600">
            <div className="flex items-center gap-3">
              <UserCircleIcon className="h-12 w-12 text-cyan-300" />
              <div>
                <p className="font-bold text-lg">{user.username || "User"}</p>
                <p className="text-xs opacity-90">
                  Role: <span className="font-semibold text-cyan-300">
                    {role === "admin" ? "Administrator" :
                     role === "supervisor" ? "Supervisor" :
                     role === "technician" ? "Teknisi" : "Operator"}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-lg mb-6 transition-all bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
            <span>Keluar</span>
          </button>

          <div className="text-center text-xs opacity-70">
            © 2025 CMMS System<br />Next.js + Flask + MongoDB
          </div>
        </div>
      </div>
    </>
  );
}