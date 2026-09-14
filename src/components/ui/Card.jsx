export default function Card({
  title,
  icon,
  children,
  className = "",
}) {
  return (
    <div
      className={`
      bg-white/80
      backdrop-blur-lg
      rounded-3xl
      shadow-soft
      border
      border-orange-100
      p-6
      ${className}
    `}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4">
          {icon}
          <h3 className="font-bold text-gray-800">
            {title}
          </h3>
        </div>
      )}

      {children}
    </div>
  );
}