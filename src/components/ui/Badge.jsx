export default function Badge({
  status,
}) {
  const colors = {
    active:
      "bg-emerald-100 text-emerald-700",

    pending:
      "bg-yellow-100 text-yellow-700",

    adopted:
      "bg-blue-100 text-blue-700",

    danger:
      "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`
      px-3 py-1
      rounded-full
      text-xs
      font-semibold
      ${colors[status]}
    `}
    >
      {status}
    </span>
  );
}