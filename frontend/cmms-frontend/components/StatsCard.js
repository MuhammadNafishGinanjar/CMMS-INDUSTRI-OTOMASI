// components/StatsCard.jsx
export default function StatsCard({ title, value, gradient, iconText }) {
  return (
    <div className={`bg-gradient-to-br ${gradient} text-white rounded-xl shadow-xl p-6 transform hover:scale-105 transition`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold opacity-90">{title}</h3>
          <p className="text-5xl font-bold mt-2">{value}</p>
        </div>
        <div className="text-5xl opacity-30">{iconText}</div>
      </div>
    </div>
  );
}