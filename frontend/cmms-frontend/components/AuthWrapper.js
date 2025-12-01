// components/AuthWrapper.jsx
"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

export default function AuthWrapper({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  // const [isLoading, setIsLoading] = useState(true);

  const publicRoutes = ["/auth/login", "/auth/register"];

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }

    // Kalau di halaman publik → langsung lanjut
    if (publicRoutes.includes(pathname)) {
      // setIsLoading(false);
      return;
    }

    // Kalau tidak ada token → lempar ke login
    if (!token) {
      router.push("/auth/login");
      return;
    }

    // Kalau ada token → lanjut
    // setIsLoading(false);
  }, [pathname, router]);

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-blue-900 to-cyan-800 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="w-28 h-28 border-8 border-white border-t-transparent rounded-full animate-spin mx-auto mb-8 shadow-2xl"></div>
  //         <p className="text-white text-4xl font-black animate-pulse tracking-wider">CMMS 2025</p>
  //         <p className="text-cyan-300 mt-4 text-lg">Memuat data...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (publicRoutes.includes(pathname)) {
    return <>{children}</>;
  }

  return <>{children}</>;
}