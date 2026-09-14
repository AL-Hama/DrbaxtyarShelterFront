import React from "react";

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const variants = {
    primary:
      "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200",

    success:
      "bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200",

    danger:
      "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-200",

    outline:
      "border-2 border-orange-500 text-orange-500 hover:bg-orange-50",
  };

return (
  <button
    {...props}
    className={`
      inline-flex items-center justify-center gap-2
      px-5 py-3
      rounded-2xl
      font-semibold
      transition-all
      duration-300
      hover:scale-105
      active:scale-95
      whitespace-nowrap
      cursor-pointer
      ${variants[variant]}
      ${className}
    `}
  >
    {children}
  </button>
);
}