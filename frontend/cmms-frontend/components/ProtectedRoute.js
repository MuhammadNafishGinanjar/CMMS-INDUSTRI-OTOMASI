// // components/ProtectedRoute.jsx
// "use client";
// import { useEffect } from "react";
// import { useRouter } from "next/navigation";

// export default function ProtectedRoute({ children }) {
//   const router = useRouter();

//   useEffect(() => {
//     const token = localStorage.getItem("token");
//     const user = localStorage.getItem("user");

//     if (!token || !user) {
//       router.push("/auth/login");
//     }
//   }, [router]);

//   // Kalau belum login → tampilkan loading (biar tidak flash)
//   const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
//   if (!token) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-950 flex items-center justify-center">
//         <div className="text-white text-3xl font-bold animate-pulse">
//           Mengarahkan ke login...
//         </div>
//       </div>
//     );
//   }

//   return <>{children}</>;
// }