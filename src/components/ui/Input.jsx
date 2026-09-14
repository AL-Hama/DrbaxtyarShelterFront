export default function Input({
  label,
  error,
  className = "",
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="font-medium text-gray-700">
          {label}
        </label>
      )}

      <input
        {...props}
        className={`
          w-full
          rounded-2xl
          border
          border-gray-200
          px-4
          py-3
          bg-white
          focus:ring-4
          focus:ring-orange-200
          focus:border-orange-500
          outline-none
          transition
          ${className}
        `}
      />

      {error && (
        <p className="text-red-500 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}