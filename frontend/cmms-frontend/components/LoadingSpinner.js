// components/LoadingSpinner.jsx
export default function LoadingSpinner({ message = "Memuat halaman..." }) {
  return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-8 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-2xl font-bold text-blue-700">{message}</p>
        </div>
      </div>
  );
}