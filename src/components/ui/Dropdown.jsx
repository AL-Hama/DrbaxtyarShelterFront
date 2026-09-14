export default function Dropdown({
  options = [],
  ...props
}) {
  return (
    <select
      {...props}
      className="
      w-full
      rounded-2xl
      border
      border-gray-200
      px-4
      py-3
      focus:ring-4
      focus:ring-orange-200
      "
    >
      {options.map((item) => (
        <option
          key={item.value}
          value={item.value}
        >
          {item.label}
        </option>
      ))}
    </select>
  );
}