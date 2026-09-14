export default function Avatar({
  src,
  name,
  size = "md",
}) {
  const sizes = {
    sm: "w-10 h-10",
    md: "w-14 h-14",
    lg: "w-20 h-20",
  };

  return (
    <div
      className={`
      ${sizes[size]}
      rounded-full
      overflow-hidden
      ring-4
      ring-orange-100
      bg-orange-100
    `}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex items-center justify-center h-full text-xl font-bold">
          {name?.charAt(0)}
        </div>
      )}
    </div>
  );
}